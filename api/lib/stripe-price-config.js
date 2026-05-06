const DEFAULT_STRIPE_PRICE_IDS = {
  starter: {
    monthly: 'price_1T9t9L2Ouddv7uendIMAR6IP',
    annual: 'price_1TDQ7w2Ouddv7ueno5CuaNTH',
  },
  pro: {
    monthly: 'price_1T9t9U2Ouddv7uenfg38PRZ2',
    annual: 'price_1T9t9U2Ouddv7uenK6oT1O13',
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

async function validateStripePrice({ stripe, priceId }) {
  const config = getPriceConfig(priceId);
  if (!config) {
    const error = new Error(`Unknown Stripe priceId "${priceId}". Use one of the configured MarketFlow price IDs.`);
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

module.exports = {
  DEFAULT_STRIPE_PRICE_IDS,
  PLAN_IDS,
  PRICE_PLAN_MAP,
  STRIPE_PRICE_CONFIG,
  getConfiguredPriceId,
  getPriceConfig,
  validateStripePrice,
};
