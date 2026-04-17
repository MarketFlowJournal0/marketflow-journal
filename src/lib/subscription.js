const BASE_ROUTES = ['dashboard', 'all-trades', 'calendar'];
const ACCOUNT_ROUTES = ['account-settings', 'subscription', 'support'];

export const PLAN_DETAILS = {
  trial: {
    id: 'trial',
    label: 'Trial',
    accent: '#FB923C',
    description: 'Core journal access while your subscription finishes syncing.',
    entryRoute: 'dashboard',
    features: [
      'Unlimited trade journal',
      'Dashboard and core statistics',
      'CSV import',
      'Performance calendar',
    ],
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    accent: '#00F5D4',
    description: 'A focused workspace for consistent journaling and review.',
    entryRoute: 'dashboard',
    features: [
      'Unlimited trade journal',
      'Dashboard and core statistics',
      'CSV import',
      'Performance calendar',
      '1 trading account',
    ],
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    accent: '#06E6FF',
    description: 'Advanced review tools for serious traders who want to improve.',
    entryRoute: 'dashboard',
    features: [
      'Everything in Starter',
      'Advanced Pro analytics',
      'Psychology tracker',
      'Equity curve and drawdown',
      'Strategy backtesting',
      'Broker sync',
      'PDF report export',
    ],
  },
  elite: {
    id: 'elite',
    label: 'Elite',
    accent: '#FFD700',
    description: 'Full MarketFlow access with AI, alerts, and power-user tools.',
    entryRoute: 'dashboard',
    features: [
      'Everything in Pro',
      'AI Trading Coach',
      'Unlimited accounts',
      'Alerts and notifications',
      'API access',
      '24/7 priority support',
    ],
  },
};

const ROUTES_BY_PLAN = {
  trial: [...BASE_ROUTES, ...ACCOUNT_ROUTES],
  starter: [...BASE_ROUTES, 'competition', ...ACCOUNT_ROUTES],
  pro: [
    ...BASE_ROUTES,
    'competition',
    'analytics',
    'analytics-pro',
    'equity',
    'backtest',
    'psychology',
    'broker-connect',
    'reports',
    ...ACCOUNT_ROUTES,
  ],
  elite: [
    ...BASE_ROUTES,
    'competition',
    'analytics',
    'analytics-pro',
    'equity',
    'backtest',
    'psychology',
    'broker-connect',
    'reports',
    'ai-chat',
    'alerts',
    'api-access',
    ...ACCOUNT_ROUTES,
  ],
};

export function normalizePlan(plan) {
  const value = String(plan || '').toLowerCase();
  if (PLAN_DETAILS[value]) return value;
  return 'trial';
}

export function getPlanDetails(plan) {
  return PLAN_DETAILS[normalizePlan(plan)];
}

export function getAccessibleRoutes(plan) {
  return ROUTES_BY_PLAN[normalizePlan(plan)] || ROUTES_BY_PLAN.trial;
}

export function hasRouteAccess(plan, route) {
  const cleanRoute = String(route || '')
    .replace(/^\//, '')
    .split('?')[0];

  return getAccessibleRoutes(plan).includes(cleanRoute);
}

export function getEntryRoute(plan) {
  return getPlanDetails(plan).entryRoute;
}
