const STORAGE_PREFIX = 'mf_trade_copier_v1_';
const MAX_ACTIVITY_ITEMS = 40;

export const ACCOUNT_ROLE_OPTIONS = [
  { id: 'master', label: 'Master' },
  { id: 'follower', label: 'Follower' },
  { id: 'standalone', label: 'Standalone' },
];

export const PLATFORM_OPTIONS = [
  'MT4',
  'MT5',
  'cTrader',
  'TradingView',
  'IBKR',
  'DXTrade',
  'Match Trader',
  'NinjaTrader',
  'Rithmic',
  'CQG',
  'Webhook',
  'Manual',
];

export const VENUE_OPTIONS = [
  'CFD',
  'Futures',
  'Forex',
  'Stocks',
  'Crypto',
  'Options',
  'Prop',
];

export const SESSION_OPTIONS = [
  { id: 'tokyo', label: 'Tokyo' },
  { id: 'london', label: 'London' },
  { id: 'new-york', label: 'New York' },
];

export const COPY_SIZING_MODES = [
  {
    id: 'balance-ratio',
    label: 'Balance ratio',
    description: 'Copies the master size based on balance ratio between accounts.',
  },
  {
    id: 'equity-ratio',
    label: 'Equity ratio',
    description: 'Adjusts size using live equity instead of static balance.',
  },
  {
    id: 'fixed-lot',
    label: 'Fixed size',
    description: 'Always sends the same lot or share size to the follower.',
  },
  {
    id: 'risk-percent',
    label: 'Risk percent',
    description: 'Targets a fixed risk percentage on each follower account.',
  },
  {
    id: 'smart-risk',
    label: 'Smart risk',
    description: 'Uses per-trade budget plus drawdown protection and step-down sizing.',
  },
];

export const TRADE_COPIER_FEATURES = [
  {
    id: 'prop-shield',
    label: 'Prop Shield',
    description: 'Blocks copied orders when a follower is too close to daily or trailing loss limits.',
  },
  {
    id: 'step-down',
    label: 'Drawdown Step-Down',
    description: 'Reduces follower size automatically as drawdown pressure increases.',
  },
  {
    id: 'session-control',
    label: 'Session Control',
    description: 'Lets each link trade only during Tokyo, London, or New York sessions.',
  },
  {
    id: 'suffix-map',
    label: 'Symbol Remap',
    description: 'Translates symbols and suffixes across brokers without manual re-entry.',
  },
  {
    id: 'latency-guard',
    label: 'Latency Guard',
    description: 'Flags or blocks links when connection heartbeat drifts beyond the allowed threshold.',
  },
];

export function getTradeCopierStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

export function loadTradeCopierState(userId, brokerAccounts = []) {
  if (!userId || typeof window === 'undefined') {
    return normalizeTradeCopierState({}, brokerAccounts);
  }

  try {
    const raw = window.localStorage.getItem(getTradeCopierStorageKey(userId));
    if (!raw) return normalizeTradeCopierState({}, brokerAccounts);
    return normalizeTradeCopierState(JSON.parse(raw), brokerAccounts);
  } catch {
    return normalizeTradeCopierState({}, brokerAccounts);
  }
}

export function saveTradeCopierState(userId, state) {
  const normalized = normalizeTradeCopierState(state);
  if (!userId || typeof window === 'undefined') return normalized;

  try {
    window.localStorage.setItem(
      getTradeCopierStorageKey(userId),
      JSON.stringify({
        ...normalized,
        lastUpdated: new Date().toISOString(),
      }),
    );
  } catch {}

  return normalized;
}

export function exportTradeCopierSnapshot(state, meta = {}) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    meta,
    state: normalizeTradeCopierState(state),
  };
}

export function importTradeCopierSnapshot(snapshot, brokerAccounts = []) {
  return normalizeTradeCopierState(snapshot?.state || snapshot, brokerAccounts);
}

