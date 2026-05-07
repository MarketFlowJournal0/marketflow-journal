const DEFAULT_STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_1T9t9L2Ouddv7uendIMAR6IP',
    annual: 'price_1TDQ7w2Ouddv7ueno5CuaNTH',
  },
  pro: {
    monthly: 'price_1T9t9U2Ouddv7uenfg38PRZ2',
    annual: '',
  },
  elite: {
    monthly: 'price_1T9t9L2Ouddv7uen4DXuOatj',
    annual: 'price_1T9t9K2Ouddv7uennnWOJ44p',
  },
};

const PLAN_IDS = ['starter', 'pro', 'elite'];
const BILLING_INTERVALS = ['monthly', 'annual'];
const STRIPE_INTERVAL_BY_BILLING = {
  monthly: 'month',
  annual: 'year',
};
const EXPECTED_PRICE_TARGETS = {
  starter: {
    monthly: { unitAmount: 1500, currency: 'usd' },
    annual: { unitAmount: 13200, currency: 'usd' },
  },
  pro: {
    monthly: { unitAmount: 2200, currency: 'usd' },
    annual: { unitAmount: 18000, currency: 'usd' },
  },
  elite: {
    monthly: { unitAmount: 3800, currency: 'usd' },
    annual: { unitAmount: 32400, currency: 'usd' },
  },
};

function envKey(planId, billing) {
  return `STRIPE_${planId.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID`;
}

function getConfiguredPriceId(planId, billing) {
  return process.env[envKey(planId, billing)] || DEFAULT_STRIPE_PRICE_IDS[planId]?.[billing] || '';
}

function buildPriceConfig() {
  const config = {};

  for (const planId of PLAN_IDS) {
    for (const billing of BILLING_INTERVALS) {
      const priceId = getConfiguredPriceId(planId, billing);
      if (!priceId) continue;
      config[priceId] = {
        planId,
        billing,
        expectedStripeInterval: STRIPE_INTERVAL_BY_BILLING[billing],
        envKey: envKey(planId, billing),
      };
    }
  }

  return config;
}

const STRIPE_PRICE_CONFIG = buildPriceConfig();
const PRICE_PLAN_MAP = Object.fromEntries(
  Object.entries(STRIPE_PRICE_CONFIG).map(([priceId, config]) => [priceId, config.planId])
);

function getPriceConfig(priceId) {
  return STRIPE_PRICE_CONFIG[priceId] || null;
}

function normalizePlanId(planId) {
  const normalized = String(planId || '').toLowerCase();
  return PLAN_IDS.includes(normalized) ? normalized : '';
}

function normalizeBilling(billing) {
  const normalized = String(billing || '').toLowerCase();
  if (normalized === 'yearly') return 'annual';
  return BILLING_INTERVALS.includes(normalized) ? normalized : '';
}

function buildConfigFor(planId, billing, priceId = '') {
  const normalizedPlanId = normalizePlanId(planId);
  const normalizedBilling = normalizeBilling(billing);
  if (!normalizedPlanId || !normalizedBilling) return null;

  return {
    planId: normalizedPlanId,
    billing: normalizedBilling,
    expectedStripeInterval: STRIPE_INTERVAL_BY_BILLING[normalizedBilling],
    envKey: envKey(normalizedPlanId, normalizedBilling),
    priceId,
  };
}

function getCheckoutConfig({ priceId, planId, billing }) {
  const knownConfig = getPriceConfig(priceId);
  return knownConfig || buildConfigFor(planId, billing, priceId);
}

async function validateResolvedStripePrice({ stripe, priceId, config }) {
  if (!config) {
    const error = new Error(`Unknown Stripe priceId "${priceId}". Use a configured MarketFlow plan and billing interval.`);
    error.statusCode = 400;
    throw error;
  }

  let price;
  try {
    price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  } catch (stripeError) {
    const error = new Error(`Stripe price "${priceId}" could not be retrieved. Verify ${config.envKey}. ${stripeError.message}`);
    error.statusCode = 400;
    throw error;
  }

  if (!price?.active) {
    const error = new Error(`Stripe price "${priceId}" is inactive. Verify ${config.envKey}.`);
    error.statusCode = 400;
    throw error;
  }

  if (price.type !== 'recurring' || !price.recurring?.interval) {
    const error = new Error(`Stripe price "${priceId}" must be a recurring subscription price. Verify ${config.envKey}.`);
    error.statusCode = 400;
    throw error;
  }

  if (price.recurring.interval !== config.expectedStripeInterval) {
    const error = new Error(
      `Stripe price "${priceId}" is configured as ${price.recurring.interval}, but MarketFlow expected ${config.expectedStripeInterval} for ${config.planId} ${config.billing}. Verify ${config.envKey}.`
    );
    error.statusCode = 400;
    throw error;
  }

  if (price.product && typeof price.product === 'object' && price.product.active === false) {
    const error = new Error(`Stripe product for price "${priceId}" is inactive. Verify ${config.envKey}.`);
    error.statusCode = 400;
    throw error;
  }

  return { price, config };
}

