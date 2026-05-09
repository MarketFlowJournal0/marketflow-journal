const { BrokerAdapter } = require('./base-adapter');

class MetaTraderAdapter extends BrokerAdapter {
  constructor({ version = 'mt5', mode = 'mt' } = {}) {
    super({
      id: version,
      label: version === 'mt4' ? 'MetaTrader 4 Bridge' : 'MetaTrader 5 Bridge',
      mode,
      capabilities: [
        'expert_advisor_bridge',
        'trade_ingestion',
        'heartbeat',
        'partial_close_detection',
        'sl_tp_update_detection',
        'account_snapshot',
      ],
    });
    this.version = version;
  }

  validateConnection({ account } = {}) {
    const base = super.validateConnection({ account });
    if (!base.ok) return base;
    return {
      ...base,
      bridgeRequired: true,
      message: `${this.label} feed is ready. It becomes connected only when the MarketFlow bridge posts a heartbeat or trade payload.`,
    };
  }

  syncTrades({ body = {}, trades = [] } = {}) {
    const rows = Array.isArray(trades) ? trades : [];
    const accountSnapshot = body.account || body.account_info || body.accountInfo || {};
    return rows.map((trade) => ({
      ...trade,
      platform: trade.platform || this.version.toUpperCase(),
      account: trade.account || accountSnapshot.number || accountSnapshot.login || body.account_number,
      broker: trade.broker || body.broker || body.server || accountSnapshot.server,
    }));
  }

  healthCheck({ account } = {}) {
    return {
      ...super.healthCheck({ account }),
      bridgeRequired: true,
      expectedPayload: {
        api_token: 'scoped MarketFlow feed token',
        heartbeat: { balance: 'number', equity: 'number', server_time: 'ISO timestamp' },
        trades: ['opened/closed/modified trade payloads'],
      },
    };
  }
}

module.exports = {
  MetaTraderAdapter,
};
