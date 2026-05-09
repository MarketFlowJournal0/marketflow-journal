class BrokerAdapter {
  constructor({ id, label, capabilities = [], mode = 'webhook' } = {}) {
    this.id = id || 'generic';
    this.label = label || 'Generic Broker Adapter';
    this.capabilities = capabilities;
    this.mode = mode;
  }

  connect() {
    return {
      ok: true,
      adapter: this.id,
      status: 'waiting_for_payload',
      message: 'Account feed created. Connection becomes live after the first valid broker payload.',
    };
  }

  disconnect() {
    return {
      ok: true,
      adapter: this.id,
      status: 'disconnected',
    };
  }

  validateConnection({ account } = {}) {
    if (!account?.id) {
      return { ok: false, status: 'failed', message: 'Broker account not found.' };
    }
    if (account.is_active === false) {
      return { ok: false, status: 'disabled', message: 'Broker account is disabled.' };
    }
    return { ok: true, status: account.status || 'waiting_for_payload' };
  }

  refreshSession() {
    return {
      ok: true,
      status: 'waiting_for_payload',
      message: 'Session refresh not required for token-based ingestion.',
    };
  }

  syncTrades({ trades = [] } = {}) {
    return Array.isArray(trades) ? trades : [];
  }

  normalizeTrade(trade, normalizer, context) {
    return normalizer(trade, context.index, context.account, {
      adapter: this.id,
      provider: this.label,
      source: context.source || this.id,
    });
  }

  getAccounts({ account } = {}) {
    return account ? [account] : [];
  }

  importTrades({ trades = [] } = {}) {
    return this.syncTrades({ trades });
  }

  healthCheck({ account } = {}) {
    return {
      ok: Boolean(account?.id),
      adapter: this.id,
      label: this.label,
      capabilities: this.capabilities,
      status: account?.status || 'waiting_for_payload',
      lastSyncAt: account?.last_sync_at || null,
      lastHeartbeatAt: account?.last_heartbeat_at || null,
    };
  }
}

module.exports = {
  BrokerAdapter,
};
