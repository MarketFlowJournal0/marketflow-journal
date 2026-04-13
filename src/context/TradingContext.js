import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const TradingContext = createContext(null);

export function TradingProvider({ children }) {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setTrades([]); setLoading(false); return; }
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('open_date', { ascending: false });
      if (!error) setTrades((data || []).map(normalizeTradeRecord));
    } catch(_) {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 5000);
    fetchTrades().finally(() => clearTimeout(t));
  }, [fetchTrades]);

  // ── addTrade — maps all fields to Supabase columns ──────
  const addTrade = useCallback(async (tradeData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      const payload = buildTradePayload(tradeData, session.user.id);

      const { data, error } = await supabase
        .from('trades')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('addTrade error:', error.message, error.details);
        return null;
      }
      if (data) {
        const normalized = normalizeTradeRecord(data);
        setTrades(prev => [normalized, ...prev]);
        return normalized;
      }
      return null;
    } catch (err) {
      console.error('addTrade exception:', err);
      return null;
    }
  }, []);

  const importTrades = useCallback(async (tradeRows = []) => {
    try {
      const rows = Array.isArray(tradeRows) ? tradeRows.filter(Boolean) : [];
      if (!rows.length) return { imported: 0, skipped: 0, trades: [] };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return {
          imported: 0,
          skipped: rows.length,
          trades: [],
          error: 'No active session found. Sign in again before importing trades.',
        };
      }

      const payloads = rows.map((tradeData) => buildTradePayload(tradeData, session.user.id));
      let imported = 0;
      let skipped = 0;
      let firstError = '';
      const chunkSize = 50;

      for (let index = 0; index < payloads.length; index += chunkSize) {
        const chunk = payloads.slice(index, index + chunkSize);
        const { error } = await supabase.from('trades').insert(chunk);

        if (!error) {
          imported += chunk.length;
          continue;
        }

        console.error('importTrades batch error:', error?.message, error?.details);
        if (!firstError) {
          firstError = [error?.message, error?.details].filter(Boolean).join(' - ') || 'The batch import was rejected by the database.';
        }

        for (const payload of chunk) {
          const { error: rowError } = await supabase.from('trades').insert([payload]);

          if (rowError) {
            console.error('importTrades row error:', rowError.message, rowError.details);
            if (!firstError) {
              firstError = [rowError.message, rowError.details].filter(Boolean).join(' - ') || 'A trade row could not be saved.';
            }
            skipped += 1;
            continue;
          }

          imported += 1;
        }
      }

      if (imported > 0) {
        fetchTrades().catch((refreshError) => {
          console.error('importTrades refresh error:', refreshError);
        });
      } else if (!firstError) {
        firstError = 'No trade could be saved.';
      }

      return { imported, skipped, trades: [], error: firstError || null };
    } catch (err) {
      console.error('importTrades exception:', err);
      throw err;
    }
  }, [fetchTrades]);

  const updateTrade = useCallback(async (id, updates) => {
    const currentTrade = trades.find(t => t.id === id);
    const payload = mapTradeUpdates({ ...currentTrade, ...updates });
    const { data, error } = await supabase
      .from('trades').update(payload).eq('id', id).select().single();
    if (!error && data) {
      const normalized = normalizeTradeRecord(data);
      setTrades(prev => prev.map(t => t.id === id ? normalized : t));
      return normalized;
    }
    if (error) console.error('updateTrade error:', error.message, error.details);
    return null;
  }, [trades]);

  const deleteTrade = useCallback(async (id) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) setTrades(prev => prev.filter(t => t.id !== id));
    return !error;
  }, []);

  const stats = useMemo(() => {
    if (!trades.length) return emptyStats();
    const closed = trades.filter(t => t.status === 'TP' || t.status === 'SL' || t.status === 'BE');
    const wins   = closed.filter(t => (t.profit_loss || 0) > 0);
    const losses = closed.filter(t => (t.profit_loss || 0) < 0);
    const bes    = closed.filter(t => (t.profit_loss || 0) === 0);
    const pnl    = closed.reduce((a, t) => a + (t.profit_loss || 0), 0);
    const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
    const avgWin  = wins.length   ? wins.reduce((a,t)=>a+(t.profit_loss||0),0)  / wins.length  : 0;
    const avgLoss = losses.length ? Math.abs(losses.reduce((a,t)=>a+(t.profit_loss||0),0) / losses.length) : 0;
    const pf      = avgLoss > 0   ? (avgWin * wins.length) / (avgLoss * losses.length) : 0;
    const best    = Math.max(...closed.map(t => t.profit_loss || 0));
    const worst   = Math.min(...closed.map(t => t.profit_loss || 0));

    const sorted  = [...closed].sort((a,b) => new Date(a.open_date)-new Date(b.open_date));
    let running = 0;
    const equity = sorted.map(t => {
      running += (t.profit_loss || 0);
      return { d: fmtDate(t.open_date), v: Math.round(running) };
    });

    const byDay = {};
    sorted.forEach(t => {
      const d = t.open_date?.split('T')[0] || '';
      if (!byDay[d]) byDay[d] = 0;
      byDay[d] += (t.profit_loss || 0);
    });
    const dailyPnl = Object.entries(byDay).slice(-7).map(([d, v]) => ({
      d: new Date(d).toLocaleDateString('en-US',{weekday:'short'}),
      v: Math.round(v), w: v >= 0
    }));

    const sessionMap = {};
    closed.forEach(t => {
      const s = t.session || 'Other';
      if (!sessionMap[s]) sessionMap[s] = { s, tp:0, sl:0, be:0, pnl:0 };
      const pnlT = t.profit_loss || 0;
      if (pnlT > 0) sessionMap[s].tp++;
      else if (pnlT < 0) sessionMap[s].sl++;
      else sessionMap[s].be++;
      sessionMap[s].pnl += pnlT;
    });
    const sessionData = Object.values(sessionMap).sort((a,b)=>b.pnl-a.pnl);

    const pairMap = {};
    const COLORS = ['#06E6FF','#00F5D4','#FFD700','#B06EFF','#FF4DC4','#4D7CFF'];
    closed.forEach(t => {
      const p = t.symbol || 'Other';
      if (!pairMap[p]) pairMap[p] = { p, n:0, wins:0, pnl:0 };
      pairMap[p].n++;
      if ((t.profit_loss||0) > 0) pairMap[p].wins++;
      pairMap[p].pnl += (t.profit_loss||0);
    });
    const pairData = Object.values(pairMap)
      .sort((a,b)=>b.pnl-a.pnl).slice(0,6)
      .map((p,i) => ({ ...p, wr: Math.round((p.wins/p.n)*100), col: COLORS[i] }));

    const longs  = closed.filter(t => t.direction === 'Long');
    const shorts = closed.filter(t => t.direction === 'Short');
    const total  = closed.length || 1;
    const biaisData = [
      { name:'Bullish', value:Math.round((longs.length/total)*100),  color:'#00FF88', pnl: fmt(longs.reduce((a,t)=>a+(t.profit_loss||0),0)) },
      { name:'Bearish', value:Math.round((shorts.length/total)*100), color:'#FF3D57', pnl: fmt(shorts.reduce((a,t)=>a+(t.profit_loss||0),0)) },
    ].filter(b=>b.value>0);

    let peak = 0, dd = 0, runDd = 0;
    sorted.forEach(t => {
      runDd += (t.profit_loss||0);
      if (runDd > peak) peak = runDd;
      const cur = peak > 0 ? ((runDd-peak)/peak)*100 : 0;
      if (cur < dd) dd = cur;
    });

    let wStreak = 0, lStreak = 0, curW = 0, curL = 0;
    sorted.forEach(t => {
      if ((t.profit_loss||0) > 0) { curW++; curL=0; }
      else { curL++; curW=0; }
      if (curW > wStreak) wStreak = curW;
      if (curL > lStreak) lStreak = curL;
    });

    const heatmap = ['Mon','Tue','Wed','Thu','Fri'].map(day => {
      const h = {};
      ['8h','10h','12h','14h','16h'].forEach(hr => { h[hr] = 0; });
      return { day, h };
    });
    closed.forEach(t => {
      const d = new Date(t.open_date);
      const dayIdx = (d.getDay() + 6) % 7;
      if (dayIdx < 5) {
        const hr = d.getHours();
        const hrKey = hr < 9 ? '8h' : hr < 11 ? '10h' : hr < 13 ? '12h' : hr < 15 ? '14h' : '16h';
        heatmap[dayIdx].h[hrKey] = (heatmap[dayIdx].h[hrKey] || 0) + (t.profit_loss || 0);
      }
    });

    const radarData = [
      { m:'Win Rate',   v: Math.min(100, Math.round(winRate)) },
      { m:'Profit F.',  v: Math.min(100, Math.round(pf * 25)) },
      { m:'Risk/Rew.',  v: avgLoss > 0 ? Math.min(100, Math.round((avgWin/avgLoss)*30)) : 0 },
      { m:'Sharpe',     v: Math.min(100, Math.round(Math.abs(pnl / (avgLoss||1)) * 5)) },
      { m:'Discipline', v: Math.min(100, Math.round((1 - lStreak/10)*100)) },
      { m:'Consistency',v: closed.length >= 10 ? Math.min(100, Math.round(winRate)) : Math.round(closed.length * 10) },
    ];

    return {
      pnl:        Math.round(pnl),
      pnlPct:     Math.round((pnl/10000)*100*10)/10,
      winRate:    Math.round(winRate*10)/10,
      profitFactor: Math.round(pf*100)/100,
      avgRR:      avgLoss > 0 ? `1:${Math.round((avgWin/avgLoss)*10)/10}` : '—',
      sharpe:     0,
      maxDrawdown: Math.round(dd*10)/10,
      expectancy:  Math.round(pnl / (closed.length||1)),
      totalTrades: closed.length,
      wins:        wins.length,
      losses:      losses.length,
      breakevens:  bes.length,
      avgWin:      Math.round(avgWin),
      avgLoss:     Math.round(avgLoss),
      streakWin:   wStreak,
      streakLoss:  lStreak,
      bestTrade:   Math.round(best),
      worstTrade:  Math.round(worst),
      equityData:  equity,
      dailyPnl,
      sessionData,
      pairData,
      biaisData,
      radarData,
      heatmap,
      recentTrades: trades.slice(0, 6).map(t => ({
        id:      t.id,
        pair:    t.symbol,
        dir:     t.direction || 'Long',
        res:     t.status || 'TP',
        rr:      avgLoss > 0 ? Math.round(((t.profit_loss||0)/avgLoss)*10)/10 : 0,
        pnl:     Math.round(t.profit_loss || 0),
        date:    t.open_date?.split('T')[0] || '',
        session: t.session || '—',
      })),
    };
  }, [trades]);

  return (
    <TradingContext.Provider value={{
      trades, loading, stats,
      addTrade, importTrades, updateTrade, deleteTrade, fetchTrades,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTradingContext() {
  return useContext(TradingContext) || { trades:[], loading:false, stats:emptyStats(), addTrade:()=>null, importTrades:async()=>({ imported:0, skipped:0, trades:[] }), updateTrade:()=>null, deleteTrade:()=>null };
}

export function useTrades() {
  return useTradingContext();
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function emptyStats() {
  return {
    pnl:0, pnlPct:0, winRate:0, profitFactor:0, avgRR:'—', sharpe:0,
    maxDrawdown:0, expectancy:0, totalTrades:0, wins:0, losses:0, breakevens:0,
    avgWin:0, avgLoss:0, streakWin:0, streakLoss:0, bestTrade:0, worstTrade:0,
    equityData:[], dailyPnl:[], sessionData:[], pairData:[], biaisData:[],
    radarData:[], heatmap:[], recentTrades:[],
  };
}

function calcPnl(t) {
  const entry = Number(t.entry_price ?? t.entry ?? 0);
  const tp    = Number(t.exit_price  ?? t.exit  ?? t.tp ?? 0);
  const sl    = Number(t.stop_loss   ?? t.sl    ?? 0);
  const size  = Number(t.quantity    ?? t.size  ?? t.lots ?? 0);
  if (!entry || !size) return 0;
  const target = tp || sl;
  const dir    = t.direction || t.type || t.dir || 'Long';
  const diff   = dir === 'Long' ? target - entry : entry - target;
  return Math.round(diff * size * 100000 * 100) / 100;
}

function buildTradePayload(tradeData = {}, userId) {
  const pnl = tradeData.pnl != null && tradeData.pnl !== ''
    ? Number(tradeData.pnl)
    : tradeData.profit_loss != null && tradeData.profit_loss !== ''
      ? Number(tradeData.profit_loss)
      : calcPnl(tradeData);

  const symbol = tradeData.symbol || tradeData.pair || '';
  const direction = tradeData.direction || tradeData.type || tradeData.dir || 'Long';
  const entryPrice = Number(tradeData.entry_price ?? tradeData.entry ?? 0);
  const exitPrice  = Number(tradeData.exit_price  ?? tradeData.exit  ?? 0);
  const stopLoss   = Number(tradeData.stop_loss   ?? tradeData.sl    ?? 0);
  const qty        = Number(tradeData.quantity    ?? tradeData.size  ?? tradeData.lots ?? 0);
  const openDate   = tradeData.open_date || tradeData.date || new Date().toISOString().split('T')[0];

  return {
    user_id:            userId,
    symbol,
    direction,
    entry_price:        entryPrice,
    exit_price:         exitPrice,
    stop_loss:          stopLoss || null,
    quantity:           qty || null,
    profit_loss:        pnl,
    status:             pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE',
    open_date:          openDate,
    notes:              tradeData.notes || '',
    session:            tradeData.session || detectSession(),
    emotion_before:     tradeData.emotion_before  || '',
    emotion_during:     tradeData.emotion_during  || '',
    emotion_after:      tradeData.emotion_after   || '',
    psychological_tags: tradeData.psychological_tags || tradeData.tags || null,
    bias:               tradeData.bias        || null,
    setup:              tradeData.setup       || null,
    news_impact:        tradeData.newsImpact  || tradeData.news_impact || null,
    psychology_score:   tradeData.psychologyScore ?? tradeData.psychology_score ?? null,
    break_even:         tradeData.breakEven   ?? tradeData.break_even ?? null,
    trailing_stop:      tradeData.trailingStop ?? tradeData.trailing_stop ?? null,
    lots:               tradeData.lots        ?? null,
    commission:         tradeData.commission  ?? null,
    swap:               tradeData.swap        ?? null,
    market_type:        tradeData.marketType  || tradeData.market_type || null,
    time:               tradeData.time        || null,
    extra:              tradeData.extra && Object.keys(tradeData.extra).length ? tradeData.extra : null,
  };
}

function normalizeTradeRecord(trade = {}) {
  const pnl = finiteNumber(trade.profit_loss ?? trade.pnl ?? 0);
  const openDate = trade.open_date || trade.date || trade.entryDate || trade.createdAt || '';
  const direction = trade.direction || trade.type || trade.dir || 'Long';
  const entry = nullableNumber(trade.entry_price ?? trade.entry);
  const exit = nullableNumber(trade.exit_price ?? trade.exit);
  const stopLoss = nullableNumber(trade.stop_loss ?? trade.sl);
  const quantity = nullableNumber(trade.quantity ?? trade.size ?? trade.lots);
  const newsImpact = trade.news_impact || trade.newsImpact || '';
  const psychologyScore = trade.psychology_score ?? trade.psychologyScore ?? null;
  const breakEven = trade.break_even ?? trade.breakEven ?? null;
  const trailingStop = trade.trailing_stop ?? trade.trailingStop ?? null;
  const marketType = trade.market_type || trade.marketType || '';
  const extra = trade.extra && typeof trade.extra === 'object' ? trade.extra : {};
  const risk = entry && stopLoss ? Math.abs(entry - stopLoss) : 0;
  const reward = entry && exit ? Math.abs(exit - entry) : 0;
  const rr = risk > 0 ? reward / risk : 0;

  return {
    ...trade,
    symbol: trade.symbol || trade.pair || '',
    pair: trade.pair || trade.symbol || '',
    direction,
    type: direction,
    dir: direction,
    profit_loss: pnl,
    pnl,
    status: trade.status || (pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE'),
    open_date: openDate,
    date: openDate,
    entry_price: entry,
    entry,
    exit_price: exit,
    exit,
    stop_loss: stopLoss,
    sl: stopLoss,
    quantity,
    size: quantity,
    lots: trade.lots ?? quantity,
    market_type: marketType,
    marketType,
    news_impact: newsImpact,
    newsImpact,
    psychology_score: psychologyScore,
    psychologyScore,
    break_even: breakEven,
    breakEven,
    trailing_stop: trailingStop,
    trailingStop,
    durationMinutes: trade.duration_minutes ?? trade.durationMinutes ?? null,
    emotionBefore: trade.emotion_before || trade.emotionBefore || '',
    emotionDuring: trade.emotion_during || trade.emotionDuring || '',
    emotionAfter: trade.emotion_after || trade.emotionAfter || '',
    extra,
    metrics: {
      ...(trade.metrics || {}),
      rrReel: trade.metrics?.rrReel ?? (rr > 0 ? rr : 0),
    },
  };
}

function mapTradeUpdates(tradeData = {}) {
  const pnl = tradeData.pnl != null && tradeData.pnl !== ''
    ? Number(tradeData.pnl)
    : tradeData.profit_loss != null && tradeData.profit_loss !== ''
      ? Number(tradeData.profit_loss)
      : calcPnl(tradeData);

  const payload = {
    symbol:            tradeData.symbol || tradeData.pair || '',
    direction:         tradeData.direction || tradeData.type || tradeData.dir || 'Long',
    entry_price:       nullableNumber(tradeData.entry_price ?? tradeData.entry),
    exit_price:        nullableNumber(tradeData.exit_price ?? tradeData.exit),
    stop_loss:         nullableNumber(tradeData.stop_loss ?? tradeData.sl),
    quantity:          nullableNumber(tradeData.quantity ?? tradeData.size ?? tradeData.lots),
    profit_loss:       pnl,
    status:            pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE',
    open_date:         tradeData.open_date || tradeData.date || new Date().toISOString().split('T')[0],
    notes:             tradeData.notes || '',
    session:           tradeData.session || detectSession(),
    emotion_before:    tradeData.emotion_before || '',
    emotion_during:    tradeData.emotion_during || '',
    emotion_after:     tradeData.emotion_after || '',
    psychological_tags: tradeData.psychological_tags || tradeData.tags || null,
    bias:              tradeData.bias || null,
    setup:             tradeData.setup || null,
    news_impact:       tradeData.newsImpact || tradeData.news_impact || null,
    psychology_score:  tradeData.psychologyScore ?? tradeData.psychology_score ?? null,
    break_even:        tradeData.breakEven ?? tradeData.break_even ?? null,
    trailing_stop:     tradeData.trailingStop ?? tradeData.trailing_stop ?? null,
    lots:              tradeData.lots ?? null,
    commission:        tradeData.commission ?? null,
    swap:              tradeData.swap ?? null,
    market_type:       tradeData.marketType || tradeData.market_type || null,
    time:              tradeData.time || null,
    extra:             tradeData.extra && Object.keys(tradeData.extra).length ? tradeData.extra : null,
  };

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function nullableNumber(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number !== 0 ? number : null;
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function detectSession() {
  const h = new Date().getUTCHours();
  if (h >= 22 || h < 7)  return 'Asia';
  if (h >= 7  && h < 12) return 'London';
  if (h >= 12 && h < 21) return 'NY';
  return 'NY';
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function fmt(n) {
  return (n >= 0 ? '+' : '') + '$' + Math.abs(Math.round(n)).toLocaleString();
}
