import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { shade } from '../lib/colorAlpha';
import {
  buildBacktestSessionName,
  createBacktestSession,
  getBacktestSessionLimit,
  loadBacktestSessions,
  normalizeBacktestSession,
  saveBacktestSessions,
} from '../lib/backtestSessions';
import {
  CHART_AXIS,
  CHART_AXIS_SMALL,
  CHART_GRID,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';
import {
  buildEquityDrawdownSeries,
  buildRollingWinRateSeries,
  formatAnalyticsMoney,
  formatAnalyticsPercent,
  formatAnalyticsRR,
  getTradeDateLabel,
  getTradeDateValue,
  getTradePnl,
  getTradeRR,
  sortTradesChronologically,
  summarizeTradeSet,
} from '../lib/marketflowAnalytics';

const C = {
  accent: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  blue: 'var(--mf-blue,#4D7CFF)',
  teal: 'var(--mf-teal,#00D2B8)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  purple: 'var(--mf-purple,#A78BFA)',
  gold: 'var(--mf-gold,#D7B36A)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#142033)',
  borderHi: 'var(--mf-border-hi,#1F2F47)',
};

const PAGE_STYLES = `
  .mf-bt-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .mf-bt-nav {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .mf-bt-action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .mf-bt-dashboard-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 16px;
    margin-bottom: 16px;
    align-items: start;
  }

  .mf-bt-performance-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mf-bt-chart-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .mf-bt-session-list {
    display: grid;
    gap: 10px;
  }

  .mf-bt-session-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 14px;
  }

  .mf-bt-session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }

  .mf-bt-modal-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .mf-bt-modal-assets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .mf-bt-replay-shell {
    display: grid;
    gap: 14px;
  }

  .mf-bt-replay-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .mf-bt-replay-body {
    display: grid;
    grid-template-columns: 54px minmax(0, 1fr) 350px;
    gap: 14px;
    align-items: start;
  }

  .mf-bt-replay-side {
    display: grid;
    gap: 14px;
  }

  .mf-bt-replay-trades {
    display: grid;
    gap: 8px;
    max-height: 350px;
    overflow: auto;
    padding-right: 4px;
  }

  .mf-bt-replay-bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 14px;
    align-items: start;
  }

  @media (max-width: 1320px) {
    .mf-bt-dashboard-grid,
    .mf-bt-chart-grid,
    .mf-bt-replay-bottom {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1220px) {
    .mf-bt-replay-body {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 860px) {
    .mf-bt-performance-grid,
    .mf-bt-modal-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const VIEW_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'trades', label: 'Trades' },
  { id: 'analytics', label: 'Analytics' },
];

const INTERVAL_OPTIONS = [
  { value: '1', label: '1m' },
  { value: '3', label: '3m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: 'D' },
  { value: 'W', label: 'W' },
];

const SPEED_OPTIONS = [1, 2, 5, 10];

const CHART_LAYOUT_OPTIONS = [
  { value: 'single', label: 'Single chart' },
  { value: 'focus', label: 'Focus chart' },
  { value: 'split', label: 'Split chart' },
];

const REPLAY_TOOLS = ['+', '/', '=', '<>', 'T', 'R', 'L', 'E'];

const Ic = {
  Plus: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M6.2 4.8L15 10L6.2 15.2V4.8Z" fill="currentColor" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <rect x="5" y="4.5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="12" y="4.5" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M12.8 4.8L7.4 10L12.8 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M7.2 4.8L12.6 10L7.2 15.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="4.7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.1 12.1L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Replay: () => (
    <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M7 6.2H14.2V13.5H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 4L5 6.2L8.2 8.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.36,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function getTradeSymbol(trade = {}) {
  return String(trade.symbol || trade.pair || 'Unknown').trim() || 'Unknown';
}

function getTradeAccountId(trade = {}) {
  const label = String(
    trade.account
    || trade.account_name
    || trade.extra?.account
    || trade.extra?.account_name
    || trade.extra?.account_number
    || trade.account_number
    || trade.exchange
    || trade.broker
    || trade.extra?.exchange
    || trade.extra?.broker
    || 'Main journal'
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `account:${label || 'main-journal'}`;
}

function toTradingViewSymbol(symbol = 'EURUSD') {
  const clean = String(symbol || 'EURUSD').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean || clean === 'ALL') return 'OANDA:EURUSD';
  if (clean === 'BTCUSD') return 'BITSTAMP:BTCUSD';
  if (clean === 'ETHUSD') return 'BITSTAMP:ETHUSD';
  if (clean === 'US30') return 'FOREXCOM:US30';
  if (clean === 'NAS100') return 'FOREXCOM:NSXUSD';
  if (clean === 'XAUUSD') return 'OANDA:XAUUSD';
  if (clean === 'AAPL') return 'NASDAQ:AAPL';
  if (clean.length === 6) return `OANDA:${clean}`;
  return `FOREXCOM:${clean}`;
}

function formatMoney(value = 0, digits = 0) {
  return formatAnalyticsMoney(Number(value) || 0, digits);
}

function formatCompactMoney(value = 0) {
  const numeric = Number(value) || 0;
  const absolute = Math.abs(numeric).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (numeric > 0) return `+$${absolute}`;
  if (numeric < 0) return `-$${absolute}`;
  return '$0';
}

function formatHours(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (!hours && !minutes) return '0m';
  if (!hours) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getDefaultDateBounds(trades = []) {
  const dates = trades.map((trade) => getTradeDateValue(trade)).filter(Boolean).sort((left, right) => left - right);
  if (!dates.length) {
    const now = new Date();
    const iso = now.toISOString().slice(0, 10);
    return { min: iso, max: iso };
  }
  return {
    min: dates[0].toISOString().slice(0, 10),
    max: dates[dates.length - 1].toISOString().slice(0, 10),
  };
}

function createDefaultForm(trades = [], activeAccount = 'all') {
  const bounds = getDefaultDateBounds(trades);
  const symbols = [...new Set(trades.map((trade) => getTradeSymbol(trade)).filter(Boolean))];
  return {
    mode: 'backtesting',
    name: '',
    accountBalance: 100000,
    assets: symbols.length ? [symbols[0]] : [],
    chartLayout: 'single',
    startDate: bounds.min,
    endDate: bounds.max,
    randomize: false,
    interval: '1',
    accountScope: activeAccount || 'all',
    notes: '',
  };
}

function filterTradesForSession(trades = [], session = {}) {
  const assets = Array.isArray(session.assets) && session.assets.length
    ? session.assets
    : session.symbol && session.symbol !== 'all'
      ? [session.symbol]
      : [];

  return sortTradesChronologically((trades || []).filter((trade) => {
    const tradeDate = getTradeDateValue(trade);
    if (!tradeDate) return false;

    if (session.accountScope && session.accountScope !== 'all' && getTradeAccountId(trade) !== session.accountScope) return false;
    if (assets.length && !assets.includes(getTradeSymbol(trade))) return false;
    if (session.startDate && tradeDate < new Date(`${session.startDate}T00:00:00`)) return false;
    if (session.endDate && tradeDate > new Date(`${session.endDate}T23:59:59`)) return false;
    return true;
  }));
}

function buildSessionMetrics(sessionDetails = []) {
  const totalReviewedSeconds = sessionDetails.reduce((sum, session) => sum + (session.reviewedSeconds || 0), 0);
  const totalTrades = sessionDetails.reduce((sum, session) => sum + (session.tradeCount || 0), 0);
  const totalWins = sessionDetails.reduce((sum, session) => sum + (session.summary?.wins || 0), 0);
  const totalHistoryDays = sessionDetails.reduce((sum, session) => {
    if (!session.startDate || !session.endDate) return sum;
    const start = new Date(`${session.startDate}T00:00:00`);
    const end = new Date(`${session.endDate}T00:00:00`);
    const diff = Math.max(1, Math.round((end - start) / 86400000) + 1);
    return sum + diff;
  }, 0);

  const timeInvestedSeries = Object.values(sessionDetails.reduce((bucket, session) => {
    const label = new Date(session.createdAt || Date.now()).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    if (!bucket[label]) bucket[label] = { label, seconds: 0, winRate: 0, trades: 0 };
    bucket[label].seconds += session.reviewedSeconds || 0;
    bucket[label].trades += session.tradeCount || 0;
    bucket[label].winRate += session.summary?.wins || 0;
    return bucket;
  }, {})).map((row) => ({
    label: row.label,
    hours: Number((row.seconds / 3600).toFixed(1)),
    trades: row.trades,
    winRate: row.trades ? Number(((row.winRate / row.trades) * 100).toFixed(1)) : 0,
  }));

  const symbolSeries = Object.values(sessionDetails.reduce((bucket, session) => {
    session.trades.forEach((trade) => {
      const symbol = getTradeSymbol(trade);
      if (!bucket[symbol]) bucket[symbol] = { symbol, trades: 0 };
      bucket[symbol].trades += 1;
    });
    return bucket;
  }, {}))
    .sort((left, right) => right.trades - left.trades)
    .slice(0, 6);

  return {
    totalReviewedSeconds,
    totalTrades,
    totalHistoryDays,
    totalWinRate: totalTrades ? Number(((totalWins / totalTrades) * 100).toFixed(1)) : 0,
    timeInvestedSeries,
    symbolSeries,
  };
}

function TradingViewEmbed({ symbol, interval, height = 640 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host || typeof window === 'undefined') return undefined;

    host.innerHTML = '';
    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '100%';
    widget.style.width = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: toTradingViewSymbol(symbol),
      interval: String(interval || '1'),
      timezone: 'Europe/Paris',
      theme: 'dark',
      style: '1',
      locale: 'en',
      allow_symbol_change: false,
      withdateranges: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      details: false,
      hotlist: false,
      calendar: false,
      save_image: false,
      backgroundColor: '#0A0F18',
      gridColor: 'rgba(54,72,104,0.28)',
      studies: ['Volume@tv-basicstudies'],
      support_host: 'https://www.tradingview.com',
    });

    host.appendChild(widget);
    host.appendChild(script);

    return () => {
      host.innerHTML = '';
    };
  }, [symbol, interval]);

  return (
    <div style={{ height, width: '100%', overflow: 'hidden', borderRadius: 20, border: `1px solid ${shade(C.borderHi, 0.75)}`, background: '#0A0F18' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

function Card({ children, tone = C.accent, style, index = 0, className = '' }) {
  return (
    <motion.section
      className={className}
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,16,27,0.92), rgba(7,11,19,0.96))',
        boxShadow: '0 22px 62px rgba(0,0,0,0.24)',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.09)} 0%, transparent 42%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function GhostButton({ children, onClick, icon = null, disabled = false, tone = C.text1 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 36,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${disabled ? shade(C.border, 0.9) : shade(tone, 0.18)}`,
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
        color: disabled ? C.text3 : tone,
        fontSize: 11.5,
        fontWeight: 800,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function NavButton({ active = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 34,
        padding: '0 12px',
        borderRadius: 11,
        border: `1px solid ${active ? shade(C.accent, 0.28) : shade(C.borderHi, 0.86)}`,
        background: active ? shade(C.accent, 0.13) : 'rgba(255,255,255,0.025)',
        color: active ? C.accent : C.text2,
        fontSize: 11.5,
        fontWeight: 800,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function MiniStat({ label, value, caption = '', tone = C.text1 }) {
  return (
    <div style={{ padding: '15px 15px 13px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: C.text3, marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 25, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: caption ? 6 : 0 }}>
        {value}
      </div>
      {caption ? <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{caption}</div> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [], disabled = false }) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      {label ? (
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
          {label}
        </span>
      ) : null}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          height: 42,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: disabled ? C.text3 : C.text1,
          padding: '0 12px',
          fontSize: 12.5,
          fontWeight: 700,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SessionCard({ session, onOpen, onDelete }) {
  const tone = session.totalPnl >= 0 ? C.green : session.totalPnl < 0 ? C.danger : C.text2;
  return (
    <div style={{ padding: '14px 14px 13px', borderRadius: 18, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text0, marginBottom: 4 }}>{session.name}</div>
          <div style={{ fontSize: 11, color: C.text2 }}>
            {session.mode === 'prop-firm' ? 'Prop firm session' : 'Backtesting session'} / {session.assets.join(', ')}
          </div>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: tone }}>
          {session.progressPct}%
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 10 }}>
        <MiniStat label="P&L" value={formatCompactMoney(session.totalPnl)} tone={tone} />
        <MiniStat label="Win" value={formatAnalyticsPercent(session.winRate, 0)} tone={session.winRate >= 50 ? C.green : C.warn} />
        <MiniStat label="Trades" value={`${session.tradeCount}`} tone={C.accent} />
        <MiniStat label="Time" value={formatHours(session.reviewedSeconds)} tone={C.blue} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 10.5, color: C.text3 }}>
          {session.startDate} to {session.endDate}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GhostButton onClick={onDelete} tone={C.danger}>Delete</GhostButton>
          <GhostButton onClick={onOpen} icon={<Ic.Play />} tone={C.accent}>Open</GhostButton>
        </div>
      </div>
    </div>
  );
}

function CreateSessionModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  symbolOptions,
  accountOptions,
  plan,
}) {
  const canUseProp = plan === 'pro' || plan === 'elite';

  const toggleAsset = (asset) => {
    setForm((current) => {
      const nextAssets = current.assets.includes(asset)
        ? current.assets.filter((value) => value !== asset)
        : [...current.assets, asset];
      return { ...current, assets: nextAssets };
    });
  };

  const applyDuration = (days) => {
    if (!form.startDate) return;
    const start = new Date(`${form.startDate}T00:00:00`);
    start.setDate(start.getDate() + days);
    setForm((current) => ({ ...current, endDate: start.toISOString().slice(0, 10) }));
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,5,10,0.72)',
              backdropFilter: 'blur(12px)',
              zIndex: 1200,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: '8vh auto auto 50%',
              transform: 'translateX(-50%)',
              width: 'min(760px, 94vw)',
              zIndex: 1201,
            }}
          >
            <Card tone={C.accent} style={{ padding: '18px 18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: shade(C.accent, 0.88), marginBottom: 8 }}>
                    Create session
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, marginBottom: 8 }}>
                    Quick session builder
                  </div>
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.65 }}>
                    Build a replay session from your imported journal history.
                  </div>
                </div>
                <GhostButton onClick={onClose} icon={<Ic.Close />}>Close</GhostButton>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <NavButton active={form.mode === 'backtesting'} onClick={() => setForm((current) => ({ ...current, mode: 'backtesting' }))}>
                  Backtesting session
                </NavButton>
                <NavButton active={form.mode === 'prop-firm'} onClick={() => canUseProp && setForm((current) => ({ ...current, mode: 'prop-firm' }))}>
                  Prop firm session {canUseProp ? '' : '(Pro)'}
                </NavButton>
              </div>

              <div className="mf-bt-modal-grid" style={{ marginBottom: 14 }}>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                    Name
                  </span>
                  <input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Name this session"
                    style={{
                      height: 42,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: C.text1,
                      padding: '0 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                    Account balance
                  </span>
                  <input
                    type="number"
                    value={form.accountBalance}
                    onChange={(event) => setForm((current) => ({ ...current, accountBalance: Number(event.target.value) || 0 }))}
                    style={{
                      height: 42,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: C.text1,
                      padding: '0 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>

                <SelectField label="Chart layout" value={form.chartLayout} onChange={(event) => setForm((current) => ({ ...current, chartLayout: event.target.value }))} options={CHART_LAYOUT_OPTIONS} />
                <SelectField label="Account scope" value={form.accountScope} onChange={(event) => setForm((current) => ({ ...current, accountScope: event.target.value }))} options={accountOptions.map((option) => ({ value: option.id, label: option.label }))} />
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                    Initial date
                  </span>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                    style={{
                      height: 42,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: C.text1,
                      padding: '0 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                    End date
                  </span>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                    style={{
                      height: 42,
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: C.text1,
                      padding: '0 12px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gap: 7, marginBottom: 14 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  Assets
                </span>
                <div className="mf-bt-modal-assets">
                  {symbolOptions.map((symbol) => {
                    const active = form.assets.includes(symbol);
                    return (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => toggleAsset(symbol)}
                        style={{
                          height: 34,
                          padding: '0 12px',
                          borderRadius: 11,
                          border: `1px solid ${active ? shade(C.accent, 0.28) : shade(C.borderHi, 0.86)}`,
                          background: active ? shade(C.accent, 0.13) : 'rgba(255,255,255,0.025)',
                          color: active ? C.accent : C.text2,
                          fontSize: 11.5,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {symbol}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                <GhostButton onClick={() => applyDuration(1)}>+1D</GhostButton>
                <GhostButton onClick={() => applyDuration(7)}>+1W</GhostButton>
                <GhostButton onClick={() => applyDuration(30)}>+1M</GhostButton>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, paddingLeft: 4, fontSize: 12, color: C.text2 }}>
                  <input
                    type="checkbox"
                    checked={form.randomize}
                    onChange={(event) => setForm((current) => ({ ...current, randomize: event.target.checked }))}
                  />
                  Randomize date window
                </label>
              </div>

              <div style={{ display: 'grid', gap: 7, marginBottom: 16 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={4}
                  placeholder="Session brief, focus, hypotheses."
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text1,
                    padding: '12px',
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                <GhostButton onClick={onClose}>Cancel</GhostButton>
                <GhostButton onClick={onSubmit} icon={<Ic.Plus />} tone={C.accent}>Create session</GhostButton>
              </div>
            </Card>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function Backtest() {
  const { user } = useAuth();
  const { allTrades = [], accountOptions = [], activeAccount = 'all' } = useTradingContext();
  const plan = String(user?.plan || 'trial').toLowerCase();
  const sessionLimit = getBacktestSessionLimit(plan);
  const userId = user?.id || 'guest';

  const tradeUniverse = useMemo(() => {
    return sortTradesChronologically((allTrades || []).filter((trade) => getTradeDateValue(trade) && getTradeSymbol(trade) !== 'Unknown'));
  }, [allTrades]);

  const [view, setView] = useState('dashboard');
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('recent');
  const [savedSessions, setSavedSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [currentAsset, setCurrentAsset] = useState('');
  const [chartInterval, setChartInterval] = useState('1');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sessionNotes, setSessionNotes] = useState('');
  const [form, setForm] = useState(() => createDefaultForm(tradeUniverse, activeAccount));

  useEffect(() => {
    const loaded = loadBacktestSessions(userId)
      .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));
    setSavedSessions(loaded);
    if (loaded.length) {
      setSelectedSessionId(loaded[0].id);
    }
  }, [userId]);

  useEffect(() => {
    saveBacktestSessions(userId, savedSessions);
  }, [savedSessions, userId]);

  useEffect(() => {
    setForm(createDefaultForm(tradeUniverse, activeAccount));
  }, [tradeUniverse, activeAccount]);

  const symbolOptions = useMemo(() => [...new Set(tradeUniverse.map((trade) => getTradeSymbol(trade)).filter(Boolean))].sort(), [tradeUniverse]);

  const sessionDetails = useMemo(() => {
    return savedSessions.map((session) => {
      const trades = filterTradesForSession(tradeUniverse, session);
      const summary = summarizeTradeSet(trades);
      return {
        ...session,
        trades,
        summary,
        tradeCount: trades.length,
        totalPnl: summary.totalPnL || 0,
        winRate: summary.winRate || 0,
      };
    });
  }, [savedSessions, tradeUniverse]);

  const metrics = useMemo(() => buildSessionMetrics(sessionDetails), [sessionDetails]);

  const filteredSessions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const next = sessionDetails.filter((session) => {
      if (!normalizedSearch) return true;
      return [
        session.name,
        session.mode,
        ...(session.assets || []),
      ].join(' ').toLowerCase().includes(normalizedSearch);
    });

    next.sort((left, right) => {
      if (sortMode === 'pnl') return right.totalPnl - left.totalPnl;
      if (sortMode === 'win-rate') return right.winRate - left.winRate;
      if (sortMode === 'trades') return right.tradeCount - left.tradeCount;
      return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
    });
    return next;
  }, [search, sessionDetails, sortMode]);

  const selectedSession = useMemo(
    () => sessionDetails.find((session) => session.id === selectedSessionId) || null,
    [selectedSessionId, sessionDetails]
  );

  const replayTrades = useMemo(() => {
    if (!selectedSession) return [];
    const assets = currentAsset ? [currentAsset] : selectedSession.assets;
    return selectedSession.trades.filter((trade) => !assets.length || assets.includes(getTradeSymbol(trade)));
  }, [selectedSession, currentAsset]);

  const clampedReplayIndex = useMemo(
    () => clamp(replayIndex, 0, Math.max(replayTrades.length - 1, 0)),
    [replayIndex, replayTrades.length]
  );

  const visibleReplayTrades = useMemo(() => replayTrades.slice(0, clampedReplayIndex + 1), [replayTrades, clampedReplayIndex]);
  const currentTrade = replayTrades[clampedReplayIndex] || null;
  const replaySummary = useMemo(() => summarizeTradeSet(visibleReplayTrades), [visibleReplayTrades]);
  const replayCurve = useMemo(() => buildEquityDrawdownSeries(visibleReplayTrades), [visibleReplayTrades]);
  const replayWinRate = useMemo(() => buildRollingWinRateSeries(visibleReplayTrades, Math.max(4, Math.min(12, visibleReplayTrades.length || 4))), [visibleReplayTrades]);
  const replayTape = useMemo(() => [...visibleReplayTrades].slice(-8).reverse(), [visibleReplayTrades]);
  const progressPct = replayTrades.length ? Math.round(((clampedReplayIndex + 1) / replayTrades.length) * 100) : 0;

  useEffect(() => {
    if (!selectedSession) return;
    setCurrentAsset(selectedSession.lastSymbol || selectedSession.assets?.[0] || symbolOptions[0] || '');
    setReplayIndex(selectedSession.replayIndex || 0);
    setChartInterval(selectedSession.interval || '1');
    setPlaybackSpeed(selectedSession.playbackSpeed || 1);
    setSessionNotes(selectedSession.notes || '');
  }, [selectedSessionId, selectedSession, symbolOptions]);

  useEffect(() => {
    if (!selectedSessionId) return;
    setSavedSessions((current) => current.map((session) => (
      session.id === selectedSessionId
        ? normalizeBacktestSession({
            ...session,
            replayIndex: clampedReplayIndex,
            interval: chartInterval,
            playbackSpeed,
            lastSymbol: currentAsset,
            progressPct,
            notes: sessionNotes,
            reviewedSeconds: session.reviewedSeconds || 0,
            tradeCount: replayTrades.length,
            status: progressPct >= 100 ? 'complete' : progressPct > 0 ? 'in-progress' : 'new',
            updatedAt: new Date().toISOString(),
            lastOpenedAt: new Date().toISOString(),
          })
        : session
    )));
  }, [chartInterval, clampedReplayIndex, currentAsset, playbackSpeed, progressPct, replayTrades.length, selectedSessionId, sessionNotes]);

  useEffect(() => {
    if (!isPlaying || view !== 'replay') return undefined;
    const timer = window.setInterval(() => {
      setSavedSessions((current) => current.map((session) => (
        session.id === selectedSessionId
          ? normalizeBacktestSession({
              ...session,
              reviewedSeconds: (session.reviewedSeconds || 0) + 1,
              updatedAt: new Date().toISOString(),
            })
          : session
      )));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, selectedSessionId, view]);

  useEffect(() => {
    if (!isPlaying || view !== 'replay') return undefined;
    if (clampedReplayIndex >= replayTrades.length - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const delay = playbackSpeed === 1 ? 1200 : playbackSpeed === 2 ? 650 : playbackSpeed === 5 ? 280 : 160;
    const timer = window.setTimeout(() => {
      setReplayIndex((value) => Math.min(replayTrades.length - 1, value + 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [clampedReplayIndex, isPlaying, playbackSpeed, replayTrades.length, view]);

  const handleCreateSession = () => {
    if (!form.name.trim()) {
      toast.error('Session name is required.');
      return;
    }
    if (!form.assets.length) {
      toast.error('Choose at least one asset.');
      return;
    }
    if (savedSessions.length >= sessionLimit) {
      toast.error(`Your ${plan} plan keeps ${sessionLimit} backtest session${sessionLimit > 1 ? 's' : ''}.`);
      return;
    }

    let startDate = form.startDate;
    let endDate = form.endDate;
    const scopedForRange = tradeUniverse.filter((trade) => (
      (!form.accountScope || form.accountScope === 'all' || getTradeAccountId(trade) === form.accountScope)
      && form.assets.includes(getTradeSymbol(trade))
    ));

    if (form.randomize && scopedForRange.length && form.startDate && form.endDate) {
      const minDate = getTradeDateValue(scopedForRange[0]);
      const maxDate = getTradeDateValue(scopedForRange[scopedForRange.length - 1]);
      const start = new Date(`${form.startDate}T00:00:00`);
      const end = new Date(`${form.endDate}T00:00:00`);
      const duration = Math.max(86400000, end - start);
      if (minDate && maxDate && maxDate - minDate > duration) {
        const startFloor = minDate.getTime();
        const startCeil = maxDate.getTime() - duration;
        const randomStart = randomBetween(startFloor, startCeil);
        const randomEnd = randomStart + duration;
        startDate = new Date(randomStart).toISOString().slice(0, 10);
        endDate = new Date(randomEnd).toISOString().slice(0, 10);
      }
    }

    const sessionSeed = {
      ...form,
      startDate,
      endDate,
      symbol: form.assets[0],
      lastSymbol: form.assets[0],
      replayIndex: 0,
      playbackSpeed: 1,
      interval: form.interval,
      plan,
    };

    const filteredTrades = filterTradesForSession(tradeUniverse, sessionSeed);
    const session = createBacktestSession({
      ...sessionSeed,
      name: form.name.trim(),
      tradeCount: filteredTrades.length,
      progressPct: 0,
    });

    setSavedSessions((current) => [session, ...current]);
    setSelectedSessionId(session.id);
    setView('replay');
    setCreateOpen(false);
    toast.success('Backtest session created.');
  };

  const handleDeleteSession = (sessionId) => {
    setSavedSessions((current) => current.filter((session) => session.id !== sessionId));
    if (selectedSessionId === sessionId) {
      setSelectedSessionId('');
      setView('dashboard');
      setIsPlaying(false);
    }
    toast.success('Session deleted.');
  };

  const openReplay = (sessionId) => {
    setSelectedSessionId(sessionId);
    setView('replay');
    setIsPlaying(false);
  };

  const timeInvestedChart = metrics.timeInvestedSeries;
  const operationsBySymbol = metrics.symbolSeries;

  if (sessionLimit <= 0) {
    return (
      <div style={{ padding: '30px', width: '100%', boxSizing: 'border-box' }}>
        <style>{PAGE_STYLES}</style>
        <Card tone={C.gold} style={{ padding: '28px 26px', maxWidth: 760 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, marginBottom: 8 }}>
            Backtest
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text0, letterSpacing: '-0.05em', marginBottom: 10 }}>
            Backtesting opens from Starter
          </div>
          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
            Upgrade to Starter or above to unlock session-based replay. Starter keeps 1 session, Pro keeps 5, and Elite keeps 25.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px 30px 56px', width: '100%', boxSizing: 'border-box', color: C.text1 }}>
      <style>{PAGE_STYLES}</style>

      <div className="mf-bt-header">
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: shade(C.accent, 0.88), marginBottom: 8 }}>
            Backtest
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, marginBottom: 8 }}>
            Backtest lab
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.7, maxWidth: 760 }}>
            Build replay sessions from your own journal history, track time invested, and jump into a chart workspace when you want to review execution.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ padding: '7px 10px', borderRadius: 999, background: shade(C.accent, 0.12), border: `1px solid ${shade(C.accent, 0.18)}`, fontSize: 10.5, fontWeight: 800, color: C.accent }}>
            {savedSessions.length}/{sessionLimit} sessions
          </div>
          <div style={{ padding: '7px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.borderHi, 0.8)}`, fontSize: 10.5, fontWeight: 800, color: C.text2 }}>
            {formatHours(metrics.totalReviewedSeconds)} reviewed
          </div>
        </div>
      </div>

      {view !== 'replay' ? (
        <>
          <div className="mf-bt-action-row">
            <div className="mf-bt-nav">
              {VIEW_TABS.map((tab) => (
                <NavButton key={tab.id} active={view === tab.id} onClick={() => setView(tab.id)}>
                  {tab.label}
                </NavButton>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <GhostButton onClick={() => setCreateOpen(true)} icon={<Ic.Plus />} tone={C.accent}>Backtesting session</GhostButton>
              <GhostButton onClick={() => {
                setForm((current) => ({ ...current, mode: plan === 'starter' ? 'backtesting' : 'prop-firm' }));
                setCreateOpen(true);
              }}>
                Prop firm session
              </GhostButton>
              <GhostButton onClick={() => toast('Use a date range + asset list to build a replay set, then open the session from the list.')}>Tutorials</GhostButton>
            </div>
          </div>

          <Card tone={C.blue} index={1} style={{ padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.65 }}>
              {plan === 'starter'
                ? 'Starter keeps one saved session. Upgrade to Pro or Elite to unlock more historical backtest sessions.'
                : `Your ${plan.toUpperCase()} plan keeps ${sessionLimit} saved sessions and full replay continuity.`}
            </div>
          </Card>

          {(view === 'dashboard' || view === 'sessions') ? (
            <>
              {view === 'dashboard' ? (
                <>
                  <div className="mf-bt-dashboard-grid">
                    <Card tone={C.accent} index={2} style={{ padding: '18px 18px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Performances</div>
                      <div className="mf-bt-performance-grid">
                        <MiniStat label="Time invested" value={formatHours(metrics.totalReviewedSeconds)} tone={C.text0} />
                        <MiniStat label="History reviewed" value={`${metrics.totalHistoryDays}d`} tone={C.text0} />
                        <MiniStat label="Operations" value={`${metrics.totalTrades}`} tone={C.green} caption="Across all sessions" />
                        <MiniStat label="Total win rate" value={formatAnalyticsPercent(metrics.totalWinRate, 0)} tone={metrics.totalWinRate >= 50 ? C.green : C.warn} />
                      </div>
                    </Card>

                    <Card tone={C.blue} index={3} style={{ padding: '18px 18px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.text0 }}>Session library</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ position: 'relative' }}>
                            <input
                              value={search}
                              onChange={(event) => setSearch(event.target.value)}
                              placeholder="Search sessions"
                              style={{
                                height: 36,
                                width: 180,
                                borderRadius: 12,
                                border: `1px solid ${C.border}`,
                                background: 'rgba(255,255,255,0.03)',
                                color: C.text1,
                                padding: '0 12px 0 34px',
                                fontSize: 12,
                                fontFamily: 'inherit',
                                outline: 'none',
                              }}
                            />
                            <div style={{ position: 'absolute', left: 11, top: 10, color: C.text3 }}>
                              <Ic.Search />
                            </div>
                          </div>
                          <SelectField
                            label=""
                            value={sortMode}
                            onChange={(event) => setSortMode(event.target.value)}
                            options={[
                              { value: 'recent', label: 'Newest to oldest' },
                              { value: 'pnl', label: 'Highest P&L' },
                              { value: 'win-rate', label: 'Highest win rate' },
                              { value: 'trades', label: 'Most trades' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="mf-bt-session-list">
                        {filteredSessions.length ? filteredSessions.slice(0, 3).map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onOpen={() => openReplay(session.id)}
                            onDelete={() => handleDeleteSession(session.id)}
                          />
                        )) : (
                          <div style={{ padding: '16px 14px', borderRadius: 18, border: `1px dashed ${shade(C.borderHi, 0.82)}`, fontSize: 12.5, color: C.text2 }}>
                            You do not have any sessions yet. Create the first one to start the replay.
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  <div className="mf-bt-chart-grid">
                    <Card tone={C.warn} index={4} style={{ padding: '18px 18px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Time invested</div>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timeInvestedChart}>
                            <CartesianGrid {...CHART_GRID} />
                            <XAxis dataKey="label" {...CHART_AXIS_SMALL} />
                            <YAxis width={56} tickFormatter={(value) => `${value}h`} {...CHART_AXIS_SMALL} />
                            <Tooltip
                              cursor={chartCursor(C.warn)}
                              content={({ active, payload = [], label }) => {
                                if (!active || !payload.length) return null;
                                return (
                                  <div style={{ ...chartTooltipStyle(C.warn), padding: '12px 13px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                                    <div style={{ fontSize: 11.5, color: C.warn, fontWeight: 800 }}>{payload[0]?.value}h reviewed</div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="hours" name="Hours" radius={[7, 7, 0, 0]} fill={C.warn} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card tone={C.accent} index={5} style={{ padding: '18px 18px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Operations per symbol</div>
                      <div style={{ height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={operationsBySymbol} layout="vertical">
                            <CartesianGrid {...CHART_GRID} />
                            <XAxis type="number" {...CHART_AXIS_SMALL} />
                            <YAxis type="category" dataKey="symbol" width={92} {...CHART_AXIS_SMALL} />
                            <Tooltip
                              cursor={chartCursor(C.accent)}
                              content={({ active, payload = [], label }) => {
                                if (!active || !payload.length) return null;
                                return (
                                  <div style={{ ...chartTooltipStyle(C.accent), padding: '12px 13px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                                    <div style={{ fontSize: 11.5, color: C.accent, fontWeight: 800 }}>{payload[0]?.value} operations</div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="trades" name="Trades" radius={[0, 7, 7, 0]} fill={C.accent} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </div>
                </>
              ) : (
                <Card tone={C.accent} index={6} style={{ padding: '18px 18px 16px' }}>
                  <div className="mf-bt-session-toolbar">
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.text0 }}>Recent sessions</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search here"
                          style={{
                            height: 36,
                            width: 180,
                            borderRadius: 12,
                            border: `1px solid ${C.border}`,
                            background: 'rgba(255,255,255,0.03)',
                            color: C.text1,
                            padding: '0 12px 0 34px',
                            fontSize: 12,
                            fontFamily: 'inherit',
                            outline: 'none',
                          }}
                        />
                        <div style={{ position: 'absolute', left: 11, top: 10, color: C.text3 }}>
                          <Ic.Search />
                        </div>
                      </div>
                      <SelectField
                        label=""
                        value={sortMode}
                        onChange={(event) => setSortMode(event.target.value)}
                        options={[
                          { value: 'recent', label: 'Newest to oldest' },
                          { value: 'pnl', label: 'Highest P&L' },
                          { value: 'win-rate', label: 'Highest win rate' },
                          { value: 'trades', label: 'Most trades' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="mf-bt-session-list">
                    {filteredSessions.length ? filteredSessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onOpen={() => openReplay(session.id)}
                        onDelete={() => handleDeleteSession(session.id)}
                      />
                    )) : (
                      <div style={{ padding: '18px 14px', borderRadius: 18, border: `1px dashed ${shade(C.borderHi, 0.82)}`, fontSize: 12.5, color: C.text2 }}>
                        You do not have any sessions yet.
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </>
          ) : null}

          {view === 'trades' ? (
            <Card tone={C.teal} index={7} style={{ padding: '18px 18px 16px' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Backtestable trades</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {tradeUniverse.slice(-40).reverse().map((trade) => {
                  const pnl = getTradePnl(trade);
                  const tone = pnl >= 0 ? C.green : C.danger;
                  return (
                    <div key={trade.id} style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text1 }}>{getTradeSymbol(trade)}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: tone }}>{formatCompactMoney(pnl)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: C.text2 }}>
                        {getTradeDateLabel(trade)} / {trade.direction || trade.type || 'Long'} / {trade.setup || 'Unlabeled'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : null}

          {view === 'analytics' ? (
            <div className="mf-bt-chart-grid">
              <Card tone={C.purple} index={8} style={{ padding: '18px 18px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Win rate by review month</div>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeInvestedChart}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="label" {...CHART_AXIS_SMALL} />
                      <YAxis width={54} tickFormatter={(value) => `${value}%`} {...CHART_AXIS_SMALL} />
                      <Tooltip
                        cursor={chartCursor(C.purple)}
                        content={({ active, payload = [], label }) => {
                          if (!active || !payload.length) return null;
                          return (
                            <div style={{ ...chartTooltipStyle(C.purple), padding: '12px 13px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                              <div style={{ fontSize: 11.5, color: C.purple, fontWeight: 800 }}>{payload[0]?.value}%</div>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="winRate" stroke={C.purple} strokeWidth={2.3} dot={false} activeDot={chartActiveDot(C.purple)} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card tone={C.green} index={9} style={{ padding: '18px 18px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 14 }}>Session P&L spread</div>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredSessions}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="name" hide />
                      <YAxis width={60} tickFormatter={(value) => formatCompactMoney(value)} {...CHART_AXIS_SMALL} />
                      <Tooltip
                        cursor={chartCursor(C.green)}
                        content={({ active, payload = [], label }) => {
                          if (!active || !payload.length) return null;
                          return (
                            <div style={{ ...chartTooltipStyle(C.green), padding: '12px 13px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                              <div style={{ fontSize: 11.5, color: (payload[0]?.value || 0) >= 0 ? C.green : C.danger, fontWeight: 800 }}>{formatCompactMoney(payload[0]?.value || 0)}</div>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="totalPnl" fill={C.green} radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mf-bt-replay-shell">
          <Card tone={C.accent} index={10} style={{ padding: '16px 16px 14px' }}>
            <div className="mf-bt-replay-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <GhostButton onClick={() => { setView('dashboard'); setIsPlaying(false); }} icon={<Ic.Back />}>Back</GhostButton>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0 }}>
                  {selectedSession?.name || 'Replay session'}
                </div>
                <div style={{ padding: '6px 9px', borderRadius: 999, background: shade(C.accent, 0.12), border: `1px solid ${shade(C.accent, 0.18)}`, fontSize: 10.5, fontWeight: 800, color: C.accent }}>
                  {progressPct}% revealed
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(selectedSession?.assets || []).map((asset) => (
                  <NavButton key={asset} active={currentAsset === asset} onClick={() => { setCurrentAsset(asset); setReplayIndex(0); setIsPlaying(false); }}>
                    {asset}
                  </NavButton>
                ))}
                <SelectField label="" value={chartInterval} onChange={(event) => setChartInterval(event.target.value)} options={INTERVAL_OPTIONS} />
              </div>
            </div>
          </Card>

          <div className="mf-bt-replay-body">
            <Card tone={C.text2} index={11} style={{ padding: '10px 8px', display: 'grid', gap: 8 }}>
              {REPLAY_TOOLS.map((tool) => (
                <button
                  key={tool}
                  type="button"
                  style={{
                    height: 36,
                    borderRadius: 12,
                    border: `1px solid ${shade(C.borderHi, 0.82)}`,
                    background: 'rgba(255,255,255,0.025)',
                    color: C.text2,
                    fontSize: 11.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {tool}
                </button>
              ))}
            </Card>

            <Card tone={C.accent} index={12} style={{ padding: '12px 12px 10px' }}>
              <TradingViewEmbed symbol={currentAsset || selectedSession?.assets?.[0] || 'EURUSD'} interval={chartInterval} />
            </Card>

            <div className="mf-bt-replay-side">
              <Card tone={C.blue} index={13} style={{ padding: '16px 16px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 12 }}>Session pulse</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <MiniStat label="Account balance" value={formatCompactMoney((selectedSession?.accountBalance || 0) + (replaySummary.totalPnL || 0))} tone={C.text0} />
                  <MiniStat label="Realized P&L" value={formatCompactMoney(replaySummary.totalPnL || 0)} tone={(replaySummary.totalPnL || 0) >= 0 ? C.green : C.danger} />
                  <MiniStat label="Win rate" value={formatAnalyticsPercent(replaySummary.winRate || 0, 0)} tone={(replaySummary.winRate || 0) >= 50 ? C.green : C.warn} />
                  <MiniStat label="Drawdown" value={formatCompactMoney(replaySummary.maxDrawdownCash || 0)} tone={C.danger} />
                </div>
              </Card>

              <Card tone={currentTrade && getTradePnl(currentTrade) >= 0 ? C.green : C.warn} index={14} style={{ padding: '16px 16px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 12 }}>Current trade</div>
                {currentTrade ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <MiniStat label="Pair" value={getTradeSymbol(currentTrade)} tone={C.text0} caption={currentTrade.direction || currentTrade.type || 'Long'} />
                    <MiniStat label="P&L" value={formatCompactMoney(getTradePnl(currentTrade))} tone={getTradePnl(currentTrade) >= 0 ? C.green : C.danger} />
                    <MiniStat label="R:R" value={formatAnalyticsRR(getTradeRR(currentTrade))} tone={C.accent} caption={getTradeDateLabel(currentTrade)} />
                    <MiniStat label="Setup" value={String(currentTrade.setup || '').trim() || 'Unlabeled'} tone={C.text0} />
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                    No trade visible yet for this asset.
                  </div>
                )}
              </Card>

              <Card tone={C.accent} index={15} style={{ padding: '16px 16px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0, marginBottom: 12 }}>Session notes</div>
                <textarea
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  rows={6}
                  placeholder="Mark what mattered in the replay."
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text1,
                    padding: '12px',
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </Card>
            </div>
          </div>

          <div className="mf-bt-replay-bottom">
            <Card tone={C.green} index={16} style={{ padding: '16px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0 }}>Replay analytics</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <GhostButton onClick={() => { setIsPlaying(false); setReplayIndex((value) => Math.max(0, value - 1)); }} icon={<Ic.Back />}>Prev</GhostButton>
                  <GhostButton onClick={() => {
                    if (clampedReplayIndex >= replayTrades.length - 1) setReplayIndex(0);
                    setIsPlaying((value) => !value);
                  }} icon={isPlaying ? <Ic.Pause /> : <Ic.Play />} tone={C.accent}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </GhostButton>
                  <GhostButton onClick={() => { setIsPlaying(false); setReplayIndex((value) => Math.min(replayTrades.length - 1, value + 1)); }} icon={<Ic.Forward />}>Next</GhostButton>
                </div>
              </div>

              <div style={{ padding: '12px 12px 10px', borderRadius: 18, border: `1px solid ${shade(C.accent, 0.14)}`, background: 'rgba(255,255,255,0.025)', marginBottom: 14 }}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(replayTrades.length - 1, 0)}
                  step={1}
                  value={clampedReplayIndex}
                  onChange={(event) => { setReplayIndex(Number(event.target.value)); setIsPlaying(false); }}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, fontSize: 11, color: C.text3 }}>
                  <span>{Math.min(clampedReplayIndex + 1, replayTrades.length)} / {replayTrades.length} trades</span>
                  <span>{formatHours(selectedSession?.reviewedSeconds || 0)} reviewed</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 14 }}>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={replayCurve}>
                      <defs>
                        <linearGradient id="btReplayCurve" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={shade(C.green, 0.42)} />
                          <stop offset="100%" stopColor={shade(C.green, 0.02)} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="dateLabel" {...CHART_AXIS_SMALL} />
                      <YAxis width={64} tickFormatter={(value) => formatCompactMoney(value)} {...CHART_AXIS_SMALL} />
                      <Tooltip
                        cursor={chartCursor(C.green)}
                        content={({ active, payload = [], label }) => {
                          if (!active || !payload.length) return null;
                          return (
                            <div style={{ ...chartTooltipStyle(C.green), padding: '12px 13px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                              <div style={{ fontSize: 11.5, color: C.green, fontWeight: 800 }}>{formatCompactMoney(payload[0]?.value || 0)}</div>
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="equity" stroke={C.green} strokeWidth={2.2} fill="url(#btReplayCurve)" activeDot={chartActiveDot(C.green)} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={replayWinRate}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="dateLabel" {...CHART_AXIS_SMALL} />
                      <YAxis width={54} domain={[0, 100]} tickFormatter={(value) => `${value}%`} {...CHART_AXIS_SMALL} />
                      <Tooltip
                        cursor={chartCursor(C.purple)}
                        content={({ active, payload = [], label }) => {
                          if (!active || !payload.length) return null;
                          return (
                            <div style={{ ...chartTooltipStyle(C.purple), padding: '12px 13px' }}>
                              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                              <div style={{ fontSize: 11.5, color: C.purple, fontWeight: 800 }}>{formatAnalyticsPercent(payload[0]?.value || 0, 1)}</div>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="cumulativeWinRate" stroke={C.purple} strokeWidth={2.2} dot={false} activeDot={chartActiveDot(C.purple)} />
                      <Line type="monotone" dataKey="rollingWinRate" stroke={C.accent} strokeWidth={1.7} strokeDasharray="6 6" dot={false} activeDot={chartActiveDot(C.accent, 4.5)} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            <Card tone={C.accent} index={17} style={{ padding: '16px 16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.text0 }}>Revealed trades</div>
                <SelectField
                  label=""
                  value={String(playbackSpeed)}
                  onChange={(event) => setPlaybackSpeed(Number(event.target.value))}
                  options={SPEED_OPTIONS.map((value) => ({ value: String(value), label: `${value}x` }))}
                />
              </div>

              <div className="mf-bt-replay-trades">
                {replayTape.length ? replayTape.map((trade) => {
                  const pnl = getTradePnl(trade);
                  const tone = pnl >= 0 ? C.green : C.danger;
                  return (
                    <div key={trade.id} style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text1 }}>{getTradeSymbol(trade)}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: tone }}>{formatCompactMoney(pnl)}</div>
                      </div>
                      <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>
                        {getTradeDateLabel(trade)} / {trade.direction || trade.type || 'Long'} / {trade.setup || 'Unlabeled'}
                      </div>
                      <div style={{ fontSize: 10.5, color: C.text3, marginTop: 4 }}>
                        {formatAnalyticsRR(getTradeRR(trade))}
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ padding: '14px 12px', borderRadius: 16, border: `1px dashed ${shade(C.borderHi, 0.82)}`, fontSize: 12, color: C.text2 }}>
                    No revealed trades yet for this asset.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      <CreateSessionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSession}
        form={form}
        setForm={setForm}
        symbolOptions={symbolOptions}
        accountOptions={accountOptions}
        plan={plan}
      />
    </div>
  );
}
