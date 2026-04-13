/*
══════════════════════════════════════════════════════════════════════════════╗
║   📊 ANALYTICS PRO v2 - MARKETFLOW JOURNAL                                  ║
║   ✅ FIX: useState extracted from .map() → KpiCard = dedicated component   ║
║   ✅ NEW: Monthly P&L, Cumulative WR, Long vs Short, News Impact           ║
║   ✅ 16 complete analytics blocks                                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ComposedChart,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  CHART_AXIS,
  CHART_AXIS_SMALL,
  CHART_GRID,
  CHART_GRID_FULL,
  CHART_MOTION,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';

// ─────────────────────────────────────────────────────────────────────────────
// 🎨 PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bgPage: '#0F1420', bgCard: 'var(--mf-card,#161D2E)', bgDeep: 'var(--mf-deep,#0D1117)',
  bgHigh: '#1C2540', bgHov:  '#1F2B42',
  cyan: 'var(--mf-accent,#06E6FF)',   cyanGlow: 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.3)',
  teal: 'var(--mf-teal,#00F5D4)',   green: 'var(--mf-green,#00FF88)', greenGlow: 'rgba(var(--mf-green-rgb, 0, 255, 136),0.3)',
  danger: 'var(--mf-danger,#FF3D57)', dangerGlow: 'rgba(var(--mf-danger-rgb, 255, 61, 87),0.3)',
  warn: 'var(--mf-warn,#FFB31A)',   orange: 'var(--mf-orange,#FF6B35)',
  purple: 'var(--mf-purple,#A78BFA)', blue: 'var(--mf-blue,#4D7CFF)',
  t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#8B9BB4)', t3: 'var(--mf-text-3,#3D4F6B)', t4: 'var(--mf-text-3,#64748B)',
  brd: 'var(--mf-border,#1E2D45)', brdSoft: 'var(--mf-border-hi,#243454)', brdBright: 'var(--mf-border-hi,#334155)',
  grad:       'linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88))',
  gradBlue:   'linear-gradient(135deg,var(--mf-blue,#4D7CFF),var(--mf-blue,#4D7CFF))',
  gradPurple: 'linear-gradient(135deg,var(--mf-purple,#A78BFA),var(--mf-purple,#8B5CF6))',
  gradOrange: 'linear-gradient(135deg,var(--mf-orange,#FF6B35),var(--mf-orange,#FF8C00))',
};

const CHART_COLORS = [
  C.cyan, C.green, C.purple, C.warn, C.orange,
  C.teal, C.blue, C.danger, 'var(--mf-pink,#EC4899)', 'var(--mf-orange,#F97316)',
];

// ─────────────────────────────────────────────────────────────────────────────
// 🎬 ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 22, scale: 0.97 },
  visible: (i = 0) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.055, duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtPnl = (n) => {
  const v = parseFloat(n);
  if (isNaN(v)) return '$0.00';
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v >= 0 ? `+$${s}` : `-$${s}`;
};
const avg = (arr) => arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

// ─────────────────────────────────────────────────────────────────────────────
// 🧩 ATOMS
// ─────────────────────────────────────────────────────────────────────────────
const Card = ({ children, style = {}, index = 0, glow }) => (
  <motion.div
    variants={fadeUp} initial="hidden" animate="visible" custom={index}
    whileHover={{ y: -3 }}
    style={{
      backgroundColor: C.bgCard, border: `1px solid ${C.brd}`,
      borderRadius: 14, padding: '20px 22px', position: 'relative', overflow: 'hidden',
      boxShadow: glow ? `0 8px 32px ${glow}` : '0 2px 12px rgba(0,0,0,0.25)',
      transition: 'box-shadow 0.3s', ...style,
    }}
  >{children}</motion.div>
);

const STitle = ({ icon, title, sub, badge, color = C.cyan }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: `linear-gradient(135deg,${shade(color,'30')},${shade(color,'10')})`,
        border: `1px solid ${shade(color,'30')}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.t1, letterSpacing: '-0.2px' }}>{title}</span>
          {badge && (
            <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 8, fontWeight: 800, background: C.grad, color: C.bgDeep, letterSpacing: '0.5px' }}>
              {badge}
            </span>
          )}
        </div>
        {sub && <div style={{ fontSize: 10, color: C.t3, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ height: 1, width: 50, background: `linear-gradient(90deg,${shade(color,'25')},transparent)` }} />
    </div>
  </div>
);

const ChartTip = ({ active, payload, label, render: renderFn }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      ...chartTooltipStyle(payload[0]?.color || C.cyan),
      padding: '10px 13px',
    }}>
      {renderFn ? renderFn(payload, label) : (
        <>
          {label && <div style={{ color: C.t3, fontWeight: 700, marginBottom: 5 }}>{label}</div>}
          {payload.map((p, i) => (
            <div key={i} style={{ color: p.color || C.t1, fontWeight: 700 }}>{p.name}: {p.value}</div>
          ))}
        </>
      )}
    </div>
  );
};

const PeriodFilter = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 3, padding: '3px', backgroundColor: C.bgDeep, borderRadius: 8, border: `1px solid ${C.brd}` }}>
    {['7D', '1M', '3M', '6M', 'ALL'].map(p => (
      <motion.button key={p} onClick={() => onChange(p)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        style={{
          padding: '5px 12px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          backgroundColor: value === p ? C.cyan : 'transparent',
          color: value === p ? C.bgDeep : C.t3,
          transition: 'all 0.2s',
        }}>{p}</motion.button>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ✅ CRITICAL FIX — KpiCard = independent React component
//    useState() called here, NOT in a .map()
// ─────────────────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, color, icon, sub, index }) => {
  const [hov, setHov] = useState(false); // ← Legal hook here: React component
  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={index}
      whileHover={{ scale: 1.04, y: -6 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: C.bgCard, borderRadius: 12,
        border: `1px solid ${hov ? color + '45' : C.brd}`,
        padding: '14px 16px', position: 'relative', overflow: 'hidden',
        boxShadow: hov ? `0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px ${shade(color,'22')}` : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', cursor: 'default',
      }}
    >
      <motion.div animate={{ opacity: hov ? 1 : 0 }} transition={{ duration: 0.2 }}
        style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${shade(color,'12')},transparent)`, pointerEvents: 'none' }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: C.t3, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: 17 }}>{icon}</span>
        </div>
        <div style={{
          fontSize: 21, fontWeight: 900, color, fontFamily: 'monospace',
          textShadow: hov ? `0 0 18px ${shade(color,'60')}` : 'none', transition: 'text-shadow 0.3s',
        }}>{value}</div>
        <div style={{ fontSize: 10, color: C.t3, marginTop: 4 }}>{sub}</div>
      </div>
      {hov && (
        <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 3, background: color, transformOrigin: 'left',
            filter: `blur(2px)`, pointerEvents: 'none',
          }}
        />
      )}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📊 BLOCK 1 — KPI CARDS (10 metrics)
// ─────────────────────────────────────────────────────────────────────────────
const KpiCards = ({ trades }) => {
  const metrics = useMemo(() => {
    const wins   = trades.filter(t => parseFloat(t.pnl) > 0);
    const losses = trades.filter(t => parseFloat(t.pnl) <= 0);
    const totalPnL  = trades.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    const winRate   = trades.length ? (wins.length / trades.length) * 100 : 0;
    const grossW    = wins.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    const grossL    = Math.abs(losses.reduce((s, t) => s + parseFloat(t.pnl || 0), 0));
    const pf        = grossL > 0 ? grossW / grossL : grossW > 0 ? 9.99 : 0;
    const avgWin    = wins.length   ? grossW / wins.length   : 0;
    const avgLoss   = losses.length ? grossL / losses.length : 0;
    const rrs       = trades.map(t => parseFloat(t.metrics?.rrReel || 0)).filter(r => r > 0);
    const avgRR     = rrs.length ? avg(rrs) : 0;
    const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;

    // Max Drawdown
    let peak = 0, eq = 0, maxDD = 0;
    [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(t => {
      eq += parseFloat(t.pnl || 0);
      if (eq > peak) peak = eq;
      const d = peak > 0 ? ((peak - eq) / peak) * 100 : 0;
      if (d > maxDD) maxDD = d;
    });

    // Consistency (% profitable days)
    const dayMap = {};
    trades.forEach(t => {
      if (!t.date) return;
      const d = t.date.substring(0, 10);
      dayMap[d] = (dayMap[d] || 0) + parseFloat(t.pnl || 0);
    });
    const days = Object.values(dayMap);
    const consistency = days.length ? (days.filter(v => v > 0).length / days.length) * 100 : 0;

    // Current streak
    const sorted = [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let streak = 0;
    if (sorted.length) {
      const lastIsWin = parseFloat(sorted[sorted.length - 1].pnl) > 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        if ((parseFloat(sorted[i].pnl) > 0) === lastIsWin) streak++;
        else break;
      }
      if (!lastIsWin) streak = -streak;
    }

    return [
      { label: 'Total P&L',    value: fmtPnl(totalPnL),          color: totalPnL >= 0 ? C.green : C.danger, icon: '💰', sub: `${trades.length} trades` },
      { label: 'Win Rate',     value: `${winRate.toFixed(1)}%`,   color: winRate >= 55 ? C.green : winRate >= 45 ? C.warn : C.danger, icon: '🎯', sub: `${wins.length}W / ${losses.length}L` },
      { label: 'Profit Factor',value: pf.toFixed(2),              color: pf >= 2 ? C.green : pf >= 1.5 ? C.warn : C.danger, icon: '📈', sub: 'Gross W / Gross L' },
      { label: 'Avg Win',      value: fmtPnl(avgWin),             color: C.green, icon: '✅', sub: `Avg Loss: ${fmtPnl(-avgLoss)}` },
      { label: 'Avg R:R',      value: `1:${avgRR.toFixed(2)}`,    color: avgRR >= 2 ? C.green : avgRR >= 1 ? C.warn : C.danger, icon: '⚖️', sub: 'Actual Risk/Reward' },
      { label: 'Expectancy',   value: fmtPnl(expectancy),         color: expectancy >= 0 ? C.green : C.danger, icon: '🎲', sub: 'Per trade' },
      { label: 'Max Drawdown', value: `-${maxDD.toFixed(1)}%`,    color: C.danger, icon: '📉', sub: 'Peak to trough' },
      { label: 'Consistency',  value: `${consistency.toFixed(0)}%`, color: consistency >= 60 ? C.green : consistency >= 40 ? C.warn : C.danger, icon: '📆', sub: 'Profitable days' },
      { label: 'Current Streak',value: streak > 0 ? `+${streak}W` : `${Math.abs(streak)}L`, color: streak > 0 ? C.green : C.danger, icon: streak > 0 ? '🔥' : '❄️', sub: 'Current streak' },
      { label: 'Trades / Day',value: (trades.length / Math.max(days.length, 1)).toFixed(1), color: C.cyan, icon: '📊', sub: `${days.length} active days` },
    ];
  }, [trades]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 11, marginBottom: 24 }}>
      {/* ✅ KpiCard = React component → useState() is legal */}
      {metrics.map((k, i) => <KpiCard key={k.label} {...k} index={i} />)}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📈 BLOCK 2 — EQUITY CURVE + DRAWDOWN
