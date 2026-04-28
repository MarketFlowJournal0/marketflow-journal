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
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((session) => {
        try {
          return normalizeBacktestSession(session);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
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
    ohlcProvider: input.ohlcProvider || 'auto',
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
  const source = session && typeof session === 'object' ? session : {};
  const assets = Array.isArray(source.assets)
    ? source.assets.map((asset) => String(asset || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(source.id || `bt-${Date.now()}`),
    name: String(source.name || buildBacktestSessionName(source)),
    mode: String(source.mode || 'backtesting'),
    symbol: String(source.symbol || 'all'),
    assets,
    setup: String(source.setup || 'all'),
    session: String(source.session || 'all'),
    interval: String(source.interval || '15'),
    ohlcProvider: String(source.ohlcProvider || 'auto'),
    playbackSpeed: clampNumber(source.playbackSpeed, 1, 10, 2),
    replayIndex: clampNumber(source.replayIndex, 0, 100000, 0),
    accountScope: String(source.accountScope || 'all'),
    accountBalance: clampNumber(source.accountBalance, 0, 1000000000, 100000),
    chartLayout: String(source.chartLayout || 'single'),
    startDate: normalizeDateString(source.startDate),
    endDate: normalizeDateString(source.endDate),
    randomize: Boolean(source.randomize),
    plan: String(source.plan || 'starter'),
    tradeCount: clampNumber(source.tradeCount, 0, 1000000, 0),
    progressPct: clampNumber(source.progressPct, 0, 100, 0),
    lastSymbol: String(source.lastSymbol || ''),
    reviewedSeconds: clampNumber(source.reviewedSeconds, 0, 100000000, 0),
    status: String(source.status || 'new'),
    notes: String(source.notes || ''),
    createdAt: normalizeIsoString(source.createdAt),
    updatedAt: normalizeIsoString(source.updatedAt),
    lastOpenedAt: normalizeIsoString(source.lastOpenedAt),
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

function normalizeDateString(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function normalizeIsoString(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}
