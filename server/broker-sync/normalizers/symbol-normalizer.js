const SYMBOL_ALIASES = new Map([
  ['XAU/USD', 'XAUUSD'],
  ['XAUUSD', 'XAUUSD'],
  ['GOLD', 'XAUUSD'],
  ['XAUUSD.', 'XAUUSD'],
  ['XAG/USD', 'XAGUSD'],
  ['SILVER', 'XAGUSD'],
  ['US30', 'US30'],
  ['DJ30', 'US30'],
  ['DJI', 'US30'],
  ['DOW', 'US30'],
  ['NAS100', 'NAS100'],
  ['USTEC', 'NAS100'],
  ['US100', 'NAS100'],
  ['NDX', 'NAS100'],
  ['SPX500', 'SPX500'],
  ['US500', 'SPX500'],
  ['SP500', 'SPX500'],
  ['BTC/USDT', 'BTCUSD'],
  ['BTCUSDT', 'BTCUSD'],
  ['BTC/USD', 'BTCUSD'],
  ['BTCUSD', 'BTCUSD'],
  ['ETH/USDT', 'ETHUSD'],
  ['ETHUSDT', 'ETHUSD'],
  ['ETH/USD', 'ETHUSD'],
  ['ETHUSD', 'ETHUSD'],
]);

function normalizeSymbol(value = '') {
  const raw = String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[_-]/g, '')
    .toUpperCase();

  if (!raw) return '';

  const strippedSuffix = raw.replace(/(\.RAW|\.PRO|\.ECN|\.M|\.R|\.I|\.A)$/i, '');
  const slashPair = strippedSuffix.length === 6
    ? `${strippedSuffix.slice(0, 3)}/${strippedSuffix.slice(3)}`
    : strippedSuffix;

  return SYMBOL_ALIASES.get(strippedSuffix)
    || SYMBOL_ALIASES.get(slashPair)
    || strippedSuffix.replace('/', '');
}

module.exports = {
  SYMBOL_ALIASES,
  normalizeSymbol,
};
