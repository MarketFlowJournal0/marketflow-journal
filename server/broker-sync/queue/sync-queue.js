function createSyncQueueItem({ account, trades = [], mode = 'broker-sync', reason = 'ingestion' } = {}) {
  return {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    account_id: account?.id || null,
    user_id: account?.user_id || null,
    mode,
    reason,
    status: 'pending',
    trade_count: Array.isArray(trades) ? trades.length : 0,
    attempts: 0,
    created_at: new Date().toISOString(),
  };
}

module.exports = {
  createSyncQueueItem,
};
