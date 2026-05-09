const SYNC_STATUS = Object.freeze({
  PENDING: 'pending',
  WAITING_FOR_PAYLOAD: 'waiting_for_payload',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  PARTIALLY_SYNCED: 'partially_synced',
  FAILED: 'failed',
  RECONNECT_REQUIRED: 'reconnect_required',
  EXPIRED: 'expired',
  RATE_LIMITED: 'rate_limited',
  DISCONNECTED: 'disconnected',
  DISABLED: 'disabled',
});

const SYNC_EVENT = Object.freeze({
  HEARTBEAT: 'heartbeat',
  INGESTION_STARTED: 'ingestion_started',
  INGESTION_COMPLETED: 'ingestion_completed',
  INGESTION_FAILED: 'ingestion_failed',
  CONNECTION_VALIDATED: 'connection_validated',
  DUPLICATE_SKIPPED: 'duplicate_skipped',
});

function isHealthySyncStatus(status) {
  return [SYNC_STATUS.SYNCED, SYNC_STATUS.SYNCING, SYNC_STATUS.WAITING_FOR_PAYLOAD].includes(status);
}

module.exports = {
  SYNC_EVENT,
  SYNC_STATUS,
  isHealthySyncStatus,
};
