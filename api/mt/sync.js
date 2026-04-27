const { handleBrokerSync } = require('../lib/broker-sync-core');

module.exports = async function handler(req, res) {
  return handleBrokerSync(req, res, { mode: 'mt' });
};
