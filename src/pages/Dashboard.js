import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
} from '../lib/marketflowCharts';

const C = {
  accent: 'var(--mf-accent,#06E6FF)',
  accentSoft: 'var(--mf-accent-secondary,#66F0FF)',
  green: 'var(--mf-green,#00FF88)',
  blue: 'var(--mf-blue,#4D7CFF)',
  teal: 'var(--mf-teal,#00F5D4)',
  purple: 'var(--mf-purple,#A78BFA)',
  gold: 'var(--mf-gold,#FFD700)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  orange: 'var(--mf-orange,#FF6B35)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
  borderHi: 'var(--mf-border-hi,#1E2E48)',
  panel: 'rgba(10, 16, 28, 0.82)',
  panelStrong: 'rgba(8, 13, 24, 0.92)',
};

const DASHBOARD_STYLES = `
  @keyframes mfDashboardGlowA {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.12; }
    50% { transform: translate3d(26px, 18px, 0) scale(1.04); opacity: 0.18; }
  }

  @keyframes mfDashboardGlowB {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.08; }
    50% { transform: translate3d(-24px, -16px, 0) scale(1.03); opacity: 0.12; }
  }

  .mf-dashboard-shell {
    position: relative;
    min-height: 100%;
    width: 100%;
    color: ${C.text1};
    font-family: "Inter", "Segoe UI", system-ui, sans-serif;
  }

  .mf-dashboard-grid-kpi {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .mf-dashboard-grid-primary {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.95fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-dashboard-grid-secondary {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(330px, 0.92fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-dashboard-grid-tertiary {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    gap: 14px;
  }

  .mf-dashboard-calendar-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(300px, 0.78fr);
    gap: 16px;
  }

  .mf-dashboard-kpi-value {
    font-variant-numeric: tabular-nums;
  }

  .mf-dashboard-side-stack {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  @media (max-width: 1380px) {
    .mf-dashboard-grid-kpi {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 1160px) {
    .mf-dashboard-grid-primary,
    .mf-dashboard-grid-secondary,
    .mf-dashboard-grid-tertiary,
    .mf-dashboard-calendar-shell {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .mf-dashboard-grid-kpi {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .mf-dashboard-grid-kpi {
      grid-template-columns: 1fr;
    }
  }
`;

const ROUTES = {
  trades: '/all-trades',
  analytics: '/analytics-pro',
  psychology: '/psychology',
  backtest: '/backtest',
};

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.42,
      delay: index * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function formatCurrency(value = 0, signed = false) {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount).toLocaleString();

  if (signed) {
    if (amount > 0) return `+$${absolute}`;
    if (amount < 0) return `-$${absolute}`;
  }

  return `$${absolute}`;
}

function formatSignedCompact(value = 0) {
  const amount = Number(value) || 0;
  if (amount > 0) return `+$${Math.abs(amount).toLocaleString()}`;
  if (amount < 0) return `-$${Math.abs(amount).toLocaleString()}`;
  return '$0';
}

function formatRatio(value = 0) {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return 'n/a';
  return Number(value).toFixed(2);
}

function formatShortDate(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
  });
}

function formatLongDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getWeekNumber(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getSessionStatus() {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 7) return { label: 'Sydney session active', tone: C.accent };
  if (hour >= 2 && hour < 9) return { label: 'Tokyo session active', tone: C.blue };
  if (hour >= 7 && hour < 16) return { label: 'London session active', tone: C.green };
  if (hour >= 13 && hour < 22) return { label: 'New York session active', tone: C.warn };
  return { label: 'Market closed', tone: C.text2 };
}

