const IMPORT_FORMATS = Object.freeze({
  CSV: 'csv',
  EXCEL: 'excel',
  MT4_STATEMENT: 'mt4_statement',
  MT5_STATEMENT: 'mt5_statement',
  FXBLUE: 'fxblue',
  CTRADER: 'ctrader',
  TRADELOCKER: 'tradelocker',
  DXTRADE: 'dxtrade',
  GENERIC: 'generic',
});

const COLUMN_SYNONYMS = Object.freeze({
  ticket: ['ticket', 'order', 'order id', 'deal', 'deal id', 'position id', 'id'],
  symbol: ['symbol', 'pair', 'instrument', 'market', 'ticker'],
  direction: ['direction', 'side', 'type', 'action', 'buy/sell'],
  entry_price: ['entry', 'entry price', 'open price', 'price open', 'open'],
  exit_price: ['exit', 'exit price', 'close price', 'price close', 'close'],
  stop_loss: ['sl', 'stop', 'stop loss', 'stoploss'],
  take_profit: ['tp', 'target', 'take profit', 'takeprofit'],
  quantity: ['size', 'quantity', 'qty', 'volume', 'lots', 'lot size'],
  commission: ['commission', 'comm', 'fee', 'fees'],
  swap: ['swap', 'overnight', 'financing'],
  profit_loss: ['pnl', 'p/l', 'profit', 'profit/loss', 'gross profit', 'net pnl'],
  open_time: ['open time', 'entry time', 'opened at', 'time'],
  close_time: ['close time', 'exit time', 'closed at'],
});

function detectImportFormat(headers = []) {
  const normalized = headers.map((header) => String(header || '').toLowerCase());
  const joined = normalized.join(' | ');
  if (joined.includes('s/l') || joined.includes('t/p') || joined.includes('commission') && joined.includes('swap')) return IMPORT_FORMATS.MT5_STATEMENT;
  if (joined.includes('open time') && joined.includes('close time') && joined.includes('profit')) return IMPORT_FORMATS.MT4_STATEMENT;
  if (joined.includes('fxblue')) return IMPORT_FORMATS.FXBLUE;
  if (joined.includes('ctrader')) return IMPORT_FORMATS.CTRADER;
  if (joined.includes('tradelocker')) return IMPORT_FORMATS.TRADELOCKER;
  if (joined.includes('dxtrade')) return IMPORT_FORMATS.DXTRADE;
  return IMPORT_FORMATS.GENERIC;
}

function suggestColumnMapping(headers = []) {
  const result = {};
  headers.forEach((header) => {
    const clean = String(header || '').trim().toLowerCase();
    Object.entries(COLUMN_SYNONYMS).forEach(([field, synonyms]) => {
      if (result[field]) return;
      if (synonyms.includes(clean) || synonyms.some((synonym) => clean.includes(synonym))) {
        result[field] = header;
      }
    });
  });
  return result;
}

module.exports = {
  COLUMN_SYNONYMS,
  IMPORT_FORMATS,
  detectImportFormat,
  suggestColumnMapping,
};
