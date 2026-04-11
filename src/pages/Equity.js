/*
╔══════════════════════════════════════════════════════════════════════════════╗
║  📈 MARKETFLOW — EQUITY  v1.0                                                ║
║  ✦ Data: useTradingContext() → all trades (t.pnl / t.date)                  ║
║  ✦ Equity curve per trade + per month + per year                             ║
║  ✦ Drawdown depth / duration / recovery                                      ║
║  ✦ Advanced statistics: Sharpe · Sortino · Calmar · Kelly                   ║
║  ✦ Monthly P&L Heatmap                                                       ║
║  ✦ Monte Carlo 1,000 runs with confidence bands                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';

// ══════════════════════════════════════════════════════
// 🎨 DESIGN SYSTEM — same MarketFlow DA
// ══════════════════════════════════════════════════════
const C = {
  bg:      'var(--mf-bg,#030508)',
  bgCard:  'var(--mf-card,#0C1422)',
  bgHigh:  'var(--mf-high,#121C2E)',
  bgDeep:  'var(--mf-deep,#07090F)',
  cyan:    'var(--mf-accent,#06E6FF)', cyanGlow:   'rgba(var(--mf-accent-rgb, 6, 230, 255),0.35)',
  teal:    'var(--mf-teal,#00F5D4)', tealGlow:   'rgba(var(--mf-teal-rgb, 0, 245, 212),0.3)',
  green:   'var(--mf-green,#00FF88)', greenGlow:  'rgba(var(--mf-green-rgb, 0, 255, 136),0.35)',
  danger:  'var(--mf-danger,#FF3D57)', dangerGlow: 'rgba(var(--mf-danger-rgb, 255, 61, 87),0.35)',
  warn:    'var(--mf-warn,#FFB31A)', warnGlow:   'rgba(var(--mf-warn-rgb, 255, 179, 26),0.35)',
  orange:  'var(--mf-orange,#FF6B35)',
  purple:  'var(--mf-purple,#A78BFA)', purpleGlow: 'rgba(var(--mf-purple-rgb, 176, 110, 255),0.35)',
  blue:    'var(--mf-blue,#4D7CFF)', blueGlow:   'rgba(var(--mf-blue-rgb, 77, 124, 255),0.3)',
  pink:    'var(--mf-pink,#FB7185)',
  gold:    'var(--mf-gold,#FFD700)', goldGlow:   'rgba(var(--mf-gold-rgb, 255, 215, 0),0.3)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)', t4: 'var(--mf-text-4,#1E2E45)',
  brd: 'var(--mf-border,#162034)', brdHi: 'var(--mf-border-hi,#1E2E48)',
  gradCyan:   'linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88))',
  gradPurple: 'linear-gradient(135deg,var(--mf-purple,#A78BFA),var(--mf-blue,#4D7CFF))',
  gradWarm:   'linear-gradient(135deg,var(--mf-warn,#FFB31A),var(--mf-orange,#FF6B35))',
  gradDanger: 'linear-gradient(135deg,var(--mf-danger,#FF3D57),var(--mf-orange,#FF6B35))',
  gradGold:   'linear-gradient(135deg,var(--mf-gold,#FFD700),var(--mf-gold,#FFB31A))',
};

const NOISE = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")';

const fadeUp = {
  hidden:  { opacity: 0, y: 22, scale: 0.97 },
  visible: (i = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.05, duration: 0.55, ease: [0.16, 1, 0.3, 1] } }),
};

const GlassCard = ({ children, style = {}, glow = null, hover = true, custom = 0, onClick, ...p }) => (
  <motion.div
    variants={fadeUp} initial="hidden" animate="visible" custom={custom}
    whileHover={hover ? { y: -2, scale: 1.003 } : {}} onClick={onClick}
    style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(145deg,rgba(15,24,44,0.93),rgba(10,16,32,0.97))',
      backdropFilter: 'blur(20px) saturate(1.4)', borderRadius: 20,
      border: `1px solid ${glow ? shade(glow,'28') : C.brd}`,
      boxShadow: `0 4px 40px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04)${glow ? `,0 0 55px ${shade(glow,'08')}` : ''}`,
      cursor: onClick ? 'pointer' : 'default', ...style,
    }} {...p}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: NOISE, backgroundSize: '128px', pointerEvents: 'none', zIndex: 0 }} />
    <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
  </motion.div>
);

const ST = ({ children, sub, color = C.cyan, icon, mb = 16 }) => (
  <div style={{ marginBottom: mb }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ fontSize: 15, filter: `drop-shadow(0 0 8px ${color})` }}>{icon}</span>}
      <div style={{ width: 3, height: 16, background: `linear-gradient(180deg,${color},${shade(color,'50')})`, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 800, color: C.t1, letterSpacing: '-0.3px' }}>{children}</span>
    </div>
    {sub && <p style={{ margin: '3px 0 0', fontSize: 9, color: C.t3, paddingLeft: icon ? 31 : 11 }}>{sub}</p>}
  </div>
);

// ══════════════════════════════════════════════════════
// 🧮 STATISTICAL CALCULATIONS
// ══════════════════════════════════════════════════════
function buildEquityStats(trades) {
  if (!trades?.length) return null;

  // Normalize & sort by date
  const sorted = [...trades]
    .map(t => ({
      ...t,
      _pnl:  parseFloat(t.pnl  || 0),
      _rr:   parseFloat(t.metrics?.rrReel || t.rr || 0),
      _date: t.date || '',
      _win:  t.win === true || parseFloat(t.pnl || 0) > 0,
    }))
    .filter(t => t._date)
    .sort((a, b) => a._date.localeCompare(b._date));

  const n     = sorted.length;
  const wins  = sorted.filter(t => t._win);
  const losses = sorted.filter(t => !t._win && t._pnl <= 0);
  const bes   = sorted.filter(t => !t._win && t._pnl === 0);

  // Global P&L
  const totalPnL   = parseFloat(sorted.reduce((s, t) => s + t._pnl, 0).toFixed(2));
  const grossW     = wins.reduce((s, t) => s + t._pnl, 0);
  const grossL     = Math.abs(losses.reduce((s, t) => s + t._pnl, 0));
  const pf         = grossL > 0 ? parseFloat((grossW / grossL).toFixed(2)) : 9.99;
  const avgWin     = wins.length   ? parseFloat((grossW / wins.length).toFixed(2))   : 0;
  const avgLoss    = losses.length ? parseFloat((grossL / losses.length).toFixed(2)) : 1;
  const wr         = Math.round(wins.length / n * 100);

  // Equity curve + drawdown
  let bal = 0, peak = 0, maxDD = 0, maxDDStart = 0, maxDDEnd = 0;
  let inDD = false, ddStartIdx = 0;
  const equity = [];
  const ddSeries = [];
  const ddPeriods = [];

  sorted.forEach((t, i) => {
    bal += t._pnl;
    equity.push({ i: i + 1, v: parseFloat(bal.toFixed(2)), pnl: t._pnl, date: t._date, win: t._win, symbol: t.symbol || '' });
    const curPeak = equity.reduce((m, e) => Math.max(m, e.v), 0);
    const dd = Math.min(0, bal - curPeak);
    ddSeries.push({ i: i + 1, v: parseFloat(dd.toFixed(2)) });
    if (bal > peak) {
      if (inDD) { ddPeriods.push({ start: ddStartIdx, end: i, depth: parseFloat((peak - bal + t._pnl).toFixed(2)), dur: i - ddStartIdx }); inDD = false; }
      peak = bal;
    } else {
      const curDD = peak - bal;
      if (!inDD && curDD > 0) { inDD = true; ddStartIdx = i; }
      if (curDD > maxDD) { maxDD = curDD; maxDDStart = ddStartIdx; maxDDEnd = i; }
    }
  });
  if (inDD) ddPeriods.push({ start: ddStartIdx, end: n - 1, depth: parseFloat((peak - bal).toFixed(2)), dur: n - 1 - ddStartIdx });

  const maxDDDur  = Math.max(0, ...ddPeriods.map(d => d.dur));
  const worstDD   = [...ddPeriods].sort((a, b) => b.depth - a.depth).slice(0, 5);

  // Volatility / Sharpe / Sortino / Calmar
  const rets  = sorted.map(t => t._pnl);
  const mean  = totalPnL / n;
  const variance = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const std   = Math.sqrt(variance) || 0.001;
  const negRets = rets.filter(r => r < 0);
  const semiVar = negRets.length ? negRets.reduce((s, v) => s + v * v, 0) / n : 0.001;
  const semiStd = Math.sqrt(semiVar) || 0.001;
  const sharpe  = parseFloat(((mean / std)    * Math.sqrt(252)).toFixed(2));
  const sortino = parseFloat(((mean / semiStd) * Math.sqrt(252)).toFixed(2));
  const calmar  = maxDD > 0 ? parseFloat((totalPnL / maxDD).toFixed(2)) : 9.99;
  const kelly   = parseFloat(((wins.length / n - losses.length / n / Math.max(0.01, avgWin / Math.max(0.01, avgLoss))) * 100).toFixed(1));
  const exp     = parseFloat(((wins.length / n * avgWin) - (losses.length / n * avgLoss)).toFixed(2));

  // Streaks
  let cW = 0, cL = 0, mW = 0, mL = 0;
  sorted.forEach(t => { if (t._win) { cW++; cL = 0; if (cW > mW) mW = cW; } else { cL++; cW = 0; if (cL > mL) mL = cL; } });

  // Per month
  const byMonth = {};
  sorted.forEach(t => {
    const key = t._date.substring(0, 7);
    if (!byMonth[key]) byMonth[key] = { pnl: 0, n: 0, wins: 0 };
    byMonth[key].pnl  += t._pnl;
    byMonth[key].n    += 1;
    if (t._win) byMonth[key].wins++;
  });
  const monthlyData = Object.entries(byMonth).sort().map(([m, d]) => ({
    month: m,
    pnl:   parseFloat(d.pnl.toFixed(2)),
    n:     d.n,
    wr:    Math.round(d.wins / d.n * 100),
  }));

  // Per year
  const byYear = {};
  sorted.forEach(t => {
    const y = t._date.substring(0, 4);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(t);
  });
  const yearStats = Object.entries(byYear).sort().map(([y, ts]) => {
    const yw  = ts.filter(t => t._win);
    const yl  = ts.filter(t => !t._win && t._pnl < 0);
    const ytot = parseFloat(ts.reduce((s, t) => s + t._pnl, 0).toFixed(2));
    const ygW  = yw.reduce((s, t) => s + t._pnl, 0);
    const ygL  = Math.abs(yl.reduce((s, t) => s + t._pnl, 0));
    let ybal = 0, ypeak = 0, ymaxDD = 0;
    ts.forEach(t => { ybal += t._pnl; if (ybal > ypeak) ypeak = ybal; const d = ypeak - ybal; if (d > ymaxDD) ymaxDD = d; });
    // mini equity per month in the year
    const ym = {};
    ts.forEach(t => { const k = t._date.substring(5, 7); if (!ym[k]) ym[k] = 0; ym[k] += t._pnl; });
    const mCurve = Object.entries(ym).sort().map(([m, v]) => ({ m, v: parseFloat(v.toFixed(2)) }));
    let cw = 0, cl = 0, mwY = 0, mlY = 0;
    ts.forEach(t => { if (t._win) { cw++; cl = 0; if (cw > mwY) mwY = cw; } else { cl++; cw = 0; if (cl > mlY) mlY = cl; } });
    return {
      year: y, n: ts.length, wins: yw.length, losses: yl.length,
      totalPnL: ytot, pf: ygL > 0 ? parseFloat((ygW / ygL).toFixed(2)) : 9.99,
      wr: Math.round(yw.length / ts.length * 100),
      avgPnL: parseFloat((ytot / ts.length).toFixed(2)),
      maxDD: parseFloat(ymaxDD.toFixed(2)),
      mW: mwY, mL: mlY, mCurve,
    };
  });

  // Available years
  const years = yearStats.map(y => y.year);

  // Dates
  const dates = sorted.map(t => t._date);
  const yrs   = Math.max(0.1, parseFloat(((new Date(dates[dates.length - 1]) - new Date(dates[0])) / (365.25 * 86400000)).toFixed(1)));

  // Monte Carlo factory
  function runMonteCarlo(nRuns = 1000) {
    const results = [];
    for (let r = 0; r < nRuns; r++) {
      const shuffled = [...rets].sort(() => Math.random() - 0.5);
      let b = 0, p = 0, dd = 0;
      const curve = shuffled.map(v => { b += v; if (b > p) p = b; const d = p - b; if (d > dd) dd = d; return parseFloat(b.toFixed(2)); });
      results.push({ final: parseFloat(b.toFixed(2)), maxDD: parseFloat(dd.toFixed(2)), curve });
    }
    results.sort((a, b) => a.final - b.final);
    const idx = p => Math.max(0, Math.min(nRuns - 1, Math.floor(p * nRuns)));
    const curveLen = rets.length;
    const ptiles = [0.05, 0.25, 0.50, 0.75, 0.95];
    const bands = ptiles.map(p => Array.from({ length: curveLen }, (_, i) => {
      const vals = results.map(r => r.curve[i]).sort((a, b) => a - b);
      return parseFloat(vals[idx(p)].toFixed(2));
    }));
    const mcCurve = Array.from({ length: curveLen }, (_, i) => ({
      i: i + 1,
      p5:     bands[0][i],
      p25:    bands[1][i],
      p50:    bands[2][i],
      p75:    bands[3][i],
      p95:    bands[4][i],
      actual: equity[i].v,
    }));
    const finals = results.map(r => r.final);
    const dds    = results.map(r => r.maxDD).sort((a, b) => a - b);
    return {
      mcCurve,
      p5:   parseFloat(finals[idx(0.05)].toFixed(2)),
      p25:  parseFloat(finals[idx(0.25)].toFixed(2)),
      p50:  parseFloat(finals[idx(0.50)].toFixed(2)),
      p75:  parseFloat(finals[idx(0.75)].toFixed(2)),
      p95:  parseFloat(finals[idx(0.95)].toFixed(2)),
      ddP50: parseFloat(dds[idx(0.50)].toFixed(2)),
      ddP95: parseFloat(dds[idx(0.95)].toFixed(2)),
      pctPos: Math.round(finals.filter(v => v > 0).length / nRuns * 100),
    };
  }

  return {
    n, wins: wins.length, losses: losses.length, bes: bes.length,
    totalPnL, grossW: parseFloat(grossW.toFixed(2)), grossL: parseFloat(grossL.toFixed(2)),
    pf, avgWin, avgLoss, wr, mean: parseFloat(mean.toFixed(2)),
    std: parseFloat(std.toFixed(2)), sharpe, sortino, calmar, kelly, exp,
    maxDD: parseFloat(maxDD.toFixed(2)), maxDDDur, worstDD, ddPeriods,
    mW, mL, equity, ddSeries, monthlyData, yearStats, years, yrs, runMonteCarlo,
  };
}

// ══════════════════════════════════════════════════════
// 🧩 KPI BADGE
// ══════════════════════════════════════════════════════
const KpiBadge = ({ label, value, sub, color, icon, custom = 0 }) => (
  <GlassCard custom={custom} glow={color} hover={false} style={{ padding: '18px 16px', position: 'relative', minHeight: 96 }}>
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `radial-gradient(circle,${shade(color,'20')},transparent 70%)`, filter: 'blur(14px)', pointerEvents: 'none' }} />
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${shade(color,'60')},transparent)` }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 7.5, fontWeight: 800, color: C.t3, letterSpacing: '1.4px', textTransform: 'uppercase' }}>{label}</span>
      <motion.span animate={{ scale: [1, 1.13, 1] }} transition={{ duration: 3.5, repeat: Infinity, delay: custom * 0.22 }}
        style={{ fontSize: 17, filter: `drop-shadow(0 0 7px ${color})` }}>{icon}</motion.span>
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: 'monospace', color, lineHeight: 1, marginBottom: 4, textShadow: `0 0 22px ${shade(color,'40')}` }}>{value}</div>
    {sub && <div style={{ fontSize: 8.5, color: C.t2, lineHeight: 1.5 }}>{sub}</div>}
    <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2.5, repeat: Infinity, delay: custom * 0.15 }}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${shade(color,'60')},transparent)` }} />
  </GlassCard>
);

// ══════════════════════════════════════════════════════
// 📈 MAIN EQUITY CURVE
// ══════════════════════════════════════════════════════
const EquityCurve = ({ s }) => {
  const [view, setView] = useState('all');

  const data = useMemo(() => {
    if (view === 'all') return s.equity;
    // filter by year
    let bal = 0;
    return s.equity.filter(e => e.date.startsWith(view)).map((e, i) => ({ ...e, i: i + 1, v: parseFloat((bal += e.pnl).toFixed(2)) }));
  }, [view, s.equity]);

  const last    = data[data.length - 1]?.v || 0;
  const col     = last >= 0 ? C.green : C.danger;
  const minV    = Math.min(0, ...data.map(d => d.v));
  const maxV    = Math.max(...data.map(d => d.v));

  // Annotate win/loss runs
  const annotations = [];
  let streak = 0, streakType = null, streakStart = 0;
  data.forEach((d, i) => {
    const t = d.pnl > 0 ? 'W' : d.pnl < 0 ? 'L' : 'B';
    if (t !== streakType) { if (streak >= 4) annotations.push({ i: streakStart + Math.floor(streak / 2), v: data[streakStart + Math.floor(streak / 2)]?.v, label: `${streak}× ${streakType}` }); streak = 1; streakType = t; streakStart = i; }
    else streak++;
  });

  return (
    <GlassCard hover={false} glow={col} style={{ padding: '24px 22px' }} custom={0}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <ST icon="📈" color={col} mb={0}>
          Equity Curve{view === 'all' ? ` · Global (${data.length} trades)` : ` · ${view}`}
        </ST>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {['all', ...s.years].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${view === v ? col : C.brd}`, background: view === v ? `${shade(col,'18')}` : 'transparent', color: view === v ? col : C.t3, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {v === 'all' ? 'Global' : v}
            </button>
          ))}
        </div>
      </div>

      {/* Quick inline stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { l: 'Total P&L', v: `${last >= 0 ? '+' : ''}${last}`, c: col },
          { l: 'Trades', v: data.length, c: C.t2 },
          { l: 'Best', v: `+${Math.max(...data.map(d => d.pnl)).toFixed(2)}`, c: C.green },
          { l: 'Worst', v: `${Math.min(...data.map(d => d.pnl)).toFixed(2)}`, c: C.danger },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 7, color: C.t4, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 900, fontFamily: 'monospace', color: c }}>{v}</div>
          </div>
        ))}
      </div>


      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity={0.38} />
              <stop offset="100%" stopColor={col} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="eqLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor={C.cyan} />
              <stop offset="45%"  stopColor={C.green} />
              <stop offset="100%" stopColor={C.purple} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="5 5" vertical={false} />
          <XAxis dataKey="i" tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} interval={Math.floor(data.length / 10)} />
          <YAxis tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} tickFormatter={v => `${v >= 0 ? '+' : ''}${v}`} width={42} domain={[minV * 1.05, maxV * 1.05]} />
          <Tooltip
            contentStyle={{ background: C.bgHigh, border: `1px solid ${C.brdHi}`, borderRadius: 12, fontSize: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.85)' }}
            formatter={(v, _, p) => [<span style={{ color: p.payload.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontWeight: 900 }}>{v >= 0 ? '+' : ''}{v}</span>, 'Equity']}
            labelFormatter={(_, p) => {
              const d = p?.[0]?.payload;
              return d ? <span style={{ color: C.t2, fontSize: 9 }}>Trade #{d.i} · {d.date} · {d.symbol} · <span style={{ color: d.win ? C.green : C.danger }}>{d.win ? 'WIN' : 'LOSS'}</span></span> : '';
            }}
          />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.18)" strokeDasharray="5 4" strokeWidth={1.5} />
          <Area type="monotone" dataKey="v" stroke="url(#eqLine)" strokeWidth={2.5} fill="url(#eqFill)" dot={false} activeDot={{ r: 6, fill: col, stroke: '#fff', strokeWidth: 2, filter: 'url(#glow)' }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
        {[{ c: C.green, l: 'Winning trade' }, { c: C.danger, l: 'Losing trade' }].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: `${shade(c,'40')}`, border: `1px solid ${c}` }} />
            <span style={{ fontSize: 8, color: C.t3 }}>{l}</span>
          </div>
        ))}
        <span style={{ fontSize: 8, color: C.t4, marginLeft: 'auto' }}>Hover = trade details</span>
      </div>
    </GlassCard>
  );
};

// ══════════════════════════════════════════════════════
// 📉 DRAWDOWN CHART
// ══════════════════════════════════════════════════════
const DrawdownChart = ({ s }) => (
  <GlassCard hover={false} glow={C.danger} style={{ padding: '24px 22px' }} custom={1}>
    <ST icon="📉" color={C.danger} mb={14}>Drawdown Analysis</ST>

    {/* Summary KPIs */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
      {[
        { l: 'Max DD', v: `-${s.maxDD.toFixed(2)}`, c: C.danger },
        { l: 'Max duration', v: `${s.maxDDDur} trades`, c: C.warn },
        { l: 'Nb periods', v: s.ddPeriods.length, c: C.t2 },
        { l: '% trades in DD', v: `${Math.round(s.ddSeries.filter(d => d.v < 0).length / s.n * 100)}%`, c: C.orange },
      ].map(({ l, v, c }) => (
        <div key={l} style={{ padding: '8px 10px', borderRadius: 10, background: `${shade(c,'0A')}`, border: `1px solid ${shade(c,'20')}`, textAlign: 'center' }}>
          <div style={{ fontSize: 7, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, fontWeight: 700 }}>{l}</div>
          <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', color: c }}>{v}</div>
        </div>
      ))}
    </div>

    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={s.ddSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.danger} stopOpacity={0.6} />
            <stop offset="100%" stopColor={C.danger} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="5 5" vertical={false} />
        <XAxis dataKey="i" tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} interval={Math.floor(s.n / 8)} />
        <YAxis tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}`} width={38} />
        <Tooltip contentStyle={{ background: C.bgHigh, border: `1px solid ${C.brdHi}`, borderRadius: 10, fontSize: 10 }}
          formatter={v => [<span style={{ color: C.danger, fontFamily: 'monospace', fontWeight: 900 }}>{v}</span>, 'Drawdown']} />
        <ReferenceLine y={-s.maxDD} stroke={C.danger} strokeDasharray="6 3" strokeWidth={1.5} label={{ value: `Max -${s.maxDD.toFixed(2)}`, fill: C.danger, fontSize: 8, position: 'insideTopRight' }} />
        <Area type="monotone" dataKey="v" stroke={C.danger} strokeWidth={2} fill="url(#ddFill)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>

    {/* Top 5 worst drawdowns */}
    {s.worstDD.length > 0 && (
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 8, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Top 5 — Deepest Drawdowns</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {s.worstDD.map((d, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '22px 1fr 56px 64px', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 9, background: 'rgba(var(--mf-danger-rgb, 255, 61, 87),0.06)', border: '1px solid rgba(var(--mf-danger-rgb, 255, 61, 87),0.15)' }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: C.danger }}>#{i + 1}</span>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, d.depth / s.maxDD * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.08 }}
                  style={{ height: '100%', background: C.gradDanger, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 9.5, fontFamily: 'monospace', color: C.danger, fontWeight: 800, textAlign: 'right' }}>-{d.depth.toFixed(2)}</span>
              <span style={{ fontSize: 8, color: C.t3, textAlign: 'right' }}>{d.dur} trades</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </GlassCard>
);

// ══════════════════════════════════════════════════════
// 🔬 ADVANCED STATISTICS
// ══════════════════════════════════════════════════════
const AdvancedStats = ({ s }) => {
  const groups = [
    {
      label: 'Returns', color: C.green, icon: '💹',
      items: [
        { l: 'Total P&L',   v: `${s.totalPnL >= 0 ? '+' : ''}${s.totalPnL.toFixed(2)}`,   c: s.totalPnL >= 0 ? C.green : C.danger, desc: 'Sum of all P&L' },
        { l: 'Avg / trade', v: `${s.mean >= 0 ? '+' : ''}${s.mean.toFixed(2)}`,            c: s.mean >= 0 ? C.green : C.warn,       desc: 'Average P&L per trade' },
        { l: 'Expectancy',  v: `${s.exp >= 0 ? '+' : ''}${s.exp.toFixed(2)}`,              c: s.exp >= 0 ? C.green : C.danger,      desc: 'Statistical expected gain' },
        { l: 'Profit Factor', v: s.pf,                                                      c: s.pf >= 2 ? C.green : s.pf >= 1.3 ? C.cyan : s.pf >= 1 ? C.warn : C.danger, desc: 'Gross gains / gross losses' },
      ],
    },
    {
      label: 'Risk-Adjusted', color: C.blue, icon: '📐',
      items: [
        { l: 'Sharpe',  v: s.sharpe,  c: s.sharpe  >= 2 ? C.green : s.sharpe  >= 1 ? C.cyan : C.warn, desc: 'Ret. / total vol · ×√252' },
        { l: 'Sortino', v: s.sortino, c: s.sortino >= 2 ? C.green : s.sortino >= 1 ? C.cyan : C.warn, desc: 'Ret. / negative vol · ×√252' },
        { l: 'Calmar',  v: s.calmar,  c: s.calmar  >= 2 ? C.green : s.calmar  >= 1 ? C.cyan : C.warn, desc: 'Total P&L / Max Drawdown' },
        { l: 'Kelly %', v: `${s.kelly}%`,                                                              c: s.kelly >= 25 ? C.danger : s.kelly >= 10 ? C.green : C.warn, desc: 'Optimal position size' },
      ],
    },
    {
      label: 'Win / Loss', color: C.purple, icon: '🏆',
      items: [
        { l: 'Win Rate',     v: `${s.wr}%`,                                                            c: s.wr >= 60 ? C.green : s.wr >= 50 ? C.warn : C.danger, desc: `${s.wins}W · ${s.losses}L · ${shade(s.bes,'BE')}` },
        { l: 'Avg Win',      v: `+${s.avgWin.toFixed(2)}`,                                             c: C.green,   desc: 'Average gains' },
        { l: 'Avg Loss',     v: `-${s.avgLoss.toFixed(2)}`,                                            c: C.danger,  desc: 'Average losses' },
        { l: 'Ratio W/L',    v: parseFloat((s.avgWin / Math.max(0.01, s.avgLoss)).toFixed(2)),         c: s.avgWin / s.avgLoss >= 2 ? C.green : C.warn, desc: 'Avg gain / loss size' },
      ],
    },
    {
      label: 'Drawdown', color: C.danger, icon: '⚠️',
      items: [
        { l: 'Max DD',     v: `-${s.maxDD.toFixed(2)}`,     c: C.danger, desc: 'Worst absolute drawdown' },
        { l: 'Max duration',  v: `${s.maxDDDur} trades`,       c: C.warn,   desc: 'Duration of longest DD' },
        { l: 'Streak W',   v: `${s.mW}× consec.`,          c: C.green,  desc: 'Longest winning streak' },
        { l: 'Streak L',   v: `${s.mL}× consec.`,          c: C.danger, desc: 'Longest losing streak' },
      ],
    },
  ];

  return (
    <GlassCard hover={false} glow={C.blue} style={{ padding: '24px 22px' }} custom={2}>
      <ST icon="🔬" color={C.blue} mb={16}>Advanced Statistics</ST>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {groups.map(({ label, color, icon, items }) => (
          <div key={label}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingBottom: 7, borderBottom: `1px solid ${shade(color,'28')}` }}>
              <span style={{ fontSize: 12, filter: `drop-shadow(0 0 5px ${color})` }}>{icon}</span>
              <span style={{ fontSize: 8.5, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.map(({ l, v, c, desc }) => (
                <div key={l} title={desc} style={{ padding: '9px 11px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'help', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}>
                  <div style={{ fontSize: 7.5, color: C.t3, marginBottom: 4, fontWeight: 600 }}>{l}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: c, lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 6.5, color: C.t4, marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ══════════════════════════════════════════════════════
// 📅 YEARLY COMPARISON
// ══════════════════════════════════════════════════════
const YearBreakdown = ({ s }) => {
  const YEAR_COLORS = [C.cyan, C.purple, C.green, C.warn, C.pink];

  // Global monthly bar chart
  const barData = s.monthlyData.map(d => ({ ...d, label: d.month.substring(5) + '/' + d.month.substring(2, 4) }));

  return (
    <GlassCard hover={false} glow={C.purple} style={{ padding: '24px 22px' }} custom={3}>
      <ST icon="📅" color={C.purple} mb={16}>Yearly Comparison</ST>

      {/* Monthly bar chart */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 8.5, color: C.t3, fontWeight: 700, marginBottom: 8 }}>Global monthly P&L (all years)</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="5 5" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} tickFormatter={v => `${v >= 0 ? '+' : ''}${v}`} width={36} />
            <Tooltip contentStyle={{ background: C.bgHigh, border: `1px solid ${C.brdHi}`, borderRadius: 10, fontSize: 10 }}
              formatter={(v, _, p) => [<span style={{ fontFamily: 'monospace', fontWeight: 900, color: v >= 0 ? C.green : C.danger }}>{v >= 0 ? '+' : ''}{v}</span>, p.payload.month]}
              labelFormatter={(_, p) => `${p?.[0]?.payload?.n} trades · WR ${p?.[0]?.payload?.wr}%`} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3" />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {barData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? C.green : C.danger} opacity={0.82} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Year cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${s.yearStats.length}, 1fr)`, gap: 12 }}>
        {s.yearStats.map((y, i) => {
          const col = YEAR_COLORS[i % YEAR_COLORS.length];
          return (
            <div key={y.year} style={{ padding: '16px 14px', borderRadius: 14, background: `${shade(col,'09')}`, border: `1px solid ${shade(col,'30')}` }}>
              {/* Year header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, paddingBottom: 9, borderBottom: `1px solid ${shade(col,'22')}` }}>
                <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  style={{ width: 9, height: 9, borderRadius: '50%', background: col, boxShadow: `0 0 9px ${col}` }} />
                <span style={{ fontSize: 16, fontWeight: 900, color: col }}>{y.year}</span>
                <span style={{ fontSize: 8, color: C.t3, marginLeft: 'auto' }}>{y.wins}W · {y.losses}L</span>
              </div>
              {/* Stats rows */}
              {[
                { l: 'Trades', v: y.n, c: C.t1 },
                { l: 'Win Rate', v: `${y.wr}%`, c: y.wr >= 60 ? C.green : y.wr >= 50 ? C.warn : C.danger },
                { l: 'Total P&L', v: `${y.totalPnL >= 0 ? '+' : ''}${y.totalPnL.toFixed(2)}`, c: y.totalPnL >= 0 ? C.green : C.danger },
                { l: 'PF', v: y.pf, c: y.pf >= 1.5 ? C.green : y.pf >= 1 ? C.warn : C.danger },
                { l: 'Avg / trade', v: `${y.avgPnL >= 0 ? '+' : ''}${y.avgPnL.toFixed(2)}`, c: y.avgPnL >= 0 ? C.green : C.warn },
                { l: 'Max DD', v: `-${y.maxDD.toFixed(2)}`, c: C.danger },
                { l: 'Streak W/L', v: `${y.mW}W / ${y.mL}L`, c: C.t2 },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 8.5, color: C.t3 }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'monospace', color: c }}>{v}</span>
                </div>
              ))}
              {/* Mini equity bar */}
              <div style={{ marginTop: 10, borderRadius: 7, overflow: 'hidden', height: 30 }}>
                <ResponsiveContainer width="100%" height={30}>
                  <AreaChart data={y.mCurve} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                    <defs><linearGradient id={`yg${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity={0.5} /><stop offset="100%" stopColor={col} stopOpacity={0.02} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke={col} strokeWidth={1.5} fill={`url(#yg${i})`} dot={false} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// ══════════════════════════════════════════════════════
// 🗓️ MONTHLY HEATMAP
// ══════════════════════════════════════════════════════
const MonthlyHeatmap = ({ s }) => {
  const [metric, setMetric] = useState('pnl');

  // index [year][month 1-12]
  const grid = {};
  s.monthlyData.forEach(d => {
    const [y, m] = d.month.split('-');
    if (!grid[y]) grid[y] = {};
    grid[y][parseInt(m)] = d;
  });
  const years = Object.keys(grid).sort();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const allVals = s.monthlyData.map(d => metric === 'pnl' ? d.pnl : d.wr);
  const maxAbs  = Math.max(...allVals.map(Math.abs), 1);

  const cellBg = (val, hasData) => {
    if (!hasData || val === null) return 'rgba(255,255,255,0.025)';
    const intensity = Math.min(0.75, Math.abs(val) / maxAbs * 0.75);
    if (metric === 'wr')  return val >= 50 ? `rgba(0,255,136,${intensity * 0.65})` : `rgba(255,61,87,${intensity * 0.55})`;
    return val >= 0 ? `rgba(0,255,136,${intensity * 0.65})` : `rgba(255,61,87,${intensity * 0.55})`;
  };
  const cellColor = (val) => {
    if (metric === 'wr') return val >= 50 ? C.green : C.danger;
    return val >= 0 ? C.green : C.danger;
  };

  return (
    <GlassCard hover={false} glow={C.teal} style={{ padding: '24px 22px' }} custom={4}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <ST icon="🗓️" color={C.teal} mb={0}>Monthly Heatmap</ST>
        <div style={{ display: 'flex', gap: 3 }}>
          {[{ v: 'pnl', l: 'P&L' }, { v: 'wr', l: 'WR%' }, { v: 'n', l: '# Trades' }].map(({ v, l }) => (
            <button key={v} onClick={() => setMetric(v)}
              style={{ padding: '3px 9px', borderRadius: 7, border: `1px solid ${metric === v ? C.teal : C.brd}`, background: metric === v ? `${shade(C.teal,'18')}` : 'transparent', color: metric === v ? C.teal : C.t3, fontSize: 8.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3, minWidth: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: 50 }} />
              {MONTHS.map(m => <th key={m} style={{ fontSize: 8, fontWeight: 700, color: C.t3, textAlign: 'center', minWidth: 50, paddingBottom: 7 }}>{m}</th>)}
              <th style={{ fontSize: 8, fontWeight: 700, color: C.t3, textAlign: 'center', minWidth: 50, paddingBottom: 7 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {years.map(y => {
              const yearTotal = s.monthlyData.filter(d => d.month.startsWith(y)).reduce((sum, d) => sum + (metric === 'pnl' ? d.pnl : metric === 'n' ? d.n : d.wr), 0);
              return (
                <tr key={y}>
                  <td style={{ fontSize: 10, fontWeight: 800, color: C.t2, paddingRight: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>{y}</td>
                  {Array.from({ length: 12 }, (_, mi) => {
                    const d   = grid[y]?.[mi + 1];
                    const val = d ? (metric === 'pnl' ? d.pnl : metric === 'wr' ? d.wr : d.n) : null;
                    const bg  = cellBg(val, !!d);
                    const tc  = val !== null ? cellColor(val) : C.t4;
                    return (
                      <td key={mi} style={{ padding: 2 }}>
                        <div
                          title={d ? `${y}-${String(mi + 1).padStart(2, '0')}: ${d.n} trades · P&L ${d.pnl >= 0 ? '+' : ''}${d.pnl.toFixed(2)} · WR ${d.wr}%` : ''}
                          style={{ height: 44, borderRadius: 8, background: bg, border: `1px solid ${d ? 'rgba(255,255,255,0.07)' : C.brd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.12s, box-shadow 0.12s', cursor: d ? 'pointer' : 'default' }}
                          onMouseEnter={e => { if (d) { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = `0 4px 16px ${shade(tc,'30')}`; } }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                          {d ? (
                            <>
                              <div style={{ fontSize: 9.5, fontWeight: 900, fontFamily: 'monospace', color: tc, lineHeight: 1 }}>
                                {metric === 'pnl' ? `${val >= 0 ? '+' : ''}${val.toFixed(1)}` : metric === 'wr' ? `${val}%` : val}
                              </div>
                              <div style={{ fontSize: 6, color: C.t3, marginTop: 2 }}>×{d.n}</div>
                            </>
                          ) : <div style={{ width: 8, height: 1, background: 'rgba(255,255,255,0.07)' }} />}
                        </div>
                      </td>
                    );
                  })}
                  {/* Total column */}
                  <td style={{ padding: 2 }}>
                    <div style={{ height: 44, borderRadius: 8, background: cellBg(yearTotal, true), border: `1px solid rgba(255,255,255,0.1)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 9, fontWeight: 900, fontFamily: 'monospace', color: cellColor(yearTotal) }}>
                        {metric === 'pnl' ? `${yearTotal >= 0 ? '+' : ''}${yearTotal.toFixed(1)}` : metric === 'wr' ? `${Math.round(yearTotal / 12)}%` : yearTotal}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 7.5, color: C.t4 }}>Hover = details · click = zoom (coming soon)</span>
        {[{ c: C.green, l: metric === 'wr' ? 'WR ≥ 50%' : 'Positive' }, { c: C.danger, l: metric === 'wr' ? 'WR < 50%' : 'Negative' }].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: `${shade(c,'30')}`, border: `1px solid ${shade(c,'60')}` }} />
            <span style={{ fontSize: 7.5, color: C.t3 }}>{l}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

// ══════════════════════════════════════════════════════
// 🎲 MONTE CARLO
// ══════════════════════════════════════════════════════
const MonteCarlo = ({ s }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState(1000);

  const launch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setResult(s.runMonteCarlo(runs));
      setLoading(false);
    }, 60);
  }, [s, runs]);

  const PCT_COLORS = { p95: C.blue, p75: C.cyan, p50: C.gold, p25: C.orange, p5: C.danger };

  return (
    <GlassCard hover={false} glow={C.gold} style={{ padding: '24px 22px' }} custom={5}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <ST icon="🎲" color={C.gold} mb={0}>Monte Carlo — Trajectory Simulation</ST>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={runs} onChange={e => setRuns(Number(e.target.value))}
            style={{ background: C.bgHigh, border: `1px solid ${C.brd}`, borderRadius: 8, padding: '5px 9px', color: C.t2, fontSize: 9, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            {[500, 1000, 2000, 5000].map(n => <option key={n} value={n}>{n} runs</option>)}
          </select>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={launch} disabled={loading}
            style={{ padding: '7px 18px', borderRadius: 10, border: `1px solid ${C.gold}`, background: result ? `${shade(C.gold,'22')}` : `${shade(C.gold,'18')}`, color: C.gold, fontSize: 10, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, boxShadow: result ? `0 0 20px ${C.goldGlow}` : 'none', transition: 'all 0.2s' }}>
            {loading ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>⟳</motion.span> : '▶'}
            {loading ? 'Calculating…' : result ? `Relaunch (${runs})` : `Run ${runs} simulations`}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result && !loading && (
          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, border: `2px dashed ${C.brd}`, borderRadius: 14 }}>
            <motion.div animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: 44 }}>🎲</motion.div>
            <div style={{ textAlign: 'center', lineHeight: 1.7 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.t2 }}>Monte Carlo Simulation</div>
              <div style={{ fontSize: 9.5, color: C.t3, maxWidth: 340 }}>
                Randomly shuffles your {s.n} trades and projects {runs} possible trajectories<br />
                to estimate the distribution of future results
              </div>
            </div>
          </motion.div>
        )}

        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.brd}`, borderTop: `3px solid ${C.gold}` }} />
            <div style={{ fontSize: 11, color: C.t3 }}>Calculating {runs} trajectories…</div>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={result.mcCurve} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="mc95" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity={0.18} /><stop offset="100%" stopColor={C.blue} stopOpacity={0.02} /></linearGradient>
                  <linearGradient id="mc75" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.cyan} stopOpacity={0.22} /><stop offset="100%" stopColor={C.cyan} stopOpacity={0.03} /></linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="5 5" vertical={false} />
                <XAxis dataKey="i" tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} interval={Math.floor(result.mcCurve.length / 9)} />
                <YAxis tick={{ fill: C.t3, fontSize: 7 }} axisLine={false} tickLine={false} tickFormatter={v => `${v >= 0 ? '+' : ''}${v}`} width={42} />
                <Tooltip contentStyle={{ background: C.bgHigh, border: `1px solid ${C.brdHi}`, borderRadius: 11, fontSize: 9.5 }}
                  formatter={(v, name) => [<span style={{ fontFamily: 'monospace', fontWeight: 800, color: C.t1 }}>{v >= 0 ? '+' : ''}{v}</span>, name]} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="5 4" />

                {/* P5-P95 Bands */}
                <Area type="monotone" dataKey="p95" stroke="none" fill="url(#mc95)" dot={false} legendType="none" />
                <Area type="monotone" dataKey="p75" stroke="none" fill="url(#mc75)" dot={false} legendType="none" />

                {/* Percentile lines */}
                <Line type="monotone" dataKey="p95"    stroke={PCT_COLORS.p95}  strokeWidth={1}   dot={false} strokeDasharray="6 3" name="P95 (Optimistic)" />
                <Line type="monotone" dataKey="p75"    stroke={PCT_COLORS.p75}  strokeWidth={1.5} dot={false} name="P75" />
                <Line type="monotone" dataKey="p50"    stroke={PCT_COLORS.p50}  strokeWidth={2.5} dot={false} name="Median P50" />
                <Line type="monotone" dataKey="p25"    stroke={PCT_COLORS.p25}  strokeWidth={1.5} dot={false} name="P25" />
                <Line type="monotone" dataKey="p5"     stroke={PCT_COLORS.p5}   strokeWidth={1}   dot={false} strokeDasharray="6 3" name="P5 (Pessimistic)" />
                {/* Actual curve */}
                <Line type="monotone" dataKey="actual" stroke={C.green}         strokeWidth={3}   dot={false} name="Actual" />
              </ComposedChart>
            </ResponsiveContainer>

            {/* MC Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginTop: 14 }}>
              {[
                { l: '% positive runs', v: `${result.pctPos}%`,              c: result.pctPos >= 75 ? C.green : result.pctPos >= 50 ? C.warn : C.danger },
                { l: 'Final median',  v: `${result.p50 >= 0 ? '+' : ''}${result.p50}`, c: result.p50 >= 0 ? C.green : C.danger },
                { l: 'Pessimistic P5',   v: `${result.p5 >= 0 ? '+' : ''}${result.p5}`,  c: result.p5 >= 0 ? C.green : C.danger },
                { l: 'Optimistic P95',   v: `+${result.p95}`,                 c: C.blue },
                { l: 'Median DD',       v: `-${result.ddP50}`,               c: C.warn },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ padding: '9px 10px', borderRadius: 10, background: `${shade(c,'0A')}`, border: `1px solid ${shade(c,'22')}`, textAlign: 'center' }}>
                  <div style={{ fontSize: 7, color: C.t3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4, lineHeight: 1.4 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { c: C.green,  l: 'Actual', w: 3 },
                { c: C.gold,   l: 'Median P50', w: 2.5 },
                { c: C.cyan,   l: 'P75', w: 1.5 },
                { c: C.blue,   l: 'P95', w: 1, dash: true },
                { c: C.orange, l: 'P25', w: 1.5 },
                { c: C.danger, l: 'P5', w: 1, dash: true },
              ].map(({ c, l, w, dash }) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 20, height: 2, background: c, borderRadius: 1, opacity: dash ? 0.7 : 1, borderTop: dash ? `2px dashed ${c}` : 'none', background: dash ? 'none' : c }} />
                  <span style={{ fontSize: 8, color: C.t3 }}>{l}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

// ══════════════════════════════════════════════════════
// 🏠 MAIN PAGE — EQUITY
// ══════════════════════════════════════════════════════
export default function Equity() {
  const { trades } = useTradingContext();

  const s = useMemo(() => buildEquityStats(trades), [trades]);

  // Background particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 13 + 7) % 100}%`,
    top:  `${(i * 8.7  + 5) % 100}%`,
    color: [C.blue, C.cyan, C.purple, C.green, C.teal, C.gold][i % 6],
    dur: 5 + i * 0.35,
    delay: i * 0.4,
  }));

  if (!trades?.length) {
    return (
      <div style={{ background: `radial-gradient(ellipse 120% 50% at 50% -5%,rgba(var(--mf-blue-rgb, 77, 124, 255),0.12) 0%,var(--mf-bg,#030508) 60%)`, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'SF Pro Display','Segoe UI',system-ui,sans-serif" }}>
        <GlassCard glow={C.blue} style={{ padding: '60px 48px', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.t1, marginBottom: 8 }}>No trades</div>
          <div style={{ fontSize: 11, color: C.t3, lineHeight: 1.7 }}>Add trades via <strong style={{ color: C.cyan }}>All Trades</strong> to display your Equity analysis.</div>
        </GlassCard>
      </div>
    );
  }

  const last = s.equity[s.equity.length - 1]?.v || 0;

  const KPI_ROW = [
    { label: 'Total P&L',    value: `${last >= 0 ? '+' : ''}${last.toFixed(2)}`,  sub: `${s.n} trades · ${s.yrs}y`, color: last >= 0 ? C.green : C.danger, icon: '💹', custom: 0 },
    { label: 'Win Rate',     value: `${s.wr}%`,                                    sub: `${s.wins}W · ${s.losses}L · ${shade(s.bes,'BE')}`, color: s.wr >= 60 ? C.green : s.wr >= 50 ? C.warn : C.danger, icon: '🎯', custom: 1 },
    { label: 'Profit Factor',value: s.pf,                                           sub: `${s.grossW.toFixed(2)} won / ${s.grossL.toFixed(2)} lost`, color: s.pf >= 2 ? C.green : s.pf >= 1.3 ? C.cyan : s.pf >= 1 ? C.warn : C.danger, icon: '⚖️', custom: 2 },
    { label: 'Sharpe',       value: s.sharpe,                                       sub: '≥1 good · ≥2 excellent',  color: s.sharpe  >= 2 ? C.green : s.sharpe  >= 1 ? C.cyan : C.warn, icon: '📏', custom: 3 },
    { label: 'Sortino',      value: s.sortino,                                      sub: 'Negative vol only',    color: s.sortino >= 2 ? C.green : s.sortino >= 1 ? C.cyan : C.warn, icon: '📐', custom: 4 },
    { label: 'Calmar',       value: s.calmar,                                       sub: 'P&L / Max Drawdown',         color: s.calmar  >= 2 ? C.green : s.calmar  >= 1 ? C.cyan : C.warn, icon: '🔢', custom: 5 },
    { label: 'Max Drawdown', value: `-${s.maxDD.toFixed(2)}`,                       sub: `Max duration: ${s.maxDDDur} trades`,     color: C.danger, icon: '📉', custom: 6 },
    { label: 'Kelly %',      value: `${s.kelly}%`,                                  sub: 'Optimal position size', color: s.kelly >= 25 ? C.danger : s.kelly >= 10 ? C.green : C.warn, icon: '🎯', custom: 7 },
  ];

  return (
    <div style={{ background: `radial-gradient(ellipse 130% 55% at 50% -5%,rgba(var(--mf-blue-rgb, 77, 124, 255),0.13) 0%,var(--mf-bg,#030508) 60%)`, minHeight: '100vh', fontFamily: "'SF Pro Display','Segoe UI',system-ui,sans-serif", color: C.t1 }}>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {particles.map((p, i) => (
          <motion.div key={i} animate={{ y: [0, -42, 0], opacity: [0.025, 0.15, 0.025] }} transition={{ duration: p.dur, repeat: Infinity, delay: p.delay }}
            style={{ position: 'absolute', left: p.left, top: p.top, width: 2, height: 2, borderRadius: '50%', background: p.color }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(var(--mf-blue-rgb, 77, 124, 255),0.011) 1px,transparent 1px),linear-gradient(90deg,rgba(var(--mf-blue-rgb, 77, 124, 255),0.011) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px 60px' }}>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${C.brd}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <motion.div animate={{ rotateY: [0, 360] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              style={{ width: 48, height: 48, borderRadius: 14, background: C.gradCyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, boxShadow: `0 4px 24px ${C.cyanGlow}, 0 0 40px ${C.cyanGlow}` }}>
              📈
            </motion.div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, background: C.gradCyan, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>Equity</h1>
                <span style={{ padding: '3px 9px', borderRadius: 6, background: `${shade(C.green,'18')}`, border: `1px solid ${shade(C.green,'38')}`, fontSize: 9, fontWeight: 800, color: C.green }}>
                  {last >= 0 ? '+' : ''}{last.toFixed(2)} total
                </span>
                <span style={{ padding: '3px 9px', borderRadius: 6, background: `${shade(C.cyan,'12')}`, border: `1px solid ${shade(C.cyan,'30')}`, fontSize: 9, fontWeight: 800, color: C.cyan }}>
                  {s.n} trades · {s.yrs}y
                </span>
              </div>
              <div style={{ fontSize: 11, color: C.t3 }}>
                Complete performance analysis · Real-time data from All Trades
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 10 }}>
          {KPI_ROW.slice(0, 4).map(k => <KpiBadge key={k.label} {...k} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
          {KPI_ROW.slice(4).map(k => <KpiBadge key={k.label} {...k} />)}
        </div>

        {/* EQUITY CURVE */}
        <div style={{ marginBottom: 14 }}>
          <EquityCurve s={s} />
        </div>

        {/* DRAWDOWN + HEATMAP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <DrawdownChart s={s} />
          <MonthlyHeatmap s={s} />
        </div>

        {/* ADVANCED STATS */}
        <div style={{ marginBottom: 14 }}>
          <AdvancedStats s={s} />
        </div>

        {/* YEAR BREAKDOWN */}
        <div style={{ marginBottom: 14 }}>
          <YearBreakdown s={s} />
        </div>

        {/* MONTE CARLO */}
        <MonteCarlo s={s} />

      </div>
    </div>
  );
}

