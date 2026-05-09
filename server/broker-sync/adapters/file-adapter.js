const { BrokerAdapter } = require('./base-adapter');

class FileImportAdapter extends BrokerAdapter {
  constructor({ mode = 'file' } = {}) {
    super({
      id: 'file',
      label: 'Manual File Import Adapter',
      mode,
      capabilities: ['csv', 'excel', 'statement_import', 'dedupe', 'rollback_ready'],
    });
  }
}

module.exports = {
  FileImportAdapter,
};
