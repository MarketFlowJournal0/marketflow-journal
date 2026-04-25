const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!accessToken) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const authUser = authData?.user;

    if (authError || !authUser?.id) {
      return res.status(401).json({ error: 'Invalid session' });
    }

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
  } catch (error) {
    console.error('onboarding endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Unable to save onboarding' });
  }
};

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
