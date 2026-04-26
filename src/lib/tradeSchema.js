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
  { value: 'symbol', label: 'Pair / Symbol', required: true, aliases: ['symbol', 'pair', 'instrument', 'ticker', 'market', 'asset', 'contract', 'product', 'paire'] },
  { value: 'account', label: 'Account', aliases: ['account', 'accountname', 'accountnumber', 'accountid', 'compte', 'portfolio', 'book'] },
  { value: 'broker', label: 'Broker', aliases: ['broker', 'platform', 'exchange', 'venue', 'server', 'brokername'] },
  { value: 'date', label: 'Date', aliases: ['date', 'tradedate', 'opendate', 'entrydate', 'opened', 'created', 'timestamp', 'closedate', 'dateouverture'] },
  { value: 'time', label: 'Time', aliases: ['time', 'hour', 'heure', 'opentime', 'entrytime', 'tradetime', 'executiontime'] },
  { value: 'type', label: 'Direction', aliases: ['type', 'direction', 'side', 'dir', 'position', 'buysell', 'action', 'operation', 'sens', 'longshort'] },
  { value: 'entry', label: 'Entry', aliases: ['entry', 'entryprice', 'entry_price', 'open', 'openprice', 'open_price', 'fillprice', 'prixentree'] },
  { value: 'exit', label: 'Exit', aliases: ['exit', 'exitprice', 'exit_price', 'close', 'closeprice', 'close_price', 'prixsortie'] },
  { value: 'sl', label: 'Stop loss', aliases: ['sl', 'stoploss', 'stop_loss', 'stop', 'stopprice', 'stoplossprice', 'initialstop'] },
  { value: 'tp', label: 'Take profit', aliases: ['tp', 'takeprofit', 'take_profit', 'target', 'targetprice', 'profittarget', 'objectif'] },
  { value: 'result', label: 'Result', aliases: ['result', 'resultat', 'outcome', 'status', 'winloss', 'closedreason'] },
  { value: 'rrActual', label: 'R:R', aliases: ['rr', 'r', 'riskreward', 'rrratio', 'rractual', 'rrreel', 'multiple', 'rmultiple'] },
  { value: 'pnl', label: 'Profit / Loss', aliases: ['pnl', 'pl', 'profitloss', 'profit_loss', 'profit', 'netprofit', 'netpl', 'gainloss', 'realizedpnl', 'realizedpl'] },
  { value: 'size', label: 'Position size', aliases: ['size', 'positionsize', 'quantity', 'qty', 'lots', 'lot', 'lotsize', 'volume', 'contracts', 'shares', 'units'] },
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

export function autoMapImportHeaders(headers = []) {
  return headers.reduce((mapping, header) => {
    const normalized = normalizeImportHeader(header);
    const exact = TRADE_FIELD_ALIASES[normalized];
    if (exact) return { ...mapping, [header]: exact };

    const fuzzy = Object.entries(TRADE_FIELD_ALIASES).find(([alias]) => (
      alias.length >= 3 && (normalized === alias || normalized.includes(alias) || alias.includes(normalized))
    ));

    return { ...mapping, [header]: fuzzy?.[1] || CREATE_COLUMN_VALUE };
  }, {});
}