async function validateStripePrice({ stripe, priceId }) {
  return validateResolvedStripePrice({ stripe, priceId, config: getPriceConfig(priceId) });
}

function getCandidateLookupKeys(planId, billing) {
  const normalizedBilling = normalizeBilling(billing);
  const intervalAlias = normalizedBilling === 'annual' ? 'yearly' : 'monthly';

  return [
    `marketflow_${planId}_${normalizedBilling}`,
    `marketflow_${planId}_${intervalAlias}`,
    `mfj_${planId}_${normalizedBilling}`,
    `mfj_${planId}_${intervalAlias}`,
    `${planId}_${normalizedBilling}`,
    `${planId}_${intervalAlias}`,
  ];
}

function priceMatchesPlan(price, config) {
  const product = price?.product && typeof price.product === 'object' ? price.product : {};
  const target = EXPECTED_PRICE_TARGETS[config.planId]?.[config.billing];
  const searchable = [
    price?.lookup_key,
    price?.nickname,
    price?.metadata?.plan,
    price?.metadata?.marketflow_plan,
    price?.metadata?.mfj_plan,
    product?.name,
    product?.metadata?.plan,
    product?.metadata?.marketflow_plan,
    product?.metadata?.mfj_plan,
  ].filter(Boolean).join(' ').toLowerCase();

  const planMatch = searchable.includes(config.planId);
  const amountMatch = target
    ? price.unit_amount === target.unitAmount && String(price.currency || '').toLowerCase() === target.currency
    : true;

  return planMatch && amountMatch;
}

async function findStripePriceByLookupKeys({ stripe, config }) {
  const lookupKeys = getCandidateLookupKeys(config.planId, config.billing);
  const result = await stripe.prices.list({
    active: true,
    lookup_keys: lookupKeys,
    limit: 10,
    expand: ['data.product'],
  });

  return result.data.find((price) => price.recurring?.interval === config.expectedStripeInterval) || null;
}

async function findStripePriceByCatalog({ stripe, config }) {
  const result = await stripe.prices.list({
    active: true,
    type: 'recurring',
    limit: 100,
    expand: ['data.product'],
  });

  const matches = result.data.filter((price) => (
    price.recurring?.interval === config.expectedStripeInterval
    && priceMatchesPlan(price, config)
  ));

  return matches.length === 1 ? matches[0] : null;
}

async function resolveStripePriceForCheckout({ stripe, priceId, planId, billing }) {
  const config = getCheckoutConfig({ priceId, planId, billing });
  if (!config) {
    const error = new Error('Stripe checkout requires a valid planId and billing interval.');
    error.statusCode = 400;
    throw error;
  }

  const configuredPriceId = getConfiguredPriceId(config.planId, config.billing);
  const candidateIds = [...new Set([priceId, configuredPriceId].filter(Boolean))];
  const errors = [];

  for (const candidatePriceId of candidateIds) {
    try {
      return await validateResolvedStripePrice({
        stripe,
        priceId: candidatePriceId,
        config: { ...config, priceId: candidatePriceId },
      });
    } catch (err) {
      errors.push(err.message);
    }
  }

  try {
    const lookupPrice = await findStripePriceByLookupKeys({ stripe, config });
    if (lookupPrice) {
      return await validateResolvedStripePrice({
        stripe,
        priceId: lookupPrice.id,
        config: { ...config, priceId: lookupPrice.id, envKey: `${config.envKey} or Stripe lookup_key` },
      });
    }
  } catch (err) {
    errors.push(err.message);
  }

  try {
    const catalogPrice = await findStripePriceByCatalog({ stripe, config });
    if (catalogPrice) {
      return await validateResolvedStripePrice({
        stripe,
        priceId: catalogPrice.id,
        config: { ...config, priceId: catalogPrice.id, envKey: `${config.envKey} or Stripe catalog metadata` },
      });
    }
  } catch (err) {
    errors.push(err.message);
  }

  const error = new Error(
    `Stripe ${config.planId} ${config.billing} price is not configured. Set ${config.envKey} in Vercel to an active recurring ${config.expectedStripeInterval} Price ID. Last checks: ${errors.join(' | ')}`
  );
  error.statusCode = 400;
  throw error;
}

module.exports = {
  DEFAULT_STRIPE_PRICE_IDS,
  EXPECTED_PRICE_TARGETS,
  PLAN_IDS,
  PRICE_PLAN_MAP,
  STRIPE_PRICE_CONFIG,
  getConfiguredPriceId,
  getPriceConfig,
  validateStripePrice,
  resolveStripePriceForCheckout,
};
