const { getBrokerAdapter } = require('../adapters');
const { writeSyncLog } = require('../logs/sync-log');
const { normalizeIncomingTrade } = require('../normalizers/trade-normalizer');
const { createSyncQueueItem } = require('../queue/sync-queue');
const { SYNC_EVENT, SYNC_STATUS } = require('../sync-states');
const { resolveHeartbeatFromPayload, resolveTradesFromPayload } = require('../webhooks/payload');

const MAX_TRADES_PER_REQUEST = 500;

class TradeSyncEngine {
  constructor({ supabase, mode = 'broker-sync' } = {}) {
    this.supabase = supabase;
    this.mode = mode;
  }

  async health({ token }) {
    const { account, error } = await this.selectBrokerAccountByToken(token);
    if (error || !account) return { status: 401, body: { error: 'Invalid api_token' } };
    const adapter = getBrokerAdapter({ brokerType: account.broker_type, mode: this.mode });
    return {
      status: 200,
      body: {
        ok: true,
        account: publicAccountSnapshot(account),
        health: adapter.healthCheck({ account }),
      },
    };
  }

  async ingest({ token, body = {} } = {}) {
    if (!token) return { status: 401, body: { error: 'api_token required' } };

    const incomingTrades = resolveTradesFromPayload(body, this.mode);
    if (!Array.isArray(incomingTrades)) {
      return { status: 400, body: { error: 'trades[] required' } };
    }
    if (incomingTrades.length > MAX_TRADES_PER_REQUEST) {
      return { status: 400, body: { error: `Max ${MAX_TRADES_PER_REQUEST} trades per request` } };
    }

    const { account, error: accountError } = await this.selectBrokerAccountByToken(token);
    if (accountError || !account) return { status: 401, body: { error: 'Invalid api_token' } };
    if (account.is_active === false) return { status: 403, body: { error: 'Account is disabled' } };

    const adapter = getBrokerAdapter({ brokerType: account.broker_type, mode: this.mode });
    const validation = adapter.validateConnection({ account, body });
    if (!validation.ok) {
      await this.updateBrokerAccount(account, {
        insertedCount: 0,
        status: validation.status || SYNC_STATUS.FAILED,
        lastError: validation.message || 'Connection validation failed.',
      });
      await writeSyncLog(this.supabase, {
        account_id: account.id,
        user_id: account.user_id,
        event_type: SYNC_EVENT.INGESTION_FAILED,
        status: validation.status || SYNC_STATUS.FAILED,
        message: validation.message || 'Connection validation failed.',
      });
      return { status: 403, body: { error: validation.message || 'Connection validation failed.' } };
    }

    const heartbeat = resolveHeartbeatFromPayload(body);
    const queueItem = createSyncQueueItem({ account, trades: incomingTrades, mode: this.mode });
    await writeSyncLog(this.supabase, {
      account_id: account.id,
      user_id: account.user_id,
      event_type: incomingTrades.length ? SYNC_EVENT.INGESTION_STARTED : SYNC_EVENT.HEARTBEAT,
      status: incomingTrades.length ? SYNC_STATUS.SYNCING : SYNC_STATUS.WAITING_FOR_PAYLOAD,
      message: incomingTrades.length ? `Received ${incomingTrades.length} trade payload(s).` : 'Heartbeat received without trades.',
      details: { queueItem, heartbeat: sanitizeHeartbeat(heartbeat), adapter: adapter.id },
    });

    if (incomingTrades.length === 0) {
      const status = account.total_trades_synced > 0 ? SYNC_STATUS.SYNCED : SYNC_STATUS.WAITING_FOR_PAYLOAD;
      await this.updateBrokerAccount(account, {
        insertedCount: 0,
        status,
        heartbeatOnly: true,
        heartbeat,
      });
      return {
        status: 200,
        body: {
          inserted: 0,
          skipped: 0,
          sync_status: status,
          account_status: status,
          message: 'Heartbeat accepted. Waiting for valid broker trade payloads.',
        },
      };
    }

    const adapterTrades = adapter.syncTrades({ body, trades: incomingTrades, account });
    const normalizedRows = adapterTrades
      .map((trade, index) => adapter.normalizeTrade(trade, normalizeIncomingTrade, {
        index,
        account,
        source: account.broker_type || adapter.id,
      }));
    const validRows = normalizedRows.filter((trade) => trade.valid);
    const invalidRows = normalizedRows.filter((trade) => !trade.valid);
    const uniqueRows = dedupePreparedTrades(validRows);

    if (!uniqueRows.length) {
      await this.updateBrokerAccount(account, {
        insertedCount: 0,
        status: SYNC_STATUS.FAILED,
        lastError: 'No valid trades found in payload.',
        heartbeat,
      });
      await writeSyncLog(this.supabase, {
        account_id: account.id,
        user_id: account.user_id,
        event_type: SYNC_EVENT.INGESTION_FAILED,
        status: SYNC_STATUS.FAILED,
        message: 'No valid trades found in payload.',
        details: { invalidRows: invalidRows.map((row) => row.validationErrors) },
      });
      return {
        status: 200,
        body: {
          inserted: 0,
          skipped: incomingTrades.length,
          invalid: invalidRows.length,
          sync_status: SYNC_STATUS.FAILED,
          message: 'No valid trades found in payload.',
        },
      };
    }

    const existingTickets = await this.fetchExistingTickets(account.id, uniqueRows.map((trade) => trade.ticket));
    const newRows = uniqueRows.filter((trade) => !existingTickets.has(trade.ticket));
    const duplicateCount = uniqueRows.length - newRows.length;

    if (!newRows.length) {
      const status = account.total_trades_synced > 0 ? SYNC_STATUS.SYNCED : SYNC_STATUS.WAITING_FOR_PAYLOAD;
      await this.updateBrokerAccount(account, { insertedCount: 0, status, heartbeat });
      await writeSyncLog(this.supabase, {
        account_id: account.id,
        user_id: account.user_id,
        event_type: SYNC_EVENT.DUPLICATE_SKIPPED,
        status,
        message: 'All valid trades were already synced.',
        details: { duplicateCount, invalidCount: invalidRows.length },
      });
      return {
        status: 200,
        body: {
          inserted: 0,
          skipped: incomingTrades.length,
          duplicates: duplicateCount,
          invalid: invalidRows.length,
          sync_status: status,
          message: 'All trades already synced.',
        },
      };
    }

    const insertResult = await this.insertTradesWithFallback(
      newRows.map((trade) => trade.modern),
      newRows.map((trade) => trade.legacy),
    );

    if (insertResult.error) {
      await this.updateBrokerAccount(account, {
        insertedCount: 0,
        status: SYNC_STATUS.FAILED,
        lastError: insertResult.error.message || String(insertResult.error),
        heartbeat,
      });
      await writeSyncLog(this.supabase, {
        account_id: account.id,
        user_id: account.user_id,
        event_type: SYNC_EVENT.INGESTION_FAILED,
        status: SYNC_STATUS.FAILED,
        message: insertResult.error.message || 'Failed to insert trades.',
        details: { storage: insertResult.storage },
      });
      return {
        status: 500,
        body: {
          error: 'Failed to insert trades',
          detail: insertResult.error.message || String(insertResult.error),
          sync_status: SYNC_STATUS.FAILED,
        },
      };
    }

    const syncStatus = invalidRows.length ? SYNC_STATUS.PARTIALLY_SYNCED : SYNC_STATUS.SYNCED;
    await this.updateBrokerAccount(account, {
      insertedCount: newRows.length,
      status: syncStatus,
      heartbeat,
    });
    await writeSyncLog(this.supabase, {
      account_id: account.id,
      user_id: account.user_id,
      event_type: SYNC_EVENT.INGESTION_COMPLETED,
      status: syncStatus,
      message: `${newRows.length} trade(s) synced successfully.`,
      details: {
        inserted: newRows.length,
        duplicates: duplicateCount,
        invalid: invalidRows.length,
        storage: insertResult.storage,
        adapter: adapter.id,
      },
    });

    return {
      status: 200,
      body: {
        inserted: newRows.length,
        skipped: incomingTrades.length - newRows.length,
        duplicates: duplicateCount,
        invalid: invalidRows.length,
        storage: insertResult.storage,
        endpoint: this.mode || 'broker-sync',
        sync_status: syncStatus,
        account_status: syncStatus,
        message: `${newRows.length} trade(s) synced successfully.`,
      },
    };
  }

