import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
  CHART_AXIS_SMALL,
  CHART_GRID,
  CHART_MOTION_SOFT,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';
import {
  buildEquityDrawdownSeries,
  formatAnalyticsFactor,
  formatAnalyticsMoney,
  formatAnalyticsPercent,
  formatAnalyticsRR,
  getTradeDateLabel,
  getTradeDateValue,
  getTradePnl,
  getTradeRR,
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
  orange: 'var(--mf-orange,#FF6B35)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
  borderHi: 'var(--mf-border-hi,#1E2E48)',
};

const PAGE_STYLES = `
  @keyframes mfReplayGlowA {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.14; }
    50% { transform: translate3d(28px, 18px, 0) scale(1.05); opacity: 0.22; }
  }

  @keyframes mfReplayGlowB {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.08; }
    50% { transform: translate3d(-26px, -14px, 0) scale(1.04); opacity: 0.14; }
  }

  @keyframes mfReplayPulse {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.08); }
  }

  .mf-backtest-page {
    position: relative;
    min-height: 100%;
    color: ${C.text1};
  }

  .mf-replay-topbar {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-replay-layout {
    display: grid;
    grid-template-columns: 340px minmax(0, 1fr);
    gap: 14px;
  }

  .mf-replay-chart-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.28fr) minmax(340px, 0.92fr);
    gap: 14px;
  }

  .mf-replay-bottom-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.95fr 0.95fr;
    gap: 14px;
    margin-top: 14px;
  }

  @media (max-width: 1320px) {
    .mf-replay-chart-grid,
    .mf-replay-bottom-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 1160px) {
    .mf-replay-topbar,
    .mf-replay-layout {
      grid-template-columns: 1fr;
    }
  }
`;

const playbackOptions = [1, 2, 5, 10];

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 18, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.42,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: numeric < 10 ? 3 : 2,
    maximumFractionDigits: numeric < 10 ? 5 : 2,
  });
}

function getTradeSymbol(trade = {}) {
  return trade.symbol || trade.pair || 'Unknown';
}

function getTradeEntry(trade = {}) {
  return Number(trade.entry_price ?? trade.entry ?? trade.open_price ?? trade.open ?? NaN);
}

function getTradeExit(trade = {}) {
  return Number(trade.exit_price ?? trade.exit ?? trade.close_price ?? trade.close ?? NaN);
}

function getTradeStop(trade = {}) {
  return Number(trade.stop_loss ?? trade.sl ?? NaN);
}

function getTradeTarget(trade = {}) {
  return Number(trade.take_profit ?? trade.tp ?? NaN);
}

function getTradeSize(trade = {}) {
  return trade.position_size ?? trade.size ?? trade.lots ?? trade.qty ?? trade.quantity ?? '--';
}

function extractTagValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, current]) => current !== null && current !== undefined && current !== false && String(current).trim() !== '')
      .map(([key, current]) => (typeof current === 'string' && current.trim() !== '' ? `${key}: ${current}` : key));
  }

  if (typeof value === 'string') {
    return value
      .split(/[,|/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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

function getContextInterval(interval) {
  if (interval === '15') return '60';
  if (interval === '30') return '240';
  if (interval === '60') return 'D';
  if (interval === '240') return 'W';
  return 'W';
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

function buildReplayRows(trades = []) {
  return [...trades]
    .slice(-10)
    .reverse()
    .map((trade) => ({
      id: trade.id,
      time: trade.time || (getTradeDateValue(trade)?.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) || '--'),
      symbol: getTradeSymbol(trade),
      setup: trade.setup || 'Unlabeled',
      direction: trade.direction || trade.type || 'Long',
      session: normalizeSessionLabel(trade.session),
      pnl: getTradePnl(trade),
      entry: getTradeEntry(trade),
      exit: getTradeExit(trade),
      size: getTradeSize(trade),
    }));
}

function buildTradePulse(trades = []) {
  let equity = 0;
  return trades.map((trade, index) => {
    equity += getTradePnl(trade);
    return {
      index: index + 1,
      label: `${index + 1}`,
      pnl: getTradePnl(trade),
      equity: Number(equity.toFixed(2)),
      symbol: getTradeSymbol(trade),
      session: normalizeSessionLabel(trade.session),
    };
  });
}

function filterTradesForBacktestSession(trades = [], session = {}) {
  return (trades || []).filter((trade) => {
    const symbol = getTradeSymbol(trade);
    const setup = String(trade.setup || '').trim() || 'Unlabeled';
    const tradingSession = normalizeSessionLabel(trade.session);
    if (session.symbol && session.symbol !== 'all' && symbol !== session.symbol) return false;
    if (session.setup && session.setup !== 'all' && setup !== session.setup) return false;
    if (session.session && session.session !== 'all' && tradingSession !== session.session) return false;
    return true;
  });
}

function TradingViewEmbed({ symbol, interval, height = 420 }) {
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
    <div style={{ height, borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}

function SectionCard({ children, tone = C.accent, index = 0, style = {} }) {
  return (
    <motion.section
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 28,
        border: `1px solid ${shade(tone, 0.12)}`,
        background: 'linear-gradient(180deg, rgba(10,14,24,0.96), rgba(7,10,17,0.98))',
        boxShadow: `0 28px 56px rgba(0,0,0,0.22), inset 0 1px 0 ${shade('#FFFFFF', 0.03)}`,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at top right, ${shade(tone, 0.1)}, transparent 40%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, action = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
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

function ControlButton({ children, active = false, onClick, subtle = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 13px',
        borderRadius: 14,
        border: `1px solid ${active ? shade(C.accent, 0.28) : subtle ? shade(C.text3, 0.38) : C.border}`,
        background: active
          ? 'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.22), rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.12))'
          : subtle
            ? 'rgba(255,255,255,0.025)'
            : 'rgba(255,255,255,0.03)',
        color: disabled ? C.text3 : active ? C.text0 : C.text2,
        fontSize: 11.5,
        fontWeight: 800,
        letterSpacing: '0.02em',
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 180ms ease',
      }}
    >
      {children}
    </button>
  );
}

function StatBlock({ label, value, caption, tone = C.accent }) {
  return (
    <div style={{ padding: '14px 14px 13px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.text2 }}>
        {caption}
      </div>
    </div>
  );
}

function MetricRow({ label, value, tone = C.text1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: `1px solid ${shade(C.border, 0.7)}` }}>
      <span style={{ fontSize: 11, color: C.text3, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 800 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: tone, fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function TagCluster({ label, values, tone = C.accent }) {
  if (!values.length) return null;
  return (
    <div style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {values.slice(0, 6).map((value) => (
          <span
            key={`${label}-${value}`}
            style={{
              padding: '6px 9px',
              borderRadius: 999,
              border: `1px solid ${shade(tone, 0.18)}`,
              background: shade(tone, 0.1),
              color: C.text1,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
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

function Field({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '11px 12px',
          borderRadius: 13,
          border: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: C.text1,
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

function TextField({ label, value, onChange, placeholder = '' }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 12px',
          borderRadius: 13,
          border: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: C.text1,
          fontSize: 12,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
    </label>
  );
}

function SessionChip({ active = false, children, onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick?.();
        }
      }}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 13px',
        borderRadius: 16,
        border: `1px solid ${active ? shade(C.accent, 0.22) : shade(C.border, 0.8)}`,
        background: active ? 'linear-gradient(135deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.15), rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.05))' : 'rgba(255,255,255,0.025)',
        color: C.text1,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </div>
  );
}

export default function Backtest() {
  const { user } = useAuth();
  const { trades, activeAccount, accountOptions } = useTradingContext();
  const plan = String(user?.plan || 'trial').toLowerCase();
  const sessionLimit = getBacktestSessionLimit(plan);
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [selectedSetup, setSelectedSetup] = useState('all');
  const [selectedSession, setSelectedSession] = useState('all');
  const [selectedInterval, setSelectedInterval] = useState('15');
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [backtestSessions, setBacktestSessions] = useState([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [activeBacktestSessionId, setActiveBacktestSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  function activateBacktestSession(sessionRecord) {
    if (!sessionRecord) return;
    const normalized = normalizeBacktestSession(sessionRecord);
    setActiveBacktestSessionId(normalized.id);
    setSelectedSymbol(normalized.symbol || 'all');
    setSelectedSetup(normalized.setup || 'all');
    setSelectedSession(normalized.session || 'all');
    setSelectedInterval(normalized.interval || '15');
    setPlaybackSpeed(normalized.playbackSpeed || 2);
    setReplayIndex(normalized.replayIndex || 0);
    setSessionName(normalized.name || '');
    setSessionNotes(normalized.notes || '');
    setIsPlaying(false);
  }

  useEffect(() => {
    if (!user?.id) {
      setBacktestSessions([]);
      setActiveBacktestSessionId('');
      setSessionName('');
      setSessionNotes('');
      setSessionsLoaded(true);
      return;
    }

    const stored = loadBacktestSessions(user.id)
      .sort((left, right) => new Date(right.lastOpenedAt || right.updatedAt || 0) - new Date(left.lastOpenedAt || left.updatedAt || 0));
    setBacktestSessions(stored);
    setSessionsLoaded(true);

    if (stored[0]) activateBacktestSession(stored[0]);
  }, [user?.id]);

  useEffect(() => {
    if (!sessionsLoaded || !user?.id) return;
    saveBacktestSessions(user.id, backtestSessions);
  }, [backtestSessions, sessionsLoaded, user?.id]);

  const sortedTrades = useMemo(() => {
    return [...trades].sort((left, right) => (getTradeDateValue(left)?.getTime() || 0) - (getTradeDateValue(right)?.getTime() || 0));
  }, [trades]);

  const symbolRows = useMemo(() => buildBreakdown(sortedTrades, (trade) => getTradeSymbol(trade), 10), [sortedTrades]);
  const setupRows = useMemo(() => buildBreakdown(sortedTrades, (trade) => String(trade.setup || '').trim() || 'Unlabeled', 10), [sortedTrades]);
  const sessionRows = useMemo(() => buildBreakdown(sortedTrades, (trade) => normalizeSessionLabel(trade.session), 6), [sortedTrades]);

  const filteredTrades = useMemo(() => {
    return sortedTrades.filter((trade) => {
      const symbol = getTradeSymbol(trade);
      const setup = String(trade.setup || '').trim() || 'Unlabeled';
      const session = normalizeSessionLabel(trade.session);
      if (selectedSymbol !== 'all' && symbol !== selectedSymbol) return false;
      if (selectedSetup !== 'all' && setup !== selectedSetup) return false;
      if (selectedSession !== 'all' && session !== selectedSession) return false;
      return true;
    });
  }, [selectedSession, selectedSetup, selectedSymbol, sortedTrades]);

  useEffect(() => {
    if (!filteredTrades.length) {
      setReplayIndex(0);
      setIsPlaying(false);
      return;
    }

    setReplayIndex((current) => {
      if (current < 0 || current >= filteredTrades.length) return filteredTrades.length - 1;
      return current;
    });
  }, [filteredTrades.length]);

  useEffect(() => {
    if (!isPlaying || filteredTrades.length <= 1) return undefined;
    const delay = Math.max(320, 1600 / playbackSpeed);
    const timer = window.setInterval(() => {
      setReplayIndex((current) => {
        if (current >= filteredTrades.length - 1) return current;
        return current + 1;
      });
    }, delay);
    return () => window.clearInterval(timer);
  }, [filteredTrades.length, isPlaying, playbackSpeed]);

  useEffect(() => {
    if (!isPlaying) return;
    if (replayIndex >= filteredTrades.length - 1) setIsPlaying(false);
  }, [filteredTrades.length, isPlaying, replayIndex]);

  const visibleTrades = useMemo(() => filteredTrades.slice(0, replayIndex + 1), [filteredTrades, replayIndex]);
  const currentTrade = filteredTrades[replayIndex] || filteredTrades[filteredTrades.length - 1] || null;
  const replaySummary = useMemo(() => summarizeTradeSet(visibleTrades), [visibleTrades]);
  const fullSummary = useMemo(() => summarizeTradeSet(filteredTrades), [filteredTrades]);
  const replayCurve = useMemo(() => buildEquityDrawdownSeries(visibleTrades), [visibleTrades]);
  const tradePulse = useMemo(() => buildTradePulse(visibleTrades), [visibleTrades]);
  const sessionPulse = useMemo(() => buildBreakdown(visibleTrades, (trade) => normalizeSessionLabel(trade.session), 1), [visibleTrades]);
  const setupPulse = useMemo(() => buildBreakdown(visibleTrades, (trade) => String(trade.setup || '').trim() || 'Unlabeled', 5), [visibleTrades]);
  const replayRows = useMemo(() => buildReplayRows(visibleTrades), [visibleTrades]);

  const symbolOptions = ['all', ...symbolRows.map((row) => row.label)];
  const setupOptions = ['all', ...setupRows.map((row) => row.label)];
  const sessionOptions = ['all', ...sessionRows.map((row) => row.label)];

  const accountLabel = useMemo(() => {
    return accountOptions.find((item) => item.id === activeAccount)?.label || 'All Accounts';
  }, [accountOptions, activeAccount]);

  const currentDate = getTradeDateValue(currentTrade);
  const currentSymbol = currentTrade ? getTradeSymbol(currentTrade) : selectedSymbol !== 'all' ? selectedSymbol : symbolRows[0]?.label || 'EURUSD';
  const currentDirection = currentTrade?.direction || currentTrade?.type || 'Long';
  const currentTone = getTradePnl(currentTrade || {}) >= 0 ? C.green : C.danger;
  const currentTags = {
    setup: extractTagValues(currentTrade?.setup),
    bias: extractTagValues(currentTrade?.bias || currentTrade?.direction),
    confluences: extractTagValues(currentTrade?.confluences),
    psychology: extractTagValues(currentTrade?.psychology),
  };

  const progress = filteredTrades.length ? ((replayIndex + 1) / filteredTrades.length) * 100 : 0;
  const focusNote = !filteredTrades.length
    ? 'Import trades to open the replay desk.'
    : fullSummary.maxDrawdownCash < -Math.abs(fullSummary.avgWin || 0) * 2
      ? 'Start with the drawdown pocket and watch where invalidation slips.'
      : replaySummary.winRate < 45
        ? 'Replay slower and tighten the trigger before scaling size.'
        : replaySummary.avgRR != null && replaySummary.avgRR < 1.3
          ? 'The strike rate is acceptable. Push the average winner further.'
          : 'Keep the same structure and add more clean samples before adjusting the playbook.';

  const activeReplaySession = useMemo(
    () => backtestSessions.find((session) => session.id === activeBacktestSessionId) || null,
    [activeBacktestSessionId, backtestSessions],
  );

  const sessionSummaries = useMemo(() => {
    return backtestSessions.map((session) => {
      const sessionTrades = filterTradesForBacktestSession(sortedTrades, session);
      const summary = summarizeTradeSet(sessionTrades);
      return {
        ...session,
        tradeCount: sessionTrades.length,
        totalPnL: summary.totalPnL,
        winRate: summary.winRate,
      };
    });
  }, [backtestSessions, sortedTrades]);

  useEffect(() => {
    if (!sessionsLoaded || !activeBacktestSessionId) return;
    setBacktestSessions((current) => {
      const index = current.findIndex((session) => session.id === activeBacktestSessionId);
      if (index === -1) return current;

      const existing = normalizeBacktestSession(current[index]);
      const next = normalizeBacktestSession({
        ...existing,
        name: sessionName || existing.name,
        notes: sessionNotes,
        symbol: selectedSymbol,
        setup: selectedSetup,
        session: selectedSession,
        interval: selectedInterval,
        playbackSpeed,
        replayIndex,
        accountScope: activeAccount,
        plan,
        tradeCount: filteredTrades.length,
        progressPct: progress,
        lastSymbol: currentSymbol,
        updatedAt: new Date().toISOString(),
        lastOpenedAt: new Date().toISOString(),
      });

      if (JSON.stringify(existing) === JSON.stringify(next)) return current;
      const copy = [...current];
      copy[index] = next;
      return copy;
    });
  }, [
    activeAccount,
    activeBacktestSessionId,
    currentSymbol,
    filteredTrades.length,
    plan,
    playbackSpeed,
    progress,
    replayIndex,
    selectedInterval,
    selectedSession,
    selectedSetup,
    selectedSymbol,
    sessionName,
    sessionNotes,
    sessionsLoaded,
  ]);

  function handleCreateSession() {
    if (sessionLimit <= 0) {
      toast.error('Upgrade to Starter or higher to create replay sessions.');
      return;
    }

    if (backtestSessions.length >= sessionLimit) {
      toast.error(`Your ${plan} plan allows ${sessionLimit} replay session${sessionLimit > 1 ? 's' : ''}.`);
      return;
    }

    const sessionRecord = createBacktestSession({
      name: sessionName || buildBacktestSessionName({ symbol: selectedSymbol, setup: selectedSetup, session: selectedSession }),
      symbol: selectedSymbol,
      setup: selectedSetup,
      session: selectedSession,
      interval: selectedInterval,
      playbackSpeed,
      replayIndex: 0,
      accountScope: activeAccount,
      plan,
      tradeCount: filteredTrades.length,
      progressPct: filteredTrades.length ? (100 / filteredTrades.length) : 0,
      lastSymbol: currentSymbol,
      notes: sessionNotes,
    });

    setBacktestSessions((current) => [sessionRecord, ...current]);
    activateBacktestSession(sessionRecord);
    setReplayIndex(0);
    toast.success('Replay session created.');
  }

  function handleDeleteSession(sessionId) {
    const next = backtestSessions.filter((session) => session.id !== sessionId);
    setBacktestSessions(next);
    if (activeBacktestSessionId === sessionId) {
      const fallback = next[0] || null;
      if (fallback) activateBacktestSession(fallback);
      else {
        setActiveBacktestSessionId('');
        setSessionName('');
        setSessionNotes('');
      }
    }
    toast.success('Replay session removed.');
  }

  return (
    <div className="mf-backtest-page" style={{ minHeight: '100vh', padding: '28px 24px 48px', position: 'relative', overflow: 'hidden' }}>
      <style>{PAGE_STYLES}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '10%', width: 520, height: 340, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-rgb, 6, 230, 255), 0.08) 0%, transparent 72%)', filter: 'blur(42px)', animation: 'mfReplayGlowA 18s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '8%', bottom: 0, width: 520, height: 340, background: 'radial-gradient(ellipse, rgba(var(--mf-accent-secondary-rgb, 102, 240, 255), 0.06) 0%, transparent 72%)', filter: 'blur(46px)', animation: 'mfReplayGlowB 22s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1560, margin: '0 auto' }}>
        <SectionCard tone={C.gold} index={0} style={{ padding: '20px 22px 18px', marginBottom: 14 }}>
          <SectionTitle
            eyebrow="Sessions"
            title="Replay sessions"
            tone={C.gold}
            action={(
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.gold, 0.16)}`, background: shade(C.gold, 0.1), fontSize: 10.5, color: C.gold, fontWeight: 800 }}>
                  {sessionLimit > 0 ? `${backtestSessions.length}/${sessionLimit} session${sessionLimit > 1 ? 's' : ''}` : 'Locked'}
                </span>
                <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 10.5, color: C.text2, fontWeight: 700 }}>
                  {plan}
                </span>
              </div>
            )}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.95fr) minmax(0, 1.05fr)', gap: 14 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <TextField label="Session name" value={sessionName} onChange={setSessionName} placeholder="London momentum review" />
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Session notes</span>
                <textarea
                  value={sessionNotes}
                  onChange={(event) => setSessionNotes(event.target.value)}
                  rows={4}
                  placeholder="What are you testing in this replay?"
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: 13,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text1,
                    fontSize: 12,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <ControlButton onClick={handleCreateSession} disabled={sessionLimit <= 0 || backtestSessions.length >= sessionLimit}>
                  New session
                </ControlButton>
                {activeReplaySession ? (
                  <ControlButton subtle onClick={() => activateBacktestSession(activeReplaySession)}>
                    Continue current
                  </ControlButton>
                ) : null}
              </div>
              <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.7 }}>
                Starter keeps 1 active replay session. Pro keeps 5. Elite keeps 25. Each session stores filters, interval, replay progress, and notes so you can continue exactly where you stopped.
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {sessionSummaries.length ? sessionSummaries.map((session) => {
                const active = session.id === activeBacktestSessionId;
                const pnlTone = session.totalPnL >= 0 ? C.green : C.danger;
                return (
                  <SessionChip key={session.id} active={active} onClick={() => activateBacktestSession(session)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.text0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {session.name}
                        </div>
                        <div style={{ marginTop: 5, fontSize: 11.5, color: C.text2, lineHeight: 1.55 }}>
                          {session.symbol === 'all' ? 'All symbols' : session.symbol} · {session.setup === 'all' ? 'All setups' : session.setup} · {session.session === 'all' ? 'All sessions' : session.session}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 6, justifyItems: 'end', flexShrink: 0 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: pnlTone }}>{formatAnalyticsMoney(session.totalPnL)}</span>
                        <span style={{ fontSize: 10.5, color: C.text3 }}>{Math.round(session.progressPct || 0)}%</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.border, 0.8)}`, fontSize: 10.5, color: C.text2 }}>
                          {session.tradeCount} trades
                        </span>
                        <span style={{ padding: '5px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.border, 0.8)}`, fontSize: 10.5, color: C.text2 }}>
                          {formatAnalyticsPercent(session.winRate, 1)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ControlButton subtle onClick={(event) => { event.stopPropagation(); activateBacktestSession(session); }}>
                          Continue
                        </ControlButton>
                        <ControlButton subtle onClick={(event) => { event.stopPropagation(); handleDeleteSession(session.id); }}>
                          Remove
                        </ControlButton>
                      </div>
                    </div>
                  </SessionChip>
                );
              }) : (
                <div style={{ padding: '16px 14px', borderRadius: 16, border: `1px dashed ${shade(C.border, 0.9)}`, background: 'rgba(255,255,255,0.02)', fontSize: 12.5, color: C.text2, lineHeight: 1.7 }}>
                  No replay session yet. Build one from your current filters, then resume it any time from this desk.
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="mf-replay-topbar">
          <SectionCard tone={C.accent} index={1} style={{ padding: '20px 22px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Backtest replay desk
                </div>
                <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 3.2vw, 3rem)', fontWeight: 900, letterSpacing: '-0.06em', color: C.text0 }}>
                  {currentSymbol}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.accent, 0.18)}`, background: 'rgba(var(--mf-accent-rgb, 6, 230, 255), 0.08)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent }}>
                    {accountLabel}
                  </span>
                  <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(currentTone, 0.18)}`, background: shade(currentTone, 0.1), fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: currentTone }}>
                    {currentDirection}
                  </span>
                  <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.03)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text2 }}>
                    {filteredTrades.length} samples
                  </span>
                </div>
              </div>

              <div style={{ minWidth: 280, flex: '0 1 420px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: C.text2, fontWeight: 700 }}>Replay progress</div>
                  <div style={{ fontSize: 11, color: C.text2 }}>{replayIndex + 1}/{Math.max(filteredTrades.length, 0)}</div>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 12 }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, rgba(var(--mf-accent-rgb, 6, 230, 255),0.46), rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.95))' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <ControlButton onClick={() => setReplayIndex((current) => Math.max(0, current - 1))} subtle disabled={!filteredTrades.length}>
                    Prev
                  </ControlButton>
                  <ControlButton
                    active={isPlaying}
                    onClick={() => {
                      if (!filteredTrades.length) return;
                      if (replayIndex >= filteredTrades.length - 1) setReplayIndex(0);
                      setIsPlaying((current) => !current);
                    }}
                    disabled={!filteredTrades.length}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPlaying ? C.green : C.text2, animation: isPlaying ? 'mfReplayPulse 1.2s ease-in-out infinite' : 'none' }} />
                      {isPlaying ? 'Pause replay' : 'Play replay'}
                    </span>
                  </ControlButton>
                  <ControlButton onClick={() => setReplayIndex((current) => Math.min(filteredTrades.length - 1, current + 1))} subtle disabled={!filteredTrades.length}>
                    Next
                  </ControlButton>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard tone={C.purple} index={2} style={{ padding: '20px 22px 18px' }}>
            <SectionTitle
              eyebrow="Controls"
              title="Replay controls"
              tone={C.purple}
              action={currentDate ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 10.5, color: C.text2, fontWeight: 700 }}>
                    {currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 10.5, color: C.text2, fontWeight: 700 }}>
                    {currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </span>
                </div>
              ) : null}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
              <Field label="Symbol" value={selectedSymbol} onChange={setSelectedSymbol} options={symbolOptions} />
              <Field label="Setup" value={selectedSetup} onChange={setSelectedSetup} options={setupOptions} />
              <Field label="Session" value={selectedSession} onChange={setSelectedSession} options={sessionOptions} />
              <Field label="Interval" value={selectedInterval} onChange={setSelectedInterval} options={['15', '30', '60', '240', 'D']} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {playbackOptions.map((speed) => (
                  <ControlButton key={speed} active={playbackSpeed === speed} onClick={() => setPlaybackSpeed(speed)}>
                    {speed}x
                  </ControlButton>
                ))}
              </div>

              <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.6 }}>
                Focus on one symbol, one setup, or one session to isolate the edge.
              </div>
            </div>
          </SectionCard>
        </div>

        {filteredTrades.length ? (
          <div className="mf-replay-layout">
            <SectionCard tone={currentTone} index={2} style={{ padding: '18px 18px 16px', height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 7 }}>
                    Current trade
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.06em', color: C.text0, marginBottom: 4 }}>
                    {currentSymbol}
                  </div>
                  <div style={{ fontSize: 12, color: C.text2 }}>
                    {currentDate ? getTradeDateLabel(currentTrade) : '--'} / {currentTrade?.setup || 'Unlabeled'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: currentTone }}>
                    {formatAnalyticsMoney(getTradePnl(currentTrade))}
                  </div>
                  <div style={{ fontSize: 11, color: C.text2 }}>
                    {formatAnalyticsRR(getTradeRR(currentTrade))} / {normalizeSessionLabel(currentTrade?.session)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 2, marginBottom: 16 }}>
                <MetricRow label="Entry" value={formatPrice(getTradeEntry(currentTrade))} />
                <MetricRow label="Exit" value={formatPrice(getTradeExit(currentTrade))} />
                <MetricRow label="Stop" value={formatPrice(getTradeStop(currentTrade))} />
                <MetricRow label="Target" value={formatPrice(getTradeTarget(currentTrade))} />
                <MetricRow label="Size" value={String(getTradeSize(currentTrade))} />
                <MetricRow label="Result" value={formatAnalyticsMoney(getTradePnl(currentTrade))} tone={currentTone} />
              </div>

              <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                <TagCluster label="Setup" values={currentTags.setup} tone={C.green} />
                <TagCluster label="Bias" values={currentTags.bias} tone={C.blue} />
                <TagCluster label="Confluences" values={currentTags.confluences} tone={C.purple} />
                <TagCluster label="Psychology" values={currentTags.psychology} tone={C.warn} />
              </div>

              <div style={{ padding: '14px 15px', borderRadius: 18, border: `1px solid ${shade(C.accent, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>
                  Replay note
                </div>
                <div style={{ fontSize: 12.5, color: C.text1, lineHeight: 1.65 }}>
                  {focusNote}
                </div>
                {currentTrade?.notes ? (
                  <div style={{ marginTop: 10, fontSize: 11.5, color: C.text2, lineHeight: 1.6 }}>
                    {currentTrade.notes}
                  </div>
                ) : null}
              </div>
            </SectionCard>

            <div>
              <SectionCard tone={C.accent} index={3} style={{ padding: '18px 18px 16px' }}>
                <SectionTitle
                  eyebrow="Replay"
                  title="Market replay"
                  tone={C.accent}
                  action={(
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(currentTone, 0.16)}`, background: shade(currentTone, 0.1), fontSize: 10.5, fontWeight: 700, color: currentTone }}>
                        {currentDirection}
                      </span>
                      <span style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.025)', fontSize: 10.5, fontWeight: 700, color: C.text2 }}>
                        {normalizeSessionLabel(currentTrade?.session)}
                      </span>
                    </div>
                  )}
                />

                <div className="mf-replay-chart-grid">
                  <div>
                    <div style={{ padding: '12px 12px 10px', borderRadius: 18, border: `1px solid ${shade(C.accent, 0.12)}`, background: 'rgba(255,255,255,0.02)', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                            Primary chart
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.text0 }}>
                            {currentSymbol} / {selectedInterval}m
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: C.text2 }}>{replayIndex + 1} / {filteredTrades.length}</span>
                          <span style={{ fontSize: 11, color: C.text2 }}>{currentTrade?.time || '--'}</span>
                        </div>
                      </div>
                      <TradingViewEmbed symbol={currentSymbol} interval={selectedInterval} height={520} />
                    </div>
                  </div>

                  <div>
                    <div style={{ padding: '12px 12px 10px', borderRadius: 18, border: `1px solid ${shade(C.purple, 0.12)}`, background: 'rgba(255,255,255,0.02)', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
                            Context chart
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: C.text0 }}>
                            {currentSymbol} / {getContextInterval(selectedInterval)}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.text2 }}>
                          Higher timeframe
                        </div>
                      </div>
                      <TradingViewEmbed symbol={currentSymbol} interval={getContextInterval(selectedInterval)} height={520} />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="mf-replay-bottom-grid">
                <SectionCard tone={C.accent} index={4} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Execution" title="Replay tape" tone={C.accent} />
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                      <thead>
                        <tr>
                          {['Time', 'Pair', 'Setup', 'Dir', 'Entry', 'Exit', 'P&L'].map((header) => (
                            <th key={header} style={{ padding: '0 8px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, textAlign: header === 'P&L' ? 'right' : 'left', borderBottom: `1px solid ${C.border}` }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {replayRows.map((row) => {
                          const rowTone = row.pnl >= 0 ? C.green : C.danger;
                          return (
                            <tr key={row.id}>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11.5, color: C.text2 }}>{row.time}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12.5, fontWeight: 800, color: C.text0 }}>{row.symbol}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11.5, color: C.text1 }}>{row.setup}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11, fontWeight: 800, color: row.direction === 'Short' ? C.danger : C.green }}>{row.direction}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11.5, color: C.text2 }}>{formatPrice(row.entry)}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 11.5, color: C.text2 }}>{formatPrice(row.exit)}</td>
                              <td style={{ padding: '12px 8px', borderBottom: `1px solid ${shade(C.border, 0.72)}`, fontSize: 12, fontWeight: 800, color: rowTone, textAlign: 'right' }}>{formatAnalyticsMoney(row.pnl)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                <SectionCard tone={replaySummary.totalPnL >= 0 ? C.green : C.danger} index={5} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Curve" title="Replay curve" tone={replaySummary.totalPnL >= 0 ? C.green : C.danger} />
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={replayCurve} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="mf-replay-equity" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={replaySummary.totalPnL >= 0 ? C.green : C.danger} stopOpacity={0.38} />
                          <stop offset="100%" stopColor={replaySummary.totalPnL >= 0 ? C.green : C.danger} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis {...CHART_AXIS_SMALL} dataKey="dateLabel" hide={replayCurve.length > 10} />
                      <YAxis {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
                      <ReferenceLine y={0} stroke={shade(C.text3, 0.8)} strokeDasharray="3 3" />
                      <Tooltip
                        cursor={chartCursor(replaySummary.totalPnL >= 0 ? C.green : C.danger)}
                        content={(
                          <ChartTooltip
                            render={(payload, label) => {
                              const row = replayCurve.find((item) => item.dateLabel === label);
                              return (
                                <>
                                  <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.dateLabel}</div>
                                  <div style={{ color: replaySummary.totalPnL >= 0 ? C.green : C.danger, fontWeight: 700 }}>Equity: {formatAnalyticsMoney(row?.equity || 0)}</div>
                                  <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.symbol || '--'} / {row?.session || 'Other'}</div>
                                </>
                              );
                            }}
                          />
                        )}
                      />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke={replaySummary.totalPnL >= 0 ? C.green : C.danger}
                        fill="url(#mf-replay-equity)"
                        strokeWidth={2.6}
                        activeDot={chartActiveDot(replaySummary.totalPnL >= 0 ? C.green : C.danger, 4)}
                        {...CHART_MOTION_SOFT}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
                    <StatBlock label="Net P&L" value={formatAnalyticsMoney(replaySummary.totalPnL)} caption={`${replaySummary.totalTrades} trades`} tone={replaySummary.totalPnL >= 0 ? C.green : C.danger} />
                    <StatBlock label="Win rate" value={formatAnalyticsPercent(replaySummary.winRate, 1)} caption={`${replaySummary.wins} wins / ${replaySummary.losses} losses`} tone={C.teal} />
                    <StatBlock label="Drawdown" value={formatAnalyticsMoney(replaySummary.maxDrawdownCash)} caption={formatAnalyticsPercent(replaySummary.maxDrawdownPct, 1)} tone={C.warn} />
                  </div>
                </SectionCard>

                <SectionCard tone={C.purple} index={6} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Readout" title="Session pulse" tone={C.purple} />
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={sessionPulse} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis {...CHART_AXIS_SMALL} dataKey="label" />
                      <YAxis {...CHART_AXIS_SMALL} tickFormatter={(value) => `$${value}`} />
                      <Tooltip
                        cursor={chartCursor(C.purple)}
                        content={(
                          <ChartTooltip
                            render={(payload, label) => {
                              const row = sessionPulse.find((item) => item.label === label);
                              return (
                                <>
                                  <div style={{ color: C.text1, fontWeight: 800, marginBottom: 4 }}>{row?.label}</div>
                                  <div style={{ color: C.purple, fontWeight: 700 }}>{formatAnalyticsMoney(row?.pnl || 0)}</div>
                                  <div style={{ color: C.text2, fontSize: 10, marginTop: 4 }}>{row?.trades || 0} trades / {formatAnalyticsPercent(row?.winRate || 0, 1)}</div>
                                </>
                              );
                            }}
                          />
                        )}
                      />
                      <Bar dataKey="pnl" radius={[6, 6, 0, 0]} fill={C.purple} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                    {setupPulse.slice(0, 3).map((row) => {
                      const tone = row.pnl >= 0 ? C.green : C.danger;
                      return (
                        <div key={row.label} style={{ padding: '11px 12px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.text0 }}>{row.label}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: tone }}>{formatAnalyticsMoney(row.pnl)}</span>
                          </div>
                          <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 7 }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(10, row.winRate)}%` }}
                              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                              style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(tone, 0.44)}, ${tone})` }}
                            />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 10.5, color: C.text2 }}>
                            <span>{row.trades} trades</span>
                            <span>{formatAnalyticsPercent(row.winRate, 1)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        ) : (
          <SectionCard tone={C.accent} index={2} style={{ padding: '28px 28px 26px' }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
                Backtest
              </div>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, marginBottom: 10 }}>
                Import trades to unlock the replay desk.
              </h2>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
                The replay room opens when MarketFlow has enough history to build the chart context, execution flow, and session readout.
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
