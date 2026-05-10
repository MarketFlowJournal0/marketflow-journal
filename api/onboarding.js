const { createClient } = require('@supabase/supabase-js');
const { applyRateLimit, handleCors, requireSupabaseUser, sendServerError } = require('../server/lib/api-security');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const QUESTION_DEFINITIONS = {
  experience: {
    label: 'What is your trading level?',
    options: {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      professional: 'Professional',
    },
  },
  market: {
    label: 'Which markets do you trade?',
    options: {
      forex: 'Forex',
      indices: 'Indices',
      crypto: 'Crypto',
      stocks: 'Stocks',
      futures: 'Futures',
      options: 'Options',
    },
  },
  style: {
    label: 'What is your trading style?',
    options: {
      scalping: 'Scalping',
      daytrading: 'Day Trading',
      swing: 'Swing Trading',
      position: 'Position',
    },
  },
  goal: {
    label: 'What is your main goal?',
    options: {
      improve: 'Improve my performance',
      prop: 'Pass a prop firm challenge',
      consistent: 'Become consistent',
      manage: 'Manage multiple accounts',
    },
  },
  platform: {
    label: 'Which platform do you use?',
    options: {
      mt4: 'MetaTrader 4',
      mt5: 'MetaTrader 5',
      ctrader: 'cTrader',
      tradingview: 'TradingView',
      ninjatrader: 'NinjaTrader',
      other: 'Other',
    },
  },
};

module.exports = async (req, res) => {
  if (handleCors(req, res, { methods: 'GET, POST, OPTIONS' })) return;
  if (!applyRateLimit(req, res, { keyPrefix: 'onboarding', limit: 40, windowMs: 60_000 })) return;
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireSupabaseUser(supabase, req, {
      requireConfirmedEmail: process.env.REQUIRE_CONFIRMED_EMAIL === 'true',
    });
    if (!auth.user) return res.status(auth.status).json({ error: auth.error });

    if (req.method === 'GET') {
      return getOnboardingResponses(req, res, auth.user);
    }

    return saveOnboardingResponse(req, res, auth.user);
  } catch (error) {
    console.error('onboarding endpoint error:', error);
    return sendServerError(res, 'Unable to process onboarding request.');
  }
};

