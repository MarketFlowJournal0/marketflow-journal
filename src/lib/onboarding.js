export const ONBOARDING_VERSION = 2;

export function buildOnboardingRecord({ answers = {}, user = null } = {}) {
  const normalizedAnswers = normalizeAnswers(answers);
  const completedAt = new Date().toISOString();

  return {
    version: ONBOARDING_VERSION,
    completedAt,
    answers: normalizedAnswers,
    summary: {
      primaryExperience: normalizedAnswers.experience || null,
      primaryStyle: normalizedAnswers.style || null,
      primaryGoal: normalizedAnswers.goal || null,
      markets: Array.isArray(normalizedAnswers.market) ? normalizedAnswers.market : [],
      platforms: Array.isArray(normalizedAnswers.platform) ? normalizedAnswers.platform : [],
    },
    meta: {
      userId: user?.id || null,
      email: user?.email || null,
      firstName: user?.firstName || null,
      plan: user?.plan || 'trial',
      createdAt: user?.createdAt || null,
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

function sanitizeSingle(value) {
  return typeof value === 'string' ? value.trim() : null;
}

function sanitizeMulti(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
}
