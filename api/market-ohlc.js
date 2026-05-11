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

const OANDA_GRANULARITIES = {
  1: 'M1',
  3: 'M3',
  5: 'M5',
  15: 'M15',
  30: 'M30',
  60: 'H1',
  120: 'H2',
  240: 'H4',
  D: 'D',
  W: 'W',
};

const DUKASCOPY_INTERVALS = {
  1: { api: '1MIN', ms: 60 * 1000 },
  3: { api: '3MIN', ms: 3 * 60 * 1000 },
  5: { api: '5MIN', ms: 5 * 60 * 1000 },
  15: { api: '15MIN', ms: 15 * 60 * 1000 },
  30: { api: '30MIN', ms: 30 * 60 * 1000 },
  60: { api: '1HOUR', ms: 60 * 60 * 1000 },
  120: { api: '2HOURS', ms: 2 * 60 * 60 * 1000 },
  240: { api: '4HOURS', ms: 4 * 60 * 60 * 1000 },
  D: { api: '1DAY', ms: 24 * 60 * 60 * 1000 },
  W: { api: '1WEEK', ms: 7 * 24 * 60 * 60 * 1000 },
};
const { applyRateLimit, handleCors, sendServerError } = require('../server/lib/api-security');

const PROVIDER_ORDER = ['oanda', 'dukascopy', 'twelvedata', 'alphavantage'];
const KNOWN_PROVIDERS = ['auto', ...PROVIDER_ORDER];

class ProviderUnavailableError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.status = status;
  }
}

module.exports = async function handler(req, res) {
  if (handleCors(req, res, { methods: 'GET, OPTIONS' })) return;
  if (!(await applyRateLimit(req, res, { category: 'market', keyPrefix: 'market-ohlc' }))) return;
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbol = normalizeSymbol(req.query.symbol || 'EURUSD');
  const interval = String(req.query.interval || '1').toUpperCase();
  const requestedProvider = String(req.query.provider || 'auto').toLowerCase();
  const provider = KNOWN_PROVIDERS.includes(requestedProvider) ? requestedProvider : 'auto';
  const from = normalizeDate(req.query.from);
  const to = normalizeDate(req.query.to);
  const limit = clampNumber(req.query.limit, 20, 1000, 500);
  const requested = { symbol, interval, provider, from, to, limit };

  const attempts = [];
  const order = provider === 'auto' ? PROVIDER_ORDER : [provider];

  for (const candidate of order) {
    const readiness = getProviderReadiness(candidate, symbol, interval);
    if (!readiness.ready) {
      attempts.push({ provider: candidate, status: 'skipped', reason: readiness.reason });
      if (provider !== 'auto') {
        return res.status(readiness.status || 501).json({
          error: 'OHLC provider is not ready.',
          message: readiness.reason,
          requiredEnv: readiness.requiredEnv || [],
          requested,
          availableProviders: getAvailableProviderSummary(symbol, interval),
        });
      }
      continue;
    }

    try {
      const payload = await fetchProvider(candidate, { symbol, interval, from, to, limit });
      const candles = Array.isArray(payload.candles) ? payload.candles.filter(isValidCandle) : [];
      if (!candles.length) {
        throw new ProviderUnavailableError(`${candidate} returned no candles for ${symbol} ${interval}.`, 204);
      }

      return res.status(200).json({
        ...payload,
        provider: candidate,
        symbol,
        requestedProvider: provider,
        interval: payload.interval || interval,
        candles,
        count: candles.length,
        generated: false,
        fetchedAt: new Date().toISOString(),
        attempts,
      });
    } catch (error) {
      const detail = error?.message || String(error);
      attempts.push({ provider: candidate, status: 'failed', reason: detail });
      if (provider !== 'auto') {
        return res.status(error.status && error.status !== 204 ? error.status : 502).json({
          error: 'OHLC provider request failed.',
          detail,
          requested,
          attempts,
        });
      }
    }
  }

  const hasConfiguredProvider = attempts.some((attempt) => attempt.status === 'failed');
  return res.status(hasConfiguredProvider ? 502 : 501).json({
    error: hasConfiguredProvider ? 'All OHLC provider attempts failed.' : 'No OHLC provider configured for this request.',
    message: hasConfiguredProvider
      ? 'MarketFlow did not generate fake candles. Check the provider details below.'
      : 'Use Dukascopy for supported FX symbols without a key, or configure OANDA_API_TOKEN, TWELVE_DATA_API_KEY, or ALPHA_VANTAGE_API_KEY in Vercel.',
    requiredEnv: ['OANDA_API_TOKEN', 'TWELVE_DATA_API_KEY', 'ALPHA_VANTAGE_API_KEY'],
    requested,
    attempts,
    availableProviders: getAvailableProviderSummary(symbol, interval),
  });
};

