import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const TradingContext = createContext(null);

export function TradingProvider({ children }) {
  const [trades,  setTrades]  = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les trades depuis Supabase
  const fetchTrades = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) { setTrades([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', session.user.id)
      .order('open_date', { ascending: false });
    if (!error) setTrades(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  // Ajouter un trade
  const addTrade = useCallback(async (tradeData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    const pnl = tradeData.pnl != null
      ? Number(tradeData.pnl)
      : calcPnl(tradeData);
    const { data, error } = await supabase.from('trades').insert([{
      user_id:          session.user.id,
      symbol:           tradeData.pair   || tradeData.symbol || '',
      direction:        tradeData.dir    || tradeData.direction || 'Long',
      entry_price:      Number(tradeData.entry)  || 0,
      exit_price:       Number(tradeData.tp)     || 0,
      stop_loss:        Number(tradeData.sl)      || 0,
      quantity:         Number(tradeData.size)    || 0,
      profit_loss:      pnl,
      status:           pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE',
      open_date:        tradeData.date   || new Date().toISOString().split('T')[0],
      notes:            tradeData.notes  || '',
      session:          tradeData.session || detectSession(),
      emotion_before:   tradeData.emotion_before  || '',
      emotion_during:   tradeData.emotion_during  || '',
      emotion_after:    tradeData.emotion_after   || '',
      psychological_tags: tradeData.tags || null,
    }]).select().single();
    if (!error && data) {
      setTrades(prev => [data, ...prev]);
      return data;
    }
    return null;
  }, []);

  // Modifier un trade
  const updateTrade = useCallback(async (id, updates) => {
    const { data, error } = await supabase
      .from('trades').update(updates).eq('id', id).select().single();
    if (!error && data) {
      setTrades(prev => prev.map(t => t.id === id ? data : t));
      return data;
    }
    return null;
  }, []);

  // Supprimer un trade
  const deleteTrade = useCallback(async (id) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) setTrades(prev => prev.filter(t => t.id !== id));
    return !error;
  }, []);

  // Stats calculées depuis les vrais trades
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

    // Equity curve
    const sorted  = [...closed].sort((a,b) => new Date(a.open_date)-new Date(b.open_date));
    let running = 0;
    const equity = sorted.map(t => {
      running += (t.profit_loss || 0);
      return { d: fmtDate(t.open_date), v: Math.round(running) };
    });

    // Daily PnL (7 derniers jours)
    const byDay = {};
    sorted.forEach(t => {
      const d = t.open_date?.split('T')[0] || '';
      if (!byDay[d]) byDay[d] = 0;
      byDay[d] += (t.profit_loss || 0);
    });
    const dailyPnl = Object.entries(byDay).slice(-7).map(([d, v]) => ({
      d: new Date(d).toLocaleDateString('fr-FR',{weekday:'short'}),
      v: Math.round(v), w: v >= 0
    }));

    // Sessions
    const sessionMap = {};
    closed.forEach(t => {
      const s = t.session || 'Autre';
      if (!sessionMap[s]) sessionMap[s] = { s, tp:0, sl:0, be:0, pnl:0 };
      const pnlT = t.profit_loss || 0;
      if (pnlT > 0) sessionMap[s].tp++;
      else if (pnlT < 0) sessionMap[s].sl++;
      else sessionMap[s].be++;
      sessionMap[s].pnl += pnlT;
    });
    const sessionData = Object.values(sessionMap).sort((a,b)=>b.pnl-a.pnl);

    // Pairs
    const pairMap = {};
    const COLORS = ['#06E6FF','#00F5D4','#FFD700','#B06EFF','#FF4DC4','#4D7CFF'];
    closed.forEach(t => {
      const p = t.symbol || 'Autre';
      if (!pairMap[p]) pairMap[p] = { p, n:0, wins:0, pnl:0 };
      pairMap[p].n++;
      if ((t.profit_loss||0) > 0) pairMap[p].wins++;
      pairMap[p].pnl += (t.profit_loss||0);
    });
    const pairData = Object.values(pairMap)
      .sort((a,b)=>b.pnl-a.pnl).slice(0,6)
      .map((p,i) => ({ ...p, wr: Math.round((p.wins/p.n)*100), col: COLORS[i] }));

    // Biais
    const longs  = closed.filter(t => t.direction === 'Long');
    const shorts = closed.filter(t => t.direction === 'Short');
    const total  = closed.length || 1;
    const biaisData = [
      { name:'Bullish', value:Math.round((longs.length/total)*100),  color:'#00FF88', pnl: fmt(longs.reduce((a,t)=>a+(t.profit_loss||0),0)) },
      { name:'Bearish', value:Math.round((shorts.length/total)*100), color:'#FF3D57', pnl: fmt(shorts.reduce((a,t)=>a+(t.profit_loss||0),0)) },
    ].filter(b=>b.value>0);

    // Drawdown
    let peak = 0, dd = 0, runDd = 0;
    sorted.forEach(t => {
      runDd += (t.profit_loss||0);
      if (runDd > peak) peak = runDd;
      const cur = peak > 0 ? ((runDd-peak)/peak)*100 : 0;
      if (cur < dd) dd = cur;
    });

    // Streaks
    let wStreak = 0, lStreak = 0, curW = 0, curL = 0;
    sorted.forEach(t => {
      if ((t.profit_loss||0) > 0) { curW++; curL=0; }
      else { curL++; curW=0; }
      if (curW > wStreak) wStreak = curW;
      if (curL > lStreak) lStreak = curL;
    });

    // Heatmap horaire
    const heatmap = ['Lun','Mar','Mer','Jeu','Ven'].map(day => {
      const h = {};
      ['8h','10h','12h','14h','16h'].forEach(hr => { h[hr] = 0; });
      return { day, h };
    });
    closed.forEach(t => {
      const d = new Date(t.open_date);
      const dayIdx = (d.getDay() + 6) % 7; // Lun=0
      if (dayIdx < 5) {
        const hr = d.getHours();
        const hrKey = hr < 9 ? '8h' : hr < 11 ? '10h' : hr < 13 ? '12h' : hr < 15 ? '14h' : '16h';
        heatmap[dayIdx].h[hrKey] = (heatmap[dayIdx].h[hrKey] || 0) + (t.profit_loss || 0);
      }
    });

    // Radar
    const radarData = [
      { m:'Win Rate',   v: Math.min(100, Math.round(winRate)) },
      { m:'Profit F.',  v: Math.min(100, Math.round(pf * 25)) },
      { m:'Risk/Rew.',  v: avgLoss > 0 ? Math.min(100, Math.round((avgWin/avgLoss)*30)) : 0 },
      { m:'Sharpe',     v: Math.min(100, Math.round(Math.abs(pnl / (avgLoss||1)) * 5)) },
      { m:'Discipline', v: Math.min(100, Math.round((1 - lStreak/10)*100)) },
      { m:'Constance',  v: closed.length >= 10 ? Math.min(100, Math.round(winRate)) : Math.round(closed.length * 10) },
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
      addTrade, updateTrade, deleteTrade, fetchTrades,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTradingContext() {
  return useContext(TradingContext) || { trades:[], loading:false, stats:emptyStats(), addTrade:()=>null, updateTrade:()=>null, deleteTrade:()=>null };
}

// Alias pour compatibilité
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
  const entry = Number(t.entry) || 0;
  const tp    = Number(t.tp)    || 0;
  const sl    = Number(t.sl)    || 0;
  const size  = Number(t.size)  || 0;
  if (!entry || !size) return 0;
  const target = tp || sl;
  const diff   = t.dir === 'Long' ? target - entry : entry - target;
  return Math.round(diff * size * 100000 * 100) / 100;
}

function detectSession() {
  const h = new Date().getUTCHours();
  if (h >= 22 || h < 7)  return 'Asie';
  if (h >= 7  && h < 12) return 'Londres';
  if (h >= 12 && h < 21) return 'New-York';
  return 'Autre';
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('fr-FR',{month:'short',day:'numeric'});
}

function fmt(n) {
  return (n >= 0 ? '+' : '') + '$' + Math.abs(Math.round(n)).toLocaleString();
}