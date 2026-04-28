export const PSYCHOLOGY_CHECKIN_STORAGE_PREFIX = 'mfj_psychology_checkins_v1_';
export const PSYCHOLOGY_CHECKIN_STATUS_PREFIX = 'mfj_psychology_checkin_status_v1_';
export const PSYCHOLOGY_CHECKIN_EVENT = 'mfj-psychology-checkin-updated';

export const DAILY_PSYCHOLOGY_QUESTIONS = [
  {
    id: 'sleep',
    label: 'How did you sleep?',
    options: [
      { id: 'deep', label: 'Deep sleep', score: 96, value: 9 },
      { id: 'ok', label: 'Enough sleep', score: 78, value: 7 },
      { id: 'light', label: 'Light sleep', score: 55, value: 5 },
      { id: 'poor', label: 'Poor sleep', score: 28, value: 3 },
    ],
  },
  {
    id: 'energy',
    label: 'Where is your energy?',
    options: [
      { id: 'sharp', label: 'Sharp', score: 94, value: 9 },
      { id: 'stable', label: 'Stable', score: 76, value: 7 },
      { id: 'low', label: 'Low', score: 48, value: 5 },
      { id: 'drained', label: 'Drained', score: 25, value: 3 },
    ],
  },
  {
    id: 'emotionalState',
    label: 'Emotional state before trading?',
    options: [
      { id: 'calm', label: 'Calm', score: 96 },
      { id: 'focused', label: 'Focused', score: 86 },
      { id: 'reactive', label: 'Reactive', score: 45 },
      { id: 'stressed', label: 'Stressed', score: 24 },
    ],
  },
  {
    id: 'planReadiness',
    label: 'How ready is your plan?',
    options: [
      { id: 'written', label: 'Written and precise', score: 98 },
      { id: 'clear', label: 'Clear enough', score: 82 },
      { id: 'rough', label: 'Rough idea', score: 52 },
      { id: 'none', label: 'No real plan', score: 18 },
    ],
  },
  {
    id: 'riskControl',
    label: 'How locked is your risk?',
    options: [
      { id: 'locked', label: 'Risk locked', score: 98 },
      { id: 'reviewed', label: 'Reviewed', score: 84 },
      { id: 'uncertain', label: 'Uncertain', score: 44 },
      { id: 'impulsive', label: 'Impulsive risk', score: 18 },
    ],
  },
];

const DEFAULT_ANSWERS = DAILY_PSYCHOLOGY_QUESTIONS.reduce((accumulator, question) => ({
  ...accumulator,
  [question.id]: question.options[1]?.id || '',
}), {});

const POSITIVE_NOTE_SIGNALS = [
  'calm',
  'focused',
  'patient',
  'clear',
  'confident',
  'disciplined',
  'prepared',
  'stable',
  'relaxed',
  'controlled',
];

const NEGATIVE_NOTE_SIGNALS = [
  'stress',
  'stressed',
  'fear',
  'fomo',
  'angry',
  'tired',
  'revenge',
  'anxious',
  'overtrade',
  'impulsive',
  'frustrated',
  'exhausted',
  'doubt',
];

export function getPsychologyDateKey(date = new Date()) {
  const safeDate = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(safeDate.getTime())) return getPsychologyDateKey(new Date());
  const year = safeDate.getFullYear();
  const month = String(safeDate.getMonth() + 1).padStart(2, '0');
  const day = String(safeDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultPsychologyAnswers() {
  return { ...DEFAULT_ANSWERS };
}

export function getPsychologyCheckinStorageKey(userId = 'guest') {
  return `${PSYCHOLOGY_CHECKIN_STORAGE_PREFIX}${userId || 'guest'}`;
}

export function getPsychologyCheckinStatusKey(userId = 'guest', dateKey = getPsychologyDateKey()) {
  return `${PSYCHOLOGY_CHECKIN_STATUS_PREFIX}${userId || 'guest'}_${dateKey}`;
}

export function loadPsychologyCheckins(userId = 'guest') {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getPsychologyCheckinStorageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePsychologyCheckin).filter(Boolean);
  } catch {
    return [];
  }
}

