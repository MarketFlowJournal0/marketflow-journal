const { handleBrokerSync } = require('../server/broker-sync-core');

module.exports = async function handler(req, res) {
  return handleBrokerSync(req, res, { mode: resolveMode(req) });
};

function resolveMode(req = {}) {
  const mode = String(req.query?.mode || '').toLowerCase();
  if (['webhook', 'file', 'mt4', 'mt5', 'mt'].includes(mode)) return mode;
  return 'mt';
}
