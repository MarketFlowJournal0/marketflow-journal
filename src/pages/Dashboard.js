import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
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
  CHART_GRID,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
} from '../lib/marketflowCharts';
import {
  buildCompetitionBoard,
  buildMarketFlowRank,
} from '../lib/marketflowCompetition';

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
};

const ROUTES = {
  trades: '/all-trades',
  analytics: '/analytics-pro',
  psychology: '/psychology',
  backtest: '/backtest',
  competition: '/competition',
};

const ROUTINE_TEMPLATE_PREFIX = 'mf_dashboard_routine_template_v1_';
const ROUTINE_DAY_PREFIX = 'mf_dashboard_routine_day_v1_';

const DASHBOARD_STYLES = `
  @keyframes mfDashboardGlowA {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.12; }
    50% { transform: translate3d(24px, 18px, 0) scale(1.04); opacity: 0.18; }
  }

  @keyframes mfDashboardGlowB {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.08; }
    50% { transform: translate3d(-22px, -14px, 0) scale(1.03); opacity: 0.12; }
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .mf-dashboard-grid-primary {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.78fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-dashboard-grid-secondary {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(300px, 0.82fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-dashboard-calendar-shell {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(340px, 0.92fr);
    gap: 16px;
  }

  .mf-dashboard-side-stack {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (max-width: 1380px) {
    .mf-dashboard-grid-kpi {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1160px) {
    .mf-dashboard-grid-primary,
    .mf-dashboard-grid-secondary,
    .mf-dashboard-calendar-shell {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 900px) {
    .mf-dashboard-grid-kpi {
      grid-template-columns: 1fr;
    }
  }
`;

const Ic = {
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.25" />
      <path d="M7 4.1v3.2l2.15 1.35" />
    </svg>
  ),
  Session: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9.5c1.1-2.8 3-4.8 5.7-6" />
      <path d="M7.7 3.5h3v3" />
      <path d="M3 11.5h8" />
    </svg>
  ),
  Checklist: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.3 4.25h6.2" />
      <path d="M5.3 7.5h6.2" />
      <path d="M5.3 10.75h6.2" />
      <path d="M2.4 4.25l.9.9 1.4-1.55" />
      <path d="M2.4 7.5l.9.9 1.4-1.55" />
      <path d="M2.4 10.75l.9.9 1.4-1.55" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.1 11.9l2.45-.55 6-6.05-1.9-1.9-6 6.05-.55 2.45z" />
      <path d="M7.95 3.45l1.9 1.9" />
    </svg>
  ),
  Save: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.2 2.2h7.8l1.8 1.8v7.8H2.2z" />
      <path d="M4.3 2.2v3h4.2v-3" />
      <path d="M4.4 11.1h5.2" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3.5,5.5 7,9 10.5,5.5" />
    </svg>
  ),
  ChevronUp: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3.5,8.5 7,5 10.5,8.5" />
    </svg>
  ),
  Trophy: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.2 2.1h6.6v1.6A3.3 3.3 0 017.5 7 3.3 3.3 0 014.2 3.7z" />
      <path d="M3.4 2.9H2.2a1.4 1.4 0 000 2.8h1.1" />
      <path d="M11.6 2.9h1.2a1.4 1.4 0 010 2.8h-1.1" />
      <path d="M7.5 7v2.1" />
      <path d="M5.1 13h4.8" />
      <path d="M5.8 9.1h3.4v1.6H5.8z" />
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.8l4.45 1.6v3.15c0 2.65-1.6 4.95-4.45 6.65C4.65 11.5 3.05 9.2 3.05 6.55V3.4z" />
      <path d="M5.7 7.3l1.25 1.25 2.35-2.6" />
    </svg>
  ),
  Pulse: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.7 7h2.1l1.1-2.2 2.2 4.3 1.6-3 1 1.9h2.6" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5h8.2" />
      <path d="M6.8 3.2l3.4 3.3-3.4 3.3" />
    </svg>
  ),
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

