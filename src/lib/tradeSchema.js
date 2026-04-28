export const IGNORE_COLUMN_VALUE = '_ignore';
export const CREATE_COLUMN_VALUE = '_create';

export const TRADE_IMPORT_SOURCE_OPTIONS = [
  'CSV / TSV',
  'Excel',
  'Notion CSV',
  'Google Sheets CSV',
  'Broker export',
  'JSON / API',
  'Pasted table',
];

export const CANONICAL_TRADE_FIELDS = [
  { value: 'symbol', label: 'Pair / Symbol', required: true, aliases: ['symbol', 'pair', 'pairs', 'instrument', 'ticker', 'market', 'asset', 'contract', 'product', 'paire', 'symbolname', 'instrumentname'] },
  { value: 'account', label: 'Account', aliases: ['account', 'accountname', 'accountnumber', 'accountid', 'compte', 'portfolio', 'book'] },
  { value: 'broker', label: 'Broker', aliases: ['broker', 'platform', 'exchange', 'venue', 'server', 'brokername', 'propfirm', 'propfirmname'] },
  { value: 'date', label: 'Date', aliases: ['date', 'tradedate', 'opendate', 'entrydate', 'opened', 'created', 'timestamp', 'closedate', 'dateouverture', 'openingtimestamp', 'closetime', 'closingtime'] },
  { value: 'time', label: 'Time', aliases: ['time', 'hour', 'heure', 'opentime', 'entrytime', 'tradetime', 'executiontime', 'openingtime'] },
  { value: 'type', label: 'Direction', aliases: ['type', 'direction', 'side', 'dir', 'position', 'buysell', 'action', 'operation', 'sens', 'longshort', 'ordertype'] },
  { value: 'entry', label: 'Entry', aliases: ['entry', 'entryprice', 'entry_price', 'open', 'openprice', 'open_price', 'fillprice', 'price', 'openrate', 'prixentree'] },
  { value: 'exit', label: 'Exit', aliases: ['exit', 'exitprice', 'exit_price', 'close', 'closeprice', 'close_price', 'closerate', 'prixsortie'] },
  { value: 'sl', label: 'Stop loss', aliases: ['sl', 'stoploss', 'stop_loss', 'stop', 'stopprice', 'stoplossprice', 'initialstop'] },
  { value: 'tp', label: 'Take profit', aliases: ['tp', 'takeprofit', 'take_profit', 'target', 'targetprice', 'profittarget', 'objectif'] },
  { value: 'result', label: 'Result (TP / BE / SL)', aliases: ['result', 'resultat', 'outcome', 'status', 'winloss', 'winlose', 'closedreason', 'closereason', 'tradeoutcome'] },
  { value: 'rrActual', label: 'R:R', aliases: ['rr', 'r', 'riskreward', 'riskrewardratio', 'rrratio', 'rractual', 'rrreel', 'multiple', 'rmultiple', 'r-multiple'] },
  { value: 'pnl', label: 'P&L', aliases: ['pnl', 'pl', 'profitloss', 'profit_loss', 'profit', 'loss', 'netprofit', 'netpl', 'gainloss', 'realizedpnl', 'realizedpl', 'grosspnl', 'netpnl'] },
  { value: 'size', label: 'Position size', aliases: ['size', 'positionsize', 'quantity', 'qty', 'lots', 'lot', 'lotsize', 'volume', 'contracts', 'shares', 'units', 'amount'] },
  { value: 'commission', label: 'Commission / fees', aliases: ['commission', 'commissions', 'fee', 'fees', 'brokerage', 'cost', 'tradecost', 'frais'] },
  { value: 'swap', label: 'Swap / overnight', aliases: ['swap', 'overnight', 'overnightfee', 'rollover', 'financingcost'] },
  { value: 'setup', label: 'Strategy / setup', aliases: ['setup', 'strategy', 'strategie', 'playbook', 'pattern', 'model', 'confluence', 'confluences', 'signal'] },
  { value: 'session', label: 'Session', aliases: ['session', 'marketsession', 'tradesession', 'sessiontype', 'periode'] },
  { value: 'bias', label: 'Bias', aliases: ['bias', 'sentiment', 'trend', 'marketbias', 'orientation', 'tendance'] },
  { value: 'newsImpact', label: 'News impact', aliases: ['news', 'newsimpact', 'impact', 'newsevent', 'newstier'] },
  { value: 'psychologyScore', label: 'Psychology score', aliases: ['psychology', 'psychologyscore', 'psycho', 'mentalstate', 'emotionscore', 'discipline', 'confidence'] },
  { value: 'emotion_before', label: 'Emotion before', aliases: ['emotionbefore', 'beforeemotion', 'preemotion', 'emotionsbefore', 'emotionavant'] },
  { value: 'emotion_during', label: 'Emotion during', aliases: ['emotionduring', 'duringemotion', 'tradeemotion', 'emotionpendant'] },
  { value: 'emotion_after', label: 'Emotion after', aliases: ['emotionafter', 'afteremotion', 'postemotion', 'emotionapres'] },
  { value: 'notes', label: 'Notes', aliases: ['notes', 'note', 'comment', 'comments', 'commentaire', 'journal', 'journalentry', 'description', 'lesson'] },
  { value: 'screenshots', label: 'Screenshots', aliases: ['screenshot', 'screenshots', 'image', 'images', 'chartshot', 'chartimage', 'attachment'] },
  { value: 'tags', label: 'Tags', aliases: ['tags', 'tag', 'labels', 'mistakes', 'habits'] },
  { value: 'marketType', label: 'Market type', aliases: ['markettype', 'assetclass', 'assettype', 'market', 'instrumenttype'] },
];

