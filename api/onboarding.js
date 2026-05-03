const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DEFAULT_ADMIN_EMAILS = [
  'marketflowjournal0@gmail.com',
  'support@marketflowjournal.com',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const authUser = await getAuthUser(accessToken);
    if (!authUser?.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (req.method === 'GET') {
      return getOnboardingResponses(req, res, authUser);
    }

    return saveOnboardingResponse(req, res, authUser);
  } catch (error) {
    console.error('onboarding endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Unable to process onboarding request' });
  }
};

async function getAuthUser(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) throw error;
  return data?.user || null;
}

async function getOnboardingResponses(req, res, authUser) {
  if (!isAdmin(authUser)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, plan, onboarding')
    .not('onboarding', 'is', null);

  if (error) {
    console.error('onboarding admin fetch error:', error);
    return res.status(500).json({ error: error.message });
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

  return res.status(200).json({
    saved: true,
    onboarding: data?.onboarding || onboardingRecord,
  });
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

  return Array.from(new Set([...configured, ...DEFAULT_ADMIN_EMAILS]));
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