export function savePsychologyCheckins(userId = 'guest', checkins = []) {
  const normalized = Array.isArray(checkins)
    ? checkins.map(normalizePsychologyCheckin).filter(Boolean)
    : [];

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(getPsychologyCheckinStorageKey(userId), JSON.stringify(normalized));
      window.dispatchEvent(new CustomEvent(PSYCHOLOGY_CHECKIN_EVENT, {
        detail: { userId, checkins: normalized },
      }));
    } catch {}
  }

  return normalized;
}

export function getPsychologyCheckinStatus(userId = 'guest', dateKey = getPsychologyDateKey()) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(getPsychologyCheckinStatusKey(userId, dateKey));
  } catch {
    return null;
  }
}

export function savePsychologyCheckinStatus(userId = 'guest', dateKey = getPsychologyDateKey(), status = 'completed') {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(getPsychologyCheckinStatusKey(userId, dateKey), status);
  } catch {}
}

export function createPsychologyCheckin({
  userId = 'guest',
  dateKey = getPsychologyDateKey(),
  answers = getDefaultPsychologyAnswers(),
  note = '',
  skipped = false,
} = {}) {
  const normalizedAnswers = normalizeAnswers(answers);
  const scoreDetails = skipped ? null : computePsychologyCheckinScore(normalizedAnswers, note);
  const now = new Date().toISOString();

  return normalizePsychologyCheckin({
    id: `psych-${dateKey}-${Date.now()}`,
    userId,
    dateKey,
    answers: normalizedAnswers,
    note: String(note || '').trim(),
    skipped: Boolean(skipped),
    score: skipped ? null : scoreDetails.score,
    baseScore: skipped ? null : scoreDetails.baseScore,
    noteModifier: skipped ? 0 : scoreDetails.noteModifier,
    metrics: skipped ? null : scoreDetails.metrics,
    noteSignals: skipped ? { positive: [], negative: [] } : scoreDetails.noteSignals,
    createdAt: now,
    updatedAt: now,
  });
}

export function upsertPsychologyCheckin(userId = 'guest', checkin = {}) {
  const normalized = normalizePsychologyCheckin(checkin);
  if (!normalized) return loadPsychologyCheckins(userId);
  const current = loadPsychologyCheckins(userId);
  const withoutSameDay = current.filter((entry) => entry.dateKey !== normalized.dateKey);
  const next = [...withoutSameDay, normalized].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
  savePsychologyCheckins(userId, next);
  savePsychologyCheckinStatus(userId, normalized.dateKey, normalized.skipped ? 'skipped' : 'completed');
  return next;
}

export function summarizePsychologyCheckins(checkins = []) {
  const completed = checkins.filter((entry) => !entry.skipped && Number.isFinite(Number(entry.score)));
  const latest = completed[completed.length - 1] || null;
  const averageScore = completed.length
    ? Math.round(completed.reduce((sum, entry) => sum + Number(entry.score || 0), 0) / completed.length)
    : 0;

  return {
    total: checkins.length,
    completed: completed.length,
    skipped: checkins.filter((entry) => entry.skipped).length,
    latest,
    averageScore,
    streak: computePsychologyStreak(completed),
  };
}

export function psychologyCheckinToSession(checkin = {}) {
  const normalized = normalizePsychologyCheckin(checkin);
  if (!normalized || normalized.skipped || !normalized.metrics) return null;
  const score = Number(normalized.score || 0);
  return {
    id: `checkin-${normalized.dateKey}`,
    date: normalized.dateKey,
    mood: score >= 84 ? 'excellent' : score >= 68 ? 'bien' : score >= 52 ? 'neutre' : score >= 34 ? 'difficile' : 'terrible',
    sleep: normalized.metrics.sleep,
    energy: normalized.metrics.energy,
    routine: normalized.metrics.planFollow >= 78 && normalized.metrics.riskCtrl >= 78,
    discipline: normalized.metrics.discipline,
    patience: normalized.metrics.patience,
    confidence: normalized.metrics.confidence,
    riskCtrl: normalized.metrics.riskCtrl,
    consistency: normalized.metrics.consistency,
    emotional: normalized.metrics.emotional,
    planFollow: normalized.metrics.planFollow,
    pnl: 0,
    trades: 0,
    wins: 0,
    maxTrades: 0,
    maxLoss: 0,
    stressors: normalized.noteSignals?.negative?.join(', ') || '',
    objectives: normalized.answers?.planReadiness === 'written' ? 'Execute the written plan' : 'Clarify the execution plan',
    notes: normalized.note || 'Daily psychology check-in completed.',
    checkinScore: score,
    checkin: normalized,
  };
}

