const STORAGE_PREFIX = 'mf_backtest_sessions_v1_';

export function getBacktestSessionLimit(plan) {
  const normalized = String(plan || '').toLowerCase();
  if (normalized === 'elite') return 25;
  if (normalized === 'pro') return 5;
  if (normalized === 'starter') return 1;
  return 0;
}

export function loadBacktestSessions(userId) {
  if (!userId || typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeBacktestSession) : [];
  } catch {
    return [];
  }
}

export function saveBacktestSessions(userId, sessions) {
  const normalized = Array.isArray(sessions) ? sessions.map(normalizeBacktestSession) : [];
  if (!userId || typeof window === 'undefined') return normalized;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(normalized));
  } catch {}
  return normalized;
}

export function createBacktestSession(input = {}) {
  return normalizeBacktestSession({
    id: input.id || `bt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name || buildBacktestSessionName(input),
    mode: input.mode || 'backtesting',
    symbol: input.symbol || 'all',
    assets: Array.isArray(input.assets) ? input.assets : [],
    setup: input.setup || 'all',
    session: input.session || 'all',
    interval: input.interval || '15',
    playbackSpeed: input.playbackSpeed || 2,
    replayIndex: Number.isFinite(input.replayIndex) ? input.replayIndex : 0,
    accountScope: input.accountScope || 'all',
    accountBalance: Number.isFinite(Number(input.accountBalance)) ? Number(input.accountBalance) : 100000,
    chartLayout: input.chartLayout || 'single',
    startDate: input.startDate || '',
    endDate: input.endDate || '',
    randomize: Boolean(input.randomize),
    plan: input.plan || 'starter',
    tradeCount: Number.isFinite(input.tradeCount) ? input.tradeCount : 0,
    progressPct: Number.isFinite(input.progressPct) ? input.progressPct : 0,
    lastSymbol: input.lastSymbol || '',
    reviewedSeconds: Number.isFinite(input.reviewedSeconds) ? input.reviewedSeconds : 0,
    status: input.status || 'new',
    notes: input.notes || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    lastOpenedAt: input.lastOpenedAt || new Date().toISOString(),
  });
}

export function normalizeBacktestSession(session = {}) {
  const assets = Array.isArray(session.assets)
    ? session.assets.map((asset) => String(asset || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(session.id || `bt-${Date.now()}`),
    name: String(session.name || buildBacktestSessionName(session)),
    mode: String(session.mode || 'backtesting'),
    symbol: String(session.symbol || 'all'),
    assets,
    setup: String(session.setup || 'all'),
    session: String(session.session || 'all'),
    interval: String(session.interval || '15'),
    playbackSpeed: clampNumber(session.playbackSpeed, 1, 10, 2),
    replayIndex: clampNumber(session.replayIndex, 0, 100000, 0),
    accountScope: String(session.accountScope || 'all'),
    accountBalance: clampNumber(session.accountBalance, 0, 1000000000, 100000),
    chartLayout: String(session.chartLayout || 'single'),
    startDate: String(session.startDate || ''),
    endDate: String(session.endDate || ''),
    randomize: Boolean(session.randomize),
    plan: String(session.plan || 'starter'),
    tradeCount: clampNumber(session.tradeCount, 0, 1000000, 0),
    progressPct: clampNumber(session.progressPct, 0, 100, 0),
    lastSymbol: String(session.lastSymbol || ''),
    reviewedSeconds: clampNumber(session.reviewedSeconds, 0, 100000000, 0),
    status: String(session.status || 'new'),
    notes: String(session.notes || ''),
    createdAt: String(session.createdAt || new Date().toISOString()),
    updatedAt: String(session.updatedAt || new Date().toISOString()),
    lastOpenedAt: String(session.lastOpenedAt || new Date().toISOString()),
  };
}

export function buildBacktestSessionName(input = {}) {
  const parts = [
    input.symbol && input.symbol !== 'all'
      ? input.symbol
      : Array.isArray(input.assets) && input.assets[0]
        ? input.assets[0]
        : 'Replay',
    input.setup && input.setup !== 'all' ? input.setup : '',
    input.session && input.session !== 'all' ? input.session : '',
  ].filter(Boolean);

  return parts.join(' · ') || 'Replay session';
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
}
