export function normalizeBrokerAccount(account = {}) {
  const status = account.status
    || account.connection_status
    || (account.is_active === false ? 'disabled' : account.last_sync_at ? 'connected' : 'disconnected');

  return {
    ...account,
    status,
    total_trades_synced: Number(account.total_trades_synced ?? account.synced_trades ?? 0) || 0,
    last_sync_at: account.last_sync_at || account.last_sync || null,
  };
}

export async function fetchBrokerAccounts(supabase, userId) {
  if (!supabase || !userId) return [];

  const request = await supabase
    .from('broker_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (request.error) throw request.error;
  return (request.data || []).map(normalizeBrokerAccount);
}

export async function createBrokerAccount(supabase, payload = {}) {
  const fullPayload = {
    ...payload,
    status: payload.status || 'disconnected',
  };

  const first = await supabase
    .from('broker_accounts')
    .insert(fullPayload)
    .select('*')
    .single();

  if (!first.error) return normalizeBrokerAccount(first.data || fullPayload);
  if (!isMissingColumnError(first.error, 'status')) throw first.error;

  const { status, ...schemaSafePayload } = fullPayload;
  const fallback = await supabase
    .from('broker_accounts')
    .insert(schemaSafePayload)
    .select('*')
    .single();

  if (fallback.error) throw fallback.error;
  return normalizeBrokerAccount(fallback.data || schemaSafePayload);
}

export async function markBrokerAccountConnected(supabase, id) {
  if (!supabase || !id) return null;
  const connectedAt = new Date().toISOString();
  const fullUpdate = {
    status: 'connected',
    last_sync_at: connectedAt,
  };

  const first = await supabase
    .from('broker_accounts')
    .update(fullUpdate)
    .eq('id', id)
    .select('*')
    .single();

  if (!first.error) return normalizeBrokerAccount(first.data || fullUpdate);
  if (!isMissingColumnError(first.error, 'status')) throw first.error;

  const fallback = await supabase
    .from('broker_accounts')
    .update({ last_sync_at: connectedAt })
    .eq('id', id)
    .select('*')
    .single();

  if (fallback.error) throw fallback.error;
  return normalizeBrokerAccount(fallback.data || { id, last_sync_at: connectedAt });
}

export function isMissingColumnError(error = {}, column = '') {
  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const cleanColumn = String(column || '').toLowerCase();
  return text.includes('could not find')
    && text.includes(cleanColumn)
    && (text.includes('schema cache') || text.includes('column'));
}