function clamp(value, min = 0, max = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function toValidDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateKey(value) {
  const date = toValidDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function percentage(total, predicate) {
  if (!total.length) return 0;
  const count = total.filter(predicate).length;
  return Math.round((count / total.length) * 100);
}

function getClosedTrades(trades) {
  return [...(trades || [])]
    .filter((trade) => ['TP', 'SL', 'BE'].includes(trade.status))
    .sort((left, right) => new Date(right.open_date || right.date || 0) - new Date(left.open_date || left.date || 0));
}

function getCurrentStreak(closedTrades) {
  if (!closedTrades.length) {
    return {
      count: 0,
      type: 'flat',
      label: 'No streak',
      tone: C.text2,
    };
  }

  const firstValue = Number(closedTrades[0].profit_loss || 0);
  const firstSign = Math.sign(firstValue);

  if (firstSign === 0) {
    return {
      count: 1,
      type: 'flat',
      label: 'Break-even',
      tone: C.text2,
    };
  }

  let count = 0;
  for (const trade of closedTrades) {
    const sign = Math.sign(Number(trade.profit_loss || 0));
    if (sign === firstSign) {
      count += 1;
    } else {
      break;
    }
  }

  return {
    count,
    type: firstSign > 0 ? 'win' : 'loss',
    label: firstSign > 0 ? `${count} winning trade${count > 1 ? 's' : ''}` : `${count} losing trade${count > 1 ? 's' : ''}`,
    tone: firstSign > 0 ? C.green : C.danger,
  };
}

function buildBriefing(stats, context) {
  const {
    hygieneScore,
    currentStreak,
    bestSession,
    topPair,
    tradeCount,
    monthSummary,
  } = context;

  if (!tradeCount) {
    return {
      eyebrow: 'Desk setup',
      headline: 'Connect the first batch of trades.',
      body: 'The dashboard is ready. The next move is clean data, not more widgets.',
      points: [
        'Import the first executions.',
        'Normalize setup names early.',
        'Log session and psychology on each trade.',
      ],
    };
  }

  if (hygieneScore < 60) {
    return {
      eyebrow: 'Process first',
      headline: 'The edge is being hidden by incomplete journaling.',
      body: 'Tighten tagging, notes and psychology before trusting the conclusions.',
      points: [
        'Push note coverage above 80%.',
        'Tag every trade with setup and session.',
        'Use psychology fields systematically.',
      ],
    };
  }

  if (currentStreak.type === 'loss' && currentStreak.count >= 3) {
    return {
      eyebrow: 'Capital protection',
      headline: 'Slow the desk down before pressing size again.',
      body: 'A losing run should trigger review, not speed.',
      points: [
        'Review the last losing trades first.',
        'Reduce aggression until the pattern is clear.',
        'Backtest the exact setup before the next session.',
      ],
    };
  }

  if ((stats.profitFactor || 0) >= 1.4 && (stats.winRate || 0) >= 50) {
    return {
      eyebrow: 'Protect the edge',
      headline: 'The desk is stable. Keep it selective.',
      body: `Best context: ${bestSession?.s || 'your strongest session'}. Best pair: ${topPair?.p || 'your leading pair'}.`,
      points: [
        'Keep size stable while the edge holds.',
        'Concentrate on the strongest context first.',
        'Audit only the outlier losses.',
      ],
    };
  }

  if ((monthSummary?.totalPnl || 0) > 0) {
    return {
      eyebrow: 'Month in control',
      headline: 'The month is green, but selectivity can still improve.',
      body: 'Focus on repeatable executions, not more volume.',
      points: [
        'Cut the weakest context first.',
        'Use Analytics Pro only for deeper breakdowns.',
        'Rebuild one setup at a time in Backtest.',
      ],
    };
  }

  return {
    eyebrow: 'Rebuild the process',
    headline: 'Simplify the desk and tighten the routine.',
    body: 'Cleaner setups, cleaner reviews, fewer forced trades.',
    points: [
      'Trade fewer but clearer setups.',
      'Review weak sessions before repeating them.',
      'Use Psychology to catch execution drift.',
    ],
  };
}

function buildMarketFlowRank(stats, context) {
  const drawdown = Math.abs(Number(stats.maxDrawdown || 0));
  const expectancy = Number(stats.expectancy || 0);

  const factors = [
    { label: 'Process', value: clamp(context.hygieneScore), tone: C.accent },
    { label: 'Edge', value: clamp((Number(stats.profitFactor || 0) / 2.4) * 100), tone: C.green },
    { label: 'Consistency', value: clamp((Number(stats.winRate || 0) / 60) * 100), tone: C.blue },
    { label: 'Risk', value: clamp(100 - (drawdown / 12) * 100), tone: C.warn },
    { label: 'Depth', value: clamp((Number(stats.totalTrades || 0) / 80) * 100), tone: C.purple },
  ];

  const weighted =
    factors[0].value * 0.24 +
    factors[1].value * 0.25 +
    factors[2].value * 0.19 +
    factors[3].value * 0.18 +
    factors[4].value * 0.14;

  const score = Math.round(weighted * 10);
  const ladder = [
    { min: 0, label: 'Foundation', tone: C.text2 },
    { min: 220, label: 'Structure', tone: C.blue },
    { min: 420, label: 'Precision', tone: C.accent },
    { min: 620, label: 'Momentum', tone: C.green },
    { min: 820, label: 'Command', tone: C.warn },
    { min: 940, label: 'Apex', tone: C.purple },
  ];

  const currentTier = [...ladder].reverse().find((tier) => score >= tier.min) || ladder[0];
  const nextTier = ladder.find((tier) => score < tier.min) || null;
  const rangeMin = currentTier.min;
  const rangeMax = nextTier ? nextTier.min : 1000;
  const progress = rangeMax > rangeMin
    ? clamp(((score - rangeMin) / (rangeMax - rangeMin)) * 100)
    : 100;

  const division = nextTier
    ? progress >= 68 ? 'I' : progress >= 34 ? 'II' : 'III'
    : 'I';

  let focus = 'Keep the desk stable.';
  if ((stats.totalTrades || 0) < 25) focus = 'Build more clean sample size.';
  else if (context.hygieneScore < 75) focus = 'Raise journal discipline.';
  else if ((stats.profitFactor || 0) < 1.25) focus = 'Sharpen entry selectivity.';
  else if (drawdown > 8) focus = 'Reduce drawdown pressure.';
  else if (expectancy <= 0) focus = 'Protect the positive expectancy.';

  return {
    score,
    normalized: clamp(weighted),
    label: currentTier.label === 'Apex' ? 'Apex' : `${currentTier.label} ${division}`,
    tone: currentTier.tone,
    nextLabel: nextTier ? nextTier.label : 'Apex',
    nextGap: nextTier ? nextTier.min - score : 0,
    progress,
    focus,
    note: context.bestSession
      ? `Strongest context: ${context.bestSession.s}.${context.topPair ? ` Top pair: ${context.topPair.p}.` : ''}`
      : 'The first ranked tier unlocks as soon as the journal has enough clean history.',
    factors,
  };
}

function buildCalendarMonth(trades, monthOffset = 0) {
  const closedTrades = getClosedTrades(trades);
  const anchorDate = toValidDate(closedTrades[0]?.open_date || closedTrades[0]?.date) || new Date();
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + monthOffset, 1);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const startOffset = monthStart.getDay();
  const totalCells = Math.ceil((startOffset + monthEnd.getDate()) / 7) * 7;
  const todayKey = toDateKey(new Date());
  const bucket = new Map();

  closedTrades.forEach((trade) => {
    const tradeDate = toValidDate(trade.open_date || trade.date);
    if (!tradeDate) return;
    if (tradeDate.getFullYear() !== monthStart.getFullYear()) return;
    if (tradeDate.getMonth() !== monthStart.getMonth()) return;

    const key = toDateKey(tradeDate);
    const pnl = Number(trade.profit_loss ?? trade.pnl ?? 0) || 0;
    const summary = bucket.get(key) || { pnl: 0, trades: 0, wins: 0, losses: 0, breakevens: 0 };
    summary.pnl += pnl;
    summary.trades += 1;
    if (pnl > 0) summary.wins += 1;
    else if (pnl < 0) summary.losses += 1;
    else summary.breakevens += 1;
    bucket.set(key, summary);
  });

  const days = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index - startOffset + 1);
    const key = toDateKey(date);
    const entry = bucket.get(key) || { pnl: 0, trades: 0, wins: 0, losses: 0, breakevens: 0 };

    return {
      key,
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: key === todayKey,
      ...entry,
    };
  });

  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    const cells = days.slice(index, index + 7);
    weeks.push({
      cells,
      pnl: cells.reduce((sum, cell) => sum + (cell.inMonth ? cell.pnl : 0), 0),
      trades: cells.reduce((sum, cell) => sum + (cell.inMonth ? cell.trades : 0), 0),
    });
  }

  const tradeDays = days.filter((day) => day.inMonth && day.trades > 0);
  const positiveDays = tradeDays.filter((day) => day.pnl > 0).length;
  const negativeDays = tradeDays.filter((day) => day.pnl < 0).length;
  const flatDays = tradeDays.filter((day) => day.pnl === 0).length;
  const totalPnl = tradeDays.reduce((sum, day) => sum + day.pnl, 0);
  const tradeCount = tradeDays.reduce((sum, day) => sum + day.trades, 0);

  return {
    hasHistory: closedTrades.length > 0,
    monthLabel: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    totalPnl,
    tradeCount,
    positiveDays,
    negativeDays,
    flatDays,
    bestDay: tradeDays.reduce((best, day) => (!best || day.pnl > best.pnl ? day : best), null),
    worstDay: tradeDays.reduce((worst, day) => (!worst || day.pnl < worst.pnl ? day : worst), null),
    weeks,
    days,
    canGoForward: monthOffset < 0,
  };
}

