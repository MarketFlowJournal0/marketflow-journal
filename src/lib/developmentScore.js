export const DEVELOPMENT_STORAGE_PREFIX = 'mfj_development_workspace_v1_';

export const DEVELOPMENT_TASKS = [
  {
    id: 'pre_session_plan',
    label: 'Pre-session plan written',
    weight: 18,
    category: 'Preparation',
  },
  {
    id: 'risk_defined',
    label: 'Risk and invalidation defined',
    weight: 18,
    category: 'Risk',
  },
  {
    id: 'execution_rules',
    label: 'Execution rules followed',
    weight: 18,
    category: 'Discipline',
  },
  {
    id: 'no_revenge',
    label: 'No revenge / no impulse trade',
    weight: 16,
    category: 'Control',
  },
  {
    id: 'journal_updated',
    label: 'Trades logged or imported',
    weight: 15,
    category: 'Journal',
  },
  {
    id: 'post_session_review',
    label: 'Post-session review completed',
    weight: 15,
    category: 'Review',
  },
];

export function getDevelopmentDateKey(date = new Date()) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return getDevelopmentDateKey(new Date());
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDevelopmentStorageKey(userId = 'guest', accountId = 'all') {
  return `${DEVELOPMENT_STORAGE_PREFIX}${userId || 'guest'}_${accountId || 'all'}`;
}

export function createDevelopmentEntry(dateKey = getDevelopmentDateKey()) {
  return {
    dateKey,
    tasks: DEVELOPMENT_TASKS.reduce((accumulator, task) => ({ ...accumulator, [task.id]: false }), {}),
    focus: '',
    riskPlan: '',
    review: '',
    improvement: '',
    mentalState: 'steady',
    sleepQuality: 7,
    disciplineRating: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeDevelopmentEntry(entry = {}, dateKey = getDevelopmentDateKey()) {
  const tasks = DEVELOPMENT_TASKS.reduce((accumulator, task) => ({
    ...accumulator,
    [task.id]: Boolean(entry?.tasks?.[task.id]),
  }), {});

  return {
    ...createDevelopmentEntry(dateKey),
    ...entry,
    dateKey: entry.dateKey || dateKey,
    tasks,
    focus: String(entry.focus || ''),
    riskPlan: String(entry.riskPlan || ''),
    review: String(entry.review || ''),
    improvement: String(entry.improvement || ''),
    mentalState: String(entry.mentalState || 'steady'),
    sleepQuality: clampNumber(entry.sleepQuality, 1, 10, 7),
    disciplineRating: clampNumber(entry.disciplineRating, 1, 10, 7),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

export function loadDevelopmentEntries(userId = 'guest', accountId = 'all') {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getDevelopmentStorageKey(userId, accountId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([dateKey, entry]) => [dateKey, normalizeDevelopmentEntry(entry, dateKey)]),
    );
  } catch {
    return {};
  }
}

export function saveDevelopmentEntry(userId = 'guest', accountId = 'all', entry = {}) {
  const entries = loadDevelopmentEntries(userId, accountId);
  const dateKey = entry.dateKey || getDevelopmentDateKey();
  const nextEntry = normalizeDevelopmentEntry({
    ...entry,
    updatedAt: new Date().toISOString(),
  }, dateKey);
  const nextEntries = {
    ...entries,
    [dateKey]: nextEntry,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(getDevelopmentStorageKey(userId, accountId), JSON.stringify(nextEntries));
      window.dispatchEvent(new CustomEvent('mfj-development-updated', {
        detail: { userId, accountId, dateKey, entry: nextEntry },
      }));
    } catch {}
  }

  return getDevelopmentScoreSnapshot(userId, accountId, nextEntries);
}

export function getDevelopmentScoreSnapshot(userId = 'guest', accountId = 'all', providedEntries = null) {
  const entries = providedEntries || loadDevelopmentEntries(userId, accountId);
  const todayKey = getDevelopmentDateKey();
  const today = normalizeDevelopmentEntry(entries[todayKey] || createDevelopmentEntry(todayKey), todayKey);
  const sortedEntries = Object.values(entries)
    .map((entry) => normalizeDevelopmentEntry(entry, entry.dateKey))
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  const recent = buildRecentWindow(entries, 14);
  const recentLogged = recent.filter((entry) => Boolean(entries[entry.dateKey]));
  const weeklyAverage = recentLogged.length
    ? Math.round(recentLogged.reduce((sum, entry) => sum + computeEntryScore(entry), 0) / recentLogged.length)
    : 0;
  const todayScore = computeEntryScore(today);
  const streak = computeDevelopmentStreak(entries);
  const reviewQuality = computeReviewQuality(today);
  const score = clampNumber(
    Math.round((todayScore * 0.42) + (weeklyAverage * 0.34) + (Math.min(streak, 10) * 2.4) + (reviewQuality * 0.12)),
    0,
    100,
    0,
  );

  return {
    entries,
    today,
    todayKey,
    todayScore,
    weeklyAverage,
    streak,
    score,
    reviewQuality,
    recent,
    lastUpdated: sortedEntries[sortedEntries.length - 1]?.updatedAt || null,
  };
}

export function computeEntryScore(entry = {}) {
  const normalized = normalizeDevelopmentEntry(entry, entry.dateKey);
  const taskScore = DEVELOPMENT_TASKS.reduce((sum, task) => (
    sum + (normalized.tasks[task.id] ? task.weight : 0)
  ), 0);
  const disciplineScore = (normalized.disciplineRating / 10) * 8;
  const sleepScore = (normalized.sleepQuality / 10) * 4;
  const textScore = computeReviewQuality(normalized) * 0.08;
  return clampNumber(Math.round(taskScore + disciplineScore + sleepScore + textScore), 0, 100, 0);
}

function buildRecentWindow(entries = {}, days = 14) {
  const today = new Date(`${getDevelopmentDateKey()}T00:00:00`);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const dateKey = getDevelopmentDateKey(date);
    return normalizeDevelopmentEntry(entries[dateKey] || createDevelopmentEntry(dateKey), dateKey);
  });
}

function computeDevelopmentStreak(entries = {}) {
  let streak = 0;
  const cursor = new Date(`${getDevelopmentDateKey()}T00:00:00`);

  for (let index = 0; index < 90; index += 1) {
    const dateKey = getDevelopmentDateKey(cursor);
    const entry = entries[dateKey];
    if (!entry || computeEntryScore(entry) < 70) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function computeReviewQuality(entry = {}) {
  const text = [entry.focus, entry.riskPlan, entry.review, entry.improvement].join(' ').trim();
  if (!text) return 0;
  return clampNumber(Math.round((text.length / 220) * 100), 0, 100, 0);
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}