export const IMPORT_FIELD_OPTIONS = [
  ...CANONICAL_TRADE_FIELDS.map(({ value, label }) => [value, label]),
  [IGNORE_COLUMN_VALUE, 'Ignore'],
  [CREATE_COLUMN_VALUE, 'Create column'],
];

export const TRADE_FIELD_ALIASES = CANONICAL_TRADE_FIELDS.reduce((accumulator, field) => {
  field.aliases.forEach((alias) => {
    accumulator[normalizeImportHeader(alias)] = field.value;
  });
  accumulator[normalizeImportHeader(field.value)] = field.value;
  accumulator[normalizeImportHeader(field.label)] = field.value;
  return accumulator;
}, {});

export function normalizeImportHeader(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function slugifyTradeFieldKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || `field_${Date.now()}`;
}

const IMPORT_FIELD_ORDER = CANONICAL_TRADE_FIELDS.reduce((accumulator, field, index) => {
  accumulator[field.value] = index;
  return accumulator;
}, {});

const isKnownImportField = (field) => Object.prototype.hasOwnProperty.call(IMPORT_FIELD_ORDER, field);

const sampleColumnValues = (rows = [], header) => rows
  .map((row) => row?.[header])
  .filter((value) => value != null && String(value).trim() !== '')
  .slice(0, 60);

const ratio = (values, predicate) => {
  if (!values.length) return 0;
  return values.filter((value) => predicate(String(value).trim())).length / values.length;
};

const numericValue = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const clean = String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[$€£¥%]/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.+-]/g, '');
  if (!clean || !/[-+]?\d*\.?\d+/.test(clean)) return null;
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
};

function guessFieldFromValues(header, values = []) {
  const normalized = normalizeImportHeader(header);
  const samples = values.map((value) => String(value || '').trim()).filter(Boolean);
  if (!samples.length) return null;

  const directionScore = ratio(samples, (value) => /^(buy|sell|long|short|b|s|achat|vente)$/i.test(value) || /(long|short|buy|sell|bull|bear)/i.test(value));
  if (directionScore >= 0.58) return { field: 'type', score: 82 };

  const resultScore = ratio(samples, (value) => /^(tp|sl|be|win|loss|winner|loser|profit|flat|break even|break-even|take profit|stop loss)$/i.test(value));
  if (resultScore >= 0.52) return { field: 'result', score: 82 };

  const sessionScore = ratio(samples, (value) => /(new york|ny|london|ldn|tokyo|asia|asian|sydney|session)/i.test(value));
  if (sessionScore >= 0.5) return { field: 'session', score: 76 };

  const biasScore = ratio(samples, (value) => /(bullish|bearish|neutral|bull|bear|haussier|baissier|trend)/i.test(value));
  if (biasScore >= 0.5) return { field: 'bias', score: 72 };

  const newsScore = ratio(samples, (value) => /^(high|medium|low|red|orange|green|fort|moyen|faible)$/i.test(value));
  if (newsScore >= 0.5) return { field: 'newsImpact', score: 70 };

  const timeScore = ratio(samples, (value) => /^\d{1,2}:\d{2}(:\d{2})?/.test(value));
  if (timeScore >= 0.65) return { field: 'time', score: 82 };

  const dateScore = ratio(samples, (value) => (
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(value)
    || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(value)
    || /^\d{10,13}$/.test(value)
    || (!Number.isNaN(new Date(value).getTime()) && /\d/.test(value))
  ));
  if (dateScore >= 0.62) return { field: 'date', score: 78 };

  const symbolScore = ratio(samples, (value) => {
    const clean = value.toUpperCase().replace(/[^A-Z0-9/._-]/g, '');
    return /^(XAUUSD|XAGUSD|US30|NAS100|SPX500|GER40|BTCUSD|ETHUSD|[A-Z]{2,6}\/?[A-Z]{2,6}|[A-Z]{1,5})$/.test(clean);
  });
  if (symbolScore >= 0.62 && !/(account|broker|strategy|setup|tag|note|comment)/.test(normalized)) return { field: 'symbol', score: 78 };

  const numbers = samples.map(numericValue).filter((value) => value != null);
  const numericScore = numbers.length / samples.length;
  if (numericScore >= 0.75) {
    const hasPositive = numbers.some((value) => value > 0);
    const hasNegative = numbers.some((value) => value < 0);
    const maxAbs = Math.max(...numbers.map(Math.abs));
    if (/(rr|riskreward|multiple|rmultiple|^r$)/.test(normalized)) return { field: 'rrActual', score: 88 };
    if (/(pnl|profit|loss|pl|gain|realized|net)/.test(normalized) || (hasPositive && hasNegative && maxAbs < 10000000)) return { field: 'pnl', score: 76 };
    if (/(qty|quantity|volume|lots|contracts|shares|units|size|amount)/.test(normalized)) return { field: 'size', score: 82 };
    if (/(commission|fee|fees|cost|frais)/.test(normalized)) return { field: 'commission', score: 82 };
    if (/(swap|overnight|rollover)/.test(normalized)) return { field: 'swap', score: 82 };
    if (/(psychology|discipline|confidence|score)/.test(normalized) && maxAbs <= 100) return { field: 'psychologyScore', score: 72 };
  }

  return null;
}