function buildDashboardOverview(stats, trades) {
  const closedTrades = getClosedTrades(trades);
  const recentTrades = [...(trades || [])]
    .sort((left, right) => new Date(right.open_date || right.date || 0) - new Date(left.open_date || left.date || 0))
    .slice(0, 8);

  const setupCoverage = percentage(closedTrades, (trade) => String(trade.setup || '').trim().length > 0);
  const sessionCoverage = percentage(closedTrades, (trade) => String(trade.session || '').trim().length > 0);
  const noteCoverage = percentage(closedTrades, (trade) => String(trade.notes || '').trim().length > 0);
  const psychologyCoverage = percentage(closedTrades, (trade) => {
    const score = trade.psychology_score ?? trade.psychologyScore;
    return score !== null && score !== undefined && score !== ''
      || String(trade.emotion_before || '').trim().length > 0
      || String(trade.emotion_during || '').trim().length > 0
      || String(trade.emotion_after || '').trim().length > 0;
  });

  const disciplineRows = [
    { label: 'Setup tags', value: setupCoverage, tone: C.accent },
    { label: 'Session tags', value: sessionCoverage, tone: C.teal },
    { label: 'Trade notes', value: noteCoverage, tone: C.blue },
    { label: 'Psychology log', value: psychologyCoverage, tone: C.purple },
  ];

  const hygieneScore = closedTrades.length
    ? Math.round(disciplineRows.reduce((sum, row) => sum + row.value, 0) / disciplineRows.length)
    : 0;

  const currentStreak = getCurrentStreak(closedTrades);
  const sessionData = Array.isArray(stats.sessionData) ? stats.sessionData : [];
  const pairData = Array.isArray(stats.pairData) ? stats.pairData : [];
  const dailySeries = Array.isArray(stats.dailyPnl) ? stats.dailyPnl : [];

  const bestSession = sessionData.length
    ? [...sessionData].sort((left, right) => right.pnl - left.pnl)[0]
    : null;

  const weakestSession = sessionData.length
    ? [...sessionData].sort((left, right) => left.pnl - right.pnl)[0]
    : null;

  const topPair = pairData.length
    ? [...pairData].sort((left, right) => right.pnl - left.pnl)[0]
    : null;

  const bestDay = dailySeries.reduce((best, item) => {
    if (!best || item.v > best.v) return item;
    return best;
  }, null);

  const positiveDays = dailySeries.filter((item) => item.v > 0).length;
  const negativeDays = dailySeries.filter((item) => item.v < 0).length;
  const dailyAverage = dailySeries.length
    ? Math.round(dailySeries.reduce((sum, item) => sum + (item.v || 0), 0) / dailySeries.length)
    : 0;

  const lastTrade = closedTrades[0] || recentTrades[0] || null;
  const monthSummary = buildCalendarMonth(trades, 0);
  const rank = buildMarketFlowRank(stats, {
    hygieneScore,
    bestSession,
    topPair,
  });

  return {
    recentTrades,
    disciplineRows,
    hygieneScore,
    currentStreak,
    bestSession,
    weakestSession,
    topPair,
    lastTrade,
    bestDay,
    positiveDays,
    negativeDays,
    dailyAverage,
    monthSummary,
    rank,
    briefing: buildBriefing(stats, {
      hygieneScore,
      currentStreak,
      bestSession,
      topPair,
      tradeCount: stats.totalTrades || 0,
      monthSummary,
    }),
  };
}

