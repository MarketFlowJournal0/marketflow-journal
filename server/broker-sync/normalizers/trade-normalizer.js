const crypto = require('crypto');
const { normalizeSymbol } = require('./symbol-normalizer');

function normalizeIncomingTrade(input = {}, index = 0, account = {}, context = {}) {
  const ticket = resolveTicket(input, index, account);
  const symbol = normalizeSymbol(input.symbol || input.pair || input.instrument || input.ticker || input.market);
  const direction = normalizeDirection(input.type || input.direction || input.side || input.action);
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
  const commission = parseNumber(input.commission ?? input.comm ?? input.fees ?? input.fee);
  const swap = parseNumber(input.swap ?? input.overnight ?? input.financing);
  const profitLoss = parseNumber(input.profit_loss ?? input.pnl ?? input.profit ?? input.realized_pnl ?? input.gross_profit) || 0;
  const rr = parseNumber(input.rr ?? input.r_multiple ?? input.rMultiple ?? input.r);
  const status = normalizeStatus(input.status || input.result || input.outcome, profitLoss);
  const source = context.source || account.broker_type || 'broker';
  const payloadHash = hashValue(JSON.stringify({ account: account.id, ticket, symbol, openTime, entry, exit, profitLoss }));
  const extra = buildExtra(input, account, {
    account: input.account || input.account_name || input.accountNumber || input.account_number || account.account_name || account.account_number,
    broker: input.broker || input.platform || account.broker_type,
    rr,
    rawStatus: input.status || input.result || input.outcome,
    adapter: context.adapter || source,
    provider: context.provider || null,
    payloadHash,
  });

  return {
    valid: Boolean(ticket && symbol),
    ticket,
    symbol,
    payloadHash,
    validationErrors: [
      !ticket ? 'missing_ticket' : '',
      !symbol ? 'missing_symbol' : '',
    ].filter(Boolean),
    modern: {
      user_id: account.user_id,
      account_id: account.id,
      source,
      ticket,
      symbol,
      direction,
      entry_price: entry,
      exit_price: exit,
      stop_loss: stopLoss,
      take_profit: takeProfit,
      quantity,
      lots,
      profit_loss: profitLoss,
      status,
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
      source,
      ticket,
      symbol,
      direction: direction.toLowerCase() === 'short' ? 'sell' : 'buy',
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

function resolveTicket(input = {}, index = 0, account = {}) {
  const direct = input.ticket || input.order_id || input.orderId || input.deal_id || input.dealId || input.position_id || input.positionId || input.execution_id || input.executionId || input.id;
  if (direct) return String(direct);

  return `mfj-${hashValue(JSON.stringify({
    account: account.id || account.account_number || '',
    symbol: input.symbol || input.pair || input.instrument,
    side: input.side || input.direction || input.type,
    time: input.open_time || input.openTime || input.time || input.timestamp,
    entry: input.entry || input.open_price || input.openPrice,
    pnl: input.pnl || input.profit || input.profit_loss,
    index,
  }))}`;
}

function normalizeDirection(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (['1', 'sell', 'short', 'bear', 'bearish', 'vente'].includes(value)) return 'Short';
  if (['0', 'buy', 'long', 'bull', 'bullish', 'achat'].includes(value)) return 'Long';
  if (!value) return 'Long';
  return value[0].toUpperCase() + value.slice(1);
}

function normalizeStatus(raw, pnl = 0) {
  const value = String(raw || '').trim().toLowerCase();
  if (['tp', 'win', 'winner', 'profit', 'target'].includes(value)) return 'TP';
  if (['sl', 'loss', 'loser', 'stop', 'stopped'].includes(value)) return 'SL';
  if (['be', 'breakeven', 'break-even', 'flat'].includes(value)) return 'BE';
  if (Number(pnl) > 0) return 'TP';
  if (Number(pnl) < 0) return 'SL';
  return 'BE';
}

function parseNumber(value) {
  if (value === '' || value == null) return null;
  const numeric = Number(String(value).replace(/[^\d,.\-]/g, '').replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

function parseTimestamp(raw) {
  if (!raw) return null;
  let value = raw;
  if (typeof value === 'number' && value > 1000000000 && value < 10000000000) {
    value *= 1000;
  }
  if (typeof value === 'string') {
    value = value.trim().replace(/\.(?=\d{1,2}\.)/g, '-').replace(' ', 'T');
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
  if (hour >= 23 || hour < 5) return 'Tokyo';
  if (hour >= 7 && hour < 10) return 'London';
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
    account: fallback.account || null,
    broker: fallback.broker || null,
    rr_actual: fallback.rr ?? null,
    raw_status: fallback.rawStatus || null,
    adapter: fallback.adapter || null,
    provider: fallback.provider || null,
    payload_hash: fallback.payloadHash || null,
  };

  Object.entries(input).forEach(([key, value]) => {
    if (known.has(key) || value === '' || value == null) return;
    extra[key] = value;
  });

  return Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== '' && value != null));
}

function hashValue(input = '') {
  return crypto.createHash('sha256').update(String(input || '')).digest('hex').slice(0, 32);
}

module.exports = {
  detectSession,
  hashValue,
  normalizeDirection,
  normalizeIncomingTrade,
  normalizeStatus,
  parseNumber,
  parseTimestamp,
};
