export const ONBOARDING_VERSION = 3;

const TAXONOMY = {
  experience: {
    beginner: {
      id: 'beginner',
      label: 'Beginner',
      category: 'profile',
      level: 1,
      segment: 'foundation',
      dataWeight: 20,
      planBias: 'starter',
    },
    intermediate: {
      id: 'intermediate',
      label: 'Intermediate',
      category: 'profile',
      level: 2,
      segment: 'builder',
      dataWeight: 45,
      planBias: 'pro',
    },
    advanced: {
      id: 'advanced',
      label: 'Advanced',
      category: 'profile',
      level: 3,
      segment: 'operator',
      dataWeight: 70,
      planBias: 'pro',
    },
    professional: {
      id: 'professional',
      label: 'Professional',
      category: 'profile',
      level: 4,
      segment: 'desk',
      dataWeight: 95,
      planBias: 'elite',
    },
  },
  market: {
    forex: { id: 'forex', label: 'Forex', category: 'markets', assetClass: 'fx', importPriority: 90 },
    indices: { id: 'indices', label: 'Indices', category: 'markets', assetClass: 'cfd_index', importPriority: 80 },
    crypto: { id: 'crypto', label: 'Crypto', category: 'markets', assetClass: 'digital_asset', importPriority: 70 },
    stocks: { id: 'stocks', label: 'Stocks', category: 'markets', assetClass: 'equity', importPriority: 60 },
    futures: { id: 'futures', label: 'Futures', category: 'markets', assetClass: 'futures', importPriority: 85 },
    options: { id: 'options', label: 'Options', category: 'markets', assetClass: 'options', importPriority: 55 },
  },
  style: {
    scalping: { id: 'scalping', label: 'Scalping', category: 'execution', cadence: 'high_frequency', reviewWindow: 'intraday', riskFocus: 'spread_and_slippage' },
    daytrading: { id: 'daytrading', label: 'Day Trading', category: 'execution', cadence: 'daily', reviewWindow: 'session', riskFocus: 'session_quality' },
    swing: { id: 'swing', label: 'Swing Trading', category: 'execution', cadence: 'multi_day', reviewWindow: 'weekly', riskFocus: 'holding_quality' },
    position: { id: 'position', label: 'Position', category: 'execution', cadence: 'portfolio', reviewWindow: 'monthly', riskFocus: 'macro_drawdown' },
  },
  goal: {
    improve: { id: 'improve', label: 'Improve my performance', category: 'objective', objective: 'performance_growth', priority: 'review_quality' },
    prop: { id: 'prop', label: 'Pass a prop firm challenge', category: 'objective', objective: 'prop_firm_rules', priority: 'risk_limits' },
    consistent: { id: 'consistent', label: 'Become consistent', category: 'objective', objective: 'process_consistency', priority: 'discipline' },
    manage: { id: 'manage', label: 'Manage multiple accounts', category: 'objective', objective: 'account_operations', priority: 'allocation' },
  },
  platform: {
    mt4: { id: 'mt4', label: 'MetaTrader 4', category: 'data_source', connector: 'mt4', importType: 'csv_or_bridge' },
    mt5: { id: 'mt5', label: 'MetaTrader 5', category: 'data_source', connector: 'mt5', importType: 'csv_or_bridge' },
    ctrader: { id: 'ctrader', label: 'cTrader', category: 'data_source', connector: 'ctrader', importType: 'csv' },
    tradingview: { id: 'tradingview', label: 'TradingView', category: 'data_source', connector: 'tradingview', importType: 'manual_or_csv' },
    ninjatrader: { id: 'ninjatrader', label: 'NinjaTrader', category: 'data_source', connector: 'ninjatrader', importType: 'csv' },
    other: { id: 'other', label: 'Other', category: 'data_source', connector: 'custom', importType: 'custom_mapping' },
  },
};

export function buildOnboardingRecord({ answers = {}, user = null } = {}) {
  const normalizedAnswers = normalizeAnswers(answers);
  const completedAt = new Date().toISOString();
  const classified = classifyAnswers(normalizedAnswers);
  const analytics = buildOnboardingAnalytics(classified);
  const recommendations = buildOnboardingRecommendations(classified, analytics);

  return {
    version: ONBOARDING_VERSION,
    completedAt,
    answers: normalizedAnswers,
    classified,
    analytics,
    recommendations,
    summary: {
      primaryExperience: normalizedAnswers.experience || null,
      primaryExperienceLabel: classified.profile.experience?.label || null,
      primaryStyle: normalizedAnswers.style || null,
      primaryStyleLabel: classified.execution.style?.label || null,
      primaryGoal: normalizedAnswers.goal || null,
      primaryGoalLabel: classified.objective.goal?.label || null,
      markets: Array.isArray(normalizedAnswers.market) ? normalizedAnswers.market : [],
      marketLabels: classified.markets.map((market) => market.label),
      platforms: Array.isArray(normalizedAnswers.platform) ? normalizedAnswers.platform : [],
      platformLabels: classified.dataSources.map((source) => source.label),
      traderSegment: analytics.traderSegment,
      recommendedPlan: recommendations.initialPlan,
    },
    meta: {
      userId: user?.id || null,
      email: user?.email || null,
      firstName: user?.firstName || null,
      plan: user?.plan || 'trial',
      createdAt: user?.createdAt || null,
      source: 'marketflow_onboarding',
    },
  };
}