async function getOnboardingResponses(req, res, authUser) {
  if (!isAdmin(authUser)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const dedicatedResponses = await fetchDedicatedOnboardingResponses();
  if (dedicatedResponses.ok) {
    return res.status(200).json({
      total: dedicatedResponses.responses.length,
      source: 'onboarding_responses',
      responses: dedicatedResponses.responses,
      generatedAt: new Date().toISOString(),
    });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, plan, onboarding')
    .not('onboarding', 'is', null);

  if (error) {
    console.error('onboarding admin fetch error:', error);
    return sendServerError(res, 'Unable to load onboarding responses.');
  }

  const responses = (data || [])
    .map((row) => ({
      id: row.id,
      email: row.email || '',
      plan: row.plan || 'trial',
      onboarding: row.onboarding || null,
      completedAt: row.onboarding?.completedAt || row.onboarding?.savedAt || null,
    }))
    .filter((row) => row.onboarding)
    .sort((left, right) => new Date(right.completedAt || 0) - new Date(left.completedAt || 0));

  return res.status(200).json({
    total: responses.length,
    source: 'profiles.onboarding',
    responses,
    generatedAt: new Date().toISOString(),
  });
}

async function saveOnboardingResponse(req, res, authUser) {
  const body = parseBody(req.body);
  const onboarding = body?.onboarding;

  if (!onboarding || typeof onboarding !== 'object' || Array.isArray(onboarding)) {
    return res.status(400).json({ error: 'onboarding payload required' });
  }

  const savedAt = new Date().toISOString();
  const onboardingRecord = {
    ...onboarding,
    completedAt: onboarding.completedAt || savedAt,
    savedAt,
    meta: {
      ...(onboarding.meta || {}),
      userId: authUser.id,
      email: authUser.email || onboarding.meta?.email || null,
    },
    serverMeta: {
      source: 'api/onboarding',
      savedAt,
      userAgent: req.headers['user-agent'] || null,
      forwardedFor: req.headers['x-forwarded-for'] || null,
    },
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.id,
      email: authUser.email || null,
      onboarding: onboardingRecord,
    }, { onConflict: 'id' })
    .select('id, onboarding')
    .single();

  if (error) {
    console.error('onboarding upsert error:', error);
    return res.status(500).json({ error: error.message });
  }

  const dedicatedStore = await saveDedicatedOnboardingResponse({
    authUser,
    onboardingRecord,
  });
  const normalizedStore = await saveNormalizedOnboardingAnswers({
    authUser,
    onboardingRecord,
  });

  return res.status(200).json({
    saved: true,
    storedIn: {
      profiles: true,
      onboardingResponses: dedicatedStore.ok,
      onboardingAnswers: normalizedStore.ok,
    },
    storageWarning: [dedicatedStore.warning, normalizedStore.warning].filter(Boolean).join(' | ') || null,
    onboarding: data?.onboarding || onboardingRecord,
  });
}

async function fetchDedicatedOnboardingResponses() {
  try {
    const { data, error } = await supabase
      .from('onboarding_responses')
      .select('user_id, email, plan, version, answers, classified, analytics, recommendations, summary, onboarding, completed_at, saved_at')
      .order('completed_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.warn('onboarding_responses fetch fallback:', error.message);
      return { ok: false, responses: [], warning: error.message };
    }

    const responses = (data || []).map((row) => ({
      id: row.user_id,
      email: row.email || '',
      plan: row.plan || 'trial',
      version: row.version || 1,
      answers: row.answers || {},
      classified: row.classified || {},
      analytics: row.analytics || {},
      recommendations: row.recommendations || {},
      summary: row.summary || {},
      onboarding: row.onboarding || null,
      completedAt: row.completed_at || row.saved_at || null,
    }));

    return { ok: true, responses };
  } catch (error) {
    console.warn('onboarding_responses fetch exception:', error.message);
    return { ok: false, responses: [], warning: error.message };
  }
}

async function saveDedicatedOnboardingResponse({ authUser, onboardingRecord }) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', authUser.id)
      .maybeSingle();

    const row = {
      user_id: authUser.id,
      email: authUser.email || onboardingRecord?.meta?.email || null,
      plan: profile?.plan || onboardingRecord?.meta?.plan || 'trial',
      version: onboardingRecord?.version || 1,
      answers: onboardingRecord?.answers || {},
      classified: onboardingRecord?.classified || {},
      analytics: onboardingRecord?.analytics || {},
      recommendations: onboardingRecord?.recommendations || {},
      summary: onboardingRecord?.summary || {},
      onboarding: onboardingRecord,
      source: 'marketflow_signup_onboarding',
      completed_at: onboardingRecord?.completedAt || onboardingRecord?.savedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('onboarding_responses')
      .upsert(row, { onConflict: 'user_id' });

    if (error) {
      console.warn('onboarding_responses store fallback:', error.message);
      return { ok: false, warning: error.message };
    }

    return { ok: true, warning: null };
  } catch (error) {
    console.warn('onboarding_responses store exception:', error.message);
    return { ok: false, warning: error.message };
  }
}

async function saveNormalizedOnboardingAnswers({ authUser, onboardingRecord }) {
  try {
    const answers = onboardingRecord?.answers || {};
    const timestamp = new Date().toISOString();
    const rows = Object.entries(QUESTION_DEFINITIONS).map(([questionKey, meta]) => {
      const rawAnswer = answers[questionKey];
      const answerArray = Array.isArray(rawAnswer)
        ? rawAnswer
        : rawAnswer == null || rawAnswer === ''
          ? []
          : [rawAnswer];
      const labels = answerArray
        .map((answerId) => meta.options?.[answerId] || String(answerId))
        .filter(Boolean);

      return {
        user_id: authUser.id,
        question_key: questionKey,
        question_label: meta.label,
        answer: rawAnswer == null ? null : rawAnswer,
        answer_label: labels[0] || null,
        answer_labels: labels,
        created_at: onboardingRecord?.completedAt || onboardingRecord?.savedAt || timestamp,
        updated_at: timestamp,
      };
    });

    const { error } = await supabase
      .from('user_onboarding_answers')
      .upsert(rows, { onConflict: 'user_id,question_key' });

    if (error) {
      console.warn('user_onboarding_answers store fallback:', error.message);
      return { ok: false, warning: error.message };
    }

    return { ok: true, warning: null };
  } catch (error) {
    console.warn('user_onboarding_answers store exception:', error.message);
    return { ok: false, warning: error.message };
  }
}

function isAdmin(user) {
  const email = String(user?.email || '').toLowerCase();
  return getAdminEmails().includes(email);
}

function getAdminEmails() {
  const configured = [
    process.env.ADMIN_EMAILS || '',
    process.env.ADMIN_EMAIL || '',
  ]
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(configured));
}

function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (_) {
      return {};
    }
  }
  return body;
}
