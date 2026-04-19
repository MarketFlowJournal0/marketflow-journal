import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  CHART_AXIS,
  CHART_AXIS_SMALL,
  CHART_GRID,
  CHART_MOTION,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';
import {
  buildEquityDrawdownSeries,
  buildHourWinRateSeries,
  buildRollingWinRateSeries,
  buildSessionWinRateSeries,
  buildWinRateInsights,
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
  pink: 'var(--mf-pink,#FB7185)',
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
  @keyframes mfAnalyticsGlowA {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.12; }
    50% { transform: translate3d(22px, 18px, 0) scale(1.04); opacity: 0.2; }
  }

  @keyframes mfAnalyticsGlowB {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.08; }
    50% { transform: translate3d(-20px, -14px, 0) scale(1.03); opacity: 0.14; }
  }

  .mf-analytics-page {
    position: relative;
    min-height: 100%;
    color: ${C.text1};
  }

  .mf-analytics-top-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.82fr);
    gap: 16px;
    margin-bottom: 18px;
  }

  .mf-analytics-metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-top: 18px;
  }

  .mf-analytics-grid-two {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .mf-analytics-grid-three {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .mf-analytics-grid-one {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
  }

  @media (max-width: 1320px) {
    .mf-analytics-metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1160px) {
    .mf-analytics-top-grid,
    .mf-analytics-grid-two,
    .mf-analytics-grid-three {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    .mf-analytics-metric-grid {
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

const SECTION_OPTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'general', label: 'General' },
  { id: 'confluences', label: 'Confluences' },
  { id: 'long-short', label: 'Long vs Short' },
  { id: 'heatmaps', label: 'Heatmaps' },
  { id: 'trades', label: 'Trades' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function panelMotion(index = 0) {
  return {
    variants: fadeUp,
    initial: 'hidden',
    animate: 'visible',
    custom: index,
  };
}

function cardStyle(tone = C.accent) {
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    border: `1px solid ${shade(tone, 0.12)}`,
    background: 'linear-gradient(180deg, rgba(10,17,28,0.94), rgba(8,13,22,0.98))',
    boxShadow: `0 24px 48px rgba(0,0,0,0.18), 0 0 0 1px ${shade(tone, 0.05)}`,
  };
}

function SectionCard({ children, tone = C.accent, index = 0, style = {} }) {
  return (
    <motion.section {...panelMotion(index)} style={{ ...cardStyle(tone), ...style }}>
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
    <div style={{ padding: '16px 16px 15px', borderRadius: 18, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.text2 }}>
        {caption}
      </div>
    </div>
  );
}

function SegmentedControl({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
      {SECTION_OPTIONS.map((item) => {
        const active = value === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: `1px solid ${active ? shade(C.accent, 0.26) : C.border}`,
              background: active ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.1)' : 'rgba(255,255,255,0.02)',
              color: active ? C.accent : C.text2,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.18s ease',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartTooltip({ active, payload, label, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...chartTooltipStyle(payload[0]?.color || C.accent), padding: '10px 12px' }}>
      {render ? render(payload, label) : (
        <>
          <div style={{ color: C.text3, fontWeight: 700, marginBottom: 5 }}>{label}</div>
          {payload.map((row, index) => (
            <div key={`${row.name}-${index}`} style={{ color: row.color || C.text1, fontWeight: 700 }}>
              {row.name}: {row.value}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function EmptyAnalyticsState() {
  return (
    <motion.div {...panelMotion(1)} style={{ textAlign: 'center', padding: '86px 24px', ...cardStyle(C.accent) }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ width: 54, height: 54, borderRadius: 20, border: `1px solid ${shade(C.accent, 0.18)}`, background: `linear-gradient(135deg, ${shade(C.accent, 0.18)}, ${shade(C.accent, 0.06)})`, boxShadow: `0 0 26px ${shade(C.accent, 0.16)}` }} />
      </div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: C.text0 }}>
        No analytics yet
      </h2>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: C.text2 }}>
        Import trades to start.
      </p>
    </motion.div>
  );
}

function formatCompactMoney(value) {
  return formatAnalyticsMoney(value, 0);
}

function formatNumber(value, digits = 1) {
  const numeric = Number(value) || 0;
  return numeric.toFixed(digits);
}

function buildMonthlySeries(trades = []) {
  const bucket = new Map();
  trades.forEach((trade) => {
    const date = getTradeDateValue(trade);
    if (!date) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const current = bucket.get(key) || { key, label, trades: 0, wins: 0, pnl: 0 };
    const pnl = getTradePnl(trade);
    current.trades += 1;
    current.pnl += pnl;
    if (pnl > 0) current.wins += 1;
    bucket.set(key, current);
  });

  return [...bucket.values()]
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((item) => ({
      ...item,
      pnl: Number(item.pnl.toFixed(2)),
      winRate: item.trades ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
    }));
}

function buildWeekdaySeries(trades = []) {
  const base = WEEKDAY_LABELS.map((label, day) => ({
    label,
    day,
    trades: 0,
    wins: 0,
    pnl: 0,
  }));

  trades.forEach((trade) => {
    const date = getTradeDateValue(trade);
    if (!date) return;
    const row = base[date.getDay()];
    const pnl = getTradePnl(trade);
    row.trades += 1;
    row.pnl += pnl;
    if (pnl > 0) row.wins += 1;
  });

  return base.map((item) => ({
    ...item,
    pnl: Number(item.pnl.toFixed(2)),
    winRate: item.trades ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
  }));
}

function buildSimpleBreakdown(trades = [], getKey, limit = 6) {
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

function buildLongShortSeries(trades = []) {
  const rows = {
    Long: { label: 'Long', trades: 0, wins: 0, pnl: 0 },
    Short: { label: 'Short', trades: 0, wins: 0, pnl: 0 },
  };

  trades.forEach((trade) => {
    const side = String(trade.direction || trade.type || '').toLowerCase().includes('short') ? 'Short' : 'Long';
    const row = rows[side];
    const pnl = getTradePnl(trade);
    row.trades += 1;
    row.pnl += pnl;
    if (pnl > 0) row.wins += 1;
  });

  return Object.values(rows).map((item) => ({
    ...item,
    pnl: Number(item.pnl.toFixed(2)),
    winRate: item.trades ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
  }));
}

function buildConfluenceSeries(trades = []) {
  const bucket = new Map();

  trades.forEach((trade) => {
    const raw = trade.confluences;
    let tags = [];
    if (Array.isArray(raw)) tags = raw;
    else if (typeof raw === 'string') tags = raw.split(/[;,]/).map((item) => item.trim()).filter(Boolean);
    if (!tags.length && trade.setup) tags = [String(trade.setup).trim()];

    tags.forEach((tag) => {
      if (!tag) return;
      const current = bucket.get(tag) || { label: tag, trades: 0, wins: 0, pnl: 0 };
      const pnl = getTradePnl(trade);
      current.trades += 1;
      current.pnl += pnl;
      if (pnl > 0) current.wins += 1;
      bucket.set(tag, current);
    });
  });

  return [...bucket.values()]
    .map((item) => ({
      ...item,
      pnl: Number(item.pnl.toFixed(2)),
      winRate: item.trades ? Number(((item.wins / item.trades) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.trades - left.trades)
    .slice(0, 6);
}

function buildRecentTradeRows(trades = []) {
  return [...trades]
    .sort((left, right) => (getTradeDateValue(right)?.getTime() || 0) - (getTradeDateValue(left)?.getTime() || 0))
    .slice(0, 8)
    .map((trade) => ({
      id: trade.id,
      dateLabel: getTradeDateLabel(trade),
      symbol: trade.symbol || trade.pair || 'Unknown',
      side: trade.direction || trade.type || 'Long',
      session: normalizeSessionLabel(trade.session),
      setup: trade.setup || 'Unlabeled',
      pnl: getTradePnl(trade),
      status: trade.status || (getTradePnl(trade) > 0 ? 'TP' : getTradePnl(trade) < 0 ? 'SL' : 'BE'),
    }));
}

function OverviewSection({ summary, equitySeries, rollingSeries, insights }) {
  const metricItems = [
    { label: 'Net P&L', value: formatCompactMoney(summary.totalPnL), caption: `${summary.totalTrades} closed trades`, tone: summary.totalPnL >= 0 ? C.green : C.danger },
    { label: 'Win rate', value: formatAnalyticsPercent(summary.winRate, 1), caption: `${summary.wins} wins / ${summary.losses} losses`, tone: C.accent },
    { label: 'Profit factor', value: Number.isFinite(summary.profitFactor) ? formatNumber(summary.profitFactor, 2) : 'Inf', caption: 'Gross win vs gross loss', tone: C.blue },
    { label: 'Avg R:R', value: summary.avgRR ? `1:${formatNumber(summary.avgRR, 2)}` : '--', caption: 'Realized average', tone: C.purple },
  ];

  return (
    <>
      <div className="mf-analytics-grid-one">
        <SectionCard tone={C.accent} index={2} style={{ padding: '22px 22px 18px' }}>
          <SectionTitle eyebrow="Overview" title="Core" tone={C.accent} />
          <div className="mf-analytics-metric-grid" style={{ marginTop: 0 }}>
            {metricItems.map((item) => (
              <MetricTile key={item.label} {...item} />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mf-analytics-grid-two">
        <SectionCard tone={summary.totalPnL >= 0 ? C.green : C.danger} index={3} style={{ padding: '22px 22px 18px' }}>
          <SectionTitle eyebrow="Equity" title="Curve" tone={summary.totalPnL >= 0 ? C.green : C.danger} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
            <MetricTile label="Net P&L" value={formatCompactMoney(summary.totalPnL)} caption="Realized" tone={summary.totalPnL >= 0 ? C.green : C.danger} />
            <MetricTile label="Max drawdown" value={formatCompactMoney(summary.maxDrawdownCash)} caption={formatAnalyticsPercent(summary.maxDrawdownPct, 1)} tone={summary.maxDrawdownCash < 0 ? C.warn : C.text2} />
            <MetricTile label="Expectancy" value={formatCompactMoney(summary.expectancy)} caption="Per trade" tone={summary.expectancy >= 0 ? C.accent : C.danger} />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={equitySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="mf-analytics-equity" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={C.green} stopOpacity={0.42} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="mf-analytics-dd" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={C.danger} stopOpacity={0.34} />
                  <stop offset="100%" stopColor={C.danger} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis {...CHART_AXIS_SMALL} dataKey="dateLabel" hide={equitySeries.length > 14} />
              <YAxis {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
              <ReferenceLine y={0} stroke={shade(C.borderHi, 0.84)} strokeDasharray="4 6" />
              <Tooltip
                content={(
                  <ChartTooltip
                    render={(payload, label) => {
                      const row = equitySeries.find((item) => item.dateLabel === label);
                      return (
                        <>
                          <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.dateLabel}</div>
                          <div style={{ color: C.green, fontWeight: 700 }}>Equity: {formatAnalyticsMoney(row?.equity || 0)}</div>
                          <div style={{ color: C.danger, fontWeight: 700 }}>Drawdown: {formatAnalyticsMoney(row?.drawdownCash || 0)}</div>
                          <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.symbol || '--'} / {row?.session || 'Other'}</div>
                        </>
                      );
                    }}
                  />
                )}
              />
              <Area type="monotone" dataKey="drawdownCash" stroke={C.danger} fill="url(#mf-analytics-dd)" strokeWidth={2} {...CHART_MOTION_SOFT} />
              <Line type="monotone" dataKey="equity" stroke={C.green} strokeWidth={2.8} dot={false} activeDot={chartActiveDot(C.green, 4)} {...CHART_MOTION} />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard tone={C.accent} index={4} style={{ padding: '22px 22px 18px' }}>
          <SectionTitle eyebrow="Win rate" title="Quality" tone={C.accent} />
          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {insights.slice(0, 2).map((item) => {
              const tone = item.tone === 'risk' ? C.danger : item.tone === 'positive' ? C.green : C.accent;
              return (
                <div key={item.id} style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.16)}`, background: 'rgba(255,255,255,0.025)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: tone, marginBottom: 5 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>{item.body}</div>
                </div>
              );
            })}
            {!insights.length ? (
              <div style={{ padding: '12px', borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 11, color: C.text2 }}>
                Need a few more trades for stable guidance.
              </div>
            ) : null}
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={rollingSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid {...CHART_GRID} />
              <XAxis {...CHART_AXIS_SMALL} dataKey="dateLabel" hide={rollingSeries.length > 14} />
              <YAxis {...CHART_AXIS_SMALL} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <ReferenceLine y={50} stroke={shade(C.borderHi, 0.84)} strokeDasharray="4 6" />
              <Tooltip
                cursor={chartCursor(C.accent)}
                content={(
                  <ChartTooltip
                    render={(payload, label) => {
                      const row = rollingSeries.find((item) => item.dateLabel === label);
                      return (
                        <>
                          <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.dateLabel}</div>
                          <div style={{ color: C.accent, fontWeight: 700 }}>Rolling: {formatAnalyticsPercent(row?.rollingWinRate || 0, 1)}</div>
                          <div style={{ color: C.blue, fontWeight: 700 }}>Cumulative: {formatAnalyticsPercent(row?.cumulativeWinRate || 0, 1)}</div>
                          <div style={{ color: (row?.pnl || 0) >= 0 ? C.green : C.danger, fontWeight: 700 }}>Trade: {formatAnalyticsMoney(row?.pnl || 0)}</div>
                        </>
                      );
                    }}
                  />
                )}
              />
              <Line type="monotone" dataKey="rollingWinRate" stroke={C.accent} strokeWidth={2.6} dot={false} activeDot={chartActiveDot(C.accent, 4)} {...CHART_MOTION} />
              <Line type="monotone" dataKey="cumulativeWinRate" stroke={C.blue} strokeWidth={2} strokeDasharray="5 6" dot={false} activeDot={chartActiveDot(C.blue, 3)} {...CHART_MOTION_SOFT} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>
    </>
  );
}

function GeneralSection({ summary, monthlySeries, sessionSeries }) {
  return (
    <div className="mf-analytics-grid-two">
      <SectionCard tone={C.blue} index={2} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="General" title="Month" tone={C.blue} />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS_SMALL} dataKey="label" />
            <YAxis {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
            <ReferenceLine y={0} stroke={shade(C.borderHi, 0.84)} strokeDasharray="4 6" />
            <Tooltip
              content={(
                <ChartTooltip
                  render={(payload, label) => {
                    const row = monthlySeries.find((item) => item.label === label);
                    return (
                      <>
                        <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.label}</div>
                        <div style={{ color: (row?.pnl || 0) >= 0 ? C.green : C.danger, fontWeight: 700 }}>{formatAnalyticsMoney(row?.pnl || 0)}</div>
                        <div style={{ color: C.accent, fontWeight: 700 }}>Win rate: {formatAnalyticsPercent(row?.winRate || 0, 1)}</div>
                        <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.trades || 0} trades</div>
                      </>
                    );
                  }}
                />
              )}
            />
            <Bar dataKey="pnl" radius={[8, 8, 0, 0]} maxBarSize={42} {...CHART_MOTION}>
              {monthlySeries.map((row) => (
                <Cell key={row.key} fill={row.pnl >= 0 ? C.green : C.danger} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard tone={C.blue} index={3} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="General" title="Sessions" tone={C.blue} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
          <MetricTile label="Gross win" value={formatCompactMoney(summary.grossWin)} caption="Positive trades only" tone={C.green} />
          <MetricTile label="Gross loss" value={formatCompactMoney(-summary.grossLoss)} caption="Negative trades only" tone={C.danger} />
          <MetricTile label="Expectancy" value={formatCompactMoney(summary.expectancy)} caption="Per trade" tone={summary.expectancy >= 0 ? C.accent : C.danger} />
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={sessionSeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS_SMALL} dataKey="key" />
            <YAxis yAxisId="left" {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
            <YAxis yAxisId="right" orientation="right" {...CHART_AXIS_SMALL} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <ReferenceLine yAxisId="left" y={0} stroke={shade(C.borderHi, 0.84)} strokeDasharray="4 6" />
            <Tooltip
              content={(
                <ChartTooltip
                  render={(payload, label) => {
                    const row = sessionSeries.find((item) => item.key === label);
                    return (
                      <>
                        <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.key}</div>
                        <div style={{ color: (row?.pnl || 0) >= 0 ? C.green : C.danger, fontWeight: 700 }}>P&L: {formatAnalyticsMoney(row?.pnl || 0)}</div>
                        <div style={{ color: C.accent, fontWeight: 700 }}>Win rate: {formatAnalyticsPercent(row?.winRate || 0, 1)}</div>
                        <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.trades || 0} trades</div>
                      </>
                    );
                  }}
                />
              )}
            />
            <Bar yAxisId="left" dataKey="pnl" radius={[8, 8, 0, 0]} maxBarSize={36} {...CHART_MOTION}>
              {sessionSeries.map((row) => (
                <Cell key={row.key} fill={row.pnl >= 0 ? C.green : C.danger} fillOpacity={0.8} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="winRate" stroke={C.accent} strokeWidth={2.5} dot={false} activeDot={chartActiveDot(C.accent, 4)} {...CHART_MOTION_SOFT} />
          </ComposedChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

function ConfluenceSection({ confluenceSeries, setupSeries, biasSeries }) {
  return (
    <div className="mf-analytics-grid-three">
      <RankedBarList title="Confluences" eyebrow="Confluences" tone={C.warn} rows={confluenceSeries} index={2} />
      <RankedBarList title="Setups" eyebrow="Confluences" tone={C.orange} rows={setupSeries} index={3} />
      <RankedBarList title="Bias" eyebrow="Confluences" tone={C.teal} rows={biasSeries} index={4} />
    </div>
  );
}

function LongShortSection({ longShortSeries, symbolSeries }) {
  return (
    <div className="mf-analytics-grid-two">
      <SectionCard tone={C.teal} index={2} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="Long vs Short" title="Direction" tone={C.teal} />
        <div style={{ display: 'grid', gap: 12 }}>
          {longShortSeries.map((row) => {
            const tone = row.label === 'Long' ? C.green : C.purple;
            return (
              <div key={row.label} style={{ padding: '14px 14px 12px', borderRadius: 18, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text0 }}>{row.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: tone }}>{formatAnalyticsMoney(row.pnl)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                  <MetricTile label="Trades" value={String(row.trades)} caption="Closed" tone={tone} />
                  <MetricTile label="Win rate" value={formatAnalyticsPercent(row.winRate, 1)} caption="Hit rate" tone={C.accent} />
                  <MetricTile label="Share" value={formatAnalyticsPercent(longShortSeries.reduce((sum, item) => sum + item.trades, 0) ? (row.trades / longShortSeries.reduce((sum, item) => sum + item.trades, 0)) * 100 : 0, 1)} caption="Book weight" tone={C.blue} />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <RankedBarList title="By symbol" eyebrow="Long vs Short" tone={C.blue} rows={symbolSeries} index={3} />
    </div>
  );
}

function HeatmapSection({ hourSeries, weekdaySeries }) {
  return (
    <div className="mf-analytics-grid-two">
      <SectionCard tone={C.accent} index={2} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="Heatmaps" title="Hours" tone={C.accent} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 8 }}>
          {hourSeries.map((row) => {
            const intensity = Math.min(1, Math.abs(row.pnl) / Math.max(1, ...hourSeries.map((item) => Math.abs(item.pnl) || 1)));
            const bg = row.pnl >= 0
              ? `rgba(var(--mf-green-rgb, 0, 255, 136), ${0.08 + intensity * 0.18})`
              : `rgba(var(--mf-danger-rgb, 255, 61, 87), ${0.08 + intensity * 0.18})`;
            const tone = row.pnl >= 0 ? C.green : row.pnl < 0 ? C.danger : C.text2;
            return (
              <div key={row.key} style={{ padding: '12px 10px', borderRadius: 16, border: `1px solid ${shade(tone, 0.12)}`, background: bg }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.text0, marginBottom: 6 }}>{row.key}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: tone }}>{formatAnalyticsMoney(row.pnl)}</div>
                <div style={{ fontSize: 10, color: C.text2, marginTop: 4 }}>{formatAnalyticsPercent(row.winRate, 1)}</div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard tone={C.purple} index={3} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="Heatmaps" title="Weekdays" tone={C.purple} />
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={weekdaySeries} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis {...CHART_AXIS_SMALL} dataKey="label" />
            <YAxis yAxisId="left" {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
            <YAxis yAxisId="right" orientation="right" {...CHART_AXIS_SMALL} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
            <ReferenceLine yAxisId="left" y={0} stroke={shade(C.borderHi, 0.84)} strokeDasharray="4 6" />
            <Tooltip
              content={(
                <ChartTooltip
                  render={(payload, label) => {
                    const row = weekdaySeries.find((item) => item.label === label);
                    return (
                      <>
                        <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.label}</div>
                        <div style={{ color: (row?.pnl || 0) >= 0 ? C.green : C.danger, fontWeight: 700 }}>P&L: {formatAnalyticsMoney(row?.pnl || 0)}</div>
                        <div style={{ color: C.accent, fontWeight: 700 }}>Win rate: {formatAnalyticsPercent(row?.winRate || 0, 1)}</div>
                        <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.trades || 0} trades</div>
                      </>
                    );
                  }}
                />
              )}
            />
            <Bar yAxisId="left" dataKey="pnl" radius={[8, 8, 0, 0]} maxBarSize={40} {...CHART_MOTION}>
              {weekdaySeries.map((row) => (
                <Cell key={row.label} fill={row.pnl >= 0 ? C.green : C.danger} fillOpacity={0.8} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="winRate" stroke={C.purple} strokeWidth={2.4} dot={false} activeDot={chartActiveDot(C.purple, 4)} {...CHART_MOTION_SOFT} />
          </ComposedChart>
        </ResponsiveContainer>
      </SectionCard>
    </div>
  );
}

function TradesSection({ recentRows, setupSeries }) {
  return (
    <div className="mf-analytics-grid-two">
      <RankedBarList title="Setup output" eyebrow="Trades" tone={C.orange} rows={setupSeries} index={2} />

      <SectionCard tone={C.accent} index={3} style={{ padding: '22px 22px 18px' }}>
        <SectionTitle eyebrow="Trades" title="Recent trades" tone={C.accent} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                {['Date', 'Pair', 'Side', 'Session', 'Setup', 'Status', 'P&L'].map((header) => (
                  <th key={header} style={{ padding: '0 8px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, textAlign: header === 'P&L' ? 'right' : 'left', borderBottom: `1px solid ${C.border}` }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRows.map((row) => {
                const pnlTone = row.pnl >= 0 ? C.green : row.pnl < 0 ? C.danger : C.text2;
                const statusTone = row.status === 'TP' ? C.green : row.status === 'SL' ? C.danger : row.status === 'BE' ? C.warn : C.text2;
                return (
                  <tr key={row.id}>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2 }}>{row.dateLabel}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: C.text0 }}>{row.symbol}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text1 }}>{row.side}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2 }}>{row.session}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text1 }}>{row.setup}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11, fontWeight: 800, color: statusTone }}>{row.status}</td>
                    <td style={{ padding: '13px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: pnlTone, textAlign: 'right' }}>{formatAnalyticsMoney(row.pnl)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
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
            No tagged data yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

export default function AnalyticsPro() {
  const { trades } = useTradingContext();
  const [period, setPeriod] = useState('ALL');
  const [section, setSection] = useState('overview');

  const filteredTrades = useMemo(() => {
    if (period === 'ALL') return trades;
    const days = { '7D': 7, '1M': 30, '3M': 90, '6M': 180 }[period] || 9999;
    const limitDate = Date.now() - days * 86400000;
    return trades.filter((trade) => {
      const date = getTradeDateValue(trade);
      return date ? date.getTime() >= limitDate : false;
    });
  }, [trades, period]);

  const summary = useMemo(() => summarizeTradeSet(filteredTrades), [filteredTrades]);
  const equitySeries = useMemo(() => buildEquityDrawdownSeries(filteredTrades), [filteredTrades]);
  const rollingSeries = useMemo(() => buildRollingWinRateSeries(filteredTrades, 12), [filteredTrades]);
  const sessionSeries = useMemo(() => buildSessionWinRateSeries(filteredTrades), [filteredTrades]);
  const hourSeries = useMemo(() => buildHourWinRateSeries(filteredTrades), [filteredTrades]);
  const insights = useMemo(() => buildWinRateInsights(filteredTrades), [filteredTrades]);
  const monthlySeries = useMemo(() => buildMonthlySeries(filteredTrades), [filteredTrades]);
  const weekdaySeries = useMemo(() => buildWeekdaySeries(filteredTrades), [filteredTrades]);
  const longShortSeries = useMemo(() => buildLongShortSeries(filteredTrades), [filteredTrades]);
  const confluenceSeries = useMemo(() => buildConfluenceSeries(filteredTrades), [filteredTrades]);
  const setupSeries = useMemo(() => buildSimpleBreakdown(filteredTrades, (trade) => String(trade.setup || '').trim(), 6), [filteredTrades]);
  const biasSeries = useMemo(() => buildSimpleBreakdown(filteredTrades, (trade) => String(trade.bias || '').trim(), 5), [filteredTrades]);
  const symbolSeries = useMemo(() => buildSimpleBreakdown(filteredTrades, (trade) => String(trade.symbol || trade.pair || '').trim(), 6), [filteredTrades]);
  const recentRows = useMemo(() => buildRecentTradeRows(filteredTrades), [filteredTrades]);
  const strongestSession = sessionSeries.length ? [...sessionSeries].sort((left, right) => right.winRate - left.winRate)[0] : null;
  const weakestSession = sessionSeries.length ? [...sessionSeries].sort((left, right) => left.winRate - right.winRate)[0] : null;
  const leadInsight = insights[0] || null;

  return (
    <div className="mf-analytics-page" style={{ minHeight: '100vh', padding: '28px 24px 48px', position: 'relative', overflow: 'hidden' }}>
      <style>{PAGE_STYLES}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '12%', width: 520, height: 340, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.08) 0%, transparent 72%)', filter: 'blur(42px)', animation: 'mfAnalyticsGlowA 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: 0, width: 500, height: 320, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255), 0.06) 0%, transparent 72%)', filter: 'blur(46px)', animation: 'mfAnalyticsGlowB 22s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1480, margin: '0 auto' }}>
        <div className="mf-analytics-top-grid">
          <SectionCard tone={C.accent} index={0} style={{ padding: '24px 24px 22px' }}>
            <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>
              Analytics
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 3.6vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.06em', color: C.text0 }}>
                  Analytics <span style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, var(--mf-accent,#06E6FF) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
                </h1>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <div style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.accent, 0.2)}`, background: 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
                    {filteredTrades.length} trades
                  </div>
                  <div style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text2 }}>
                    {period}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, padding: '4px', background: 'rgba(7,12,20,0.82)', borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)' }}>
                {['7D', '1M', '3M', '6M', 'ALL'].map((item) => {
                  const active = period === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setPeriod(item)}
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
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mf-analytics-metric-grid">
              <MetricTile label="Active days" value={String(summary.activeDays)} caption={`${formatNumber(summary.tradesPerDay || 0, 1)} trades / day`} tone={C.blue} />
              <MetricTile label="Net P&L" value={formatCompactMoney(summary.totalPnL)} caption={`${formatAnalyticsPercent(summary.winRate, 1)} win rate`} tone={summary.totalPnL >= 0 ? C.green : C.danger} />
              <MetricTile label="Best streak" value={`${summary.bestWinStreak}W`} caption={summary.currentStreak > 0 ? `Current +${summary.currentStreak}W` : 'No active run'} tone={summary.bestWinStreak > 0 ? C.green : C.text2} />
              <MetricTile label="Drawdown" value={formatCompactMoney(summary.maxDrawdownCash)} caption={formatAnalyticsPercent(summary.maxDrawdownPct, 1)} tone={summary.maxDrawdownCash < 0 ? C.warn : C.text2} />
            </div>

            <SegmentedControl value={section} onChange={setSection} />
          </SectionCard>

          <SectionCard tone={C.accent} index={1} style={{ padding: '20px' }}>
            <SectionTitle eyebrow="Readout" title="Focus" tone={C.accent} />
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Best session</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: strongestSession ? C.green : C.text2 }}>{strongestSession?.key || 'Waiting'}</div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>{strongestSession ? `${formatAnalyticsPercent(strongestSession.winRate, 1)} / ${formatAnalyticsMoney(strongestSession.pnl)}` : 'Need more session data.'}</div>
              </div>

              <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Pressure point</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: weakestSession ? C.warn : C.text2 }}>{weakestSession?.key || 'Waiting'}</div>
                <div style={{ fontSize: 11, color: C.text2, marginTop: 4 }}>{weakestSession ? `${formatAnalyticsPercent(weakestSession.winRate, 1)} / ${formatAnalyticsMoney(weakestSession.pnl)}` : 'No weak area yet.'}</div>
              </div>

              <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${leadInsight ? shade(leadInsight.tone === 'risk' ? C.danger : leadInsight.tone === 'positive' ? C.green : C.accent, 0.16) : C.border}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Win rate focus</div>
                {leadInsight ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 800, color: leadInsight.tone === 'risk' ? C.danger : leadInsight.tone === 'positive' ? C.green : C.accent }}>{leadInsight.title}</div>
                    <div style={{ fontSize: 11, color: C.text2, marginTop: 4, lineHeight: 1.55 }}>{leadInsight.body}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: C.text2 }}>Need more trades for guidance.</div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {!filteredTrades.length ? <EmptyAnalyticsState /> : null}

        {filteredTrades.length && section === 'overview' ? (
          <OverviewSection summary={summary} equitySeries={equitySeries} rollingSeries={rollingSeries} insights={insights} />
        ) : null}

        {filteredTrades.length && section === 'general' ? (
          <GeneralSection summary={summary} monthlySeries={monthlySeries} sessionSeries={sessionSeries} />
        ) : null}

        {filteredTrades.length && section === 'confluences' ? (
          <ConfluenceSection confluenceSeries={confluenceSeries} setupSeries={setupSeries} biasSeries={biasSeries} />
        ) : null}

        {filteredTrades.length && section === 'long-short' ? (
          <LongShortSection longShortSeries={longShortSeries} symbolSeries={symbolSeries} />
        ) : null}

        {filteredTrades.length && section === 'heatmaps' ? (
          <HeatmapSection hourSeries={hourSeries} weekdaySeries={weekdaySeries} />
        ) : null}

        {filteredTrades.length && section === 'trades' ? (
          <TradesSection recentRows={recentRows} setupSeries={setupSeries} />
        ) : null}
      </div>
    </div>
  );
}
