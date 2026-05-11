const { createClient } = require('@supabase/supabase-js');
const { resolveToken } = require('./security/token');
const { TradeSyncEngine } = require('./sync-engine/trade-sync-engine');
const { applyRateLimit, handleCors } = require('../lib/api-security');

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function handleBrokerSync(req, res, options = {}) {
  if (handleCors(req, res, { methods: 'GET, POST, OPTIONS' })) return;
  if (!(await applyRateLimit(req, res, { category: 'brokerSync', keyPrefix: 'broker-sync' }))) return;
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase service role is not configured.',
      requiredEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    });
  }

  try {
    const mode = options.mode || resolveMode(req);
    const token = resolveToken(req, mode);
    const engine = new TradeSyncEngine({ supabase, mode });
    const result = req.method === 'GET'
      ? await engine.health({ token })
      : await engine.ingest({ token, body: req.body || {} });

    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('broker-sync error:', error);
    return res.status(500).json({
      error: 'Broker sync failed.',
    });
  }
}

function resolveMode(req = {}) {
  const mode = String(req.query?.mode || '').toLowerCase();
  if (['webhook', 'file', 'mt4', 'mt5', 'mt'].includes(mode)) return mode;
  return 'mt';
}

module.exports = {
  handleBrokerSync,
};