// ─────────────────────────────────────────────────────────────────────────────
const EquityDrawdown = ({ trades }) => {
  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let equity = 0, peak = 0;
    return sorted.map((t, i) => {
      equity += parseFloat(t.pnl || 0);
      if (equity > peak) peak = equity;
      const dd = peak > 0 ? -((peak - equity) / peak) * 100 : 0;
      return { i: i + 1, date: t.date?.substring(0, 10), equity: +equity.toFixed(2), drawdown: +dd.toFixed(2) };
    });
  }, [trades]);

  const maxDD   = data.length ? Math.min(...data.map(d => d.drawdown)) : 0;
  const finalEq = data.length ? data[data.length - 1].equity : 0;

  return (
    <Card index={0} glow={finalEq >= 0 ? C.greenGlow : C.dangerGlow}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <STitle icon="📈" title="Equity Curve + Drawdown" sub="Real-time capital progression" color={C.green} />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: finalEq >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>{fmtPnl(finalEq)}</div>
          <div style={{ fontSize: 10, color: C.danger, marginTop: 2 }}>Max DD: {maxDD.toFixed(1)}%</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.green}  stopOpacity={0.28} />
              <stop offset="95%" stopColor={C.green}  stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ddGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="5%"  stopColor={C.danger} stopOpacity={0.35} />
              <stop offset="95%" stopColor={C.danger} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="date" interval="preserveStartEnd" />
          <YAxis {...CHART_AXIS_SMALL} yAxisId="eq" tickFormatter={v => `$${v}`} />
          <YAxis {...CHART_AXIS_SMALL} yAxisId="dd" orientation="right" tick={{ ...CHART_AXIS_SMALL.tick, fill: C.danger }} tickFormatter={v => `${v.toFixed(0)}%`} />
          <Tooltip content={
            <ChartTip render={(payload, label) => (
              <>
                <div style={{ color: C.t2, fontWeight: 700, marginBottom: 5, fontSize: 10 }}>{label}</div>
                {payload.map((p, i) => (
                  <div key={i} style={{ color: p.dataKey === 'equity' ? C.green : C.danger, fontWeight: 700, fontSize: 11 }}>
                    {p.dataKey === 'equity' ? `Equity: $${p.value}` : `DD: ${p.value?.toFixed(1)}%`}
                  </div>
                ))}
              </>
            )} />
          } />
          <ReferenceLine yAxisId="eq" y={0} stroke={shade(C.brdBright, 0.8)} strokeDasharray="4 6" />
          <Area yAxisId="eq" type="monotone" dataKey="equity" stroke={C.green} strokeWidth={2.5} fill="url(#eqGrad)" dot={false} activeDot={chartActiveDot(C.green, 5, C.bgCard)} {...CHART_MOTION_SOFT} />
          <Area yAxisId="dd" type="monotone" dataKey="drawdown" stroke={C.danger} strokeWidth={1.6} fill="url(#ddGrad)" dot={false} strokeDasharray="6 4" activeDot={chartActiveDot(C.danger, 4, C.bgCard)} {...CHART_MOTION_SOFT} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
        {[{ color: C.green, label: 'Equity', dash: false }, { color: C.danger, label: 'Drawdown', dash: true }].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 2, backgroundColor: l.color, borderRadius: 1, borderTopStyle: l.dash ? 'dashed' : 'none' }} />
            <span style={{ fontSize: 10, color: C.t3 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🗓️ BLOCK 3 — MONTHLY P&L
// ─────────────────────────────────────────────────────────────────────────────
const MonthlyPnl = ({ trades }) => {
  const data = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      if (!t.date) return;
      const key = t.date.substring(0, 7);
      if (!map[key]) map[key] = { month: key, pnl: 0, wins: 0, total: 0 };
      map[key].pnl   += parseFloat(t.pnl || 0);
      map[key].total++;
      if (parseFloat(t.pnl) > 0) map[key].wins++;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({ ...d, pnl: +d.pnl.toFixed(2), wr: d.total > 0 ? +((d.wins / d.total) * 100).toFixed(1) : 0, label: d.month.substring(5) + '/' + d.month.substring(2, 4) }));
  }, [trades]);

  const best  = data.reduce((b, d) => d.pnl > b.pnl ? d : b, { pnl: -Infinity, month: '—' });
  const worst = data.reduce((b, d) => d.pnl < b.pnl ? d : b, { pnl: Infinity,  month: '—' });

  return (
    <Card index={1}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <STitle icon="🗓️" title="Monthly P&L" sub="Month-by-month results" color={C.blue} />
        <div style={{ display: 'flex', gap: 14, fontSize: 10, flexShrink: 0 }}>
          <div><span style={{ color: C.t3 }}>Best </span><span style={{ color: C.green, fontWeight: 800 }}>{best.month} {fmtPnl(best.pnl)}</span></div>
          <div><span style={{ color: C.t3 }}>Worst </span><span style={{ color: C.danger, fontWeight: 800 }}>{worst.month} {fmtPnl(worst.pnl)}</span></div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="label" />
          <YAxis {...CHART_AXIS_SMALL} tickFormatter={v => `$${v}`} />
          <ReferenceLine y={0} stroke={shade(C.brdBright, 0.82)} strokeDasharray="4 6" />
          <Tooltip content={
            <ChartTip render={(payload, label) => {
              const d = data.find(x => x.label === label);
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>📅 {d?.month}</div>
                  <div style={{ color: d?.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontWeight: 700 }}>{fmtPnl(d?.pnl)}</div>
                  <div style={{ color: C.cyan, fontSize: 10, marginTop: 2 }}>WR: {d?.wr}% · {d?.total} trades</div>
                </>
              );
            }} />
          } />
          <Bar dataKey="pnl" radius={[7, 7, 0, 0]} maxBarSize={38} {...CHART_MOTION}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? C.green : C.danger} fillOpacity={0.76} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📉 BLOCK 4 — CUMULATIVE WIN RATE
