// api/market-data.js
// Proxy serverless Vercel — résout les problèmes CORS pour forex et indices
// GET /api/market-data?type=forex   → taux forex
// GET /api/market-data?type=indices → indices US

module.exports = async (req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');

  const { type } = req.query;

  try {
    if (type === 'forex') {
      // open.er-api.com — gratuit, sans clé, données toutes les heures
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();

      if (!data.rates) {
        return res.status(502).json({ error: 'No rates from upstream' });
      }

      const r = data.rates;
      const pairs = {
        'EUR/USD': r.EUR ? +(1 / r.EUR).toFixed(5) : null,
        'GBP/USD': r.GBP ? +(1 / r.GBP).toFixed(5) : null,
        'USD/JPY': r.JPY ? +r.JPY.toFixed(3)        : null,
        'USD/CHF': r.CHF ? +r.CHF.toFixed(5)        : null,
        'AUD/USD': r.AUD ? +(1 / r.AUD).toFixed(5)  : null,
        'USD/CAD': r.CAD ? +r.CAD.toFixed(5)        : null,
        'GBP/JPY': (r.GBP && r.JPY) ? +(r.JPY / r.GBP).toFixed(3) : null,
      };

      return res.status(200).json({ pairs, timestamp: data.time_last_update_utc });
    }

    if (type === 'indices') {
      // Yahoo Finance v8 spark — fonctionne côté serveur
      const symbols = ['^GSPC', '^NDX', '^DJI', '^RUT'];
      const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols.join('%2C')}&range=1d&interval=5m`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      const json = await response.json();
      const results = json?.spark?.result || [];

      const NAME_MAP = {
        '^GSPC': 'S&P 500',
        '^NDX':  'NASDAQ',
        '^DJI':  'DOW JONES',
        '^RUT':  'RUSSELL 2K',
      };

      const indices = {};
      results.forEach(item => {
        const name = NAME_MAP[item.symbol];
        if (!name) return;
        const closes = item?.response?.[0]?.indicators?.quote?.[0]?.close || [];
        const valid = closes.filter(v => v != null);
        if (valid.length < 2) return;
        const price = valid[valid.length - 1];
        const open  = valid[0];
        const pct   = +((price - open) / open * 100).toFixed(2);
        indices[name] = { price: +price.toFixed(2), pct };
      });

      // Fallback: Yahoo Finance v7 si spark vide
      if (Object.keys(indices).length === 0) {
        const url2 = `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
        const res2 = await fetch(url2, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const json2 = await res2.json();
        const quotes = json2?.quoteResponse?.result || [];
        quotes.forEach(q => {
          const name = NAME_MAP[q.symbol];
          if (!name || !q.regularMarketPrice) return;
          indices[name] = {
            price: +q.regularMarketPrice.toFixed(2),
            pct: +q.regularMarketChangePercent.toFixed(2),
          };
        });
      }

      return res.status(200).json({ indices, timestamp: Date.now() });
    }

    return res.status(400).json({ error: 'type must be forex or indices' });

  } catch (err) {
    console.error('market-data error:', err);
    return res.status(500).json({ error: err.message });
  }
};