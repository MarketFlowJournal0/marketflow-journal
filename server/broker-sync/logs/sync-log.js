async function writeSyncLog(supabase, payload = {}) {
  if (!supabase || !payload.account_id) return { ok: false, skipped: true };

  const row = {
    account_id: payload.account_id,
    user_id: payload.user_id,
    event_type: payload.event_type || 'sync_event',
    status: payload.status || 'pending',
    message: payload.message || '',
    payload_hash: payload.payload_hash || null,
    details: payload.details || {},
    created_at: payload.created_at || new Date().toISOString(),
  };

  const { error } = await supabase.from('broker_sync_logs').insert(row);
  if (!error) return { ok: true };

  const text = [error.message, error.details, error.hint, error.code].filter(Boolean).join(' ').toLowerCase();
  if (text.includes('does not exist') || text.includes('schema cache') || text.includes('broker_sync_logs')) {
    return { ok: false, skipped: true, error };
  }

  console.warn('broker sync log skipped:', error.message || error);
  return { ok: false, error };
}

module.exports = {
  writeSyncLog,
};