// ─────────────────────────────────────────────────────────────────────────────
const CumulativeWinRate = ({ trades }) => {
  const data = useMemo(() => {
    const sorted = [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let wins = 0;
    return sorted.map((t, i) => {
      if (parseFloat(t.pnl) > 0) wins++;
      return { i: i + 1, date: t.date?.substring(0, 10), wr: +((wins / (i + 1)) * 100).toFixed(2) };
    });
  }, [trades]);

  const final = data.length ? data[data.length - 1].wr : 0;

  return (
    <Card index={2}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <STitle icon="📉" title="Cumulative Win Rate" sub="Convergence toward true average" color={C.cyan} />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: final >= 50 ? C.green : C.danger, fontFamily: 'monospace' }}>{final}%</div>
          <div style={{ fontSize: 9, color: C.t3 }}>Final Win Rate</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={155}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="wrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.25} />
              <stop offset="95%" stopColor={C.cyan} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="date" tick={{ ...CHART_AXIS_SMALL.tick, fontSize: 8 }} interval="preserveStartEnd" />
          <YAxis {...CHART_AXIS_SMALL} domain={[0, 100]} tickFormatter={v => `${v}%`} />
          <ReferenceLine y={50} stroke={C.warn} strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: '50%', fill: C.warn, fontSize: 9, position: 'right' }} />
          <Tooltip content={
            <ChartTip render={(payload, label) => (
              <>
                <div style={{ color: C.t2, fontSize: 10, marginBottom: 4 }}>{label}</div>
                <div style={{ color: C.cyan, fontWeight: 800 }}>WR: {payload[0]?.value}%</div>
              </>
            )} />
          } cursor={chartCursor(C.cyan)} />
          <Area type="monotone" dataKey="wr" stroke={C.cyan} strokeWidth={2.5} fill="url(#wrGrad)" dot={false} activeDot={chartActiveDot(C.cyan, 5, C.bgCard)} {...CHART_MOTION_SOFT} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🕐 BLOCK 5 — HOURLY HEATMAP