export function mergePsychologyCheckinIntoSession(session = {}, checkin = {}) {
  const checkinSession = psychologyCheckinToSession(checkin);
  if (!checkinSession) return session;
  const blend = (currentValue, checkinValue, weight = 0.48) => (
    Math.round((Number(currentValue || 0) * (1 - weight)) + (Number(checkinValue || 0) * weight))
  );

  return {
    ...session,
    mood: checkinSession.mood,
    sleep: checkinSession.sleep,
    energy: checkinSession.energy,
    routine: session.routine || checkinSession.routine,
    discipline: blend(session.discipline, checkinSession.discipline),
    patience: blend(session.patience, checkinSession.patience),
    confidence: blend(session.confidence, checkinSession.confidence),
    riskCtrl: blend(session.riskCtrl, checkinSession.riskCtrl),
    consistency: blend(session.consistency, checkinSession.consistency),
    emotional: blend(session.emotional, checkinSession.emotional),
    planFollow: blend(session.planFollow, checkinSession.planFollow),
    stressors: [session.stressors, checkinSession.stressors].filter(Boolean).join(' | '),
    objectives: [session.objectives, checkinSession.objectives].filter(Boolean).join(' | '),
    notes: [session.notes, checkinSession.notes].filter(Boolean).join(' | '),
    checkinScore: checkinSession.checkinScore,
    checkin: checkinSession.checkin,
  };
}

function normalizePsychologyCheckin(entry = {}) {
  if (!entry || typeof entry !== 'object') return null;
  const dateKey = entry.dateKey || getPsychologyDateKey(entry.createdAt || new Date());
  const answers = normalizeAnswers(entry.answers || {});
  const skipped = Boolean(entry.skipped);
  const scoreDetails = skipped ? null : computePsychologyCheckinScore(answers, entry.note || '');
  const metrics = skipped ? null : normalizeMetrics(entry.metrics || scoreDetails.metrics);

  return {
    ...entry,
    id: entry.id || `psych-${dateKey}`,
    userId: entry.userId || 'guest',
    dateKey,
    answers,
    note: String(entry.note || '').trim(),
    skipped,
    score: skipped ? null : clampNumber(entry.score ?? scoreDetails.score, 0, 100, scoreDetails.score),
    baseScore: skipped ? null : clampNumber(entry.baseScore ?? scoreDetails.baseScore, 0, 100, scoreDetails.baseScore),
    noteModifier: skipped ? 0 : clampNumber(entry.noteModifier ?? scoreDetails.noteModifier, -16, 16, scoreDetails.noteModifier),
    metrics,
    noteSignals: entry.noteSignals || scoreDetails?.noteSignals || { positive: [], negative: [] },
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
  };
}

function normalizeAnswers(answers = {}) {
  return DAILY_PSYCHOLOGY_QUESTIONS.reduce((accumulator, question) => {
    const provided = answers[question.id];
    const hasOption = question.options.some((option) => option.id === provided);
    return {
      ...accumulator,
      [question.id]: hasOption ? provided : DEFAULT_ANSWERS[question.id],
    };
  }, {});
}