  async selectBrokerAccountByToken(token) {
    const selects = [
      'id, user_id, broker_type, account_name, account_number, server_name, api_token, status, sync_status, connection_status, is_active, last_sync_at, last_heartbeat_at, total_trades_synced',
      'id, user_id, broker_type, account_name, account_number, server_name, api_token, status, connection_status, is_active, last_sync_at, total_trades_synced',
      'id, user_id, broker_type, account_name, account_number, server_name, api_token, is_active, total_trades_synced',
      'id, user_id, broker_type, api_token',
      '*',
    ];

    let lastError = null;
    for (const columns of selects) {
      const { data, error } = await this.supabase
        .from('broker_accounts')
        .select(columns)
        .eq('api_token', token)
        .single();

      if (!error) {
        return {
          account: normalizeBrokerAccount(data),
          error: null,
        };
      }

      lastError = error;
      if (!isSchemaCacheColumnError(error)) break;
    }

    return { account: null, error: lastError };
  }

  async fetchExistingTickets(accountId, tickets = []) {
    const cleanTickets = Array.from(new Set(tickets.filter(Boolean).map(String)));
    if (!cleanTickets.length) return new Set();
    const { data, error } = await this.supabase
      .from('trades')
      .select('ticket')
      .eq('account_id', accountId)
      .in('ticket', cleanTickets);

    if (error && shouldTryLegacySelect(error)) {
      return new Set();
    }
    if (error) throw error;
    return new Set((data || []).map((trade) => String(trade.ticket || '')));
  }