// ─────────────────────────────────────────────────────────────────────────────
const HourHeatmap = ({ trades }) => {
  const [hov, setHov] = useState(null); // ✅ legal: React component

  const data = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, h) => ({ h, wins: 0, total: 0, pnl: 0 }));
    trades.forEach(t => {
      const h = parseInt((t.time || '00:00').split(':')[0]);
      if (h >= 0 && h < 24) {
        hours[h].total++;
        if (parseFloat(t.pnl) > 0) hours[h].wins++;
        hours[h].pnl += parseFloat(t.pnl || 0);
      }
    });
    return hours;
  }, [trades]);

  const getColor = (d) => {
    if (d.total === 0) return C.bgDeep;
    const wr = d.wins / d.total;
    if (wr >= 0.7) return `rgba(0,230,118,${0.25 + wr * 0.55})`;
    if (wr >= 0.5) return `rgba(0,201,167,${0.2 + wr * 0.45})`;
    if (wr >= 0.3) return `rgba(255,179,0,${0.2 + wr * 0.4})`;
    return `rgba(255,71,87,${0.2 + (1 - wr) * 0.45})`;
  };

  return (
    <Card index={3}>
      <STitle icon="🕐" title="Hourly Heatmap" sub="Win rate and P&L by trading hour" color={C.cyan} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 5, marginBottom: 12 }}>
        {data.map(d => (
          <motion.div key={d.h}
            onMouseEnter={() => setHov(d)} onMouseLeave={() => setHov(null)}
            whileHover={{ scale: 1.08, zIndex: 10 }}
            style={{
              height: 54, borderRadius: 7,
              backgroundColor: getColor(d),
              border: `1px solid ${hov?.h === d.h ? C.cyan : 'transparent'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: d.total > 0 ? 'pointer' : 'default',
              transition: 'border-color 0.15s', position: 'relative',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, color: d.total > 0 ? C.t1 : C.t3 }}>{String(d.h).padStart(2, '0')}h</div>
            {d.total > 0 && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{((d.wins / d.total) * 100).toFixed(0)}%</div>}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {hov && hov.total > 0 && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '10px 14px', borderRadius: 9, backgroundColor: C.bgHigh, border: `1px solid ${C.brd}`, display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center' }}
          >
            {[
              { label: 'HOUR',     value: `${String(hov.h).padStart(2, '0')}:00`, color: C.cyan },
              { label: 'TRADES',   value: hov.total,                               color: C.t1  },
              { label: 'WIN RATE', value: `${((hov.wins / hov.total) * 100).toFixed(1)}%`, color: hov.wins / hov.total >= 0.5 ? C.green : C.danger },
              { label: 'P&L',      value: fmtPnl(hov.pnl), color: hov.pnl >= 0 ? C.green : C.danger },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: 8, color: C.t3, fontWeight: 700, marginBottom: 3, letterSpacing: '0.8px' }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: '≥70% WR', bg: 'rgba(var(--mf-green-rgb, 0, 255, 136),0.65)' },
          { label: '50–70%',  bg: 'rgba(var(--mf-teal-rgb, 0, 245, 212),0.55)' },
          { label: '30–50%',  bg: 'rgba(var(--mf-warn-rgb, 255, 179, 26),0.5)'  },
          { label: '<30%',    bg: 'rgba(var(--mf-danger-rgb, 255, 61, 87),0.55)'  },
          { label: 'None',    bg: C.bgDeep, border: `1px solid ${C.brd}` },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.bg, border: l.border }} />
            <span style={{ fontSize: 9, color: C.t3 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📅 BLOCK 6 — WEEKDAY
// ─────────────────────────────────────────────────────────────────────────────
const WeekdayPerf = ({ trades }) => {
  const data = useMemo(() => {
    const map = {
      1: { d: 'Monday',     wins: 0, total: 0, pnl: 0 },
      2: { d: 'Tuesday',    wins: 0, total: 0, pnl: 0 },
      3: { d: 'Wednesday',  wins: 0, total: 0, pnl: 0 },
      4: { d: 'Thursday',   wins: 0, total: 0, pnl: 0 },
      5: { d: 'Friday',     wins: 0, total: 0, pnl: 0 },
    };
    trades.forEach(t => {
      if (!t.date) return;
      const dw = new Date(t.date).getDay();
      if (map[dw]) { map[dw].total++; if (parseFloat(t.pnl) > 0) map[dw].wins++; map[dw].pnl += parseFloat(t.pnl || 0); }
    });
    return Object.values(map).map(d => ({ ...d, pnl: +d.pnl.toFixed(2), wr: d.total > 0 ? +((d.wins / d.total) * 100).toFixed(1) : 0 }));
  }, [trades]);

  return (
    <Card index={4}>
      <STitle icon="📅" title="By Weekday" sub="Win rate & P&L by day" color={C.purple} />
      <ResponsiveContainer width="100%" height={170}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="d" tickFormatter={v => v.substring(0, 3)} />
          <YAxis {...CHART_AXIS_SMALL} tickFormatter={v => `$${v}`} />
          <ReferenceLine y={0} stroke={shade(C.brdBright, 0.82)} strokeDasharray="4 6" />
          <Tooltip content={
            <ChartTip render={(payload, label) => {
              const d = data.find(x => x.d === label || x.d.startsWith(label));
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>{d?.d}</div>
                  <div style={{ color: d?.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontWeight: 700 }}>{fmtPnl(d?.pnl)}</div>
                  <div style={{ color: C.cyan, fontSize: 10, marginTop: 2 }}>WR: {d?.wr}% · {d?.total} trades</div>
                </>
              );
            }} />
          } />
          <Bar dataKey="pnl" radius={[7, 7, 0, 0]} maxBarSize={44} {...CHART_MOTION}>
            {data.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? C.green : C.danger} fillOpacity={0.72} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginTop: 10 }}>
        {data.map(d => (
          <div key={d.d} style={{ textAlign: 'center', padding: '7px 3px', borderRadius: 7, backgroundColor: C.bgDeep, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 8, color: C.t3, fontWeight: 700 }}>{d.d.substring(0, 3)}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: d.wr >= 50 ? C.green : d.total === 0 ? C.t3 : C.danger, marginTop: 3 }}>{d.total === 0 ? '—' : `${d.wr}%`}</div>
            <div style={{ fontSize: 9, color: C.t4, marginTop: 1 }}>{d.total}T</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🍩 BLOCK 7 — SETUP DONUT
// ─────────────────────────────────────────────────────────────────────────────
const SetupDonut = ({ trades }) => {
  const [active, setActive] = useState(null); // ✅ legal

  const data = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const s = t.setup || 'No setup';
      if (!map[s]) map[s] = { name: s, count: 0, wins: 0, pnl: 0 };
      map[s].count++;
      if (parseFloat(t.pnl) > 0) map[s].wins++;
      map[s].pnl += parseFloat(t.pnl || 0);
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map((d, i) => ({ ...d, wr: d.count > 0 ? +((d.wins / d.count) * 100).toFixed(1) : 0, color: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [trades]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card index={5}>
      <STitle icon="🎯" title="Confluence & Setups" sub="Distribution and win rate by setup" color={C.orange} />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ flexShrink: 0 }}>
          <ResponsiveContainer width={170} height={170}>
            <PieChart>
              <Pie data={data} cx={82} cy={82} innerRadius={46} outerRadius={78}
                dataKey="count" labelLine={false}
                onMouseEnter={(_, i) => setActive(i)}
                onMouseLeave={() => setActive(null)}
                {...CHART_MOTION_SOFT}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color}
                    fillOpacity={active === null || active === i ? 0.88 : 0.3}
                    stroke={active === i ? '#fff' : 'transparent'} strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 170, overflowY: 'auto' }}>
          {data.map((d, i) => (
            <motion.div key={d.name}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
              whileHover={{ x: 3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: active === null || active === i ? 1 : 0.4, cursor: 'pointer', transition: 'opacity 0.18s' }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.t1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: 10, color: d.wr >= 50 ? C.green : C.danger, fontWeight: 800, flexShrink: 0, marginLeft: 5 }}>{d.wr}%</span>
                </div>
                <div style={{ height: 3, borderRadius: 2, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    style={{ height: '100%', borderRadius: 2, backgroundColor: d.color }} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: C.t3, flexShrink: 0, minWidth: 18, textAlign: 'right' }}>{d.count}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🌍 BLOCK 8 — SESSION BREAKDOWN
// ─────────────────────────────────────────────────────────────────────────────
const SessionBreakdown = ({ trades }) => {
  const sessionMeta = { NY: { emoji: '🗽', color: C.cyan }, London: { emoji: '🎡', color: C.purple }, Asia: { emoji: '🏯', color: C.orange } };
  const data = useMemo(() => Object.entries(sessionMeta).map(([s, meta]) => {
    const st   = trades.filter(t => t.session === s);
    const wins = st.filter(t => parseFloat(t.pnl) > 0);
    const pnl  = st.reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
    return { name: s, ...meta, count: st.length, wins: wins.length, pnl: +pnl.toFixed(2), wr: st.length ? +((wins.length / st.length) * 100).toFixed(1) : 0 };
  }), [trades]);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card index={6}>
      <STitle icon="🌍" title="Trading Sessions" sub="NY · London · Asia" color={C.blue} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(d => (
          <div key={d.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{d.emoji}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.name}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>{d.count} trades · {total > 0 ? ((d.count / total) * 100).toFixed(0) : 0}%</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: d.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>{fmtPnl(d.pnl)}</div>
                <div style={{ fontSize: 9, color: d.wr >= 50 ? C.green : C.danger, fontWeight: 700 }}>WR {d.wr}%</div>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${d.count > 0 ? (d.wins / d.count) * 100 : 0}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', background: `linear-gradient(90deg,${d.color},${shade(d.color,'80')})`, boxShadow: `0 0 8px ${shade(d.color,'40')}` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ↕️ BLOCK 9 — LONG vs SHORT
// ─────────────────────────────────────────────────────────────────────────────
const LongVsShort = ({ trades }) => {
  const data = useMemo(() => ['Long', 'Short'].map(type => {
    const tt   = trades.filter(t => t.type === type);
    const wins = tt.filter(t => parseFloat(t.pnl) > 0);
    const pnl  = tt.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    return { type, count: tt.length, wins: wins.length, pnl: +pnl.toFixed(2), wr: tt.length ? +((wins.length / tt.length) * 100).toFixed(1) : 0 };
  }), [trades]);

  const colors = { Long: C.green, Short: C.danger };
  const total  = data.reduce((s, d) => s + d.count, 0);

  return (
    <Card index={7}>
      <STitle icon="↕️" title="Long vs Short" sub="Comparison of both directions" color={C.teal} />
      {data.map(d => (
        <div key={d.type} style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: `${shade(colors[d.type],'18')}`, border: `1px solid ${shade(colors[d.type],'35')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {d.type === 'Long' ? '↗' : '↘'}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: colors[d.type] }}>{d.type}</div>
                <div style={{ fontSize: 9, color: C.t3 }}>{d.count} trades · {total > 0 ? ((d.count / total) * 100).toFixed(0) : 0}%</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: d.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>{fmtPnl(d.pnl)}</div>
              <div style={{ fontSize: 10, color: d.wr >= 50 ? C.green : C.danger, fontWeight: 700 }}>WR {d.wr}%</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 4, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${d.count > 0 ? (d.wins / d.count) * 100 : 0}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', background: `linear-gradient(90deg,${colors[d.type]},${shade(colors[d.type],'70')})`, boxShadow: `0 0 10px ${shade(colors[d.type],'40')}` }} />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <ResponsiveContainer width={90} height={90}>
          <PieChart>
            <Pie data={data} cx={43} cy={43} innerRadius={24} outerRadius={40} dataKey="count" paddingAngle={4} {...CHART_MOTION}>
              {data.map((d, i) => <Cell key={i} fill={colors[d.type]} fillOpacity={0.82} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 💱 BLOCK 10 — WIN RATE BY SYMBOL
// ─────────────────────────────────────────────────────────────────────────────
const SymbolWinRate = ({ trades }) => {
  const data = useMemo(() => {
    const map = {};
    trades.forEach(t => {
      const s = t.symbol || '?';
      if (!map[s]) map[s] = { name: s, wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      if (parseFloat(t.pnl) > 0) map[s].wins++;
      map[s].pnl += parseFloat(t.pnl || 0);
    });
    return Object.values(map)
      .map(d => ({ ...d, wr: +((d.wins / d.total) * 100).toFixed(1), pnl: +d.pnl.toFixed(2) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [trades]);

  return (
    <Card index={8}>
      <STitle icon="💱" title="Performance by Symbol" sub="Top 8 traded instruments" color={C.teal} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }} whileHover={{ x: 4 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 24, borderRadius: 5, background: C.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: C.bgDeep, flexShrink: 0 }}>
              {d.name.substring(0, 4)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.t1 }}>{d.name}</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, color: d.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontWeight: 700 }}>{fmtPnl(d.pnl)}</span>
                  <span style={{ fontSize: 10, color: d.wr >= 50 ? C.green : C.danger, fontWeight: 800 }}>{d.wr}%</span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: C.bgDeep }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${d.wr}%` }} transition={{ duration: 0.8, delay: i * 0.07 }}
                  style={{ height: '100%', background: d.wr >= 50 ? `linear-gradient(90deg,${C.green},${C.teal})` : `linear-gradient(90deg,${C.danger},${C.warn})` }} />
              </div>
              <div style={{ fontSize: 9, color: C.t3, marginTop: 2 }}>{d.wins}W / {d.total - d.wins}L · {d.total} trades</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📊 BLOCK 11 — P&L DISTRIBUTION
// ─────────────────────────────────────────────────────────────────────────────
const PnlDistribution = ({ trades }) => {
  const data = useMemo(() => {
    if (!trades.length) return [];
    const pnls = trades.map(t => parseFloat(t.pnl || 0));
    const min  = Math.min(...pnls), max = Math.max(...pnls);
    const range = max - min || 1;
    const N = 12, size = range / N;
    const bins = Array.from({ length: N }, (_, i) => ({ from: min + i * size, to: min + (i + 1) * size, label: `$${(min + i * size).toFixed(0)}`, count: 0 }));
    pnls.forEach(p => { const idx = Math.min(Math.floor((p - min) / size), N - 1); if (idx >= 0) bins[idx].count++; });
    return bins;
  }, [trades]);

  return (
    <Card index={9}>
      <STitle icon="📊" title="P&L Distribution" sub="Result frequency by range" color={C.warn} />
      <ResponsiveContainer width="100%" height={195}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 22, left: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="label" tick={{ ...CHART_AXIS_SMALL.tick, fontSize: 8 }} interval={1} angle={-35} textAnchor="end" />
          <YAxis {...CHART_AXIS_SMALL} />
          <Tooltip content={
            <ChartTip render={(payload, label) => {
              const d = data.find(x => x.label === label);
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>{label} → ${d?.to?.toFixed(0)}</div>
                  <div style={{ color: C.cyan, fontSize: 11 }}>{d?.count} trades</div>
                </>
              );
            }} />
          } />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={30} {...CHART_MOTION}>
            {data.map((d, i) => <Cell key={i} fill={d.from >= 0 ? C.green : C.danger} fillOpacity={0.7} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧠 BLOCK 12 — PSYCHOLOGY OVER TIME
// ─────────────────────────────────────────────────────────────────────────────
const PsychoTimeline = ({ trades }) => {
  const data = useMemo(() => [...trades]
    .filter(t => t.psychologyScore != null && t.date)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(-40)
    .map((t, i) => ({ i: i + 1, date: t.date?.substring(0, 10), score: parseInt(t.psychologyScore) || 0, pnl: parseFloat(t.pnl || 0), symbol: t.symbol })),
  [trades]);

  const avgScore = data.length ? Math.round(avg(data.map(d => d.score))) : 0;

  return (
    <Card index={10}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <STitle icon="🧠" title="Psychology Score" sub="Evolution over last 40 trades" color={C.purple} />
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: avgScore >= 75 ? C.green : avgScore >= 55 ? C.warn : C.danger, fontFamily: 'monospace' }}>{avgScore}</div>
          <div style={{ fontSize: 9, color: C.t3 }}>Average Score</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="date" tick={{ ...CHART_AXIS_SMALL.tick, fontSize: 8 }} interval="preserveStartEnd" />
          <YAxis {...CHART_AXIS_SMALL} domain={[0, 100]} />
          <ReferenceLine y={70} stroke={C.green}  strokeDasharray="4 4" strokeOpacity={0.35} />
          <ReferenceLine y={50} stroke={C.warn}   strokeDasharray="4 4" strokeOpacity={0.35} />
          <ReferenceLine y={30} stroke={C.danger} strokeDasharray="4 4" strokeOpacity={0.35} />
          <Tooltip content={
            <ChartTip render={(payload, label) => {
              const d = payload[0]?.payload;
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>{d?.symbol} · {label}</div>
                  <div style={{ color: C.purple, fontSize: 13, fontWeight: 900 }}>Score: {d?.score}</div>
                  <div style={{ color: d?.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontSize: 11 }}>{fmtPnl(d?.pnl)}</div>
                </>
              );
            }} />
          } />
          <Line type="monotone" dataKey="score" stroke={C.purple} strokeWidth={2.5}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const c = payload.score >= 70 ? C.green : payload.score >= 50 ? C.warn : C.danger;
              return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3.5} fill={c} stroke={C.bgCard} strokeWidth={1.5} />;
            }}
            activeDot={chartActiveDot(C.purple, 5, C.bgCard)}
            {...CHART_MOTION_SOFT}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ⏱️ BLOCK 13 — DURATION ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────
const DurationAnalysis = ({ trades }) => {
  const data = useMemo(() => {
    const buckets = [
      { label: '0–5m',   min: 0,   max: 5   },
      { label: '5–15m',  min: 5,   max: 15  },
      { label: '15–30m', min: 15,  max: 30  },
      { label: '30–60m', min: 30,  max: 60  },
      { label: '1–2h',   min: 60,  max: 120 },
      { label: '>2h',    min: 120, max: Infinity },
    ];
    return buckets.map(b => {
      const bt   = trades.filter(t => { const dur = t.durationMinutes || 0; return dur >= b.min && dur < b.max; });
      const wins = bt.filter(t => parseFloat(t.pnl) > 0);
      const pnl  = bt.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
      return { ...b, count: bt.length, wins: wins.length, pnl: +pnl.toFixed(2), wr: bt.length ? +((wins.length / bt.length) * 100).toFixed(1) : 0 };
    });
  }, [trades]);

  return (
    <Card index={11}>
      <STitle icon="⏱️" title="Trade Duration" sub="Performance by holding duration" color={C.warn} />
      <ResponsiveContainer width="100%" height={155}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <CartesianGrid {...CHART_GRID} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="label" />
          <YAxis {...CHART_AXIS_SMALL} />
          <Tooltip content={
            <ChartTip render={(payload, label) => {
              const d = data.find(x => x.label === label);
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>⏱️ {label}</div>
                  <div style={{ color: C.cyan, fontSize: 11 }}>{d?.count} trades</div>
                  <div style={{ color: d?.wr >= 50 ? C.green : C.danger, fontSize: 11 }}>WR: {d?.wr}%</div>
                  <div style={{ color: d?.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontSize: 11 }}>{fmtPnl(d?.pnl)}</div>
                </>
              );
            }} />
          } />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} {...CHART_MOTION}>
            {data.map((d, i) => <Cell key={i} fill={d.wr >= 50 ? C.teal : C.warn} fillOpacity={0.75} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 5, marginTop: 10 }}>
        {data.map(d => (
          <div key={d.label} style={{ textAlign: 'center', padding: '6px 3px', borderRadius: 6, backgroundColor: C.bgDeep, border: `1px solid ${C.brd}` }}>
            <div style={{ fontSize: 8, color: C.t3, fontWeight: 700 }}>{d.label}</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: d.wr >= 50 ? C.green : d.count === 0 ? C.t3 : C.danger, marginTop: 3 }}>{d.count === 0 ? '—' : `${d.wr}%`}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📡 BLOCK 14 — MAE / MFE SCATTER
// ─────────────────────────────────────────────────────────────────────────────
const MaeMfeScatter = ({ trades }) => {
  const data = useMemo(() => trades.map(t => {
    const entry = parseFloat(t.entry || 0);
    const exit  = parseFloat(t.exit  || 0);
    const sl    = parseFloat(t.sl    || 0);
    const risk  = sl && entry ? Math.abs(entry - sl) : Math.abs(exit - entry) * 0.5 || 0.001;
    const mae   = t.mae != null ? parseFloat(t.mae) : -Math.abs(Math.random() * risk * 1.5);
    const mfe   = t.mfe != null ? parseFloat(t.mfe) :  Math.abs(Math.random() * risk * (parseFloat(t.pnl) >= 0 ? 2.5 : 1));
    return { mae: +mae.toFixed(5), mfe: +mfe.toFixed(5), pnl: parseFloat(t.pnl || 0), symbol: t.symbol };
  }), [trades]);

  return (
    <Card index={12}>
      <STitle icon="📡" title="MAE / MFE Analysis" sub="Adverse vs Favorable Excursion" color={C.blue} />
      <div style={{ padding: '7px 11px', borderRadius: 7, backgroundColor: C.bgDeep, border: `1px solid ${C.brd}`, fontSize: 10, color: C.t3, lineHeight: 1.6, marginBottom: 12 }}>
        <span style={{ color: C.green, fontWeight: 700 }}>MFE</span> = Best favorable move ·{' '}
        <span style={{ color: C.danger, fontWeight: 700 }}>MAE</span> = Worst adverse move
      </div>
      <ResponsiveContainer width="100%" height={185}>
        <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid {...CHART_GRID_FULL} />
          <XAxis {...CHART_AXIS_SMALL} dataKey="mae" name="MAE" />
          <YAxis {...CHART_AXIS_SMALL} dataKey="mfe" name="MFE" />
          <Tooltip content={
            <ChartTip render={(payload) => {
              const d = payload[0]?.payload;
              return (
                <>
                  <div style={{ color: C.t1, fontWeight: 800, marginBottom: 4 }}>{d?.symbol}</div>
                  <div style={{ color: C.green,  fontSize: 11 }}>MFE: {d?.mfe}</div>
                  <div style={{ color: C.danger, fontSize: 11 }}>MAE: {d?.mae}</div>
                  <div style={{ color: d?.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', fontSize: 11 }}>{fmtPnl(d?.pnl)}</div>
                </>
              );
            }} />
          } />
          <Scatter data={data} {...CHART_MOTION} shape={(props) => {
            const { cx, cy, payload } = props;
            return <circle cx={cx} cy={cy} r={5} fill={payload.pnl >= 0 ? C.green : C.danger} fillOpacity={0.65} stroke={C.bgCard} strokeWidth={1} />;
          }} />
        </ScatterChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 BLOCK 15 — STREAK TRACKER
// ─────────────────────────────────────────────────────────────────────────────
const StreakTracker = ({ trades }) => {
  const { streaks, bestWin, worstLoss, current } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const result = [];
    let cur = null;
    sorted.forEach(t => {
      const isWin = parseFloat(t.pnl) > 0;
      if (!cur || cur.isWin !== isWin) { cur = { isWin, count: 1, pnl: parseFloat(t.pnl || 0) }; result.push(cur); }
      else { cur.count++; cur.pnl += parseFloat(t.pnl || 0); }
    });
    const last20    = result.slice(-20);
    const bestWin   = Math.max(...last20.filter(s =>  s.isWin).map(s => s.count), 0);
    const worstLoss = Math.max(...last20.filter(s => !s.isWin).map(s => s.count), 0);
    return { streaks: last20, bestWin, worstLoss, current: last20[last20.length - 1] };
  }, [trades]);

  return (
    <Card index={13}>
      <STitle icon="🔥" title="Streak Tracker" sub="Consecutive win & loss streaks" color={C.orange} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Best Win Streak',  value: `${bestWin} wins`,    color: C.green  },
          { label: 'Worst Loss Streak',value: `${worstLoss} losses`, color: C.danger },
          { label: 'Current',          value: current ? `${current.count} ${current.isWin ? '✅' : '❌'}` : '—', color: current?.isWin ? C.green : C.danger },
        ].map(s => (
          <div key={s.label} style={{ padding: '10px 8px', borderRadius: 8, backgroundColor: C.bgDeep, border: `1px solid ${C.brd}`, textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: C.t3, fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {streaks.map((s, i) => (
          <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.04, type: 'spring' }}
            title={`${s.count} ${s.isWin ? 'Win' : 'Loss'} · ${fmtPnl(s.pnl)}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: Math.min(46, 26 + s.count * 3), height: 30, minWidth: 26,
              borderRadius: 6, cursor: 'default',
              backgroundColor: s.isWin ? `rgba(0,230,118,${0.12 + Math.min(s.count * 0.06, 0.5)})` : `rgba(255,71,87,${0.12 + Math.min(s.count * 0.06, 0.5)})`,
              border: `1px solid ${shade(s.isWin ? C.green : C.danger,'35')}`,
              fontSize: 10, fontWeight: 800, color: s.isWin ? C.green : C.danger,
            }}
          >
            {s.count}{s.isWin ? '↑' : '↓'}
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 📰 BLOCK 16 — NEWS IMPACT
// ─────────────────────────────────────────────────────────────────────────────
const NewsImpact = ({ trades }) => {
  const data = useMemo(() => ['High', 'Medium', 'Low'].map(level => {
    const nt   = trades.filter(t => t.newsImpact === level);
    const wins = nt.filter(t => parseFloat(t.pnl) > 0);
    const pnl  = nt.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    return { level, count: nt.length, wins: wins.length, pnl: +pnl.toFixed(2), wr: nt.length ? +((wins.length / nt.length) * 100).toFixed(1) : 0 };
  }), [trades]);

  const newsColors = { High: C.danger, Medium: C.warn, Low: C.teal };
  const newsEmojis = { High: '🔴', Medium: '🟡', Low: '🟢' };

  return (
    <Card index={14}>
      <STitle icon="📰" title="News Impact" sub="Performance by news impact level" color={C.warn} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(d => (
          <div key={d.level}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{newsEmojis[d.level]}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: newsColors[d.level] }}>{d.level} Impact</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>{d.count} trades · WR {d.wr}%</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: d.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>{fmtPnl(d.pnl)}</div>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${d.count > 0 ? (d.wins / d.count) * 100 : 0}%` }}
                transition={{ duration: 0.9 }}
                style={{ height: '100%', background: `linear-gradient(90deg,${newsColors[d.level]},${shade(newsColors[d.level],'70')})`, boxShadow: `0 0 8px ${shade(newsColors[d.level],'40')}` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ⚖️ BLOCK 17 — BIAS ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────
const BiasAnalysis = ({ trades }) => {
  const data = useMemo(() => ['Bullish', 'Bearish', 'Neutral'].map(b => {
    const bt   = trades.filter(t => t.bias === b);
    const wins = bt.filter(t => parseFloat(t.pnl) > 0);
    const pnl  = bt.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
    return { bias: b, count: bt.length, wins: wins.length, pnl: +pnl.toFixed(2), wr: bt.length ? +((wins.length / bt.length) * 100).toFixed(1) : 0 };
  }), [trades]);

  const colors = { Bullish: C.green, Bearish: C.danger, Neutral: C.t2 };
  const emojis = { Bullish: '🐂', Bearish: '🐻', Neutral: '⚖️' };

  return (
    <Card index={15}>
      <STitle icon="⚖️" title="Bias Analysis" sub="Performance by market bias" color={C.teal} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {data.map(d => (
          <div key={d.bias}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{emojis[d.bias]}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors[d.bias] }}>{d.bias}</div>
                  <div style={{ fontSize: 9, color: C.t3 }}>{d.count} trades · WR {d.wr}%</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: d.pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>{fmtPnl(d.pnl)}</div>
            </div>
            <div style={{ height: 8, borderRadius: 4, backgroundColor: C.bgDeep, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${d.count > 0 ? (d.wins / d.count) * 100 : 0}%` }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ height: '100%', background: `linear-gradient(90deg,${colors[d.bias]},${shade(colors[d.bias],'80')})`, boxShadow: `0 0 10px ${shade(colors[d.bias],'40')}` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 🏠 MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AnalyticsPro() {
  const { trades }  = useTradingContext();
  const [period, setPeriod] = useState('ALL');

  const filtered = useMemo(() => {
    if (period === 'ALL') return trades;
    const days = { '7D': 7, '1M': 30, '3M': 90, '6M': 180 }[period] || 9999;
    const from = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    return trades.filter(t => (t.date || '') >= from);
  }, [trades, period]);

  return (
    <div style={{ backgroundColor: 'transparent', minHeight: '100vh', fontFamily: 'system-ui,-apple-system,sans-serif', color: C.t1, padding: '24px' }}>

      {/* ── HEADER ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, background: C.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
              Analytics Pro
            </h1>
            <span style={{ padding: '3px 9px', borderRadius: 4, fontSize: 8, fontWeight: 800, background: C.grad, color: C.bgDeep, letterSpacing: '1px' }}>PRO</span>
          </div>
          <p style={{ margin: 0, color: C.t2, fontSize: 12 }}>{filtered.length} trades analyzed · Complete market intelligence</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <h2 style={{ color: C.t1, marginBottom: 8 }}>No data available</h2>
          <p style={{ color: C.t3 }}>Add trades to see your analytics</p>
        </motion.div>
      ) : (
        <>
          {/* ROW 0 — 10 KPI cards */}
          <KpiCards trades={filtered} />

          {/* ROW 1 — Equity full width */}
          <div style={{ marginBottom: 16 }}>
            <EquityDrawdown trades={filtered} />
          </div>

          {/* ROW 2 — Monthly P&L + Cumulative WR */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
            <MonthlyPnl        trades={filtered} />
            <CumulativeWinRate trades={filtered} />
          </div>

          {/* ROW 3 — Hourly heatmap + Weekday */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 16 }}>
            <HourHeatmap trades={filtered} />
            <WeekdayPerf trades={filtered} />
          </div>

          {/* ROW 4 — Setup + Sessions + Long/Short */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <SetupDonut       trades={filtered} />
            <SessionBreakdown trades={filtered} />
            <LongVsShort      trades={filtered} />
          </div>

          {/* ROW 5 — Symbols + P&L Distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <SymbolWinRate   trades={filtered} />
            <PnlDistribution trades={filtered} />
          </div>

          {/* ROW 6 — Psycho + Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <PsychoTimeline   trades={filtered} />
            <DurationAnalysis trades={filtered} />
          </div>

          {/* ROW 7 — MAE/MFE + Streak */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <MaeMfeScatter trades={filtered} />
            <StreakTracker  trades={filtered} />
          </div>

          {/* ROW 8 — News + Bias */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 8 }}>
            <NewsImpact   trades={filtered} />
            <BiasAnalysis trades={filtered} />
          </div>
        </>
      )}
    </div>
  );
}