export function getOnboardingAnswers(record) {
  if (!record) return {};
  if (record.answers && typeof record.answers === 'object') return normalizeAnswers(record.answers);
  return normalizeAnswers(record);
}

export function getOnboardingMeta(record) {
  if (!record || typeof record !== 'object') return {};
  return {
    completedAt: record.completedAt || null,
    version: record.version || 1,
    meta: record.meta || {},
    summary: record.summary || {},
    classified: record.classified || {},
    analytics: record.analytics || {},
    recommendations: record.recommendations || {},
  };
}

function normalizeAnswers(answers = {}) {
  return {
    experience: sanitizeSingle(answers.experience),
    market: sanitizeMulti(answers.market),
    style: sanitizeSingle(answers.style),
    goal: sanitizeSingle(answers.goal),
    platform: sanitizeMulti(answers.platform),
  };
}

function classifyAnswers(answers) {
  return {
    profile: {
      experience: enrichSingle('experience', answers.experience),
    },
    markets: answers.market.map((id) => enrichSingle('market', id)).filter(Boolean),
    execution: {
      style: enrichSingle('style', answers.style),
    },
    objective: {
      goal: enrichSingle('goal', answers.goal),
    },
    dataSources: answers.platform.map((id) => enrichSingle('platform', id)).filter(Boolean),
  };
}

function buildOnboardingAnalytics(classified) {
  const experienceLevel = classified.profile.experience?.level || 1;
  const marketCount = classified.markets.length;
  const platformCount = classified.dataSources.length;
  const professionalSignals = [
    classified.profile.experience?.id === 'professional',
    classified.objective.goal?.id === 'manage',
    classified.objective.goal?.id === 'prop',
    classified.markets.some((market) => ['futures', 'indices'].includes(market.id)),
    platformCount > 1,
  ].filter(Boolean).length;
  const complexityScore = clamp(
    experienceLevel * 18 + marketCount * 8 + platformCount * 6 + professionalSignals * 10,
    0,
    100
  );

  return {
    selectedCount: 3 + marketCount + platformCount,
    marketCount,
    platformCount,
    professionalSignals,
    complexityScore,
    onboardingCompleteness: 100,
    traderSegment: resolveTraderSegment(classified, complexityScore),
  };
}

function buildOnboardingRecommendations(classified, analytics) {
  const goalId = classified.objective.goal?.id;
  const experienceId = classified.profile.experience?.id;
  const needsElite = goalId === 'manage' || experienceId === 'professional' || analytics.platformCount > 2;
  const needsPro = goalId === 'prop' || analytics.complexityScore >= 55 || classified.markets.length > 2;
  const initialPlan = needsElite ? 'elite' : needsPro ? 'pro' : 'starter';

  return {
    initialPlan,
    firstActions: [
      'Import the latest trade history',
      'Confirm account scope and risk limits',
      'Review dashboard and psychology baseline',
    ],
    dataPriority: classified.dataSources.map((source) => source.connector),
    riskPriority: classified.execution.style?.riskFocus || 'review_quality',
  };
}

function resolveTraderSegment(classified, complexityScore) {
  if (classified.objective.goal?.id === 'manage') return 'multi_account_operator';
  if (classified.objective.goal?.id === 'prop') return 'prop_challenge_trader';
  if (classified.profile.experience?.id === 'professional') return 'professional_desk';
  if (complexityScore >= 70) return 'advanced_operator';
  if (classified.execution.style?.id === 'scalping') return 'intraday_execution';
  return 'structured_journal_builder';
}

function enrichSingle(type, value) {
  const id = sanitizeSingle(value);
  if (!id) return null;
  const item = TAXONOMY[type]?.[id];
  return item ? { ...item } : { id, label: toLabel(id), category: type, custom: true };
}

function sanitizeSingle(value) {
  return typeof value === 'string' ? value.trim() : null;
}

function sanitizeMulti(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
}

function toLabel(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
