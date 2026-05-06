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

function envKey(planId, billing) {
  return `REACT_APP_STRIPE_${planId.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID`;
}

export function getStripePriceId(planId, billing) {
  return process.env[envKey(planId, billing)] || DEFAULT_STRIPE_PRICE_IDS[planId]?.[billing] || '';
}

export const STRIPE_PRICE_IDS = PLAN_IDS.reduce((plans, planId) => {
  plans[planId] = BILLING_INTERVALS.reduce((billingMap, billing) => {
    billingMap[billing] = getStripePriceId(planId, billing);
    return billingMap;
  }, {});
  return plans;
}, {});

export const PRICE_PLAN_MAP = Object.fromEntries(
  PLAN_IDS.flatMap((planId) => (
    BILLING_INTERVALS.map((billing) => [STRIPE_PRICE_IDS[planId][billing], planId])
  )).filter(([priceId]) => Boolean(priceId))
);