function SectionCard({ children, tone = C.accent, style, index = 0, hover = false }) {
  return (
    <motion.section
      {...panelMotion(index)}
      whileHover={hover ? { y: -2, boxShadow: `0 18px 60px ${shade(tone, 0.12)}` } : undefined}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: `linear-gradient(160deg, ${C.panel} 0%, ${C.panelStrong} 100%)`,
        boxShadow: '0 22px 56px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${shade(C.text0, 0.04)} 0%, transparent 26%, transparent 70%, ${shade(tone, 0.04)} 100%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${shade(tone, 0.7)}, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>
        {children}
      </div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
      <div>
        {eyebrow && (
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: shade(tone, 0.86), marginBottom: 8 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 14, borderRadius: 999, background: tone, boxShadow: `0 0 16px ${shade(tone, 0.48)}` }} />
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.05, letterSpacing: '-0.03em', color: C.text0 }}>
            {title}
          </h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function GhostButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${shade(C.accent, 0.18)}`,
        background: shade(C.accent, 0.06),
        color: C.text1,
        borderRadius: 12,
        padding: '9px 14px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.16s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = shade(C.accent, 0.12);
        event.currentTarget.style.borderColor = shade(C.accent, 0.3);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = shade(C.accent, 0.06);
        event.currentTarget.style.borderColor = shade(C.accent, 0.18);
      }}
    >
      {children}
    </button>
  );
}

function TinyBadge({ children, tone }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: shade(tone, 0.12),
        border: `1px solid ${shade(tone, 0.22)}`,
        color: tone,
      }}
    >
      {children}
    </span>
  );
}

function AccountScopeStrip({ options = [], activeAccount = 'all', onChange }) {
  if (!options || options.length <= 1) return null;

  return (
    <motion.div
      {...panelMotion(1)}
      style={{
        marginBottom: 14,
        padding: '12px 14px',
        borderRadius: 18,
        border: `1px solid ${shade(C.accent, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,17,28,0.88), rgba(8,13,22,0.94))',
        boxShadow: '0 16px 38px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>
        Account scope
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {options.map((option) => {
          const active = option.id === activeAccount;
          return (
            <button
              key={option.id}
              onClick={() => onChange?.(option.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                whiteSpace: 'nowrap',
                padding: '9px 12px',
                borderRadius: 12,
                border: `1px solid ${active ? shade(C.accent, 0.28) : C.border}`,
                background: active ? shade(C.accent, 0.1) : 'rgba(255,255,255,0.02)',
                color: active ? C.text0 : C.text2,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span>{option.label}</span>
              <span style={{ padding: '3px 7px', borderRadius: 999, border: `1px solid ${active ? shade(C.accent, 0.22) : shade(C.text3, 0.18)}`, color: active ? C.accent : C.text3, fontSize: 10, fontFamily: 'monospace' }}>
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, caption, tone, index = 0 }) {
  return (
    <SectionCard tone={tone} index={index} hover style={{ padding: '16px 16px 15px', minHeight: 118 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
          {label}
        </span>
        <div style={{ width: 26, height: 2, borderRadius: 999, background: tone, boxShadow: `0 0 16px ${shade(tone, 0.42)}` }} />
      </div>
      <div className="mf-dashboard-kpi-value" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, lineHeight: 1.02, marginBottom: 10 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: C.text2 }}>
        {caption}
      </div>
    </SectionCard>
  );
}

function ProgressRow({ label, current, target, tone, suffix = '', inverse = false }) {
  const rawRatio = target > 0 ? (current / target) * 100 : 0;
  const progress = inverse
    ? Math.max(0, Math.min(100, 100 - rawRatio))
    : Math.max(0, Math.min(100, rawRatio));
  const statusTone = inverse
    ? current <= target ? C.green : C.danger
    : progress >= 100 ? C.green : progress >= 70 ? tone : C.warn;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: statusTone, fontFamily: 'monospace' }}>
            {current.toLocaleString()}{suffix}
          </span>
          <span style={{ fontSize: 10, color: C.text3 }}>
            / {target.toLocaleString()}{suffix}
          </span>
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: '100%',
            borderRadius: 999,
            background: `linear-gradient(90deg, ${shade(statusTone, 0.58)}, ${statusTone})`,
          }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = C.text1, caption }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(tone, 0.12)}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: tone, lineHeight: 1.05, marginBottom: caption ? 6 : 0 }}>
        {value}
      </div>
      {caption && (
        <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body, action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10, minHeight: 230, padding: '22px 18px' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: `linear-gradient(135deg, ${shade(C.accent, 0.16)}, ${shade(C.accentSoft, 0.05)})`,
          border: `1px solid ${shade(C.accent, 0.18)}`,
        }}
      />
      <div style={{ fontSize: 17, fontWeight: 800, color: C.text0 }}>
        {title}
      </div>
      <div style={{ maxWidth: 360, fontSize: 12.5, lineHeight: 1.7, color: C.text2 }}>
        {body}
      </div>
      {action}
    </div>
  );
}

function MoneyTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const value = Number(payload[0].value || 0);
  return (
    <div style={{ background: 'rgba(8,12,20,0.96)', border: `1px solid ${C.borderHi}`, borderRadius: 12, padding: '10px 12px', boxShadow: '0 16px 36px rgba(0,0,0,0.44)' }}>
      <div style={{ fontSize: 10, color: C.text3, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: value >= 0 ? C.green : C.danger, fontFamily: 'monospace' }}>
        {formatCurrency(value, true)}
      </div>
    </div>
  );
}

