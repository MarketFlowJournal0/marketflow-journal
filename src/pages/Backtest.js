import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  CHART_AXIS_SMALL,
  CHART_GRID,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';
import {
  buildEquityDrawdownSeries,
  formatAnalyticsMoney,
  formatAnalyticsPercent,
  getTradeDateLabel,
  getTradeDateValue,
  getTradePnl,
  normalizeSessionLabel,
  summarizeTradeSet,
} from '../lib/marketflowAnalytics';

const C = {
  bg: 'var(--mf-bg,#030508)',
  card: 'var(--mf-card,#0C1422)',
  deep: 'var(--mf-deep,#07090F)',
  accent: 'var(--mf-accent,#06E6FF)',
  accentSoft: 'var(--mf-accent-secondary,#66F0FF)',
  green: 'var(--mf-green,#00FF88)',
  teal: 'var(--mf-teal,#00F5D4)',
  blue: 'var(--mf-blue,#4D7CFF)',
  purple: 'var(--mf-purple,#A78BFA)',
  gold: 'var(--mf-gold,#FFD700)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
  borderHi: 'var(--mf-border-hi,#1E2E48)',
};

const PAGE_STYLES = `
  @keyframes mfBacktestGlowA {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.12; }
    50% { transform: translate3d(24px, 16px, 0) scale(1.04); opacity: 0.18; }
  }

  @keyframes mfBacktestGlowB {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.08; }
    50% { transform: translate3d(-18px, -12px, 0) scale(1.03); opacity: 0.12; }
  }

  .mf-backtest-page {
    position: relative;
    min-height: 100%;
    color: ${C.text1};
  }

  .mf-backtest-top-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.82fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .mf-backtest-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.78fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .mf-backtest-grid-two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 1180px) {
    .mf-backtest-top-grid,
    .mf-backtest-main-grid,
    .mf-backtest-grid-two {
      grid-template-columns: 1fr;
    }
  }
`;

const fadeUp = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: (index = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.46,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const CHECKLIST_TEMPLATE = [
  'Mark the key level before opening the replay.',
  'Write the setup trigger you are testing.',
  'Define the invalidation before entry.',
  'Review outcome only after the replay decision.',
];

function panelMotion(index = 0) {
  return {
    variants: fadeUp,
    initial: 'hidden',
    animate: 'visible',
    custom: index,
  };
}

function SectionCard({ children, tone = C.accent, index = 0, style = {} }) {
  return (
    <motion.section
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.12)}`,
        background: 'linear-gradient(180deg, rgba(10,17,28,0.94), rgba(8,13,22,0.98))',
        boxShadow: `0 24px 48px rgba(0,0,0,0.18), 0 0 0 1px ${shade(tone, 0.05)}`,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', top: -120, right: -120, width: 260, height: 260, borderRadius: '50%', background: `radial-gradient(circle, ${shade(tone, 0.16)}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, action = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        {eyebrow ? (
          <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>
            {eyebrow}
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 3, height: 18, borderRadius: 999, background: `linear-gradient(180deg, ${tone}, ${shade(tone, 0.44)})` }} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '-0.03em', color: C.text0 }}>
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricTile({ label, value, caption, tone = C.accent }) {
  return (
    <div style={{ padding: '15px 15px 14px', borderRadius: 18, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.text2 }}>
        {caption}
      </div>
    </div>
  );
}

function CheckGlyph({ color = C.green }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.2 6.2 4.7 8.55 9.8 3.55" />
    </svg>
  );
}

function ChartTooltip({ active, payload, label, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...chartTooltipStyle(payload[0]?.color || C.accent), padding: '10px 12px' }}>
      {render ? render(payload, label) : null}
    </div>
  );
}

