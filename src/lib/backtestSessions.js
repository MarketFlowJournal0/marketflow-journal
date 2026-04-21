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
    symbol: input.symbol || 'all',
    setup: input.setup || 'all',
    session: input.session || 'all',
    interval: input.interval || '15',
    playbackSpeed: input.playbackSpeed || 2,
    replayIndex: Number.isFinite(input.replayIndex) ? input.replayIndex : 0,
    accountScope: input.accountScope || 'all',
    plan: input.plan || 'starter',
    tradeCount: Number.isFinite(input.tradeCount) ? input.tradeCount : 0,
    progressPct: Number.isFinite(input.progressPct) ? input.progressPct : 0,
    lastSymbol: input.lastSymbol || '',
    notes: input.notes || '',
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: input.updatedAt || new Date().toISOString(),
    lastOpenedAt: input.lastOpenedAt || new Date().toISOString(),
  });
}

export function normalizeBacktestSession(session = {}) {
  return {
    id: String(session.id || `bt-${Date.now()}`),
    name: String(session.name || buildBacktestSessionName(session)),
    symbol: String(session.symbol || 'all'),
    setup: String(session.setup || 'all'),
    session: String(session.session || 'all'),
    interval: String(session.interval || '15'),
    playbackSpeed: clampNumber(session.playbackSpeed, 1, 10, 2),
    replayIndex: clampNumber(session.replayIndex, 0, 100000, 0),
    accountScope: String(session.accountScope || 'all'),
    plan: String(session.plan || 'starter'),
    tradeCount: clampNumber(session.tradeCount, 0, 1000000, 0),
    progressPct: clampNumber(session.progressPct, 0, 100, 0),
    lastSymbol: String(session.lastSymbol || ''),
    notes: String(session.notes || ''),
    createdAt: String(session.createdAt || new Date().toISOString()),
    updatedAt: String(session.updatedAt || new Date().toISOString()),
    lastOpenedAt: String(session.lastOpenedAt || new Date().toISOString()),
  };
}

export function buildBacktestSessionName(input = {}) {
  const parts = [
    input.symbol && input.symbol !== 'all' ? input.symbol : 'Replay',
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