function computePsychologyCheckinScore(answers = {}, note = '') {
  const optionByQuestion = Object.fromEntries(
    DAILY_PSYCHOLOGY_QUESTIONS.map((question) => [
      question.id,
      question.options.find((option) => option.id === answers[question.id]) || question.options[1],
    ]),
  );

  const metrics = {
    sleep: clampNumber(optionByQuestion.sleep?.value, 1, 10, 7),
    energy: clampNumber(optionByQuestion.energy?.value, 1, 10, 7),
    emotional: clampNumber(optionByQuestion.emotionalState?.score, 0, 100, 70),
    discipline: clampNumber(optionByQuestion.planReadiness?.score, 0, 100, 70),
    planFollow: clampNumber(optionByQuestion.planReadiness?.score, 0, 100, 70),
    riskCtrl: clampNumber(optionByQuestion.riskControl?.score, 0, 100, 70),
    patience: Math.round((clampNumber(optionByQuestion.emotionalState?.score, 0, 100, 70) * 0.55) + (clampNumber(optionByQuestion.riskControl?.score, 0, 100, 70) * 0.45)),
    confidence: Math.round((clampNumber(optionByQuestion.energy?.score, 0, 100, 70) * 0.4) + (clampNumber(optionByQuestion.emotionalState?.score, 0, 100, 70) * 0.6)),
    consistency: Math.round((clampNumber(optionByQuestion.planReadiness?.score, 0, 100, 70) * 0.5) + (clampNumber(optionByQuestion.riskControl?.score, 0, 100, 70) * 0.5)),
  };

  const baseScore = Math.round(
    (clampNumber(optionByQuestion.sleep?.score, 0, 100, 70) * 0.14)
    + (clampNumber(optionByQuestion.energy?.score, 0, 100, 70) * 0.14)
    + (metrics.emotional * 0.24)
    + (metrics.discipline * 0.22)
    + (metrics.riskCtrl * 0.26),
  );
  const noteAnalysis = computeNoteModifier(note);
  const score = clampNumber(Math.round(baseScore + noteAnalysis.modifier), 0, 100, baseScore);

  return {
    score,
    baseScore,
    noteModifier: noteAnalysis.modifier,
    noteSignals: noteAnalysis.signals,
    metrics: normalizeMetrics(metrics),
  };
}

function normalizeMetrics(metrics = {}) {
  return {
    sleep: clampNumber(metrics.sleep, 1, 10, 7),
    energy: clampNumber(metrics.energy, 1, 10, 7),
    emotional: clampNumber(metrics.emotional, 0, 100, 70),
    discipline: clampNumber(metrics.discipline, 0, 100, 70),
    planFollow: clampNumber(metrics.planFollow, 0, 100, 70),
    riskCtrl: clampNumber(metrics.riskCtrl, 0, 100, 70),
    patience: clampNumber(metrics.patience, 0, 100, 70),
    confidence: clampNumber(metrics.confidence, 0, 100, 70),
    consistency: clampNumber(metrics.consistency, 0, 100, 70),
  };
}

function computeNoteModifier(note = '') {
  const text = String(note || '').trim().toLowerCase();
  if (!text) return { modifier: -3, signals: { positive: [], negative: [] } };

  const positive = POSITIVE_NOTE_SIGNALS.filter((signal) => text.includes(signal));
  const negative = NEGATIVE_NOTE_SIGNALS.filter((signal) => text.includes(signal));
  const lengthBonus = text.length >= 220 ? 6 : text.length >= 120 ? 4 : text.length >= 50 ? 2 : 0;
  const positiveBonus = Math.min(5, positive.length * 2);
  const negativePenalty = Math.min(10, negative.length * 3);
  const modifier = clampNumber(lengthBonus + positiveBonus - negativePenalty, -12, 12, 0);

  return {
    modifier,
    signals: { positive, negative },
  };
}

function computePsychologyStreak(completed = []) {
  const completedByDate = new Set(completed.map((entry) => entry.dateKey));
  const cursor = new Date(`${getPsychologyDateKey()}T00:00:00`);
  let streak = 0;

  for (let index = 0; index < 90; index += 1) {
    const dateKey = getPsychologyDateKey(cursor);
    if (!completedByDate.has(dateKey)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}