function HeaderPanel({ stats, overview }) {
  const now = new Date();
  const session = getSessionStatus();
  const greeting = getGreeting();
  const weekNumber = getWeekNumber(now);

  return (
    <motion.div
      {...panelMotion(0)}
      style={{
        marginBottom: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: shade(C.accent, 0.85), marginBottom: 8 }}>
          Trading desk
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 34, height: 3, borderRadius: 999, background: C.accent, boxShadow: `0 0 18px ${shade(C.accent, 0.55)}` }} />
          <h1 style={{ margin: 0, fontSize: 31, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
            {getGreeting()}, <span style={{ background: `linear-gradient(90deg, ${C.text0} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Trader</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.text2 }}>
            {formatLongDate(now)} / Week {weekNumber}
          </span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.text3 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: session.tone, boxShadow: `0 0 10px ${shade(session.tone, 0.55)}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: session.tone }}>
              {session.label}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 18,
          border: `1px solid ${C.borderHi}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          boxShadow: '0 18px 42px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trades</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text0 }}>{stats.totalTrades || 0}</div>
        </div>
        <div style={{ width: 1, height: 30, background: C.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>P&L</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: (stats.pnl || 0) >= 0 ? C.green : C.danger }}>{formatSignedCompact(stats.pnl)}</div>
        </div>
        <div style={{ width: 1, height: 30, background: C.border }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rank</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: overview.rank.tone }}>
            {overview.rank.score}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatusStrip({ stats, overview }) {
  const statusTone = stats.totalTrades ? C.green : C.warn;
  const monthTone = (overview.monthSummary.totalPnl || 0) >= 0 ? C.green : C.danger;

  const items = [
    { label: 'Journal', value: stats.totalTrades ? 'Live data connected' : 'Waiting for first imports', tone: statusTone },
    { label: 'Month P&L', value: formatCurrency(overview.monthSummary.totalPnl, true), tone: monthTone },
    { label: 'MarketFlow rank', value: overview.rank.label, tone: overview.rank.tone },
    { label: 'Last execution', value: overview.lastTrade ? formatShortDate(overview.lastTrade.open_date || overview.lastTrade.date) : 'n/a', tone: C.accent },
  ];

  return (
    <motion.div
      {...panelMotion(1)}
      style={{
        marginBottom: 16,
        padding: '13px 16px',
        borderRadius: 18,
        border: `1px solid ${shade(C.accent, 0.14)}`,
        background: `linear-gradient(90deg, ${shade(C.accent, 0.08)} 0%, rgba(255,255,255,0.02) 58%, rgba(255,255,255,0.018) 100%)`,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.tone, boxShadow: `0 0 12px ${shade(item.tone, 0.55)}`, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3, marginBottom: 3 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function KpiStrip({ stats, overview }) {
  const items = [
    { label: 'Net P&L', value: formatSignedCompact(stats.pnl), caption: `${stats.pnlPct || 0}% vs 10k baseline`, tone: (stats.pnl || 0) >= 0 ? C.green : C.danger },
    { label: 'Profit factor', value: formatRatio(stats.profitFactor), caption: `${formatCurrency(stats.avgWin)} avg win / ${formatCurrency(stats.avgLoss)} avg loss`, tone: C.blue },
    { label: 'Win rate', value: `${stats.winRate || 0}%`, caption: `${stats.wins || 0}W / ${stats.losses || 0}L / ${stats.breakevens || 0}BE`, tone: C.accent },
    { label: 'Average trade', value: formatCurrency(stats.expectancy || 0, true), caption: 'Realized expectancy', tone: C.teal },
    { label: 'Max drawdown', value: `${Math.abs(stats.maxDrawdown || 0)}%`, caption: 'Peak to trough pressure', tone: C.danger },
    { label: 'Rank score', value: `${overview.rank.score}`, caption: overview.rank.label, tone: overview.rank.tone },
  ];

  return (
    <div className="mf-dashboard-grid-kpi">
      {items.map((item, index) => (
        <MetricCard key={item.label} index={index + 2} label={item.label} value={item.value} caption={item.caption} tone={item.tone} />
      ))}
    </div>
  );
}

function EquityPanel({ stats }) {
  const [range, setRange] = useState('all');
  const ranges = [
    { id: '15', label: '15' },
    { id: '30', label: '30' },
    { id: '60', label: '60' },
    { id: 'all', label: 'All' },
  ];

  const rawData = Array.isArray(stats.equityData) ? stats.equityData : [];
  const data = range === 'all' ? rawData : rawData.slice(-Number(range));
  const lastValue = data.length ? data[data.length - 1].v : 0;
  const averageDaily = Array.isArray(stats.dailyPnl) && stats.dailyPnl.length
    ? Math.round(stats.dailyPnl.reduce((sum, item) => sum + item.v, 0) / stats.dailyPnl.length)
    : 0;

  return (
    <SectionCard tone={C.accent} index={8} style={{ padding: '22px 22px 18px' }}>
      <SectionTitle
        eyebrow="Performance"
        title="Equity overview"
        tone={C.accent}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {ranges.map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${range === item.id ? shade(C.accent, 0.4) : C.border}`,
                  background: range === item.id ? shade(C.accent, 0.12) : 'rgba(255,255,255,0.02)',
                  color: range === item.id ? C.accent : C.text2,
                  padding: '7px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        }
      />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', color: lastValue >= 0 ? C.green : C.danger }}>
          {formatCurrency(lastValue, true)}
        </div>
        <div style={{ fontSize: 12, color: C.text2 }}>
          cumulative journaled performance
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        <MiniMetric label="Best trade" value={formatCurrency(stats.bestTrade || 0, true)} tone={C.green} />
        <MiniMetric label="Worst trade" value={formatCurrency(stats.worstTrade || 0, true)} tone={C.danger} />
        <MiniMetric label="Max drawdown" value={`${Math.abs(stats.maxDrawdown || 0)}%`} tone={C.orange} />
        <MiniMetric label="5-day average" value={formatCurrency(averageDaily, true)} tone={averageDaily >= 0 ? C.accent : C.warn} />
      </div>

      {data.length ? (
        <div style={{ height: 286 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="mfDashboardEquityStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--mf-accent,#06E6FF)" />
                  <stop offset="100%" stopColor="var(--mf-accent-secondary,#66F0FF)" />
                </linearGradient>
                <linearGradient id="mfDashboardEquityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(var(--mf-accent-rgb, 6, 230, 255),0.25)" />
                  <stop offset="100%" stopColor="rgba(var(--mf-accent-rgb, 6, 230, 255),0.02)" />
                </linearGradient>
              </defs>
              <CartesianGrid {...CHART_GRID} />
              <XAxis {...CHART_AXIS} dataKey="d" tick={{ ...CHART_AXIS.tick, fontSize: 11 }} />
              <YAxis {...CHART_AXIS} tick={{ ...CHART_AXIS.tick, fontSize: 11 }} width={56} />
              <Tooltip content={<MoneyTooltip />} cursor={chartCursor(C.accent)} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="v"
                stroke="url(#mfDashboardEquityStroke)"
                fill="url(#mfDashboardEquityFill)"
                strokeWidth={2.5}
                dot={false}
                activeDot={chartActiveDot(C.accent, 5, '#06101E')}
                {...CHART_MOTION_SOFT}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState title="No equity history yet" body="Import your trades to unlock the equity curve and the rest of the operating metrics." />
      )}
    </SectionCard>
  );
}

function MarketFlowRankPanel({ overview }) {
  const rank = overview.rank;

  return (
    <SectionCard tone={rank.tone} index={9} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Ranking" title="MarketFlow Rank" tone={rank.tone} />

      <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: '50%',
            background: `conic-gradient(${rank.tone} ${rank.normalized * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            padding: 12,
            boxSizing: 'border-box',
            boxShadow: `0 18px 46px ${shade(rank.tone, 0.18)}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(7, 12, 22, 0.96) 62%)',
              border: `1px solid ${shade(rank.tone, 0.18)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
              {rank.score}
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
              Score
            </div>
          </div>
        </div>

        <div>
          <TinyBadge tone={rank.tone}>{rank.label}</TinyBadge>
          <div style={{ fontSize: 23, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', color: C.text0, marginTop: 12, marginBottom: 8 }}>
            {rank.focus}
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: C.text2 }}>
            {rank.note}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(rank.tone, 0.14)}`, background: 'rgba(255,255,255,0.03)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
            Next division
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: rank.tone }}>
            {rank.nextGap > 0 ? `${rank.nextGap} pts to ${rank.nextLabel}` : 'Top division unlocked'}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 10 }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rank.progress}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{
              height: '100%',
              borderRadius: 999,
              background: `linear-gradient(90deg, ${shade(rank.tone, 0.56)}, ${rank.tone})`,
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: C.text2 }}>
          Ranked progression is driven by live performance, journal discipline and risk control.
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rank.factors.map((factor) => (
          <ProgressRow key={factor.label} label={factor.label} current={factor.value} target={100} tone={factor.tone} suffix="%" />
        ))}
      </div>
    </SectionCard>
  );
}