function classifyHeader(header, rows = []) {
  const normalized = normalizeImportHeader(header);
  const exact = TRADE_FIELD_ALIASES[normalized];
  if (exact) return { field: exact, score: 100 };

  const fuzzy = Object.entries(TRADE_FIELD_ALIASES)
    .filter(([alias]) => alias.length >= 3 && normalized.length >= 3 && (normalized.includes(alias) || alias.includes(normalized)))
    .sort((left, right) => right[0].length - left[0].length)[0];
  if (fuzzy) return { field: fuzzy[1], score: 82 };

  return guessFieldFromValues(header, sampleColumnValues(rows, header)) || { field: CREATE_COLUMN_VALUE, score: 0 };
}

export function autoMapImportHeaders(headers = [], rows = []) {
  const classified = headers.map((header, originalIndex) => ({
    header,
    originalIndex,
    ...classifyHeader(header, rows),
  }));

  const bestByField = new Map();
  classified.forEach((item) => {
    if (!isKnownImportField(item.field)) return;
    const current = bestByField.get(item.field);
    if (!current || item.score > current.score || (item.score === current.score && item.originalIndex < current.originalIndex)) {
      bestByField.set(item.field, item);
    }
  });

  return classified.reduce((mapping, item) => {
    if (isKnownImportField(item.field) && bestByField.get(item.field)?.header === item.header) {
      return { ...mapping, [item.header]: item.field };
    }
    return { ...mapping, [item.header]: CREATE_COLUMN_VALUE };
  }, {});
}

export function sortTradeImportHeaders(headers = [], mapping = {}) {
  return [...headers].sort((left, right) => {
    const leftField = mapping[left];
    const rightField = mapping[right];
    const leftOrder = isKnownImportField(leftField) ? IMPORT_FIELD_ORDER[leftField] : leftField === CREATE_COLUMN_VALUE ? 900 : 999;
    const rightOrder = isKnownImportField(rightField) ? IMPORT_FIELD_ORDER[rightField] : rightField === CREATE_COLUMN_VALUE ? 900 : 999;
    return leftOrder - rightOrder || headers.indexOf(left) - headers.indexOf(right);
  });
}

export function inferTradeImportColumnType(header, rows = []) {
  const samples = sampleColumnValues(rows, header);
  if (!samples.length) return 'text';
  if (ratio(samples, (value) => numericValue(value) != null) >= 0.8) return 'number';
  if (guessFieldFromValues(header, samples)?.field === 'date') return 'date';
  return 'text';
}

export function getTradeImportFieldOrder(field) {
  return isKnownImportField(field) ? IMPORT_FIELD_ORDER[field] : 999;
}

export function isCanonicalTradeImportField(field) {
  return isKnownImportField(field);
}

export function getTradeImportMappedFieldLabel(field) {
  if (field === CREATE_COLUMN_VALUE) return 'Create column';
  if (field === IGNORE_COLUMN_VALUE) return 'Ignore';
  return CANONICAL_TRADE_FIELDS.find((item) => item.value === field)?.label || field;
}
