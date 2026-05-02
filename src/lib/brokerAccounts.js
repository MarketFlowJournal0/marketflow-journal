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

  if (request.error && isMissingColumnError(request.error, 'created_at')) {
    const fallback = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', userId);

    if (fallback.error) throw fallback.error;
    return (fallback.data || []).map(normalizeBrokerAccount);
  }

  if (request.error) throw request.error;
  return (request.data || []).map(normalizeBrokerAccount);
}

export async function createBrokerAccount(supabase, payload = {}) {
  return insertBrokerAccountWithSchemaFallback(supabase, {
    ...payload,
    status: payload.status || 'disconnected',
  });
}

export async function markBrokerAccountConnected(supabase, id) {
  if (!supabase || !id) return null;
  const connectedAt = new Date().toISOString();
  return updateBrokerAccountWithSchemaFallback(supabase, id, {
    status: 'connected',
    last_sync_at: connectedAt,
  });
}

async function insertBrokerAccountWithSchemaFallback(supabase, payload = {}) {
  let safePayload = { ...payload };
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const request = await supabase
      .from('broker_accounts')
      .insert(safePayload)
      .select('*')
      .single();

    if (!request.error) return normalizeBrokerAccount(request.data || safePayload);

    const missingColumn = getMissingColumnName(request.error);
    if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in safePayload)) {
      throw request.error;
    }

    removedColumns.add(missingColumn);
    const { [missingColumn]: _removed, ...nextPayload } = safePayload;
    safePayload = nextPayload;
  }

  return normalizeBrokerAccount(safePayload);
}

async function updateBrokerAccountWithSchemaFallback(supabase, id, patch = {}) {
  let safePatch = { ...patch };
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const request = await supabase
      .from('broker_accounts')
      .update(safePatch)
      .eq('id', id)
      .select('*')
      .single();

    if (!request.error) return normalizeBrokerAccount(request.data || { id, ...safePatch });

    const missingColumn = getMissingColumnName(request.error);
    if (!missingColumn || removedColumns.has(missingColumn) || !(missingColumn in safePatch)) {
      throw request.error;
    }

    removedColumns.add(missingColumn);
    const { [missingColumn]: _removed, ...nextPatch } = safePatch;
    safePatch = nextPatch;
  }

  return normalizeBrokerAccount({ id, ...safePatch });
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

function getMissingColumnName(error = {}) {
  const text = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' ');
  const quoted = text.match(/'([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];
  const named = text.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+(?:does not exist|not found)/i);
  if (named?.[1]) return named[1];
  return '';
}
