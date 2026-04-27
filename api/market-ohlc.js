const TWELVE_DATA_INTERVALS = {
  1: '1min',
  3: '5min',
  5: '5min',
  15: '15min',
  30: '30min',
  45: '45min',
  60: '1h',
  120: '2h',
  240: '4h',
  D: '1day',
  W: '1week',
};

const ALPHA_VANTAGE_INTERVALS = {
  1: '1min',
  3: '5min',
  5: '5min',
  15: '15min',
  30: '30min',
  60: '60min',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbol = normalizeSymbol(req.query.symbol || 'EURUSD');
  const interval = String(req.query.interval || '1').toUpperCase();
  const provider = String(req.query.provider || 'auto').toLowerCase();
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  const limit = clampNumber(req.query.limit, 20, 1000, 500);

  try {
    if ((provider === 'auto' || provider === 'twelvedata') && process.env.TWELVE_DATA_API_KEY) {
      const payload = await fetchTwelveData({ symbol, interval, from, to, limit });
      return res.status(200).json(payload);
    }

    if ((provider === 'auto' || provider === 'alphavantage') && process.env.ALPHA_VANTAGE_API_KEY) {
      const payload = await fetchAlphaVantage({ symbol, interval, limit });
      return res.status(200).json(payload);
    }

    return res.status(501).json({
      error: 'No OHLC provider configured.',
      message: 'MarketFlow will not generate fake candles. Configure TWELVE_DATA_API_KEY or ALPHA_VANTAGE_API_KEY in Vercel.',
      requiredEnv: ['TWELVE_DATA_API_KEY', 'ALPHA_VANTAGE_API_KEY'],
      requested: { symbol, interval, provider },
    });
  } catch (error) {
    console.error('market-ohlc error:', error);
    return res.status(502).json({
      error: 'OHLC provider request failed',
      detail: error.message,
      requested: { symbol, interval, provider },
    });
  }
};

async function fetchTwelveData({ symbol, interval, from, to, limit }) {
  const apiInterval = TWELVE_DATA_INTERVALS[interval] || '1min';
  const url = new URL('https://api.twelvedata.com/time_series');
  url.searchParams.set('symbol', toTwelveDataSymbol(symbol));
  url.searchParams.set('interval', apiInterval);
  url.searchParams.set('apikey', process.env.TWELVE_DATA_API_KEY);
  url.searchParams.set('outputsize', String(limit));
  url.searchParams.set('order', 'asc');
  url.searchParams.set('timezone', 'UTC');
  if (from) url.searchParams.set('start_date', `${from} 00:00:00`);
  if (to) url.searchParams.set('end_date', `${to} 23:59:59`);

  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok || json.status === 'error') {
    throw new Error(json.message || `Twelve Data returned ${response.status}`);
  }

  const candles = normalizeTwelveDataCandles(json.values || []).slice(-limit);

  return {
    provider: 'twelvedata',
    symbol,
    interval: apiInterval,
    candles,
    count: candles.length,
    meta: json.meta || null,
    generated: false,
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchAlphaVantage({ symbol, interval, limit }) {
  const apiInterval = ALPHA_VANTAGE_INTERVALS[interval] || '1min';
  const pair = splitForexPair(symbol);
  if (!pair) {
    throw new Error('Alpha Vantage fallback currently supports 6-letter forex symbols such as EURUSD.');
  }

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'FX_INTRADAY');
  url.searchParams.set('from_symbol', pair.from);
  url.searchParams.set('to_symbol', pair.to);
  url.searchParams.set('interval', apiInterval);
  url.searchParams.set('outputsize', 'full');
  url.searchParams.set('apikey', process.env.ALPHA_VANTAGE_API_KEY);

  const response = await fetch(url);
  const json = await response.json();
  const key = `Time Series FX (${apiInterval})`;
  const rawSeries = json[key];

  if (!response.ok || !rawSeries) {
    throw new Error(json.Note || json['Error Message'] || `Alpha Vantage returned ${response.status}`);
  }

  const candles = Object.entries(rawSeries)
    .map(([datetime, item]) => ({
      time: toIsoTime(datetime),
      open: toNumber(item['1. open']),
      high: toNumber(item['2. high']),
      low: toNumber(item['3. low']),
      close: toNumber(item['4. close']),
      volume: null,
    }))
    .filter(isValidCandle)
    .sort((left, right) => new Date(left.time) - new Date(right.time))
    .slice(-limit);

  return {
    provider: 'alphavantage',
    symbol,
    interval: apiInterval,
    candles,
    count: candles.length,
    meta: json['Meta Data'] || null,
    generated: false,
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeTwelveDataCandles(values = []) {
  return values
    .map((item) => ({
      time: toIsoTime(item.datetime),
      open: toNumber(item.open),
      high: toNumber(item.high),
      low: toNumber(item.low),
      close: toNumber(item.close),
      volume: toNumber(item.volume),
    }))
    .filter(isValidCandle)
    .sort((left, right) => new Date(left.time) - new Date(right.time));
}

function isValidCandle(candle = {}) {
  return candle.time
    && Number.isFinite(candle.open)
    && Number.isFinite(candle.high)
    && Number.isFinite(candle.low)
    && Number.isFinite(candle.close);
}

function toIsoTime(value) {
  if (!value) return '';
  const date = new Date(`${String(value).replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function normalizeSymbol(value = '') {
  return String(value || 'EURUSD').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'EURUSD';
}

function toTwelveDataSymbol(symbol) {
  const pair = splitForexPair(symbol);
  if (pair) return `${pair.from}/${pair.to}`;
  if (symbol === 'BTCUSD') return 'BTC/USD';
  if (symbol === 'ETHUSD') return 'ETH/USD';
  if (symbol === 'XAUUSD') return 'XAU/USD';
  return symbol;
}

function splitForexPair(symbol) {
  const clean = normalizeSymbol(symbol);
  if (clean.length !== 6) return null;
  return {
    from: clean.slice(0, 3),
    to: clean.slice(3, 6),
  };
}

function normalizeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  if (value === '' || value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}