async function fetchProvider(provider, params) {
  if (provider === 'oanda') return fetchOanda(params);
  if (provider === 'dukascopy') return fetchDukascopy(params);
  if (provider === 'twelvedata') return fetchTwelveData(params);
  if (provider === 'alphavantage') return fetchAlphaVantage(params);
  throw new ProviderUnavailableError(`Unknown provider: ${provider}`, 400);
}

function getProviderReadiness(provider, symbol, interval) {
  if (provider === 'oanda') {
    if (!process.env.OANDA_API_TOKEN) {
      return {
        ready: false,
        status: 501,
        reason: 'OANDA requires OANDA_API_TOKEN in Vercel environment variables.',
        requiredEnv: ['OANDA_API_TOKEN'],
      };
    }
    try {
      toOandaInstrument(symbol);
    } catch (error) {
      return { ready: false, status: 400, reason: error.message };
    }
    if (!OANDA_GRANULARITIES[interval]) {
      return { ready: false, status: 400, reason: `OANDA does not support interval ${interval} in MarketFlow yet.` };
    }
    return { ready: true };
  }

  if (provider === 'dukascopy') {
    try {
      toDukascopyInstrument(symbol);
    } catch (error) {
      return { ready: false, status: 400, reason: error.message };
    }
    if (!DUKASCOPY_INTERVALS[interval]) {
      return { ready: false, status: 400, reason: `Dukascopy does not support interval ${interval} in MarketFlow yet.` };
    }
    return { ready: true };
  }

  if (provider === 'twelvedata') {
    return process.env.TWELVE_DATA_API_KEY
      ? { ready: true }
      : {
          ready: false,
          status: 501,
          reason: 'Twelve Data requires TWELVE_DATA_API_KEY in Vercel environment variables.',
          requiredEnv: ['TWELVE_DATA_API_KEY'],
        };
  }

  if (provider === 'alphavantage') {
    if (!process.env.ALPHA_VANTAGE_API_KEY) {
      return {
        ready: false,
        status: 501,
        reason: 'Alpha Vantage requires ALPHA_VANTAGE_API_KEY in Vercel environment variables.',
        requiredEnv: ['ALPHA_VANTAGE_API_KEY'],
      };
    }
    if (!splitForexPair(symbol)) {
      return { ready: false, status: 400, reason: 'Alpha Vantage FX fallback supports 6-letter forex symbols such as EURUSD.' };
    }
    return { ready: true };
  }

  return { ready: false, status: 400, reason: `Unknown provider ${provider}.` };
}

function getAvailableProviderSummary(symbol, interval) {
  return PROVIDER_ORDER.map((provider) => {
    const readiness = getProviderReadiness(provider, symbol, interval);
    return {
      provider,
      ready: readiness.ready,
      reason: readiness.ready ? 'ready' : readiness.reason,
    };
  });
}

