const { BrokerAdapter } = require('./base-adapter');
const { FileImportAdapter } = require('./file-adapter');
const { MetaTraderAdapter } = require('./mt-adapter');
const { WebhookAdapter } = require('./webhook-adapter');

function getBrokerAdapter({ brokerType = '', mode = '' } = {}) {
  const type = String(brokerType || '').toLowerCase();
  const requestMode = String(mode || '').toLowerCase();

  if (type === 'mt4' || requestMode === 'mt4') return new MetaTraderAdapter({ version: 'mt4', mode: requestMode || 'mt' });
  if (type === 'mt5' || requestMode === 'mt5' || requestMode === 'mt') return new MetaTraderAdapter({ version: type === 'mt4' ? 'mt4' : 'mt5', mode: requestMode || 'mt' });
  if (requestMode === 'file' || type === 'file') return new FileImportAdapter({ mode: requestMode || 'file' });
  if (requestMode === 'webhook' || type === 'webhook') return new WebhookAdapter({ mode: requestMode || 'webhook' });

  return new BrokerAdapter({
    id: type || 'generic',
    label: `${type || 'Generic'} Broker Adapter`,
    mode: requestMode || 'generic',
    capabilities: ['token_ingestion', 'file_fallback'],
  });
}

module.exports = {
  getBrokerAdapter,
};