function toneColor(tone = 'accent') {
  if (tone === 'green') return C.green;
  if (tone === 'blue') return C.blue;
  if (tone === 'teal') return C.teal;
  if (tone === 'purple') return C.purple;
  if (tone === 'warn') return C.warn;
  if (tone === 'danger') return C.danger;
  if (tone === 'text') return C.text2;
  return C.accent;
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
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 6) {
    return { label: 'Tokyo session active', window: '00:00 - 06:00 Paris', tone: C.blue };
  }
  if (hour >= 8 && hour < 11) {
    return { label: 'London session active', window: '08:00 - 11:00 Paris', tone: C.green };
  }
  if (hour >= 13 && hour < 22) {
    return { label: 'New York session active', window: '13:00 - 22:00 Paris', tone: C.warn };
  }
  return { label: 'Between sessions', window: 'Tokyo 00:00 - 06:00 / London 08:00 - 11:00 / New York 13:00 - 22:00', tone: C.text2 };
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
    if (sign === firstSign) count += 1;
    else break;
  }

  return {
    count,
    type: firstSign > 0 ? 'win' : 'loss',
    label: firstSign > 0 ? `${count} winning trade${count > 1 ? 's' : ''}` : `${count} losing trade${count > 1 ? 's' : ''}`,
    tone: firstSign > 0 ? C.green : C.danger,
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
    const summary = bucket.get(key) || {
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      records: [],
      sessions: {},
      pairs: {},
    };

    summary.pnl += pnl;
    summary.trades += 1;
    if (pnl > 0) summary.wins += 1;
    else if (pnl < 0) summary.losses += 1;
    else summary.breakevens += 1;

    const sessionLabel = trade.session || 'Unassigned';
    const pairLabel = trade.symbol || trade.pair || 'Unknown';
    summary.sessions[sessionLabel] = (summary.sessions[sessionLabel] || 0) + 1;
    summary.pairs[pairLabel] = (summary.pairs[pairLabel] || 0) + pnl;
    summary.records.push({
      id: trade.id,
      date: tradeDate,
      symbol: pairLabel,
      direction: trade.direction || trade.type || 'Long',
      session: sessionLabel,
      setup: trade.setup || 'Unlabeled',
      pnl,
      status: trade.status || (pnl > 0 ? 'TP' : pnl < 0 ? 'SL' : 'BE'),
      notes: trade.notes || '',
      time: trade.time || '',
    });

    bucket.set(key, summary);
  });

  const days = Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), index - startOffset + 1);
    const key = toDateKey(date);
    const entry = bucket.get(key) || {
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      breakevens: 0,
      records: [],
      sessions: {},
      pairs: {},
    };

    const sessionLeader = Object.entries(entry.sessions).sort((left, right) => right[1] - left[1])[0] || null;
    const pairLeader = Object.entries(entry.pairs).sort((left, right) => right[1] - left[1])[0] || null;
    const bestTrade = [...entry.records].sort((left, right) => right.pnl - left.pnl)[0] || null;
    const worstTrade = [...entry.records].sort((left, right) => left.pnl - right.pnl)[0] || null;
    const winRate = entry.trades ? Math.round((entry.wins / entry.trades) * 100) : 0;
    const avgTrade = entry.trades ? Math.round(entry.pnl / entry.trades) : 0;

    return {
      key,
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === monthStart.getMonth(),
      isToday: key === todayKey,
      ...entry,
      bestTrade,
      worstTrade,
      avgTrade,
      winRate,
      sessionLeader: sessionLeader ? { label: sessionLeader[0], count: sessionLeader[1] } : null,
      pairLeader: pairLeader ? { label: pairLeader[0], pnl: pairLeader[1] } : null,
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

function buildDashboardOverview(stats, trades, routineScore = 0) {
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
  const bestSession = sessionData.length ? [...sessionData].sort((left, right) => right.pnl - left.pnl)[0] : null;
  const weakestSession = sessionData.length ? [...sessionData].sort((left, right) => left.pnl - right.pnl)[0] : null;
  const topPair = pairData.length ? [...pairData].sort((left, right) => right.pnl - left.pnl)[0] : null;
  const bestDay = dailySeries.reduce((best, item) => (!best || item.v > best.v ? item : best), null);
  const positiveDays = dailySeries.filter((item) => item.v > 0).length;
  const negativeDays = dailySeries.filter((item) => item.v < 0).length;
  const dailyAverage = dailySeries.length
    ? Math.round(dailySeries.reduce((sum, item) => sum + (item.v || 0), 0) / dailySeries.length)
    : 0;
  const lastTrade = closedTrades[0] || recentTrades[0] || null;
  const monthSummary = buildCalendarMonth(trades, 0);
  const rank = buildMarketFlowRank(stats, {
    hygieneScore,
    routineScore,
    bestSession,
    topPair,
    positiveDays: monthSummary.positiveDays,
    negativeDays: monthSummary.negativeDays,
    flatDays: monthSummary.flatDays,
    monthPnl: monthSummary.totalPnl,
    currentStreak,
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
    routineScore,
    tradeCount: stats.totalTrades || 0,
  };
}

function buildRoutineBlueprint(overview) {
  if (!overview.tradeCount) {
    return [
      { id: 'import', title: 'Import your first clean batch of trades.', route: ROUTES.trades },
      { id: 'account', title: 'Choose the account scope you want to review today.', route: ROUTES.trades },
      { id: 'notes', title: 'Define your setup labels before the next execution.', route: ROUTES.trades },
      { id: 'psychology', title: 'Prepare the daily psychology check before the session.', route: ROUTES.psychology },
    ];
  }

  return [
    {
      id: 'review',
      title: overview.currentStreak.type === 'loss'
        ? 'Review the latest losing trade before you open a new position.'
        : 'Review the latest closed trade before the next session.',
      route: ROUTES.trades,
    },
    {
      id: 'session',
      title: overview.weakestSession
        ? `Protect ${overview.weakestSession.s} or skip it unless the setup is A-grade.`
        : 'Decide the session you want to trade before the open.',
      route: ROUTES.analytics,
    },
    {
      id: 'journal',
      title: overview.hygieneScore < 80
        ? 'Log setup, session, and notes on every execution today.'
        : 'Keep every execution fully tagged and documented today.',
      route: ROUTES.trades,
    },
    {
      id: 'mindset',
      title: 'Close the day with the psychology review and score update.',
      route: ROUTES.psychology,
    },
  ];
}

function routineTemplateKey(accountId = 'all') {
  return `${ROUTINE_TEMPLATE_PREFIX}${accountId || 'all'}`;
}

function routineDayKey(accountId = 'all') {
  return `${ROUTINE_DAY_PREFIX}${accountId || 'all'}`;
}

function loadRoutineState(accountId, blueprint) {
  const todayKey = toDateKey(new Date());
  try {
    const storedTemplate = JSON.parse(window.localStorage.getItem(routineTemplateKey(accountId)) || 'null');
    const storedDay = JSON.parse(window.localStorage.getItem(routineDayKey(accountId)) || 'null');
    const templateTitles = Object.fromEntries((storedTemplate?.items || []).map((item) => [item.id, item.title]));
    const doneState = storedDay?.date === todayKey
      ? Object.fromEntries((storedDay?.items || []).map((item) => [item.id, Boolean(item.done)]))
      : {};

    return blueprint.map((item) => ({
      ...item,
      title: templateTitles[item.id] || item.title,
      done: Boolean(doneState[item.id]),
    }));
  } catch {
    return blueprint.map((item) => ({ ...item, done: false }));
  }
}

function persistRoutineState(accountId, items) {
  if (typeof window === 'undefined') return;
  const todayKey = toDateKey(new Date());
  const cleanItems = (items || []).map((item) => ({
    id: item.id,
    title: item.title,
    route: item.route,
    done: Boolean(item.done),
  }));

  window.localStorage.setItem(
    routineTemplateKey(accountId),
    JSON.stringify({ items: cleanItems.map((item) => ({ id: item.id, title: item.title, route: item.route })) }),
  );
  window.localStorage.setItem(
    routineDayKey(accountId),
    JSON.stringify({ date: todayKey, items: cleanItems.map((item) => ({ id: item.id, done: item.done })) }),
  );
}

function SectionCard({ children, tone = C.accent, style, index = 0, hover = false }) {
  return (
    <motion.section
      {...panelMotion(index)}
      whileHover={hover ? { y: -2 } : undefined}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,17,28,0.9), rgba(8,13,24,0.94))',
        boxShadow: `0 18px 52px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.03)`,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.12)} 0%, transparent 42%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, action, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {icon && (
            <div style={{ width: 28, height: 28, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: shade(tone, 0.12), color: tone, border: `1px solid ${shade(tone, 0.2)}` }}>
              {icon}
            </div>
          )}
          {eyebrow && (
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
              {eyebrow}
            </div>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.05em', color: C.text0 }}>
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}

function GhostButton({ children, onClick, icon, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        border: `1px solid ${disabled ? shade(C.borderHi, 0.8) : shade(C.accent, 0.16)}`,
        background: disabled ? 'rgba(255,255,255,0.015)' : shade(C.accent, 0.06),
        color: disabled ? C.text3 : C.text1,
        borderRadius: 12,
        padding: '9px 13px',
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.16s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
      onMouseEnter={(event) => {
        if (disabled) return;
        event.currentTarget.style.background = shade(C.accent, 0.12);
        event.currentTarget.style.borderColor = shade(C.accent, 0.28);
      }}
      onMouseLeave={(event) => {
        if (disabled) return;
        event.currentTarget.style.background = shade(C.accent, 0.06);
        event.currentTarget.style.borderColor = shade(C.accent, 0.16);
      }}
    >
      {icon}
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

function MetricCard({ label, value, caption, tone, index = 0 }) {
  return (
    <SectionCard tone={tone} index={index} hover style={{ padding: '16px 16px 15px', minHeight: 118 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
          {label}
        </span>
        <div style={{ width: 26, height: 2, borderRadius: 999, background: tone, boxShadow: `0 0 16px ${shade(tone, 0.42)}` }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, lineHeight: 1.02, marginBottom: 10 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.55, color: C.text2 }}>
        {caption}
      </div>
    </SectionCard>
  );
}

function ProgressRow({ label, current, target, tone, suffix = '' }) {
  const progress = target > 0 ? clamp((current / target) * 100) : 0;
  const color = progress >= 88 ? C.green : progress >= 60 ? tone : C.warn;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'monospace' }}>
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
            background: `linear-gradient(90deg, ${shade(color, 0.58)}, ${color})`,
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

function AccountScopeDropdown({ options = [], activeAccount = 'all', onChange, stats, rank }) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.id === activeAccount) || options[0] || { label: 'All Accounts', count: 0, pnl: 0 };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => options.length > 1 && setOpen((value) => !value)}
        style={{
          minWidth: 250,
          padding: '12px 14px',
          borderRadius: 20,
          border: `1px solid ${shade(C.accent, 0.14)}`,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          boxShadow: '0 18px 42px rgba(0,0,0,0.2)',
          cursor: options.length > 1 ? 'pointer' : 'default',
          color: C.text1,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            Account scope
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text0, marginBottom: 6 }}>
            {activeOption.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: C.text2 }}>{activeOption.count} trades</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.text3 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: (stats.pnl || 0) >= 0 ? C.green : C.danger }}>{formatSignedCompact(stats.pnl)}</span>
          </div>
        </div>
        {options.length > 1 && (
          <div style={{ width: 28, height: 28, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
            {open ? <Ic.ChevronUp /> : <Ic.ChevronDown />}
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && options.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              minWidth: 310,
              padding: 10,
              borderRadius: 18,
              background: 'rgba(8,13,24,0.96)',
              border: `1px solid ${shade(C.accent, 0.16)}`,
              boxShadow: '0 22px 54px rgba(0,0,0,0.36)',
              zIndex: 40,
              display: 'grid',
              gap: 8,
            }}
          >
            {options.map((option) => {
              const active = option.id === activeAccount;
              const pnlTone = (option.pnl || 0) >= 0 ? C.green : C.danger;
              return (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange?.(option.id);
                    setOpen(false);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '12px 13px',
                    borderRadius: 14,
                    border: `1px solid ${active ? shade(C.accent, 0.24) : C.border}`,
                    background: active ? shade(C.accent, 0.1) : 'rgba(255,255,255,0.02)',
                    color: active ? C.text0 : C.text1,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800 }}>{option.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: pnlTone }}>{formatSignedCompact(option.pnl || 0)}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: active ? C.text2 : C.text3 }}>{option.count} trade{option.count > 1 ? 's' : ''}</div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeaderPanel({ stats, overview, accountOptions, activeAccount, onAccountChange }) {
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
          Dashboard
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 34, height: 3, borderRadius: 999, background: C.accent, boxShadow: `0 0 18px ${shade(C.accent, 0.55)}` }} />
          <h1 style={{ margin: 0, fontSize: 31, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
            {greeting}, <span style={{ background: `linear-gradient(90deg, ${C.text0} 0%, ${C.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Trader</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.text2 }}>
            {formatLongDate(now)} / Week {weekNumber}
          </span>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.text3 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: session.tone, boxShadow: `0 0 10px ${shade(session.tone, 0.55)}` }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: session.tone }}>
              {session.label}
            </span>
            <span style={{ fontSize: 11, color: C.text2 }}>
              {session.window}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, maxWidth: 560, marginTop: 10 }}>
          Live overview of realized performance across the active account scope.
        </div>
      </div>

      <AccountScopeDropdown
        options={accountOptions}
        activeAccount={activeAccount}
        onChange={onAccountChange}
        stats={stats}
        rank={overview.rank}
      />
    </motion.div>
  );
}

function DailyRoutinePanel({ items, onToggle, onTitleChange, navigate, overview }) {
  const [editing, setEditing] = useState(false);
  const completed = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;
  const progressTone = progress >= 100 ? C.green : progress >= 50 ? C.accent : C.warn;

  return (
    <SectionCard tone={progressTone} index={1} style={{ padding: '18px 18px 16px', marginBottom: 16 }}>
      <SectionTitle
        eyebrow="Workflow"
        title="Today's workflow"
        tone={progressTone}
        icon={<Ic.Checklist />}
        action={(
          <GhostButton onClick={() => setEditing((value) => !value)} icon={editing ? <Ic.Save /> : <Ic.Edit />}>
            {editing ? 'Done editing' : 'Customize'}
          </GhostButton>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.62fr) minmax(0, 1fr)', gap: 14 }}>
        <div style={{ padding: '15px 15px 13px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(progressTone, 0.14)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <TinyBadge tone={progressTone}>{completed}/{items.length} done</TinyBadge>
            <span style={{ fontSize: 11, color: C.text2 }}>MF score</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', color: progressTone }}>
              {progress}%
            </div>
            <div style={{ fontSize: 12, color: C.text2 }}>
              completed today
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(progressTone, 0.58)}, ${progressTone})` }} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <MiniMetric label="Current focus" value={overview.rank.focus} tone={toneColor(overview.rank.tone)} caption={overview.rank.note} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: '12px 13px', borderRadius: 16, border: `1px solid ${item.done ? shade(C.green, 0.18) : shade(C.accent, 0.12)}`, background: item.done ? 'rgba(var(--mf-green-rgb, 0, 255, 136),0.07)' : 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => onToggle(item.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    border: `1px solid ${item.done ? shade(C.green, 0.22) : C.border}`,
                    background: item.done ? shade(C.green, 0.16) : 'rgba(255,255,255,0.02)',
                    color: item.done ? C.green : C.text3,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  {item.done ? '✓' : ''}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <input
                      value={item.title}
                      onChange={(event) => onTitleChange(item.id, event.target.value)}
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: 'rgba(255,255,255,0.02)',
                        color: C.text1,
                        fontSize: 12.5,
                        padding: '8px 10px',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 12.5, lineHeight: 1.65, color: item.done ? C.text1 : C.text2, textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                  )}
                </div>

                <GhostButton onClick={() => navigate(item.route)} icon={<Ic.ArrowRight />}>
                  Open
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function StatusStrip({ overview }) {
  const rankTone = toneColor(overview.rank.tone);
  const monthTone = (overview.monthSummary.totalPnl || 0) >= 0 ? C.green : C.danger;
  const items = [
    { label: 'MF division', value: overview.rank.label, tone: rankTone },
    { label: 'Global position', value: `#${overview.rank.position.toLocaleString()}`, tone: rankTone },
    { label: 'Month P&L', value: formatCurrency(overview.monthSummary.totalPnl, true), tone: monthTone },
    { label: 'Best context', value: overview.bestSession ? overview.bestSession.s : 'Waiting for session data', tone: overview.bestSession ? C.accent : C.text2 },
  ];

  return (
    <motion.div
      {...panelMotion(2)}
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
    { label: 'Risk / reward', value: stats.avgRR || 'n/a', caption: `${stats.totalTrades || 0} realized trades`, tone: C.accent },
    { label: 'Total P&L', value: formatSignedCompact(stats.pnl), caption: `${stats.wins || 0}W / ${stats.losses || 0}L / ${stats.breakevens || 0}BE`, tone: (stats.pnl || 0) >= 0 ? C.green : C.danger },
    { label: 'Profit factor', value: formatRatio(stats.profitFactor), caption: `${formatCurrency(stats.avgWin)} avg win / ${formatCurrency(stats.avgLoss)} avg loss`, tone: C.blue },
    { label: 'MF score', value: `${overview.rank.score}`, caption: overview.rank.label, tone: toneColor(overview.rank.tone) },
  ];

  return (
    <div className="mf-dashboard-grid-kpi">
      {items.map((item, index) => (
        <MetricCard key={item.label} index={index + 3} label={item.label} value={item.value} caption={item.caption} tone={item.tone} />
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
    <SectionCard tone={C.accent} index={9} style={{ padding: '22px 22px 18px' }}>
      <SectionTitle
        eyebrow="Performance"
        title="Performance curve"
        tone={C.accent}
        icon={<Ic.Pulse />}
        action={(
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
        )}
      />

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', color: lastValue >= 0 ? C.green : C.danger }}>
          {formatCurrency(lastValue, true)}
        </div>
        <div style={{ fontSize: 12, color: C.text2 }}>
          active account scope
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
        <MiniMetric label="Best trade" value={formatCurrency(stats.bestTrade || 0, true)} tone={C.green} />
        <MiniMetric label="Worst trade" value={formatCurrency(stats.worstTrade || 0, true)} tone={C.danger} />
        <MiniMetric label="Max drawdown" value={`${Math.abs(stats.maxDrawdown || 0)}%`} tone={C.orange} />
        <MiniMetric label="Daily average" value={formatCurrency(averageDaily, true)} tone={averageDaily >= 0 ? C.accent : C.warn} />
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
        <EmptyState title="No equity history yet" body="Import trades to unlock the equity curve and the live MF score." />
      )}
    </SectionCard>
  );
}

function MarketFlowRankPanel({ overview }) {
  const rank = overview.rank;
  const rankTone = toneColor(rank.tone);

  return (
    <SectionCard tone={rankTone} index={10} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Competition" title="MarketFlow Rank" tone={rankTone} icon={<Ic.Trophy />} />

      <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', gap: 16, alignItems: 'center', marginBottom: 18 }}>
        <div
          style={{
            width: 132,
            height: 132,
            borderRadius: '50%',
            background: `conic-gradient(${rankTone} ${rank.normalized * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            padding: 12,
            boxSizing: 'border-box',
            boxShadow: `0 18px 46px ${shade(rankTone, 0.18)}`,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(7, 12, 22, 0.96) 62%)',
              border: `1px solid ${shade(rankTone, 0.18)}`,
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
          <TinyBadge tone={rankTone}>{rank.label}</TinyBadge>
          <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.04em', color: C.text0, marginTop: 12, marginBottom: 8 }}>
            #{rank.position.toLocaleString()} / Top {rank.percentile}%
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: C.text2, marginBottom: 12 }}>
            {rank.focus}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <MiniMetric label="Weekly move" value={`${rank.weeklyDelta >= 0 ? '+' : ''}${rank.weeklyDelta}`} tone={rank.weeklyDelta >= 0 ? C.green : C.danger} />
            <MiniMetric label="Next tier" value={rank.nextGap > 0 ? `${rank.nextGap} pts` : 'Unlocked'} tone={rankTone} caption={rank.nextGap > 0 ? rank.nextLabel : 'Apex'} />
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(rankTone, 0.14)}`, background: 'rgba(255,255,255,0.03)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
            Division progress
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: rankTone }}>
            {rank.nextGap > 0 ? `${rank.nextGap} pts to ${rank.nextLabel}` : 'Top tier unlocked'}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 10 }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${rank.progress}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(rankTone, 0.56)}, ${rankTone})` }} />
        </div>
        <div style={{ fontSize: 11, color: C.text2 }}>
          {rank.note}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {rank.factors.map((factor) => (
          <ProgressRow key={factor.label} label={factor.label} current={factor.value} target={100} tone={toneColor(factor.tone)} suffix="%" />
        ))}
      </div>
    </SectionCard>
  );
}

function PerformanceCalendarPanel({ trades, navigate }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const calendar = useMemo(() => buildCalendarMonth(trades, monthOffset), [trades, monthOffset]);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const available = calendar.days.find((day) => day.key === selectedKey && day.trades > 0);
    if (available) return;
    const fallback = calendar.days.find((day) => day.inMonth && day.trades > 0);
    setSelectedKey(fallback ? fallback.key : null);
  }, [calendar.days, selectedKey]);

  const selectedDay = calendar.days.find((day) => day.key === selectedKey) || null;

  return (
    <SectionCard tone={C.accent} index={11} style={{ padding: '22px 22px 20px', marginBottom: 14 }}>
      <SectionTitle
        eyebrow="Calendar"
        title="MarketFlow Calendar"
        tone={C.accent}
        icon={<Ic.Clock />}
        action={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <GhostButton onClick={() => setMonthOffset((value) => value - 1)}>Prev</GhostButton>
            <GhostButton onClick={() => setMonthOffset((value) => Math.min(0, value + 1))} disabled={!calendar.canGoForward}>Next</GhostButton>
            <GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>
          </div>
        )}
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
                <div style={{ fontSize: 11, color: C.text2 }}>Click a trading day to open the full daily breakdown.</div>
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
                      const selected = selectedKey === day.key;
                      return (
                        <button
                          key={day.key}
                          onClick={() => active && setSelectedKey(day.key)}
                          style={{
                            minHeight: 118,
                            borderRadius: 18,
                            padding: '12px 12px 11px',
                            border: `1px solid ${selected ? shade(C.accent, 0.42) : day.isToday ? shade(C.accent, 0.28) : active ? shade(tone, 0.2) : shade(C.borderHi, 0.8)}`,
                            background: active ? `linear-gradient(180deg, ${shade(tone, 0.18)} 0%, ${shade(tone, 0.06)} 100%)` : 'rgba(255,255,255,0.025)',
                            boxShadow: selected ? `0 0 0 1px ${shade(C.accent, 0.18)}` : day.isToday ? `0 0 0 1px ${shade(C.accent, 0.12)}` : 'none',
                            opacity: day.inMonth ? 1 : 0.28,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            cursor: active ? 'pointer' : 'default',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? C.accent : C.text0 }}>{day.day}</div>
                            {active && <div style={{ width: 7, height: 7, borderRadius: '50%', background: tone, boxShadow: `0 0 10px ${shade(tone, 0.44)}` }} />}
                          </div>

                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.05em', color: active ? tone : C.text3 }}>
                              {active ? formatCurrency(day.pnl, true) : 'No trades'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <div style={{ fontSize: 11, color: active ? C.text1 : C.text3 }}>
                                {active ? `${day.trades} trade${day.trades > 1 ? 's' : ''}` : 'Desk inactive'}
                              </div>
                              {active && <div style={{ fontSize: 10, color: C.text2 }}>{day.wins}W / {day.losses}L / {day.breakevens}BE</div>}
                            </div>
                          </div>
                        </button>
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
                  Daily detail
                </div>

                {selectedDay ? (
                  <>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.text0, marginBottom: 6 }}>{formatLongDate(selectedDay.date)}</div>
                      <div style={{ fontSize: 12, color: C.text2 }}>
                        {selectedDay.trades} trade{selectedDay.trades > 1 ? 's' : ''} / {selectedDay.winRate}% win rate
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                      <MiniMetric label="Daily P&L" value={formatCurrency(selectedDay.pnl, true)} tone={selectedDay.pnl >= 0 ? C.green : C.danger} />
                      <MiniMetric label="Average trade" value={formatCurrency(selectedDay.avgTrade, true)} tone={selectedDay.avgTrade >= 0 ? C.accent : C.warn} />
                      <MiniMetric label="Lead session" value={selectedDay.sessionLeader ? selectedDay.sessionLeader.label : 'n/a'} tone={C.teal} caption={selectedDay.sessionLeader ? `${selectedDay.sessionLeader.count} trade${selectedDay.sessionLeader.count > 1 ? 's' : ''}` : 'No dominant session'} />
                      <MiniMetric label="Lead pair" value={selectedDay.pairLeader ? selectedDay.pairLeader.label : 'n/a'} tone={C.blue} caption={selectedDay.pairLeader ? formatCurrency(selectedDay.pairLeader.pnl, true) : 'No pair lead'} />
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
                      Executions
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                      {selectedDay.records.slice(0, 6).map((record) => {
                        const pnlTone = record.pnl >= 0 ? C.green : C.danger;
                        return (
                          <div key={record.id} style={{ padding: '10px 11px', borderRadius: 14, border: `1px solid ${shade(pnlTone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: C.text1 }}>{record.symbol}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: pnlTone }}>{formatCurrency(record.pnl, true)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>
                              {record.direction} / {record.session} / {record.setup}
                            </div>
                            {record.notes && (
                              <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.55, color: C.text3 }}>
                                {record.notes.slice(0, 86)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                    Select a trading day to open the full breakdown for that session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="No trading calendar yet" body="Import trades in All Trades to unlock the monthly calendar and daily drill-down." action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />
      )}
    </SectionCard>
  );
}

