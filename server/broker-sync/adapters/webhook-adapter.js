const { BrokerAdapter } = require('./base-adapter');

class WebhookAdapter extends BrokerAdapter {
  constructor({ mode = 'webhook' } = {}) {
    super({
      id: 'webhook',
      label: 'Universal Webhook Adapter',
      mode,
      capabilities: ['webhook_ingestion', 'custom_payloads', 'idempotent_sync'],
    });
  }

  syncTrades({ body = {}, trades = [] } = {}) {
    if (Array.isArray(trades) && trades.length) return trades;
    if (body && typeof body === 'object' && Object.keys(body).length) return [body];
    return [];
  }
}

module.exports = {
  WebhookAdapter,
};