function DeskBriefing({ overview }) {
  const note = overview.briefing;

  return (
    <SectionCard tone={C.teal} index={10} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow={note.eyebrow} title="Desk focus" tone={C.teal} />
      <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', color: C.text0, marginBottom: 10 }}>
        {note.headline}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.72, color: C.text2, marginBottom: 16 }}>
        {note.body}
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {note.points.map((point) => (
          <div key={point} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px', borderRadius: 14, border: `1px solid ${shade(C.teal, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.teal, marginTop: 6, boxShadow: `0 0 12px ${shade(C.teal, 0.42)}`, flexShrink: 0 }} />
            <div style={{ fontSize: 12, lineHeight: 1.68, color: C.text1 }}>
              {point}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function RecentExecutions({ trades, navigate }) {
  return (
    <SectionCard tone={C.accent} index={11} style={{ padding: '20px 20px 10px' }}>
      <SectionTitle eyebrow="Execution" title="Recent executions" tone={C.accent} action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />

      {trades.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                {['Date', 'Pair', 'Side', 'Session', 'Setup', 'Result', 'P&L'].map((header) => (
                  <th key={header} style={{ padding: '0 10px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, textAlign: header === 'P&L' ? 'right' : 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const pnl = Number(trade.profit_loss ?? trade.pnl ?? 0) || 0;
                const statusTone = trade.status === 'TP' ? C.green : trade.status === 'SL' ? C.danger : C.text2;
                return (
                  <tr key={trade.id}>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{formatShortDate(trade.open_date || trade.date)}</td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 700, color: C.text0, whiteSpace: 'nowrap' }}>{trade.symbol || trade.pair || 'Unknown'}</td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text1, whiteSpace: 'nowrap' }}>{trade.direction || trade.type || 'Long'}</td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{trade.session || 'Unassigned'}</td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text1 }}>{trade.setup || 'Unlabeled'}</td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, whiteSpace: 'nowrap' }}>
                      <TinyBadge tone={statusTone}>{trade.status || 'Open'}</TinyBadge>
                    </td>
                    <td style={{ padding: '14px 10px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: pnl >= 0 ? C.green : C.danger, fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatCurrency(pnl, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No recent executions" body="Once the journal receives trades, this table becomes the fastest place to review the latest flow." action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Import or add trades</GhostButton>} />
      )}
    </SectionCard>
  );
}

function PerformanceCalendarPanel({ trades, navigate }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const calendar = useMemo(() => buildCalendarMonth(trades, monthOffset), [trades, monthOffset]);

  return (
    <SectionCard tone={C.accent} index={11} style={{ padding: '22px 22px 20px', marginBottom: 14 }}>
      <SectionTitle
        eyebrow="Calendar"
        title="MarketFlow Calendar"
        tone={C.accent}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <GhostButton onClick={() => setMonthOffset((value) => value - 1)}>Prev</GhostButton>
            <GhostButton onClick={() => setMonthOffset((value) => Math.min(0, value + 1))} disabled={!calendar.canGoForward}>Next</GhostButton>
            <GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>
          </div>
        }
      />

      {calendar.hasHistory ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
            <MiniMetric label="Month P&L" value={formatCurrency(calendar.totalPnl, true)} tone={calendar.totalPnl >= 0 ? C.green : C.danger} />
            <MiniMetric label="Trade days" value={`${calendar.positiveDays + calendar.negativeDays + calendar.flatDays}`} tone={C.accent} />
            <MiniMetric label="Winning days" value={`${calendar.positiveDays}`} tone={C.green} />
            <MiniMetric label="Trades" value={`${calendar.tradeCount}`} tone={C.blue} />
          </div>

          <div className="mf-dashboard-calendar-shell">
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text0 }}>{calendar.monthLabel}</div>
                <div style={{ fontSize: 11, color: C.text2 }}>Daily realized performance from the journal</div>
              </div>

              <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
                <div style={{ minWidth: 760 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, marginBottom: 10 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} style={{ padding: '0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                        {day}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10 }}>
                    {calendar.days.map((day) => {
                      const tone = day.pnl > 0 ? C.green : day.pnl < 0 ? C.danger : C.accent;
                      const active = day.trades > 0;
                      return (
                        <div
                          key={day.key}
                          style={{
                            minHeight: 112,
                            borderRadius: 18,
                            padding: '12px 12px 11px',
                            border: `1px solid ${day.isToday ? shade(C.accent, 0.42) : active ? shade(tone, 0.2) : shade(C.borderHi, 0.8)}`,
                            background: active ? `linear-gradient(180deg, ${shade(tone, 0.18)} 0%, ${shade(tone, 0.06)} 100%)` : 'rgba(255,255,255,0.025)',
                            boxShadow: day.isToday ? `0 0 0 1px ${shade(C.accent, 0.12)}` : 'none',
                            opacity: day.inMonth ? 1 : 0.28,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? C.accent : C.text0 }}>{day.day}</div>
                            {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: tone, boxShadow: `0 0 10px ${shade(tone, 0.44)}` }} />}
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.05em', color: active ? tone : C.text3 }}>
                              {active ? formatCurrency(day.pnl, true) : 'No trades'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ fontSize: 11, color: active ? C.text1 : C.text3 }}>
                                {active ? `${day.trades} trade${day.trades > 1 ? 's' : ''}` : 'Desk inactive'}
                              </div>
                              {active && <div style={{ fontSize: 10, color: C.text2 }}>{day.wins}W / {day.losses}L / {day.breakevens}BE</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <MiniMetric label="Best day" value={calendar.bestDay ? formatCurrency(calendar.bestDay.pnl, true) : '$0'} tone={C.green} caption={calendar.bestDay ? formatShortDate(calendar.bestDay.date) : 'No realized day yet'} />
              <MiniMetric label="Worst day" value={calendar.worstDay ? formatCurrency(calendar.worstDay.pnl, true) : '$0'} tone={C.danger} caption={calendar.worstDay ? formatShortDate(calendar.worstDay.date) : 'No realized day yet'} />

              <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.accent, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>
                  Weekly split
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {calendar.weeks.map((week, index) => (
                    <div key={`week-${index}`} style={{ padding: '10px 11px', borderRadius: 14, border: `1px solid ${shade(week.pnl >= 0 ? C.green : C.danger, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: C.text1 }}>Week {index + 1}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: week.pnl >= 0 ? C.green : C.danger }}>{formatCurrency(week.pnl, true)}</span>
                      </div>
                      <div style={{ fontSize: 10, color: C.text2 }}>{week.trades} trade{week.trades > 1 ? 's' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No trading calendar yet" body="Import trades in All Trades to unlock the monthly calendar and ranked tracking." action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />
      )}
    </SectionCard>
  );
}

function JournalDiscipline({ overview }) {
  const tone = overview.hygieneScore >= 75 ? C.green : overview.hygieneScore >= 55 ? C.warn : C.danger;

  return (
    <SectionCard tone={tone} index={13} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Quality" title="Journal discipline" tone={tone} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', color: tone }}>
          {overview.hygieneScore}%
        </div>
        <div style={{ fontSize: 12, color: C.text2 }}>
          average completion across the journal inputs
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {overview.disciplineRows.map((row) => (
          <div key={row.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: row.value >= 80 ? C.green : row.value >= 55 ? C.warn : C.danger, fontFamily: 'monospace' }}>{row.value}%</span>
            </div>
            <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${row.value}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(row.tone, 0.56)}, ${row.tone})` }} />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ExecutionBoard({ stats, overview }) {
  const bestSession = overview.bestSession;
  const weakestSession = overview.weakestSession;
  const topPair = overview.topPair;

  return (
    <SectionCard tone={C.purple} index={14} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Execution map" title="Execution board" tone={C.purple} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 14 }}>
        <MiniMetric label="Best session" value={bestSession ? bestSession.s : 'n/a'} tone={C.accent} caption={bestSession ? `${formatCurrency(bestSession.pnl, true)} / ${bestSession.tp}W ${bestSession.sl}L` : 'No session history yet'} />
        <MiniMetric label="Top pair" value={topPair ? topPair.p : 'n/a'} tone={C.green} caption={topPair ? `${formatCurrency(topPair.pnl, true)} / ${topPair.wr}% win rate` : 'No pair ranking yet'} />
        <MiniMetric label="Current streak" value={overview.currentStreak.label} tone={overview.currentStreak.tone} caption={overview.currentStreak.type === 'loss' ? 'Slow the desk down if quality is drifting.' : 'Use the streak as signal, not as permission to force trades.'} />
        <MiniMetric label="Risk frame" value={`${formatCurrency(stats.avgWin)} / ${formatCurrency(stats.avgLoss)}`} tone={C.warn} caption="Average win versus average loss" />
      </div>

      <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.purple, 0.14)}`, background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
          Desk note
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.72, color: C.text1 }}>
          {weakestSession ? `The weakest pressure point right now is ${weakestSession.s}, with ${formatCurrency(weakestSession.pnl, true)}. Use Analytics Pro for a deeper breakdown before repeating that context.` : 'As more executions are logged, this board will isolate the strongest and weakest operational contexts.'}
        </div>
      </div>
    </SectionCard>
  );
}

function WorkflowPanel({ navigate, overview }) {
  const items = [
    { label: 'All Trades', body: 'Import, edit and clean every execution.', route: ROUTES.trades, tone: C.accent },
    { label: 'Analytics Pro', body: 'Open the deeper breakdown only when needed.', route: ROUTES.analytics, tone: C.blue },
    { label: 'Psychology', body: 'Track the behavior behind the result.', route: ROUTES.psychology, tone: C.purple },
    { label: 'Backtest', body: 'Re-validate the exact setup before scaling.', route: ROUTES.backtest, tone: C.warn },
  ];

  return (
    <SectionCard tone={C.accent} index={15} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Workflow" title="Next move" tone={C.accent} />
      <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.accent, 0.12)}`, background: 'rgba(255,255,255,0.03)', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
          Current desk note
        </div>
        <div style={{ fontSize: 12.5, lineHeight: 1.72, color: C.text1 }}>
          {overview.topPair
            ? `${overview.topPair.p} is currently the strongest pair in the journal. Keep the dashboard clean and open a dedicated module only when you need more depth.`
            : 'Use the command center to stay oriented, then open the dedicated module only when the review needs more depth.'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.route)}
            style={{
              textAlign: 'left',
              padding: '14px 15px',
              borderRadius: 16,
              border: `1px solid ${shade(item.tone, 0.16)}`,
              background: 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 0.16s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-1px)';
              event.currentTarget.style.background = shade(item.tone, 0.08);
              event.currentTarget.style.borderColor = shade(item.tone, 0.28);
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0)';
              event.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              event.currentTarget.style.borderColor = shade(item.tone, 0.16);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text0 }}>{item.label}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.tone }}>Open</span>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.65, color: C.text2 }}>{item.body}</div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const ctx = useTradingContext();
  const stats = ctx?.stats || emptyStats();
  const trades = ctx?.trades || [];
  const accountOptions = ctx?.accountOptions || [{ id: 'all', label: 'All Accounts', count: 0, pnl: 0 }];
  const activeAccount = ctx?.activeAccount || 'all';
  const setActiveAccount = ctx?.setActiveAccount || (() => null);
  const overview = useMemo(() => buildDashboardOverview(stats, trades), [stats, trades]);

  return (
    <div className="mf-dashboard-shell">
      <style>{DASHBOARD_STYLES}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '16%', width: 560, height: 360, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.035) 0%, transparent 72%)', filter: 'blur(46px)', animation: 'mfDashboardGlowA 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: 0, width: 520, height: 320, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255), 0.022) 0%, transparent 72%)', filter: 'blur(48px)', animation: 'mfDashboardGlowB 22s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '30px 30px 54px', width: '100%', boxSizing: 'border-box' }}>
        <HeaderPanel stats={stats} overview={overview} />
        <AccountScopeStrip options={accountOptions} activeAccount={activeAccount} onChange={setActiveAccount} />
        <StatusStrip stats={stats} overview={overview} />
        <KpiStrip stats={stats} overview={overview} />

        <div className="mf-dashboard-grid-primary">
          <EquityPanel stats={stats} />
          <div className="mf-dashboard-side-stack">
            <MarketFlowRankPanel overview={overview} />
            <DeskBriefing overview={overview} />
          </div>
        </div>

        <PerformanceCalendarPanel trades={trades} navigate={navigate} />

        <div className="mf-dashboard-grid-secondary">
          <RecentExecutions trades={overview.recentTrades} navigate={navigate} />
          <div className="mf-dashboard-side-stack">
            <JournalDiscipline overview={overview} />
            <WorkflowPanel navigate={navigate} overview={overview} />
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyStats() {
  return {
    pnl: 0,
    pnlPct: 0,
    winRate: 0,
    profitFactor: 0,
    avgRR: 'n/a',
    sharpe: 0,
    maxDrawdown: 0,
    expectancy: 0,
    totalTrades: 0,
    wins: 0,
    losses: 0,
    breakevens: 0,
    avgWin: 0,
    avgLoss: 0,
    streakWin: 0,
    streakLoss: 0,
    bestTrade: 0,
    worstTrade: 0,
    equityData: [],
    dailyPnl: [],
    sessionData: [],
    pairData: [],
    biaisData: [],
    radarData: [],
    heatmap: [],
    recentTrades: [],
  };
}