export function createCopierAccount(input = {}, brokerAccount = null) {
  return normalizeCopierAccount({
    id: input.id || makeId('copier-account'),
    source: brokerAccount ? 'broker' : (input.source || 'manual'),
    brokerAccountId: brokerAccount?.id || input.brokerAccountId || null,
    label: input.label || brokerAccount?.account_name || brokerAccount?.account_number || 'New account',
    platform: input.platform || mapBrokerTypeToPlatform(brokerAccount?.broker_type),
    venue: input.venue || guessVenueFromAccount(brokerAccount),
    role: input.role || 'follower',
    balance: input.balance ?? 10000,
    equity: input.equity ?? input.balance ?? 10000,
    currency: input.currency || 'USD',
    riskPerTrade: input.riskPerTrade ?? 0.5,
    maxDailyLoss: input.maxDailyLoss ?? 3,
    currentDailyLoss: input.currentDailyLoss ?? 0,
    maxDrawdown: input.maxDrawdown ?? 8,
    currentDrawdown: input.currentDrawdown ?? 0,
    maxOpenRisk: input.maxOpenRisk ?? 1.5,
    maxLot: input.maxLot ?? 5,
    status: input.status || inferConnectionStatus(brokerAccount?.status),
    phase: input.phase || '',
    propFirm: input.propFirm || '',
    symbolSuffix: input.symbolSuffix || '',
    latencyMs: input.latencyMs ?? 350,
    heartbeatSeconds: input.heartbeatSeconds ?? 8,
    notes: input.notes || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function normalizeCopierAccount(input = {}) {
  return {
    id: cleanText(input.id, makeId('copier-account')),
    source: cleanText(input.source, 'manual'),
    brokerAccountId: input.brokerAccountId || null,
    label: cleanText(input.label, 'New account'),
    platform: cleanText(input.platform, 'Manual'),
    venue: cleanText(input.venue, 'CFD'),
    role: normalizeRole(input.role),
    balance: maxNumber(input.balance, 0),
    equity: maxNumber(input.equity ?? input.balance, 0),
    currency: cleanText(input.currency, 'USD').toUpperCase(),
    riskPerTrade: clampNumber(input.riskPerTrade, 0, 10, 0.5),
    maxDailyLoss: clampNumber(input.maxDailyLoss, 0, 20, 3),
    currentDailyLoss: clampNumber(input.currentDailyLoss, 0, 100, 0),
    maxDrawdown: clampNumber(input.maxDrawdown, 0, 50, 8),
    currentDrawdown: clampNumber(input.currentDrawdown, 0, 100, 0),
    maxOpenRisk: clampNumber(input.maxOpenRisk, 0, 20, 1.5),
    maxLot: clampNumber(input.maxLot, 0, 1000, 5),
    status: normalizeAccountStatus(input.status),
    phase: cleanText(input.phase, ''),
    propFirm: cleanText(input.propFirm, ''),
    symbolSuffix: cleanText(input.symbolSuffix, ''),
    latencyMs: clampNumber(input.latencyMs, 0, 60000, 350),
    heartbeatSeconds: clampNumber(input.heartbeatSeconds, 1, 300, 8),
    notes: cleanText(input.notes, ''),
    createdAt: cleanText(input.createdAt, new Date().toISOString()),
    updatedAt: cleanText(input.updatedAt, new Date().toISOString()),
  };
}

export function createCopierLink(input = {}) {
  return normalizeCopierLink({
    id: input.id || makeId('copier-link'),
    label: input.label || '',
    masterAccountId: input.masterAccountId || '',
    followerAccountId: input.followerAccountId || '',
    status: input.status || 'active',
    sizingMode: input.sizingMode || 'smart-risk',
    multiplier: input.multiplier ?? 1,
    fixedLot: input.fixedLot ?? 0.1,
    riskPercent: input.riskPercent ?? 0.5,
    maxLot: input.maxLot ?? 5,
    reverseSide: input.reverseSide ?? false,
    propShield: input.propShield ?? true,
    stepDown: input.stepDown ?? true,
    latencyGuardMs: input.latencyGuardMs ?? 4000,
    sessionFilter: input.sessionFilter || SESSION_OPTIONS.map((option) => option.id),
    symbolAllowlist: input.symbolAllowlist || '',
    symbolRemap: input.symbolRemap || '',
    notes: input.notes || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function normalizeCopierLink(input = {}) {
  return {
    id: cleanText(input.id, makeId('copier-link')),
    label: cleanText(input.label, ''),
    masterAccountId: cleanText(input.masterAccountId, ''),
    followerAccountId: cleanText(input.followerAccountId, ''),
    status: cleanText(input.status, 'active'),
    sizingMode: normalizeSizingMode(input.sizingMode),
    multiplier: clampNumber(input.multiplier, 0, 25, 1),
    fixedLot: clampNumber(input.fixedLot, 0, 1000, 0.1),
    riskPercent: clampNumber(input.riskPercent, 0, 10, 0.5),
    maxLot: clampNumber(input.maxLot, 0, 1000, 5),
    reverseSide: Boolean(input.reverseSide),
    propShield: input.propShield !== false,
    stepDown: input.stepDown !== false,
    latencyGuardMs: clampNumber(input.latencyGuardMs, 0, 120000, 4000),
    sessionFilter: normalizeSessionFilter(input.sessionFilter),
    symbolAllowlist: cleanText(input.symbolAllowlist, ''),
    symbolRemap: cleanText(input.symbolRemap, ''),
    notes: cleanText(input.notes, ''),
    createdAt: cleanText(input.createdAt, new Date().toISOString()),
    updatedAt: cleanText(input.updatedAt, new Date().toISOString()),
  };
}

export function normalizeTradeCopierState(rawState = {}, brokerAccounts = []) {
  const accounts = Array.isArray(rawState?.accounts) ? rawState.accounts.map((account) => normalizeCopierAccount(account)) : [];
  const mergedAccounts = mergeBrokerAccountsIntoCopier(accounts, brokerAccounts);
  const accountIds = new Set(mergedAccounts.map((account) => account.id));
  const links = Array.isArray(rawState?.links)
    ? rawState.links
        .map((link) => normalizeCopierLink(link))
        .filter((link) => accountIds.has(link.masterAccountId) && accountIds.has(link.followerAccountId) && link.masterAccountId !== link.followerAccountId)
    : [];
  const activity = Array.isArray(rawState?.activity)
    ? rawState.activity
        .map((item) => normalizeActivityItem(item, mergedAccounts))
        .filter(Boolean)
        .slice(0, MAX_ACTIVITY_ITEMS)
    : [];

  return {
    version: 1,
    accounts: mergedAccounts,
    links,
    activity,
    lastUpdated: cleanText(rawState?.lastUpdated, new Date().toISOString()),
  };
}

export function buildTradeCopierOverview(state) {
  const accounts = Array.isArray(state?.accounts) ? state.accounts : [];
  const links = Array.isArray(state?.links) ? state.links : [];
  const riskSummaries = accounts.map((account) => calculateAccountRiskState(account));
  const activeLinks = links.filter((link) => link.status === 'active');

  return {
    masters: accounts.filter((account) => account.role === 'master').length,
    followers: accounts.filter((account) => account.role === 'follower').length,
    activeLinks: activeLinks.length,
    capital: roundNumber(accounts.reduce((sum, account) => sum + maxNumber(account.equity || account.balance, 0), 0), 0),
    protectedAccounts: accounts.filter((account) => Boolean(account.propFirm) || account.venue === 'Prop').length,
    readyFollowers: riskSummaries.filter((item) => item.role === 'follower' && item.state === 'ready').length,
    blockedFollowers: riskSummaries.filter((item) => item.role === 'follower' && item.state === 'blocked').length,
    watchFollowers: riskSummaries.filter((item) => item.role === 'follower' && item.state === 'watch').length,
  };
}

export function calculateAccountRiskState(account) {
  const normalized = normalizeCopierAccount(account);
  const capital = Math.max(normalized.equity || normalized.balance || 0, 0);
  const perTradeBudgetCash = capital * (normalized.riskPerTrade / 100);
  const dailyLossBudgetCash = capital * (normalized.maxDailyLoss / 100);
  const drawdownBudgetCash = capital * (normalized.maxDrawdown / 100);
  const openRiskBudgetCash = capital * (normalized.maxOpenRisk / 100);
  const dailyLossRemainingCash = Math.max(0, capital * ((normalized.maxDailyLoss - normalized.currentDailyLoss) / 100));
  const drawdownRemainingCash = Math.max(0, capital * ((normalized.maxDrawdown - normalized.currentDrawdown) / 100));
  const constrainedBudgetCash = Math.max(0, Math.min(
    perTradeBudgetCash || Infinity,
    dailyLossRemainingCash || Infinity,
    drawdownRemainingCash || Infinity,
    openRiskBudgetCash || Infinity,
  ));

  const pressure = Math.max(
    normalized.maxDailyLoss ? normalized.currentDailyLoss / normalized.maxDailyLoss : 0,
    normalized.maxDrawdown ? normalized.currentDrawdown / normalized.maxDrawdown : 0,
  );

  const reasons = [];
  let state = 'ready';

  if (capital <= 0) {
    reasons.push('Capital is not configured.');
    state = 'blocked';
  }

  if (normalized.status === 'offline' || normalized.status === 'blocked') {
    reasons.push('Connection is offline.');
    state = 'blocked';
  } else if (normalized.status === 'warning' && state !== 'blocked') {
    reasons.push('Connection health needs attention.');
    state = 'watch';
  }

  if (normalized.currentDailyLoss >= normalized.maxDailyLoss || normalized.currentDrawdown >= normalized.maxDrawdown) {
    reasons.push('Loss limits are fully consumed.');
    state = 'blocked';
  } else if ((dailyLossRemainingCash < perTradeBudgetCash || drawdownRemainingCash < perTradeBudgetCash) && state === 'ready') {
    reasons.push('Loss buffers are getting tight.');
    state = 'watch';
  }

  if (pressure >= 0.75 && state === 'ready') {
    reasons.push('Account is in high drawdown pressure.');
    state = 'watch';
  }

  return {
    ...normalized,
    capital,
    role: normalized.role,
    state,
    reasons,
    pressure,
    perTradeBudgetCash: roundNumber(perTradeBudgetCash),
    dailyLossBudgetCash: roundNumber(dailyLossBudgetCash),
    drawdownBudgetCash: roundNumber(drawdownBudgetCash),
    openRiskBudgetCash: roundNumber(openRiskBudgetCash),
    dailyLossRemainingCash: roundNumber(dailyLossRemainingCash),
    drawdownRemainingCash: roundNumber(drawdownRemainingCash),
    constrainedBudgetCash: roundNumber(constrainedBudgetCash),
  };
}

export function simulateTradeCopierDispatch(state, payload) {
  const accounts = Array.isArray(state?.accounts) ? state.accounts.map((account) => normalizeCopierAccount(account)) : [];
  const links = Array.isArray(state?.links) ? state.links.map((link) => normalizeCopierLink(link)) : [];
  const masterAccount = accounts.find((account) => account.id === payload.masterAccountId);

  if (!masterAccount) {
    return {
      results: [],
      activityItem: null,
      nextState: normalizeTradeCopierState(state),
      error: 'Select a master account before dispatching a copier test.',
    };
  }

  const trade = {
    symbol: cleanText(payload.symbol, ''),
    side: normalizeSide(payload.side),
    entry: maxNumber(payload.entry, 0),
    stop: maxNumber(payload.stop, 0),
    target: maxNumber(payload.target, 0),
    session: cleanText(payload.session, 'london').toLowerCase(),
    masterSize: maxNumber(payload.masterSize, 1),
    masterRiskCash: maxNumber(payload.masterRiskCash, 0),
    notes: cleanText(payload.notes, ''),
  };

  const eligibleLinks = links.filter((link) => link.status === 'active' && link.masterAccountId === masterAccount.id);
  const results = eligibleLinks.map((link) => {
    const followerAccount = accounts.find((account) => account.id === link.followerAccountId);
    return calculateFollowerCopy(masterAccount, followerAccount, link, trade);
  });

  const activityItem = {
    id: makeId('dispatch'),
    timestamp: new Date().toISOString(),
    masterAccountId: masterAccount.id,
    masterLabel: masterAccount.label,
    symbol: trade.symbol,
    side: trade.side,
    session: trade.session,
    entry: trade.entry,
    stop: trade.stop,
    target: trade.target,
    masterSize: trade.masterSize,
    masterRiskCash: trade.masterRiskCash,
    notes: trade.notes,
    results,
  };

  return {
    results,
    activityItem,
    nextState: normalizeTradeCopierState({
      ...state,
      activity: [activityItem, ...(state?.activity || [])].slice(0, MAX_ACTIVITY_ITEMS),
    }),
    error: '',
  };
}

export function calculateFollowerCopy(masterAccount, followerAccount, link, trade) {
  const master = normalizeCopierAccount(masterAccount);
  const follower = normalizeCopierAccount(followerAccount);
  const normalizedLink = normalizeCopierLink(link);
  const riskState = calculateAccountRiskState(follower);
  const symbol = applySymbolMapping(normalizedLink, follower, trade.symbol);
  const side = normalizedLink.reverseSide ? reverseSide(trade.side) : normalizeSide(trade.side);
  const reasons = [];
  let state = riskState.state === 'blocked' ? 'blocked' : 'ready';

  if (!symbol) {
    reasons.push('Symbol is missing.');
    state = 'blocked';
  }

  if (!riskState.capital) {
    reasons.push('Follower capital is missing.');
    state = 'blocked';
  }

  if (!isSessionAllowed(normalizedLink, trade.session)) {
    reasons.push('Session filter blocks this trade.');
    state = 'blocked';
  }

  if (!isSymbolAllowed(normalizedLink, trade.symbol)) {
    reasons.push('Symbol is outside the follower allowlist.');
    state = 'blocked';
  }

  if (follower.status === 'warning' && state !== 'blocked') {
    reasons.push('Connection heartbeat is degraded.');
    state = 'watch';
  }

  const unitRiskCash = estimateUnitRiskCash(symbol, trade.entry, trade.stop, follower.venue);
  const masterCapital = Math.max(master.equity || master.balance || 0, 1);
  const followerCapital = Math.max(follower.equity || follower.balance || 0, 0);
  const sizedMultiplier = applyStepDown(normalizedLink.multiplier, follower, normalizedLink);

  let recommendedSize = 0;
  if (normalizedLink.sizingMode === 'balance-ratio') {
    recommendedSize = trade.masterSize * ratio(follower.balance, master.balance || masterCapital) * sizedMultiplier;
  } else if (normalizedLink.sizingMode === 'equity-ratio') {
    recommendedSize = trade.masterSize * ratio(followerCapital, masterCapital) * sizedMultiplier;
  } else if (normalizedLink.sizingMode === 'fixed-lot') {
    recommendedSize = normalizedLink.fixedLot * sizedMultiplier;
  } else {
    const targetRiskCash = normalizedLink.sizingMode === 'risk-percent'
      ? followerCapital * ((normalizedLink.riskPercent || follower.riskPerTrade) / 100)
      : Math.min(
          riskState.perTradeBudgetCash || Infinity,
          riskState.dailyLossRemainingCash || Infinity,
          riskState.drawdownRemainingCash || Infinity,
          riskState.openRiskBudgetCash || Infinity,
        ) * sizedMultiplier;
    recommendedSize = unitRiskCash > 0 ? (targetRiskCash / unitRiskCash) : 0;
  }

  recommendedSize = Math.min(
    recommendedSize,
    normalizedLink.maxLot || Infinity,
    follower.maxLot || Infinity,
  );

  recommendedSize = roundNumber(Math.max(0, recommendedSize), 3);
  const estimatedRiskCash = roundNumber(unitRiskCash * recommendedSize);
  const capacityCash = Math.max(0, Math.min(
    riskState.dailyLossRemainingCash || Infinity,
    riskState.drawdownRemainingCash || Infinity,
    riskState.openRiskBudgetCash || Infinity,
    riskState.perTradeBudgetCash || Infinity,
  ));
  const utilization = capacityCash > 0 ? estimatedRiskCash / capacityCash : 0;

  if (normalizedLink.propShield && estimatedRiskCash > capacityCash + 0.01) {
    reasons.push('Prop Shield blocked the order because the follower exceeds its remaining risk budget.');
    state = 'blocked';
  } else if (utilization >= 0.8 && state === 'ready') {
    reasons.push('This order consumes most of the remaining risk budget.');
    state = 'watch';
  }

  if (recommendedSize <= 0) {
    reasons.push('Recommended size falls below the allowed minimum.');
    state = 'blocked';
  }

  return {
    id: makeId('dispatch-row'),
    linkId: normalizedLink.id,
    followerAccountId: follower.id,
    followerLabel: follower.label,
    followerPlatform: follower.platform,
    symbol,
    side,
    sizingMode: normalizedLink.sizingMode,
    recommendedSize,
    estimatedRiskCash,
    capacityCash: roundNumber(capacityCash),
    utilization: roundNumber(utilization * 100, 1),
    state,
    reasons: [...riskState.reasons, ...reasons],
    stepDownApplied: roundNumber(sizedMultiplier, 2),
    connectionStatus: follower.status,
  };
}

function normalizeActivityItem(item, accounts = []) {
  if (!item || !item.id) return null;
  const accountIds = new Set(accounts.map((account) => account.id));
  const results = Array.isArray(item.results) ? item.results : [];

  return {
    id: cleanText(item.id, makeId('dispatch')),
    timestamp: cleanText(item.timestamp, new Date().toISOString()),
    masterAccountId: cleanText(item.masterAccountId, ''),
    masterLabel: cleanText(item.masterLabel, ''),
    symbol: cleanText(item.symbol, ''),
    side: normalizeSide(item.side),
    session: cleanText(item.session, 'london'),
    entry: maxNumber(item.entry, 0),
    stop: maxNumber(item.stop, 0),
    target: maxNumber(item.target, 0),
    masterSize: maxNumber(item.masterSize, 0),
    masterRiskCash: maxNumber(item.masterRiskCash, 0),
    notes: cleanText(item.notes, ''),
    results: results
      .filter((result) => accountIds.has(result.followerAccountId))
      .map((result) => ({
        ...result,
        recommendedSize: roundNumber(result.recommendedSize, 3),
        estimatedRiskCash: roundNumber(result.estimatedRiskCash),
        utilization: roundNumber(result.utilization, 1),
      })),
  };
}

function mergeBrokerAccountsIntoCopier(accounts, brokerAccounts = []) {
  const nextAccounts = [...accounts];
  const existingByBroker = new Map(nextAccounts.filter((account) => account.brokerAccountId).map((account) => [String(account.brokerAccountId), account]));

  (brokerAccounts || []).forEach((brokerAccount) => {
    const brokerId = String(brokerAccount?.id || '');
    if (!brokerId) return;
    const existing = existingByBroker.get(brokerId);

    if (!existing) {
      nextAccounts.push(createCopierAccount({}, brokerAccount));
      return;
    }

    const merged = normalizeCopierAccount({
      ...existing,
      source: 'broker',
      brokerAccountId: brokerAccount.id,
      label: existing.label || brokerAccount.account_name || brokerAccount.account_number,
      platform: existing.platform || mapBrokerTypeToPlatform(brokerAccount.broker_type),
      venue: existing.venue || guessVenueFromAccount(brokerAccount),
      status: brokerAccount.status === 'connected' ? 'connected' : existing.status,
    });

    const index = nextAccounts.findIndex((account) => account.id === existing.id);
    nextAccounts[index] = merged;
  });

  return nextAccounts
    .sort((left, right) => {
      const leftMaster = left.role === 'master' ? 0 : left.role === 'follower' ? 1 : 2;
      const rightMaster = right.role === 'master' ? 0 : right.role === 'follower' ? 1 : 2;
      return leftMaster - rightMaster;
    });
}

function isSessionAllowed(link, session) {
  const filters = normalizeSessionFilter(link.sessionFilter);
  if (!filters.length) return true;
  return filters.includes(cleanText(session, '').toLowerCase());
}

function isSymbolAllowed(link, symbol) {
  const allowlist = parseCommaList(link.symbolAllowlist);
  if (!allowlist.length) return true;
  const normalizedSymbol = cleanText(symbol, '').toUpperCase();
  return allowlist.includes(normalizedSymbol);
}

function applySymbolMapping(link, follower, symbol) {
  const normalized = cleanText(symbol, '').toUpperCase();
  if (!normalized) return '';

  const mapping = parseMapping(link.symbolRemap);
  const mapped = mapping[normalized] || normalized;
  const suffix = cleanText(follower.symbolSuffix, '');
  if (!suffix || mapped.endsWith(suffix)) return mapped;
  return `${mapped}${suffix}`;
}

function parseMapping(value) {
  return cleanText(value, '')
    .split(/\r?\n/)
    .reduce((accumulator, line) => {
      const [source, target] = line.split('=').map((part) => cleanText(part, '').toUpperCase());
      if (source && target) accumulator[source] = target;
      return accumulator;
    }, {});
}

function estimateUnitRiskCash(symbol, entry, stop, venue) {
  const distance = Math.abs(maxNumber(entry, 0) - maxNumber(stop, 0));
  if (!distance) return 0;
  const cleanSymbol = cleanText(symbol, '').toUpperCase();
  const cleanVenue = cleanText(venue, '').toLowerCase();

  if (/XAU|GOLD/.test(cleanSymbol)) return distance * 100;
  if (/XAG|SILV/.test(cleanSymbol)) return distance * 500;
  if (/BTC|ETH|SOL|CRYPTO/.test(cleanSymbol) || cleanVenue === 'crypto') return distance;
  if (/US30|NAS|SPX|GER|DAX|DJI|USTEC|JP225/.test(cleanSymbol) || cleanVenue === 'futures') return distance * 5;
  if (/^[A-Z]{6}$/.test(cleanSymbol)) {
    const pipFactor = cleanSymbol.endsWith('JPY') ? 100 : 10000;
    return distance * pipFactor * 10;
  }
  if (/^[A-Z]{1,5}$/.test(cleanSymbol) || cleanVenue === 'stocks') return distance;
  return Math.max(distance, 1);
}

function applyStepDown(multiplier, follower, link) {
  const safeMultiplier = Math.max(0, maxNumber(multiplier, 1));
  if (!link.stepDown) return safeMultiplier;

  const dailyPressure = follower.maxDailyLoss ? follower.currentDailyLoss / follower.maxDailyLoss : 0;
  const ddPressure = follower.maxDrawdown ? follower.currentDrawdown / follower.maxDrawdown : 0;
  const pressure = Math.max(dailyPressure, ddPressure);

  if (pressure >= 0.85) return safeMultiplier * 0.35;
  if (pressure >= 0.7) return safeMultiplier * 0.5;
  if (pressure >= 0.5) return safeMultiplier * 0.72;
  if (pressure >= 0.3) return safeMultiplier * 0.88;
  return safeMultiplier;
}

function normalizeRole(value) {
  const normalized = cleanText(value, 'follower').toLowerCase();
  return ACCOUNT_ROLE_OPTIONS.some((option) => option.id === normalized) ? normalized : 'follower';
}

function normalizeSizingMode(value) {
  const normalized = cleanText(value, 'smart-risk');
  return COPY_SIZING_MODES.some((mode) => mode.id === normalized) ? normalized : 'smart-risk';
}

function normalizeSessionFilter(value) {
  if (!Array.isArray(value)) return SESSION_OPTIONS.map((option) => option.id);
  const next = value
    .map((item) => cleanText(item, '').toLowerCase())
    .filter((item) => SESSION_OPTIONS.some((option) => option.id === item));
  return next.length ? Array.from(new Set(next)) : SESSION_OPTIONS.map((option) => option.id);
}

function normalizeAccountStatus(value) {
  const normalized = cleanText(value, 'connected').toLowerCase();
  if (['connected', 'warning', 'offline', 'blocked'].includes(normalized)) return normalized;
  return 'connected';
}

function normalizeSide(value) {
  const normalized = cleanText(value, 'buy').toLowerCase();
  if (['long', 'buy'].includes(normalized)) return 'long';
  if (['short', 'sell'].includes(normalized)) return 'short';
  return 'long';
}

function reverseSide(side) {
  return normalizeSide(side) === 'long' ? 'short' : 'long';
}

function inferConnectionStatus(value) {
  return cleanText(value, '').toLowerCase() === 'connected' ? 'connected' : 'warning';
}

function mapBrokerTypeToPlatform(value) {
  const normalized = cleanText(value, '').toLowerCase();
  if (normalized === 'mt4') return 'MT4';
  if (normalized === 'mt5') return 'MT5';
  if (normalized === 'ctrader') return 'cTrader';
  if (normalized === 'ibkr') return 'IBKR';
  if (normalized === 'tradingview') return 'TradingView';
  if (normalized === 'webhook') return 'Webhook';
  return 'Manual';
}

function guessVenueFromAccount(account) {
  const platform = mapBrokerTypeToPlatform(account?.broker_type);
  if (platform === 'IBKR') return 'Stocks';
  if (platform === 'Rithmic' || platform === 'NinjaTrader' || platform === 'CQG') return 'Futures';
  if (platform === 'TradingView') return 'CFD';
  return 'CFD';
}

function parseCommaList(value) {
  return cleanText(value, '')
    .split(',')
    .map((item) => cleanText(item, '').toUpperCase())
    .filter(Boolean);
}

function ratio(value, against) {
  const left = maxNumber(value, 0);
  const right = maxNumber(against, 0);
  if (!left || !right) return 0;
  return left / right;
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function maxNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(Math.max(next, min), max);
}

function cleanText(value, fallback = '') {
  if (typeof value !== 'string') {
    if (value === undefined || value === null) return fallback;
    return String(value);
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function makeId(prefix) {
  const entropy = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${entropy}`;
}