async function fetchOanda({ symbol, interval, from, to, limit }) {
  const instrument = toOandaInstrument(symbol);
  const granularity = OANDA_GRANULARITIES[interval] || 'M1';
  const environment = String(process.env.OANDA_ENV || 'practice').toLowerCase();
  const host = process.env.OANDA_API_HOST
    || (environment === 'live' ? 'https://api-fxtrade.oanda.com' : 'https://api-fxpractice.oanda.com');
  const url = new URL(`/v3/instruments/${encodeURIComponent(instrument)}/candles`, host);

  url.searchParams.set('price', 'M');
  url.searchParams.set('granularity', granularity);
  url.searchParams.set('includeFirst', 'true');
  url.searchParams.set('smooth', 'false');
  if (from) url.searchParams.set('from', `${from}T00:00:00Z`);
  if (to) url.searchParams.set('to', `${to}T23:59:59Z`);
  if (!from || !to) url.searchParams.set('count', String(limit));

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.OANDA_API_TOKEN}`,
      Accept: 'application/json',
      'Accept-Datetime-Format': 'RFC3339',
    },
  });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ProviderUnavailableError(json?.errorMessage || json?.message || `OANDA returned ${response.status}`, response.status);
  }

  const candles = normalizeOandaCandles(json.candles || []).slice(-limit);
  return {
    provider: 'oanda',
    interval: granularity,
    candles,
    meta: {
      instrument,
      granularity,
      environment,
    },
  };
}

async function fetchDukascopy({ symbol, interval, from, to, limit }) {
  const intervalConfig = DUKASCOPY_INTERVALS[interval] || DUKASCOPY_INTERVALS[1];
  const startMillis = getDukascopyStartMillis({ from, to, limit, intervalMs: intervalConfig.ms });
  const endMillis = to ? new Date(`${to}T23:59:59.999Z`).getTime() : null;
  const url = new URL('https://freeserv.dukascopy.com/2.0/index.php');

  url.searchParams.set('path', 'chart/json3');
  url.searchParams.set('instrument', toDukascopyInstrument(symbol));
  url.searchParams.set('offer_side', 'B');
  url.searchParams.set('interval', intervalConfig.api);
  url.searchParams.set('jsonp', '_callbacks____marketflow');
  url.searchParams.set('last_update', String(startMillis));
  url.searchParams.set('time_direction', 'N');
  url.searchParams.set('splits', 'true');
  url.searchParams.set('stocks', 'true');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*;q=0.8',
      Host: 'freeserv.dukascopy.com',
      Referer: 'https://freeserv.dukascopy.com/2.0/?path=chart/index&showUI=true&showTabs=true&instrument=EUR/USD&period=5&offerSide=BID&live=true',
      'User-Agent': 'MarketFlowJournal/1.0 OHLC fetcher',
    },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new ProviderUnavailableError(`Dukascopy returned ${response.status}`, response.status);
  }

  const raw = parsePossiblyJsonp(text);
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  const candles = normalizeDukascopyCandles(rows)
    .filter((candle) => !endMillis || new Date(candle.time).getTime() <= endMillis)
    .slice(-limit);

  return {
    provider: 'dukascopy',
    interval: intervalConfig.api,
    candles,
    meta: {
      instrument: toDukascopyInstrument(symbol),
      offerSide: 'BID',
      startMillis,
    },
  };
}

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
    throw new ProviderUnavailableError(json.message || `Twelve Data returned ${response.status}`, response.status);
  }

  const candles = normalizeTwelveDataCandles(json.values || []).slice(-limit);

  return {
    provider: 'twelvedata',
    symbol,
    interval: apiInterval,
    candles,
    meta: json.meta || null,
  };
}

async function fetchAlphaVantage({ symbol, interval, limit }) {
  const apiInterval = ALPHA_VANTAGE_INTERVALS[interval] || '1min';
  const pair = splitForexPair(symbol);
  if (!pair) {
    throw new ProviderUnavailableError('Alpha Vantage fallback currently supports 6-letter forex symbols such as EURUSD.', 400);
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
    throw new ProviderUnavailableError(json.Note || json['Error Message'] || `Alpha Vantage returned ${response.status}`, response.status);
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
    meta: json['Meta Data'] || null,
  };
}

function normalizeOandaCandles(candles = []) {
  return candles
    .filter((item) => item?.complete !== false && item?.mid)
    .map((item) => ({
      time: toIsoTime(item.time),
      open: toNumber(item.mid.o),
      high: toNumber(item.mid.h),
      low: toNumber(item.mid.l),
      close: toNumber(item.mid.c),
      volume: toNumber(item.volume),
    }))
    .filter(isValidCandle)
    .sort((left, right) => new Date(left.time) - new Date(right.time));
}

function normalizeDukascopyCandles(rows = []) {
  return rows
    .map((row) => {
      if (Array.isArray(row)) {
        const timestamp = normalizeTimestamp(row[0]);
        return {
          time: timestamp ? new Date(timestamp).toISOString() : '',
          open: toNumber(row[1]),
          high: toNumber(row[2]),
          low: toNumber(row[3]),
          close: toNumber(row[4]),
          volume: toNumber(row[5]),
        };
      }

      const timestamp = normalizeTimestamp(row?.timestamp ?? row?.time ?? row?.date);
      return {
        time: timestamp ? new Date(timestamp).toISOString() : '',
        open: toNumber(row?.open ?? row?.o),
        high: toNumber(row?.high ?? row?.h),
        low: toNumber(row?.low ?? row?.l),
        close: toNumber(row?.close ?? row?.c),
        volume: toNumber(row?.volume ?? row?.v),
      };
    })
    .filter(isValidCandle)
    .sort((left, right) => new Date(left.time) - new Date(right.time));
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

function parsePossiblyJsonp(text = '') {
  const trimmed = String(text || '').trim();
  if (!trimmed) return [];
  const json = trimmed.startsWith('[') || trimmed.startsWith('{')
    ? trimmed
    : trimmed.slice(trimmed.indexOf('(') + 1, trimmed.lastIndexOf(')'));
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new ProviderUnavailableError(`Dukascopy returned an unreadable payload: ${error.message}`, 502);
  }
}

function getDukascopyStartMillis({ from, to, limit, intervalMs }) {
  if (from) return new Date(`${from}T00:00:00.000Z`).getTime();
  if (to) return new Date(`${to}T23:59:59.999Z`).getTime() - (limit * intervalMs);
  return Date.now() - (limit * intervalMs);
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
  const raw = String(value);
  const date = new Date(raw.includes('T') || raw.endsWith('Z') ? raw : `${raw.replace(' ', 'T')}Z`);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function normalizeTimestamp(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric < 10000000000 ? numeric * 1000 : numeric;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeSymbol(value = '') {
  return String(value || 'EURUSD').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'EURUSD';
}

function toOandaInstrument(symbol) {
  const clean = normalizeSymbol(symbol);
  const mapped = {
    XAUUSD: 'XAU_USD',
    XAGUSD: 'XAG_USD',
  }[clean];
  if (mapped) return mapped;
  const pair = splitForexPair(clean);
  if (!pair) {
    throw new Error('OANDA market data supports forex/metals symbols such as EURUSD, GBPUSD, USDJPY, XAUUSD.');
  }
  return `${pair.from}_${pair.to}`;
}

function toDukascopyInstrument(symbol) {
  const clean = normalizeSymbol(symbol);
  const mapped = {
    XAUUSD: 'XAU/USD',
    XAGUSD: 'XAG/USD',
  }[clean];
  if (mapped) return mapped;
  const pair = splitForexPair(clean);
  if (!pair) {
    throw new Error('Dukascopy free market data supports forex/metals symbols such as EURUSD, GBPUSD, USDJPY, XAUUSD.');
  }
  return `${pair.from}/${pair.to}`;
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
