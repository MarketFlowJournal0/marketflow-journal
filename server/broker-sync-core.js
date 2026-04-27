const { createClient } = require('@supabase/supabase-js');

const MAX_TRADES_PER_REQUEST = 500;

function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function handleBrokerSync(req, res, options = {}) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createSupabaseClient();
  if (!supabase) {
    return res.status(500).json({
      error: 'Supabase service role is not configured.',
      requiredEnv: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
    });
  }

  try {
    const token = resolveToken(req, options.mode);
    const trades = resolveTrades(req, options.mode);

    if (!token) return res.status(401).json({ error: 'api_token required' });
    if (!Array.isArray(trades)) return res.status(400).json({ error: 'trades[] required' });
    if (trades.length > MAX_TRADES_PER_REQUEST) {
      return res.status(400).json({ error: `Max ${MAX_TRADES_PER_REQUEST} trades per request` });
    }

    const { data: account, error: accountError } = await supabase
      .from('broker_accounts')
      .select('id, user_id, broker_type, is_active, status, total_trades_synced')
      .eq('api_token', token)
      .single();

    if (accountError || !account) return res.status(401).json({ error: 'Invalid api_token' });
    if (account.is_active === false) return res.status(403).json({ error: 'Account is disabled' });

    if (trades.length === 0) {
      await updateBrokerAccount(supabase, account, 0);
      return res.status(200).json({ inserted: 0, skipped: 0, message: 'No trades to sync' });
    }

    const prepared = trades
      .map((trade, index) => normalizeIncomingTrade(trade, index, account))
      .filter((trade) => trade.ticket && trade.symbol);

    if (!prepared.length) {
      await updateBrokerAccount(supabase, account, 0);
      return res.status(200).json({
        inserted: 0,
        skipped: trades.length,
        message: 'No valid trades found in payload',
      });
    }

    const incomingTickets = prepared.map((trade) => trade.ticket);
    const { data: existingTrades } = await supabase
      .from('trades')
      .select('ticket')
      .eq('account_id', account.id)
      .in('ticket', incomingTickets);

    const existingTickets = new Set((existingTrades || []).map((trade) => String(trade.ticket || '')));
    const newTrades = prepared.filter((trade) => !existingTickets.has(trade.ticket));

    if (!newTrades.length) {
      await updateBrokerAccount(supabase, account, 0);
      return res.status(200).json({
        inserted: 0,
        skipped: prepared.length,
        message: 'All trades already synced',
      });
    }

    const modernRows = newTrades.map((trade) => trade.modern);
    const legacyRows = newTrades.map((trade) => trade.legacy);
    const insertResult = await insertTradesWithFallback(supabase, modernRows, legacyRows);

    if (insertResult.error) {
      console.error('Broker sync insert error:', insertResult.error);
      return res.status(500).json({
        error: 'Failed to insert trades',
        detail: insertResult.error.message || String(insertResult.error),
      });
    }

    await updateBrokerAccount(supabase, account, newTrades.length);

    return res.status(200).json({
      inserted: newTrades.length,
      skipped: trades.length - newTrades.length,
      storage: insertResult.storage,
      endpoint: options.mode || 'broker-sync',
      message: `${newTrades.length} trade(s) synced successfully`,
    });
  } catch (error) {
    console.error('broker-sync error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}

function resolveToken(req, mode) {
  if (mode === 'webhook') {
    return req.query?.token || req.body?.api_token || req.body?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '');
  }
  return req.body?.api_token || req.body?.token || req.query?.token;
}

function resolveTrades(req, mode) {
  if (Array.isArray(req.body)) return req.body;
  if (Array.isArray(req.body?.trades)) return req.body.trades;
  if (req.body?.trades && typeof req.body.trades === 'object') return [req.body.trades];
  if (mode === 'webhook' && req.body && Object.keys(req.body).length) return [req.body];
  return null;
}

function normalizeIncomingTrade(input = {}, index = 0, account = {}) {
  const ticket = resolveTicket(input, index);
  const symbol = normalizeSymbol(input.symbol || input.pair || input.instrument || input.ticker || input.market);
  const side = normalizeDirection(input.type || input.direction || input.side || input.action);
  const openTime = parseTimestamp(input.open_time || input.openTime || input.entry_time || input.entryTime || input.time || input.timestamp || input.created_at);
  const closeTime = parseTimestamp(input.close_time || input.closeTime || input.exit_time || input.exitTime || input.closed_at);
  const openDate = openTime ? openTime.slice(0, 10) : normalizeDate(input.date || input.open_date || input.entry_date) || new Date().toISOString().slice(0, 10);
  const time = normalizeTime(input.time) || (openTime ? openTime.slice(11, 16) : '');
  const entry = parseNumber(input.entry_price ?? input.entry ?? input.open_price ?? input.openPrice ?? input.price_open);
  const exit = parseNumber(input.exit_price ?? input.exit ?? input.close_price ?? input.closePrice ?? input.price_close);
  const stopLoss = parseNumber(input.sl ?? input.stop_loss ?? input.stopLoss);
  const takeProfit = parseNumber(input.tp ?? input.take_profit ?? input.takeProfit);
  const quantity = parseNumber(input.quantity ?? input.qty ?? input.size ?? input.volume ?? input.lots);
  const lots = parseNumber(input.lots ?? input.volume ?? input.size ?? input.quantity);
  const profitLoss = parseNumber(input.profit_loss ?? input.pnl ?? input.profit ?? input.realized_pnl ?? input.gross_profit) || 0;
  const commission = parseNumber(input.commission ?? input.comm ?? input.fees ?? input.fee);
  const swap = parseNumber(input.swap ?? input.overnight ?? input.financing);
  const extra = buildExtra(input, account, {
    account: input.account || input.account_name || input.accountNumber || input.account_number,
    broker: input.broker || input.platform || account.broker_type,
    rr: input.rr || input.r_multiple || input.rMultiple,
    rawStatus: input.status,
  });

  return {
    ticket,
    symbol,
    modern: {
      user_id: account.user_id,
      account_id: account.id,
      source: account.broker_type || 'broker',
      ticket,
      symbol,
      direction: side,
      entry_price: entry,
      exit_price: exit,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      quantity,
      lots,
      profit_loss: profitLoss,
      status: normalizeStatus(input.status, profitLoss),
      open_date: openDate,
      time,
      notes: input.notes || input.comment || input.description || '',
      session: input.session || detectSession(openTime),
      bias: input.bias || null,
      setup: input.setup || input.strategy || null,
      news_impact: input.news_impact || input.newsImpact || null,
      psychology_score: parseNumber(input.psychology_score ?? input.psychologyScore ?? input.disciplineScore),
      commission,
      swap,
      market_type: input.market_type || input.marketType || null,
      extra,
    },
    legacy: {
      user_id: account.user_id,
      account_id: account.id,
      source: account.broker_type || 'broker',
      ticket,
      symbol,
      direction: side.toLowerCase() === 'short' ? 'sell' : 'buy',
      volume: quantity,
      open_price: entry,
      close_price: exit,
      open_time: openTime,
      close_time: closeTime,
      profit: profitLoss,
      commission,
      swap,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      comment: input.notes || input.comment || input.description || null,
      extra,
    },
  };
}

async function insertTradesWithFallback(supabase, modernRows, legacyRows) {
  const modern = await supabase.from('trades').insert(modernRows);
  if (!modern.error) return { error: null, storage: 'modern' };
  if (!shouldTryLegacyInsert(modern.error)) return { error: modern.error, storage: 'modern' };

  const legacy = await supabase.from('trades').insert(legacyRows);
  if (!legacy.error) return { error: null, storage: 'legacy' };
  return { error: legacy.error, storage: 'legacy' };
}

async function updateBrokerAccount(supabase, account, insertedCount = 0) {
  const nextTotal = Number(account.total_trades_synced || 0) + Number(insertedCount || 0);
  const fullUpdate = await supabase
    .from('broker_accounts')
    .update({
      last_sync_at: new Date().toISOString(),
      status: 'connected',
      total_trades_synced: nextTotal,
    })
    .eq('id', account.id);

  if (!fullUpdate.error) return;

  await supabase
    .from('broker_accounts')
    .update({
      last_sync_at: new Date().toISOString(),
      status: 'connected',
    })
    .eq('id', account.id);
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

function resolveTicket(input = {}, index = 0) {
  const direct = input.ticket || input.order_id || input.orderId || input.deal_id || input.dealId || input.position_id || input.positionId || input.execution_id || input.executionId || input.id;
  if (direct) return String(direct);
  return `mfj-${hashValue(JSON.stringify({
    symbol: input.symbol || input.pair || input.instrument,
    side: input.side || input.direction || input.type,
    time: input.open_time || input.openTime || input.time || input.timestamp,
    entry: input.entry || input.open_price || input.openPrice,
    pnl: input.pnl || input.profit || input.profit_loss,
    index,
  }))}`;
}

function normalizeSymbol(value = '') {
  return String(value || '').trim().replace(/\s+/g, '').toUpperCase();
}

function normalizeDirection(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (['1', 'sell', 'short', 'bear', 'bearish'].includes(value)) return 'Short';
  if (['0', 'buy', 'long', 'bull', 'bullish'].includes(value)) return 'Long';
  if (!value) return 'Long';
  return value[0].toUpperCase() + value.slice(1);
}

function normalizeStatus(raw, pnl = 0) {
  const value = String(raw || '').trim().toLowerCase();
  if (['tp', 'win', 'winner', 'profit'].includes(value)) return 'TP';
  if (['sl', 'loss', 'loser', 'stop'].includes(value)) return 'SL';
  if (['be', 'breakeven', 'break-even', 'flat'].includes(value)) return 'BE';
  if (Number(pnl) > 0) return 'TP';
  if (Number(pnl) < 0) return 'SL';
  return 'BE';
}

function parseNumber(value) {
  if (value === '' || value == null) return null;
  const numeric = Number(String(value).replace(',', '.').replace(/\s+/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseTimestamp(raw) {
  if (!raw) return null;
  let value = raw;
  if (typeof value === 'number' && value > 1000000000 && value < 10000000000) {
    value *= 1000;
  }
  if (typeof value === 'string' && value.includes('.')) {
    value = value.replace(/\./g, '-').replace(' ', 'T');
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDate(value) {
  const date = parseTimestamp(value);
  return date ? date.slice(0, 10) : '';
}

function normalizeTime(value) {
  if (!value) return '';
  const match = String(value).match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function detectSession(isoTime) {
  const date = isoTime ? new Date(isoTime) : new Date();
  const hour = date.getUTCHours();
  if (hour >= 22 || hour < 6) return 'Tokyo';
  if (hour >= 6 && hour < 12) return 'London';
  if (hour >= 12 && hour < 21) return 'New York';
  return 'Other';
}

function buildExtra(input = {}, account = {}, fallback = {}) {
  const known = new Set([
    'ticket', 'order_id', 'orderId', 'deal_id', 'dealId', 'position_id', 'positionId', 'execution_id', 'executionId', 'id',
    'symbol', 'pair', 'instrument', 'ticker', 'market',
    'type', 'direction', 'side', 'action',
    'entry_price', 'entry', 'open_price', 'openPrice', 'price_open',
    'exit_price', 'exit', 'close_price', 'closePrice', 'price_close',
    'sl', 'stop_loss', 'stopLoss', 'tp', 'take_profit', 'takeProfit',
    'quantity', 'qty', 'size', 'volume', 'lots',
    'profit_loss', 'pnl', 'profit', 'realized_pnl', 'gross_profit',
    'commission', 'comm', 'fees', 'fee', 'swap', 'overnight', 'financing',
    'open_time', 'openTime', 'entry_time', 'entryTime', 'close_time', 'closeTime', 'exit_time', 'exitTime', 'time', 'timestamp',
    'notes', 'comment', 'description', 'session', 'bias', 'setup', 'strategy', 'news_impact', 'newsImpact',
    'psychology_score', 'psychologyScore', 'disciplineScore', 'market_type', 'marketType',
    'api_token', 'token', 'trades',
  ]);
  const extra = {
    account: fallback.account || input.account || input.account_name || input.account_number || null,
    broker: fallback.broker || input.broker || input.platform || account.broker_type || null,
    rr_actual: fallback.rr || input.rr || input.r_multiple || null,
    raw_status: fallback.rawStatus || input.status || null,
  };

  Object.entries(input).forEach(([key, value]) => {
    if (known.has(key) || value === '' || value == null) return;
    extra[key] = value;
  });

  return Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== '' && value != null));
}

function hashValue(input = '') {
  return String(input || '').split('').reduce((sum, char, index) => (
    (sum * 31 + char.charCodeAt(0) + index) % 2147483647
  ), 17).toString(36);
}

module.exports = {
  handleBrokerSync,
};
