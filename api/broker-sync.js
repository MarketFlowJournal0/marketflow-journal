const { handleBrokerSync } = require('../server/broker-sync-core');

module.exports = async function handler(req, res) {
  return handleBrokerSync(req, res, { mode: resolveMode(req) });
};

function resolveMode(req = {}) {
  const mode = String(req.query?.mode || '').toLowerCase();
  if (mode === 'webhook') return 'webhook';
  return 'mt';
}