function buildBreakdown(trades = [], getKey, limit = 6) {
  const bucket = new Map();
  trades.forEach((trade) => {
    const key = getKey(trade);
    if (!key) return;
    const current = bucket.get(key) || { label: key, trades: 0, wins: 0, pnl: 0 };
    const pnl = getTradePnl(trade);
    current.trades += 1;
    current.pnl += pnl;
    if (pnl > 0) current.wins += 1;
    bucket.set(key, current);
  });

  return [...bucket.values()]
    .map((item) => ({
      ...item,
      pnl: Number(item.pnl.toFixed(2)),
      winRate: item.trades ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.pnl - left.pnl)
    .slice(0, limit);
}

function buildRecentRows(trades = []) {
  return [...trades]
    .sort((left, right) => (getTradeDateValue(right)?.getTime() || 0) - (getTradeDateValue(left)?.getTime() || 0))
    .slice(0, 8)
    .map((trade) => ({
      id: trade.id,
      dateLabel: getTradeDateLabel(trade),
      symbol: trade.symbol || trade.pair || 'Unknown',
      setup: trade.setup || 'Unlabeled',
      session: normalizeSessionLabel(trade.session),
      pnl: getTradePnl(trade),
      result: trade.status || (getTradePnl(trade) > 0 ? 'TP' : getTradePnl(trade) < 0 ? 'SL' : 'BE'),
    }));
}

function toTradingViewSymbol(symbol = 'EURUSD') {
  const clean = String(symbol || 'EURUSD').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean) return 'OANDA:EURUSD';
  if (clean === 'BTCUSD') return 'BITSTAMP:BTCUSD';
  if (clean === 'ETHUSD') return 'BITSTAMP:ETHUSD';
  if (clean === 'US30') return 'FOREXCOM:US30';
  if (clean === 'NAS100') return 'FOREXCOM:NSXUSD';
  if (clean === 'XAUUSD') return 'OANDA:XAUUSD';
  if (clean.length === 6) return `OANDA:${clean}`;
  return `OANDA:${clean}`;
}

function TradingViewEmbed({ symbol, interval }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;

    host.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTradingViewSymbol(symbol),
      interval,
      timezone: 'Europe/Paris',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      details: false,
      hotlist: false,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      support_host: 'https://www.tradingview.com',
    });

    host.appendChild(script);
    return () => {
      if (host) host.innerHTML = '';
    };
  }, [interval, symbol]);

  return (
    <div style={{ height: 500, borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

function RankedBarList({ eyebrow, title, tone, rows, index = 0 }) {
  const maxAbs = Math.max(1, ...rows.map((row) => Math.abs(row.pnl) || row.trades || 1));
  return (
    <SectionCard tone={tone} index={index} style={{ padding: '22px 22px 18px' }}>
      <SectionTitle eyebrow={eyebrow} title={title} tone={tone} />
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.length ? rows.map((row) => {
          const fill = Math.max(10, (Math.abs(row.pnl) / maxAbs) * 100);
          const rowTone = row.pnl >= 0 ? tone : C.danger;
          return (
            <div key={row.label} style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(rowTone, 0.12)}`, background: 'rgba(255,255,255,0.025)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: C.text0 }}>{row.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: row.pnl >= 0 ? C.green : row.pnl < 0 ? C.danger : C.text2 }}>{formatAnalyticsMoney(row.pnl)}</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 8 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(rowTone, 0.46)}, ${rowTone})` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 10.5, color: C.text2 }}>
                <span>{row.trades} trades</span>
                <span>{formatAnalyticsPercent(row.winRate, 1)} win rate</span>
              </div>
            </div>
          );
        }) : (
          <div style={{ padding: '14px', borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 11, color: C.text2 }}>
            No data in scope yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function Backtest() {
  const { trades, activeAccount, accountOptions } = useTradingContext();
  const [mode, setMode] = useState('auto');
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [selectedSetup, setSelectedSetup] = useState('all');
  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedInterval, setSelectedInterval] = useState('60');
  const [checklist, setChecklist] = useState(CHECKLIST_TEMPLATE.map((label, index) => ({ id: index + 1, label, done: false })));

  const symbolRows = useMemo(() => buildBreakdown(trades, (trade) => String(trade.symbol || trade.pair || '').trim(), 8), [trades]);
  const setupRows = useMemo(() => buildBreakdown(trades, (trade) => String(trade.setup || '').trim(), 8), [trades]);
  const sessionRows = useMemo(() => buildBreakdown(trades, (trade) => normalizeSessionLabel(trade.session), 4), [trades]);
  const bestPlaybook = useMemo(() => {
    const rows = trades.reduce((list, trade) => {
      const symbol = trade.symbol || trade.pair || 'Unknown';
      const setup = trade.setup || 'Unlabeled';
      const key = `${symbol}__${setup}`;
      const existing = list.get(key) || { key, symbol, setup, trades: 0, wins: 0, pnl: 0 };
      const pnl = getTradePnl(trade);
      existing.trades += 1;
      existing.pnl += pnl;
      if (pnl > 0) existing.wins += 1;
      list.set(key, existing);
      return list;
    }, new Map());

    return [...rows.values()]
      .map((row) => ({
        ...row,
        pnl: Number(row.pnl.toFixed(2)),
        winRate: row.trades ? Number(((row.wins / row.trades) * 100).toFixed(1)) : 0,
      }))
      .filter((row) => row.trades >= 2)
      .sort((left, right) => {
        if (right.pnl !== left.pnl) return right.pnl - left.pnl;
        return right.winRate - left.winRate;
      })[0] || null;
  }, [trades]);

  useEffect(() => {
    if (mode !== 'auto' || !bestPlaybook) return;
    setSelectedSymbol(bestPlaybook.symbol || 'all');
    setSelectedSetup(bestPlaybook.setup || 'all');
  }, [bestPlaybook, mode]);

  const scopeLabel = useMemo(() => {
    return accountOptions.find((item) => item.id === activeAccount)?.label || 'All Accounts';
  }, [accountOptions, activeAccount]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      const symbol = trade.symbol || trade.pair || 'Unknown';
      const setup = trade.setup || 'Unlabeled';
      const session = normalizeSessionLabel(trade.session);
      if (selectedSymbol !== 'all' && symbol !== selectedSymbol) return false;
      if (selectedSetup !== 'all' && setup !== selectedSetup) return false;
      if (selectedSession !== 'all' && session !== selectedSession) return false;
      return true;
    });
  }, [selectedSession, selectedSetup, selectedSymbol, trades]);

  const summary = useMemo(() => summarizeTradeSet(filteredTrades), [filteredTrades]);
  const equitySeries = useMemo(() => buildEquityDrawdownSeries(filteredTrades), [filteredTrades]);
  const recentRows = useMemo(() => buildRecentRows(filteredTrades), [filteredTrades]);
  const filteredSetups = useMemo(() => buildBreakdown(filteredTrades, (trade) => String(trade.setup || '').trim(), 6), [filteredTrades]);
  const nextObjective = summary.winRate < 50
    ? 'Tighten the trigger before increasing sample size.'
    : summary.avgRR && summary.avgRR < 1.4
      ? 'Keep the same hit rate and push the average winner further.'
      : 'Add more clean samples before changing the playbook.';

  const toggleChecklist = (id) => {
    setChecklist((current) => current.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    )));
  };

  const checklistProgress = checklist.length
    ? Math.round((checklist.filter((item) => item.done).length / checklist.length) * 100)
    : 0;

  const symbolOptions = ['all', ...symbolRows.map((row) => row.label)];
  const setupOptions = ['all', ...setupRows.map((row) => row.label)];
  const sessionOptions = ['all', ...sessionRows.map((row) => row.label)];
  const primarySymbol = selectedSymbol === 'all'
    ? (bestPlaybook?.symbol || symbolRows[0]?.label || 'EURUSD')
    : selectedSymbol;

  return (
    <div className="mf-backtest-page" style={{ minHeight: '100vh', padding: '28px 24px 48px', position: 'relative', overflow: 'hidden' }}>
      <style>{PAGE_STYLES}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '14%', width: 520, height: 340, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.08) 0%, transparent 72%)', filter: 'blur(42px)', animation: 'mfBacktestGlowA 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: 0, width: 500, height: 320, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255), 0.06) 0%, transparent 72%)', filter: 'blur(46px)', animation: 'mfBacktestGlowB 22s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1480, margin: '0 auto' }}>
        <div className="mf-backtest-top-grid">
          <SectionCard tone={C.accent} index={0} style={{ padding: '24px 24px 22px' }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
              Backtest
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 3.6vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.06em', color: C.text0 }}>
                  <span style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, var(--mf-accent,#06E6FF) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Backtest</span>
                </h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <div style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.accent, 0.2)}`, background: 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
                    {scopeLabel}
                  </div>
                  <div style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text2 }}>
                    {filteredTrades.length} samples
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'rgba(7,12,20,0.82)', borderRadius: 12, border: `1px solid ${C.border}` }}>
                {[
                  { id: 'auto', label: 'Auto' },
                  { id: 'manual', label: 'Manual' },
                ].map((item) => {
                  const active = mode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      style={{
                        padding: '6px 13px',
                        borderRadius: 9,
                        fontSize: 11,
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        background: active ? 'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.94), rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.9))' : 'transparent',
                        color: active ? C.deep : C.text3,
                        boxShadow: active ? `0 10px 22px ${shade(C.accent, 0.18)}` : 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mf-backtest-grid-two" style={{ marginTop: 18, marginBottom: 0 }}>
              <MetricTile label="Net P&L" value={formatAnalyticsMoney(summary.totalPnL)} caption={`${formatAnalyticsPercent(summary.winRate, 1)} win rate`} tone={summary.totalPnL >= 0 ? C.green : C.danger} />
              <MetricTile label="Profit factor" value={Number.isFinite(summary.profitFactor) ? summary.profitFactor.toFixed(2) : 'Inf'} caption="Gross win vs gross loss" tone={C.blue} />
            </div>
          </SectionCard>

          <SectionCard tone={C.accent} index={1} style={{ padding: '20px' }}>
            <SectionTitle eyebrow="Playbook" title="Scope" tone={C.accent} />
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Symbol" value={selectedSymbol} onChange={setSelectedSymbol} options={symbolOptions} disabled={mode === 'auto'} />
              <Field label="Setup" value={selectedSetup} onChange={setSelectedSetup} options={setupOptions} disabled={mode === 'auto'} />
              <Field label="Session" value={selectedSession} onChange={setSelectedSession} options={sessionOptions} />
              <Field label="Interval" value={selectedInterval} onChange={setSelectedInterval} options={['15', '30', '60', '240', 'D']} />
            </div>
            <div style={{ marginTop: 14, padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.blue, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                Auto mode
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text0 }}>
                {bestPlaybook ? `${bestPlaybook.symbol} / ${bestPlaybook.setup}` : 'Waiting for enough samples'}
              </div>
              <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>
                {bestPlaybook ? `${bestPlaybook.trades} trades / ${formatAnalyticsPercent(bestPlaybook.winRate, 1)} / ${formatAnalyticsMoney(bestPlaybook.pnl)}` : 'Need at least two trades on the same playbook.'}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mf-backtest-main-grid">
          <SectionCard tone={C.accent} index={2} style={{ padding: '22px 22px 18px' }}>
            <SectionTitle eyebrow="Replay" title="Chart" tone={C.accent} />
            <TradingViewEmbed symbol={primarySymbol} interval={selectedInterval} />
          </SectionCard>

          <SectionCard tone={C.accent} index={3} style={{ padding: '22px 22px 18px' }}>
            <SectionTitle eyebrow="Checklist" title="Checklist" tone={C.accent} />
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 12px 11px',
                    borderRadius: 16,
                    border: `1px solid ${item.done ? shade(C.green, 0.18) : C.border}`,
                    background: item.done ? 'rgba(var(--mf-green-rgb, 0, 255, 136),0.07)' : 'rgba(255,255,255,0.025)',
                    color: item.done ? C.text1 : C.text2,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: 7, border: `1px solid ${item.done ? shade(C.green, 0.24) : C.border}`, background: item.done ? shade(C.green, 0.16) : 'rgba(255,255,255,0.02)', color: item.done ? C.green : C.text3, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900, fontSize: 12 }}>
                    {item.done ? <CheckGlyph /> : null}
                  </span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5 }}>{item.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.accent, 0.14)}`, background: 'rgba(255,255,255,0.025)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>Progress</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: checklistProgress >= 100 ? C.green : C.accent }}>{checklistProgress}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${checklistProgress}%` }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(C.accent, 0.54)}, ${C.accent})` }} />
              </div>
            </div>
            <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.blue, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>
                Next move
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.text1 }}>
                {nextObjective}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mf-backtest-grid-two">
          <SectionCard tone={summary.totalPnL >= 0 ? C.green : C.danger} index={4} style={{ padding: '22px 22px 18px' }}>
            <SectionTitle eyebrow="Curve" title="Equity" tone={summary.totalPnL >= 0 ? C.green : C.danger} />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={equitySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="mf-backtest-equity" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={C.green} stopOpacity={0.42} />
                    <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID} />
                <XAxis {...CHART_AXIS_SMALL} dataKey="dateLabel" hide={equitySeries.length > 12} />
                <YAxis {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  cursor={chartCursor(C.green)}
                  content={(
                    <ChartTooltip
                      render={(payload, label) => {
                        const row = equitySeries.find((item) => item.dateLabel === label);
                        return (
                          <>
                            <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.dateLabel}</div>
                            <div style={{ color: C.green, fontWeight: 700 }}>Equity: {formatAnalyticsMoney(row?.equity || 0)}</div>
                            <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.symbol || '--'} / {row?.session || 'Other'}</div>
                          </>
                        );
                      }}
                    />
                  )}
                />
                <Area type="monotone" dataKey="equity" stroke={C.green} fill="url(#mf-backtest-equity)" strokeWidth={2.6} activeDot={chartActiveDot(C.green, 4)} {...CHART_MOTION_SOFT} />
              </AreaChart>
            </ResponsiveContainer>
          </SectionCard>

          <RankedBarList eyebrow="Playbook" title="Setups" tone={C.orange} rows={filteredSetups} index={5} />
        </div>

        <div className="mf-backtest-grid-two">
          <RankedBarList eyebrow="Scope" title="Symbols" tone={C.blue} rows={symbolRows} index={6} />

          <SectionCard tone={C.accent} index={7} style={{ padding: '22px 22px 18px' }}>
            <SectionTitle eyebrow="Evidence" title="Recent trades" tone={C.accent} />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr>
                    {['Date', 'Pair', 'Setup', 'Session', 'Result', 'P&L'].map((header) => (
                      <th key={header} style={{ padding: '0 8px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, textAlign: header === 'P&L' ? 'right' : 'left', borderBottom: `1px solid ${C.border}` }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((row) => {
                    const pnlTone = row.pnl >= 0 ? C.green : row.pnl < 0 ? C.danger : C.text2;
                    const resultTone = row.result === 'TP' ? C.green : row.result === 'SL' ? C.danger : row.result === 'BE' ? C.warn : C.text2;
                    return (
                      <tr key={row.id}>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2 }}>{row.dateLabel}</td>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: C.text0 }}>{row.symbol}</td>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text1 }}>{row.setup}</td>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2 }}>{row.session}</td>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11, fontWeight: 800, color: resultTone }}>{row.result}</td>
                        <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: pnlTone, textAlign: 'right' }}>{formatAnalyticsMoney(row.pnl)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, options, disabled = false }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '11px 12px',
          borderRadius: 12,
          border: `1px solid ${disabled ? shade(C.border, 0.86) : C.border}`,
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
          color: disabled ? C.text3 : C.text1,
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'all' ? 'All' : option}
          </option>
        ))}
      </select>
    </label>
  );
}