function RecentExecutions({ trades, navigate }) {
  return (
    <SectionCard tone={C.accent} index={12} style={{ padding: '20px 20px 10px' }}>
      <SectionTitle eyebrow="Execution" title="Recent executions" tone={C.accent} icon={<Ic.Session />} action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />

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
        <EmptyState title="No recent executions" body="Import or add trades to make this your daily review table." action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />
      )}
    </SectionCard>
  );
}

function JournalDiscipline({ overview }) {
  const tone = overview.hygieneScore >= 75 ? C.green : overview.hygieneScore >= 55 ? C.warn : C.danger;

  return (
    <SectionCard tone={tone} index={13} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Quality" title="Journal discipline" tone={tone} icon={<Ic.Shield />} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', color: tone }}>
          {overview.hygieneScore}%
        </div>
        <div style={{ fontSize: 12, color: C.text2 }}>
          completion quality across the active journal scope
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

function CompetitionPreviewPanel({ overview, navigate }) {
  const rankTone = toneColor(overview.rank.tone);
  const board = useMemo(() => buildCompetitionBoard(overview.rank, 'You'), [overview.rank]);

  return (
    <SectionCard tone={rankTone} index={14} style={{ padding: '20px 20px 18px' }}>
      <SectionTitle eyebrow="Competition" title="Leaderboard preview" tone={rankTone} icon={<Ic.Trophy />} action={<GhostButton onClick={() => navigate(ROUTES.competition)}>Open Competition</GhostButton>} />

      <div style={{ display: 'grid', gap: 8 }}>
        {board.slice(0, 5).map((row) => {
          const rowTone = row.isUser ? rankTone : C.text2;
          return (
            <div key={row.id} style={{ padding: '11px 12px', borderRadius: 14, border: `1px solid ${shade(rowTone, row.isUser ? 0.22 : 0.12)}`, background: row.isUser ? shade(rankTone, 0.1) : 'rgba(255,255,255,0.025)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: rowTone, minWidth: 36 }}>#{row.position}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: row.isUser ? C.text0 : C.text1 }}>{row.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: rowTone }}>{row.score}</span>
              </div>
              <div style={{ fontSize: 10.5, color: row.isUser ? C.text2 : C.text3 }}>
                Top {row.percentile}% / {row.delta >= 0 ? '+' : ''}{row.delta} this week
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function CompactRoutinePanel({ items, onToggle, onTitleChange, navigate, overview }) {
  const [editing, setEditing] = useState(false);
  const completed = items.filter((item) => item.done).length;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;
  const progressTone = progress >= 100 ? C.green : progress >= 50 ? C.accent : C.warn;

  return (
    <SectionCard tone={progressTone} index={1} style={{ padding: '18px 18px 16px', marginBottom: 16 }}>
      <SectionTitle
        eyebrow="Workflow"
        title="Today's workflow"
        tone={progressTone}
        icon={<Ic.Checklist />}
        action={(
          <GhostButton onClick={() => setEditing((value) => !value)} icon={editing ? <Ic.Save /> : <Ic.Edit />}>
            {editing ? 'Done editing' : 'Customize'}
          </GhostButton>
        )}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 0.62fr) minmax(0, 1fr)', gap: 14 }}>
        <div style={{ padding: '15px 15px 13px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(progressTone, 0.14)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <TinyBadge tone={progressTone}>{completed}/{items.length} done</TinyBadge>
            <span style={{ fontSize: 11, color: C.text2 }}>MF score</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', color: progressTone }}>
              {progress}%
            </div>
            <div style={{ fontSize: 12, color: C.text2 }}>
              completed today
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(progressTone, 0.58)}, ${progressTone})` }} />
          </div>
          <MiniMetric label="Current focus" value={overview.rank.focus} tone={toneColor(overview.rank.tone)} caption={overview.rank.note} />
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: '12px 13px', borderRadius: 16, border: `1px solid ${item.done ? shade(C.green, 0.18) : shade(C.accent, 0.12)}`, background: item.done ? 'rgba(var(--mf-green-rgb, 0, 255, 136),0.07)' : 'rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => onToggle(item.id)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    border: `1px solid ${item.done ? shade(C.green, 0.22) : C.border}`,
                    background: item.done ? shade(C.green, 0.16) : 'rgba(255,255,255,0.02)',
                    color: item.done ? C.green : C.text3,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: 12,
                  }}
                >
                  {item.done ? '✓' : ''}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing ? (
                    <input
                      value={item.title}
                      onChange={(event) => onTitleChange(item.id, event.target.value)}
                      style={{
                        width: '100%',
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: 'rgba(255,255,255,0.02)',
                        color: C.text1,
                        fontSize: 12.5,
                        padding: '8px 10px',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 12.5, lineHeight: 1.55, color: item.done ? C.text1 : C.text2, textDecoration: item.done ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                  )}
                </div>

                <GhostButton onClick={() => navigate(item.route)} icon={<Ic.ArrowRight />}>
                  Open
                </GhostButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function CompactRankPanel({ overview, navigate }) {
  const rank = overview.rank;
  const rankTone = toneColor(rank.tone);
  const topLine = [
    { label: 'Score', value: rank.score, tone: rankTone },
    { label: 'Position', value: `#${rank.position.toLocaleString()}`, tone: C.text1 },
    { label: 'Weekly', value: `${rank.weeklyDelta >= 0 ? '+' : ''}${rank.weeklyDelta}`, tone: rank.weeklyDelta >= 0 ? C.green : C.danger },
  ];

  return (
    <SectionCard tone={rankTone} index={10} style={{ padding: '18px 18px 16px' }}>
      <SectionTitle
        eyebrow="Competition"
        title="MarketFlow Rank"
        tone={rankTone}
        icon={<Ic.Trophy />}
        action={<GhostButton onClick={() => navigate(ROUTES.competition)}>Open</GhostButton>}
      />

      <TinyBadge tone={rankTone}>{rank.label}</TinyBadge>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: C.text2, marginTop: 10, marginBottom: 14 }}>
        {rank.focus}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
        {topLine.map((item) => (
          <div key={item.label} style={{ padding: '12px 12px 10px', borderRadius: 14, border: `1px solid ${shade(item.tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: item.tone, letterSpacing: '-0.04em' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>Division progress</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: rankTone }}>{rank.progress}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${rank.progress}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(rankTone, 0.56)}, ${rankTone})` }} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {rank.factors.slice(0, 3).map((factor) => (
          <ProgressRow key={factor.label} label={factor.label} current={factor.value} target={100} tone={toneColor(factor.tone)} suffix="%" />
        ))}
      </div>
    </SectionCard>
  );
}

function CompactCalendarPanel({ trades, navigate }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const calendar = useMemo(() => buildCalendarMonth(trades, monthOffset), [trades, monthOffset]);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const available = calendar.days.find((day) => day.key === selectedKey && day.trades > 0);
    if (available) return;
    const fallback = calendar.days.find((day) => day.inMonth && day.trades > 0);
    setSelectedKey(fallback ? fallback.key : null);
  }, [calendar.days, selectedKey]);

  const selectedDay = calendar.days.find((day) => day.key === selectedKey) || null;

  return (
    <SectionCard tone={C.accent} index={11} style={{ padding: '18px 18px 16px', marginBottom: 14 }}>
      <SectionTitle
        eyebrow="Calendar"
        title="Trading calendar"
        tone={C.accent}
        icon={<Ic.Clock />}
        action={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GhostButton onClick={() => setMonthOffset((value) => value - 1)}>Prev</GhostButton>
            <GhostButton onClick={() => setMonthOffset((value) => Math.min(0, value + 1))} disabled={!calendar.canGoForward}>Next</GhostButton>
          </div>
        )}
      />

      {calendar.hasHistory ? (
        <div className="mf-dashboard-calendar-shell">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text0 }}>{calendar.monthLabel}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <TinyBadge tone={calendar.totalPnl >= 0 ? C.green : C.danger}>{formatCurrency(calendar.totalPnl, true)}</TinyBadge>
                <TinyBadge tone={C.accent}>{calendar.tradeCount} trades</TinyBadge>
                <TinyBadge tone={C.green}>{calendar.positiveDays} green days</TinyBadge>
              </div>
            </div>

            <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
              <div style={{ minWidth: 720 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8, marginBottom: 8 }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} style={{ padding: '0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 }}>
                  {calendar.days.map((day) => {
                    const tone = day.pnl > 0 ? C.green : day.pnl < 0 ? C.danger : C.accent;
                    const active = day.trades > 0;
                    const selected = selectedKey === day.key;
                    return (
                      <button
                        key={day.key}
                        onClick={() => active && setSelectedKey(day.key)}
                        style={{
                          minHeight: 104,
                          borderRadius: 16,
                          padding: '11px 11px 10px',
                          border: `1px solid ${selected ? shade(C.accent, 0.38) : active ? shade(tone, 0.18) : shade(C.borderHi, 0.82)}`,
                          background: active ? `linear-gradient(180deg, ${shade(tone, 0.14)} 0%, ${shade(tone, 0.04)} 100%)` : 'rgba(255,255,255,0.02)',
                          boxShadow: selected ? `0 0 0 1px ${shade(C.accent, 0.16)}` : 'none',
                          opacity: day.inMonth ? 1 : 0.28,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 8,
                          cursor: active ? 'pointer' : 'default',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? C.accent : C.text0 }}>{day.day}</span>
                          {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone, boxShadow: `0 0 10px ${shade(tone, 0.44)}` }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', color: active ? tone : C.text3, marginBottom: 4 }}>
                            {active ? formatCurrency(day.pnl, true) : '—'}
                          </div>
                          <div style={{ fontSize: 10.5, color: active ? C.text2 : C.text3 }}>
                            {active ? `${day.trades} trade${day.trades > 1 ? 's' : ''}` : 'No trades'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <div style={{ padding: '14px 15px', borderRadius: 16, border: `1px solid ${shade(C.accent, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>
                Day detail
              </div>

              {selectedDay ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text0, marginBottom: 4 }}>{formatLongDate(selectedDay.date)}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>
                      {selectedDay.trades} trade{selectedDay.trades > 1 ? 's' : ''} / {selectedDay.winRate}% win rate
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                    <MiniMetric label="Daily P&L" value={formatCurrency(selectedDay.pnl, true)} tone={selectedDay.pnl >= 0 ? C.green : C.danger} />
                    <MiniMetric label="Average trade" value={formatCurrency(selectedDay.avgTrade, true)} tone={selectedDay.avgTrade >= 0 ? C.accent : C.warn} />
                    <MiniMetric label="Lead session" value={selectedDay.sessionLeader ? selectedDay.sessionLeader.label : 'n/a'} tone={C.teal} caption={selectedDay.sessionLeader ? `${selectedDay.sessionLeader.count} trade${selectedDay.sessionLeader.count > 1 ? 's' : ''}` : 'No dominant session'} />
                    <MiniMetric label="Lead pair" value={selectedDay.pairLeader ? selectedDay.pairLeader.label : 'n/a'} tone={C.blue} caption={selectedDay.pairLeader ? formatCurrency(selectedDay.pairLeader.pnl, true) : 'No pair lead'} />
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedDay.records.slice(0, 5).map((record) => {
                      const pnlTone = record.pnl >= 0 ? C.green : C.danger;
                      return (
                        <div key={record.id} style={{ padding: '10px 11px', borderRadius: 14, border: `1px solid ${shade(pnlTone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.text1 }}>{record.symbol}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: pnlTone }}>{formatCurrency(record.pnl, true)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>
                            {record.direction} / {record.session} / {record.setup}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                  Select a trading day to open the detail.
                </div>
              )}
            </div>

            <GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>
          </div>
        </div>
      ) : (
        <EmptyState title="No trading calendar yet" body="Import trades in All Trades to unlock the monthly view." action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open All Trades</GhostButton>} />
      )}
    </SectionCard>
  );
}

function CompactRecentExecutions({ trades, navigate }) {
  return (
    <SectionCard tone={C.accent} index={12} style={{ padding: '18px 18px 12px' }}>
      <SectionTitle eyebrow="Execution" title="Latest trades" tone={C.accent} icon={<Ic.Session />} action={<GhostButton onClick={() => navigate(ROUTES.trades)}>Open</GhostButton>} />

      {trades.length ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead>
              <tr>
                {['Date', 'Pair', 'Side', 'P&L'].map((header) => (
                  <th key={header} style={{ padding: '0 8px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: C.text3, textAlign: header === 'P&L' ? 'right' : 'left', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.slice(0, 5).map((trade) => {
                const pnlTone = Number(trade.pnl || 0) >= 0 ? C.green : C.danger;
                return (
                  <tr key={trade.id}>
                    <td style={{ padding: '14px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{formatShortDate(trade.open_date || trade.date)}</td>
                    <td style={{ padding: '14px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 700, color: C.text0, whiteSpace: 'nowrap' }}>{trade.symbol || trade.pair || 'Unknown'}</td>
                    <td style={{ padding: '14px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, color: C.text2, whiteSpace: 'nowrap' }}>{trade.direction || trade.dir || 'n/a'}</td>
                    <td style={{ padding: '14px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: pnlTone, whiteSpace: 'nowrap' }}>{formatCurrency(trade.pnl, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No closed trades yet" body="Import or log trades to build the daily review." />
      )}
    </SectionCard>
  );
}

function CompactCompetitionPanel({ overview, navigate }) {
  const rankTone = toneColor(overview.rank.tone);
  const board = useMemo(() => buildCompetitionBoard(overview.rank, 'You'), [overview.rank]);

  return (
    <SectionCard tone={rankTone} index={13} style={{ padding: '18px 18px 16px' }}>
      <SectionTitle eyebrow="Competition" title="Leaderboard" tone={rankTone} icon={<Ic.Trophy />} action={<GhostButton onClick={() => navigate(ROUTES.competition)}>Open</GhostButton>} />
      <div style={{ display: 'grid', gap: 8 }}>
        {board.slice(0, 4).map((row) => {
          const rowTone = row.isUser ? rankTone : C.text2;
          return (
            <div key={row.id} style={{ padding: '11px 12px', borderRadius: 14, border: `1px solid ${shade(rowTone, row.isUser ? 0.22 : 0.12)}`, background: row.isUser ? shade(rankTone, 0.1) : 'rgba(255,255,255,0.025)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: rowTone, minWidth: 36 }}>#{row.position}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: row.isUser ? C.text0 : C.text1 }}>{row.name}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: rowTone }}>{row.score}</span>
              </div>
              <div style={{ fontSize: 10.5, color: row.isUser ? C.text2 : C.text3 }}>
                Top {row.percentile}% / {row.delta >= 0 ? '+' : ''}{row.delta} this week
              </div>
            </div>
          );
        })}
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

  const baseOverview = useMemo(() => buildDashboardOverview(stats, trades, 0), [stats, trades]);
  const routineBlueprint = useMemo(() => buildRoutineBlueprint(baseOverview), [baseOverview]);
  const [routineItems, setRoutineItems] = useState(() => loadRoutineState(activeAccount, routineBlueprint));

  useEffect(() => {
    setRoutineItems(loadRoutineState(activeAccount, routineBlueprint));
  }, [activeAccount, routineBlueprint]);

  useEffect(() => {
    persistRoutineState(activeAccount, routineItems);
  }, [activeAccount, routineItems]);

  const routineScore = useMemo(() => (
    routineItems.length ? Math.round((routineItems.filter((item) => item.done).length / routineItems.length) * 100) : 0
  ), [routineItems]);

  const overview = useMemo(() => buildDashboardOverview(stats, trades, routineScore), [stats, trades, routineScore]);

  const toggleRoutineItem = (id) => {
    setRoutineItems((current) => current.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    )));
  };

  const changeRoutineTitle = (id, title) => {
    setRoutineItems((current) => current.map((item) => (
      item.id === id ? { ...item, title } : item
    )));
  };

  return (
    <div className="mf-dashboard-shell">
      <style>{DASHBOARD_STYLES}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '16%', width: 560, height: 360, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.035) 0%, transparent 72%)', filter: 'blur(46px)', animation: 'mfDashboardGlowA 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: 0, width: 520, height: 320, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255), 0.022) 0%, transparent 72%)', filter: 'blur(48px)', animation: 'mfDashboardGlowB 22s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, padding: '30px 30px 54px', width: '100%', boxSizing: 'border-box' }}>
        <HeaderPanel
          stats={stats}
          overview={overview}
          accountOptions={accountOptions}
          activeAccount={activeAccount}
          onAccountChange={setActiveAccount}
        />

        <CompactRoutinePanel
          items={routineItems}
          onToggle={toggleRoutineItem}
          onTitleChange={changeRoutineTitle}
          navigate={navigate}
          overview={overview}
        />

        <KpiStrip stats={stats} overview={overview} />

        <div className="mf-dashboard-grid-primary">
          <EquityPanel stats={stats} />
          <CompactRankPanel overview={overview} navigate={navigate} />
        </div>

        <CompactCalendarPanel trades={trades} navigate={navigate} />

        <div className="mf-dashboard-grid-secondary">
          <CompactRecentExecutions trades={overview.recentTrades} navigate={navigate} />
          <div className="mf-dashboard-side-stack">
            <CompactCompetitionPanel overview={overview} navigate={navigate} />
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