  async insertTradesWithFallback(modernRows, legacyRows) {
    const modern = await this.supabase.from('trades').insert(modernRows);
    if (!modern.error) return { error: null, storage: 'modern' };
    if (!shouldTryLegacyInsert(modern.error)) return { error: modern.error, storage: 'modern' };

    const legacy = await this.supabase.from('trades').insert(legacyRows);
    if (!legacy.error) return { error: null, storage: 'legacy' };
    return { error: legacy.error, storage: 'legacy' };
  }

  async updateBrokerAccount(account, { insertedCount = 0, status, heartbeatOnly = false, heartbeat = null, lastError = '' } = {}) {
    const now = new Date().toISOString();
    const nextTotal = Number(account.total_trades_synced || 0) + Number(insertedCount || 0);
    const nextStatus = status || (insertedCount > 0 ? SYNC_STATUS.SYNCED : account.status || SYNC_STATUS.WAITING_FOR_PAYLOAD);
    const heartbeatSnapshot = sanitizeHeartbeat(heartbeat);
    const candidates = [
      {
        status: nextStatus,
        sync_status: nextStatus,
        connection_status: nextStatus,
        last_sync_at: insertedCount > 0 ? now : account.last_sync_at || null,
        last_payload_at: insertedCount > 0 ? now : null,
        last_heartbeat_at: now,
        total_trades_synced: nextTotal,
        last_error: lastError || null,
        updated_at: now,
        metadata: {
          heartbeat: heartbeatSnapshot,
          heartbeatOnly,
          last_engine: 'marketflow_trade_sync_engine_v1',
        },
      },
      {
        status: nextStatus,
        connection_status: nextStatus,
        last_sync_at: insertedCount > 0 ? now : account.last_sync_at || null,
        last_heartbeat_at: now,
        total_trades_synced: nextTotal,
        updated_at: now,
      },
      {
        status: nextStatus,
        last_sync_at: insertedCount > 0 ? now : account.last_sync_at || null,
        total_trades_synced: nextTotal,
        updated_at: now,
      },
      { last_sync_at: insertedCount > 0 ? now : account.last_sync_at || null, total_trades_synced: nextTotal },
      { last_sync_at: insertedCount > 0 ? now : now },
    ];

    let lastUpdateError = null;
    for (const payload of candidates) {
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null));
      const result = await this.supabase.from('broker_accounts').update(cleanPayload).eq('id', account.id);
      if (!result.error) return { ok: true, payload: cleanPayload };
      lastUpdateError = result.error;
      if (!isSchemaCacheColumnError(result.error)) break;
    }

    console.warn('broker account update skipped:', lastUpdateError?.message || lastUpdateError);
    return { ok: false, error: lastUpdateError };
  }
}

function dedupePreparedTrades(rows = []) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.ticket || row.payloadHash;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeBrokerAccount(account = {}) {
  const status = account.sync_status || account.status || account.connection_status || SYNC_STATUS.WAITING_FOR_PAYLOAD;
  return {
    ...account,
    is_active: account.is_active !== false,
    status,
    total_trades_synced: Number(account.total_trades_synced || 0),
  };
}

function publicAccountSnapshot(account = {}) {
  return {
    id: account.id,
    broker_type: account.broker_type,
    account_name: account.account_name,
    account_number: account.account_number,
    server_name: account.server_name,
    status: account.status,
    total_trades_synced: Number(account.total_trades_synced || 0),
    last_sync_at: account.last_sync_at || null,
    last_heartbeat_at: account.last_heartbeat_at || null,
  };
}

function sanitizeHeartbeat(heartbeat = null) {
  if (!heartbeat || typeof heartbeat !== 'object') return null;
  const allowed = ['balance', 'equity', 'margin', 'free_margin', 'currency', 'server', 'server_time', 'timestamp', 'account_number'];
  return Object.fromEntries(Object.entries(heartbeat).filter(([key]) => allowed.includes(key)));
}

function isSchemaCacheColumnError(error = {}) {
  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes('could not find')
    && (text.includes('schema cache') || text.includes('column'));
}

function shouldTryLegacyInsert(error = {}) {
  const text = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return text.includes('column')
    || text.includes('schema')
    || text.includes('entry_price')
    || text.includes('profit_loss')
    || text.includes('open_date')
    || text.includes('could not find');
}

function shouldTryLegacySelect(error = {}) {
  const text = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return text.includes('ticket') || text.includes('account_id') || text.includes('column') || text.includes('schema');
}

module.exports = {
  MAX_TRADES_PER_REQUEST,
  TradeSyncEngine,
};
