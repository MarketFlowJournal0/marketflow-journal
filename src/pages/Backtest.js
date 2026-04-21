import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  formatAnalyticsFactor,
  formatAnalyticsMoney,
  formatAnalyticsPercent,
  formatAnalyticsRR,
  getTradeDateLabel,
  getTradeDateValue,
  getTradePnl,
  getTradeRR,
  normalizeSessionLabel,
  sortTradesChronologically,
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
  .mf-backtest-page {
    position: relative;
    min-height: 100%;
    color: ${C.text1};
  }

  .mf-backtest-shell {
    display: grid;
    grid-template-columns: 310px minmax(0, 1fr);
    gap: 18px;
    align-items: start;
  }

  .mf-backtest-stage {
    display: grid;
    gap: 18px;
    min-width: 0;
  }

  .mf-backtest-top {
    display: grid;
    grid-template-columns: minmax(0, 1.38fr) minmax(340px, 0.82fr);
    gap: 18px;
    align-items: start;
  }

  .mf-backtest-bottom {
    display: grid;
    grid-template-columns: minmax(0, 1.04fr) minmax(360px, 0.96fr);
    gap: 18px;
    align-items: start;
  }

  .mf-backtest-rail {
    display: grid;
    gap: 18px;
    position: sticky;
    top: 24px;
  }

  .mf-backtest-session-list {
    display: grid;
    gap: 10px;
    max-height: 320px;
    overflow: auto;
    padding-right: 3px;
  }

  .mf-backtest-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mf-backtest-insights {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .mf-backtest-right-stack {
    display: grid;
    gap: 18px;
  }

  .mf-backtest-tape {
    display: grid;
    gap: 8px;
    max-height: 286px;
    overflow: auto;
    padding-right: 4px;
  }

  @media (max-width: 1360px) {
    .mf-backtest-top,
    .mf-backtest-bottom {
      grid-template-columns: 1fr;
    }

    .mf-backtest-insights {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 1160px) {
    .mf-backtest-shell {
      grid-template-columns: 1fr;
    }

    .mf-backtest-rail {
      position: static;
    }
  }

  @media (max-width: 760px) {
    .mf-backtest-form-grid,
    .mf-backtest-insights {
      grid-template-columns: 1fr;
    }
  }
`;

const INTERVAL_OPTIONS = [
  { value: '3', label: '3m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
];

const PLAYBACK_OPTIONS = [1, 2, 5, 10];

const BASE_DRAFT = {
  name: '',
  symbol: 'all',
  setup: 'all',
  session: 'all',
  interval: '15',
  playbackSpeed: 2,
  accountScope: 'all',
  notes: '',
};

const Ic = {
  Play: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M6 4.8L15 10L6 15.2V4.8Z" fill="currentColor" />
    </svg>
  ),
  Pause: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="5" y="4.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
      <rect x="11.8" y="4.5" width="3.2" height="11" rx="1.2" fill="currentColor" />
    </svg>
  ),
  Back: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M12.8 4.9L7.5 10L12.8 15.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M7.2 4.9L12.5 10L7.2 15.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M5.2 4.7H13.4L15.3 6.6V14.9H4.7V5.2C4.7 4.92 4.92 4.7 5.2 4.7Z" stroke="currentColor" strokeWidth="1.45" />
      <path d="M7 4.9V8.2H12.6V4.9" stroke="currentColor" strokeWidth="1.45" />
      <path d="M7.3 14.9V11.7H12.7V14.9" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M5.4 6.2L6 15.1H14L14.6 6.2" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M3.9 5.5H16.1M7.5 5.5L8.1 4.2H11.9L12.5 5.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Duplicate: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="6.4" y="6.1" width="8.2" height="8.4" rx="1.8" stroke="currentColor" strokeWidth="1.45" />
      <path d="M5 12.8H4.6C3.72 12.8 3 12.08 3 11.2V5.6C3 4.72 3.72 4 4.6 4H10.1" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  ),
  Replay: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M7.2 6.3H14.4V13.6H7.2" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.2 3.8L5 6.3L8.2 8.8" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Bolt: () => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" aria-hidden="true">
      <path d="M10.8 2.9L5.7 10.1H9.3L8.7 17.1L14.3 9.9H10.7L10.8 2.9Z" fill="currentColor" />
    </svg>
  ),
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 16, scale: 0.988 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: {
      duration: 0.38,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function getTradeSymbol(trade = {}) {
  return String(trade.symbol || trade.pair || 'Unknown').trim() || 'Unknown';
}

function getTradeEntry(trade = {}) {
  const numeric = Number(trade.entry_price ?? trade.entry ?? trade.open_price ?? trade.open ?? NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function getTradeExit(trade = {}) {
  const numeric = Number(trade.exit_price ?? trade.exit ?? trade.close_price ?? trade.close ?? NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function getTradeStop(trade = {}) {
  const numeric = Number(trade.stop_loss ?? trade.sl ?? NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function getTradeTarget(trade = {}) {
  const numeric = Number(trade.take_profit ?? trade.tp ?? NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function getTradeSize(trade = {}) {
  const numeric = Number(trade.position_size ?? trade.size ?? trade.lots ?? trade.qty ?? trade.quantity ?? NaN);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: numeric < 10 ? 3 : 2,
    maximumFractionDigits: numeric < 10 ? 5 : 2,
  });
}

function formatCompactDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCompactTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSignedCompact(value = 0) {
  const numeric = Number(value) || 0;
  const absolute = Math.abs(numeric).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (numeric > 0) return `+$${absolute}`;
  if (numeric < 0) return `-$${absolute}`;
  return '$0';
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
  if (clean === 'SPX500') return 'FOREXCOM:SPXUSD';
  if (clean === 'XAUUSD') return 'OANDA:XAUUSD';
  if (clean === 'AAPL') return 'NASDAQ:AAPL';
  if (clean.length === 6) return `OANDA:${clean}`;
  return `FOREXCOM:${clean}`;
}

function getContextInterval(interval = '15') {
  if (interval === '3') return '15';
  if (interval === '5') return '30';
  if (interval === '15') return '60';
  if (interval === '60') return '240';
  if (interval === '240') return 'D';
  return 'W';
}

function filterTradesForReplay(trades = [], descriptor = {}) {
  return (trades || []).filter((trade) => {
    const symbol = getTradeSymbol(trade);
    const session = normalizeSessionLabel(trade.session);
    const setup = String(trade.setup || '').trim() || 'Unlabeled';
    const accountId = getTradeAccountId(trade);

    if (descriptor.accountScope && descriptor.accountScope !== 'all' && descriptor.accountScope !== accountId) return false;
    if (descriptor.symbol && descriptor.symbol !== 'all' && descriptor.symbol !== symbol) return false;
    if (descriptor.setup && descriptor.setup !== 'all' && descriptor.setup !== setup) return false;
    if (descriptor.session && descriptor.session !== 'all' && descriptor.session !== session) return false;
    return true;
  });
}

function buildReplayTape(trades = []) {
  return [...(trades || [])]
    .slice(-10)
    .reverse()
    .map((trade) => ({
      id: trade.id,
      symbol: getTradeSymbol(trade),
      direction: trade.direction || trade.type || 'Long',
      pnl: getTradePnl(trade),
      rr: getTradeRR(trade),
      session: normalizeSessionLabel(trade.session),
      dateLabel: getTradeDateLabel(trade),
      timeLabel: trade.time || formatCompactTime(getTradeDateValue(trade)),
      setup: String(trade.setup || '').trim() || 'Unlabeled',
    }));
}

function buildPerformanceBars(trades = []) {
  return [...(trades || [])]
    .slice(-16)
    .map((trade, index) => ({
      index: index + 1,
      label: getTradeDateLabel(trade),
      pnl: Number(getTradePnl(trade).toFixed(2)),
      symbol: getTradeSymbol(trade),
    }));
}

function buildReplayInsights(allTrades = [], visibleSummary, fullSummary, currentTrade) {
  const insights = [];
  const visibleWinRate = visibleSummary.totalTrades ? visibleSummary.winRate : 0;
  const sessionWinRate = fullSummary.totalTrades ? fullSummary.winRate : 0;

  insights.push({
    id: 'progress',
    label: 'Live read',
    tone: visibleSummary.totalPnL >= 0 ? C.green : C.danger,
    title: visibleSummary.totalTrades ? `${formatSignedCompact(visibleSummary.totalPnL)} visible` : 'Waiting for replay',
    detail: visibleSummary.totalTrades ? `${formatAnalyticsPercent(visibleWinRate, 1)} win rate on the revealed segment` : 'Reveal the first trades to start the replay.',
  });

  insights.push({
    id: 'discipline',
    label: 'Execution bias',
    tone: sessionWinRate >= 55 ? C.accent : C.warn,
    title: sessionWinRate >= 55 ? 'Edge is holding' : 'Tighten the execution filter',
    detail: sessionWinRate >= 55
      ? `The full scope is running at ${formatAnalyticsPercent(sessionWinRate, 1)}. Keep the same selectivity.`
      : `Session win rate sits at ${formatAnalyticsPercent(sessionWinRate, 1)}. Reduce marginal entries before size.`,
  });

  insights.push({
    id: 'drawdown',
    label: 'Risk pulse',
    tone: Math.abs(fullSummary.maxDrawdownCash || 0) > Math.abs(fullSummary.avgWin || 0) * 2 ? C.danger : C.blue,
    title: formatAnalyticsMoney(fullSummary.maxDrawdownCash || 0),
    detail: `Max drawdown / ${formatAnalyticsPercent(fullSummary.maxDrawdownPct || 0, 1)} from the full replay scope.`,
  });

  if (currentTrade) {
    const pnl = getTradePnl(currentTrade);
    insights.push({
      id: 'current',
      label: 'Current trade',
      tone: pnl >= 0 ? C.green : C.warn,
      title: `${getTradeSymbol(currentTrade)} · ${currentTrade.direction || currentTrade.type || 'Long'}`,
      detail: `${formatSignedCompact(pnl)} / ${formatAnalyticsRR(getTradeRR(currentTrade))} / ${normalizeSessionLabel(currentTrade.session)}`,
    });
  }

  return insights.slice(0, 4);
}

function buildSessionScopeText(descriptor = {}, accountOptions = []) {
  const accountLabel = accountOptions.find((item) => item.id === descriptor.accountScope)?.label || 'All Accounts';
  const parts = [accountLabel];
  if (descriptor.symbol && descriptor.symbol !== 'all') parts.push(descriptor.symbol);
  if (descriptor.session && descriptor.session !== 'all') parts.push(descriptor.session);
  if (descriptor.setup && descriptor.setup !== 'all') parts.push(descriptor.setup);
  return parts.join(' / ');
}

function getPlaybackDelay(speed = 2) {
  if (speed === 1) return 1350;
  if (speed === 2) return 780;
  if (speed === 5) return 360;
  if (speed === 10) return 180;
  return 780;
}

function sessionsAreEqual(left = {}, right = {}) {
  return [
    'id',
    'name',
    'symbol',
    'setup',
    'session',
    'interval',
    'playbackSpeed',
    'replayIndex',
    'accountScope',
    'plan',
    'tradeCount',
    'progressPct',
    'lastSymbol',
    'notes',
  ].every((key) => left[key] === right[key]);
}

function SectionCard({ children, tone = C.accent, style, index = 0, className = '' }) {
  return (
    <motion.section
      className={className}
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,16,28,0.92), rgba(7,10,18,0.96))',
        boxShadow: '0 24px 70px rgba(0,0,0,0.24)',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.1)} 0%, transparent 42%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, action = null, icon = null, subtitle = null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {icon ? (
            <div style={{ width: 28, height: 28, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: shade(tone, 0.12), color: tone, border: `1px solid ${shade(tone, 0.2)}` }}>
              {icon}
            </div>
          ) : null}
          {eyebrow ? (
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: shade(tone, 0.92) }}>
              {eyebrow}
            </div>
          ) : null}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, lineHeight: 1 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12, color: C.text2, marginTop: 8, lineHeight: 1.6, maxWidth: 720 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {action}
    </div>
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
        border: `1px solid ${disabled ? shade(C.border, 0.9) : shade(tone, 0.2)}`,
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.035)',
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

function ChipButton({ active = false, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 34,
        padding: '0 12px',
        borderRadius: 12,
        border: `1px solid ${active ? shade(C.accent, 0.3) : shade(C.borderHi, 0.82)}`,
        background: active ? shade(C.accent, 0.13) : 'rgba(255,255,255,0.03)',
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
    <div style={{ padding: '14px 14px 13px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: caption ? 6 : 0 }}>
        {value}
      </div>
      {caption ? <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>{caption}</div> : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [] }) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        style={{
          height: 42,
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: C.text1,
          padding: '0 12px',
          fontSize: 12.5,
          fontWeight: 700,
          fontFamily: 'inherit',
          outline: 'none',
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

function DetailRow({ label, value, tone = C.text1 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: `1px solid ${shade(C.borderHi, 0.6)}` }}>
      <span style={{ fontSize: 11.5, color: C.text2 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 800, color: tone, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function SessionTile({ session, active, onOpen, onDelete }) {
  const tone = active ? C.accent : C.text2;
  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${active ? shade(C.accent, 0.24) : shade(C.borderHi, 0.78)}`,
        background: active ? shade(C.accent, 0.08) : 'rgba(255,255,255,0.025)',
        padding: '13px 13px 12px',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        style={{
          all: 'unset',
          display: 'grid',
          gap: 8,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: active ? C.text0 : C.text1 }}>{session.name}</div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: tone }}>{session.progressPct}%</div>
        </div>
        <div style={{ fontSize: 11, color: C.text2 }}>
          {session.tradeCount} trades / {session.symbol === 'all' ? 'Multi-symbol' : session.symbol}
        </div>
        <div style={{ width: '100%', height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ width: `${session.progressPct}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(C.accent, 0.55)}, ${C.accent})` }} />
        </div>
      </button>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10.5, color: C.text3 }}>{formatCompactDate(session.updatedAt)}</span>
        <button
          type="button"
          onClick={onDelete}
          style={{
            all: 'unset',
            color: C.text3,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ic.Trash />
        </button>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload = [], label, tone = C.accent, valueFormatter = (value) => value }) {
  if (!active || !payload.length) return null;
  return (
    <div style={{ ...chartTooltipStyle(tone), padding: '12px 13px', minWidth: 140 }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 11.5, marginTop: 5 }}>
          <span style={{ color: C.text2 }}>{entry.name}</span>
          <span style={{ color: entry.color || tone, fontWeight: 800 }}>{valueFormatter(entry.value, entry.dataKey, entry.payload)}</span>
        </div>
      ))}
    </div>
  );
}

function TradingViewEmbed({ symbol, interval, height = 420 }) {
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
      interval: String(interval || '15'),
      timezone: 'Europe/Paris',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: true,
      calendar: false,
      backgroundColor: '#0A101B',
      gridColor: 'rgba(38,55,84,0.28)',
      studies: [],
      details: false,
      hotlist: false,
      watchlist: false,
      range: '12M',
    });

    host.appendChild(widget);
    host.appendChild(script);

    return () => {
      host.innerHTML = '';
    };
  }, [symbol, interval]);

  return (
    <div style={{ height, width: '100%', overflow: 'hidden', borderRadius: 18, border: `1px solid ${shade(C.borderHi, 0.7)}`, background: '#0A101B' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function Backtest() {
  const { user } = useAuth();
  const { allTrades = [], accountOptions = [], activeAccount = 'all' } = useTradingContext();
  const plan = String(user?.plan || 'trial').toLowerCase();
  const sessionLimit = getBacktestSessionLimit(plan);
  const userId = user?.id || 'guest';

  const [savedSessions, setSavedSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [draft, setDraft] = useState({ ...BASE_DRAFT, accountScope: activeAccount || 'all' });
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loaded = loadBacktestSessions(userId)
      .sort((left, right) => new Date(right.lastOpenedAt || right.updatedAt || 0) - new Date(left.lastOpenedAt || left.updatedAt || 0));
    setSavedSessions(loaded);
    if (loaded.length) {
      const next = loaded[0];
      setActiveSessionId(next.id);
      setDraft({
        name: next.name || '',
        symbol: next.symbol || 'all',
        setup: next.setup || 'all',
        session: next.session || 'all',
        interval: next.interval || '15',
        playbackSpeed: next.playbackSpeed || 2,
        accountScope: next.accountScope || 'all',
        notes: next.notes || '',
      });
      setReplayIndex(next.replayIndex || 0);
    } else {
      setActiveSessionId('');
      setDraft({ ...BASE_DRAFT, accountScope: activeAccount || 'all' });
      setReplayIndex(0);
    }
  }, [userId, activeAccount]);

  useEffect(() => {
    saveBacktestSessions(userId, savedSessions);
  }, [userId, savedSessions]);

  const tradeUniverse = useMemo(() => {
    return sortTradesChronologically(
      (allTrades || []).filter((trade) => getTradeDateValue(trade) && getTradeSymbol(trade) !== 'Unknown')
    );
  }, [allTrades]);

  const symbolOptions = useMemo(() => {
    const values = [...new Set(tradeUniverse.map((trade) => getTradeSymbol(trade)).filter(Boolean))].sort();
    return [{ value: 'all', label: 'All pairs' }, ...values.map((value) => ({ value, label: value }))];
  }, [tradeUniverse]);

  const setupOptions = useMemo(() => {
    const values = [...new Set(tradeUniverse.map((trade) => String(trade.setup || '').trim() || 'Unlabeled'))].sort();
    return [{ value: 'all', label: 'All setups' }, ...values.map((value) => ({ value, label: value }))];
  }, [tradeUniverse]);

  const sessionOptions = useMemo(() => {
    const values = [...new Set(tradeUniverse.map((trade) => normalizeSessionLabel(trade.session)).filter(Boolean))];
    return [{ value: 'all', label: 'All sessions' }, ...values.map((value) => ({ value, label: value }))];
  }, [tradeUniverse]);

  const accountScopeOptions = useMemo(() => {
    return (accountOptions || []).map((option) => ({ value: option.id, label: option.label }));
  }, [accountOptions]);

  const filteredTrades = useMemo(() => filterTradesForReplay(tradeUniverse, draft), [tradeUniverse, draft]);
  const clampedReplayIndex = useMemo(() => clamp(replayIndex, 0, Math.max(filteredTrades.length - 1, 0)), [replayIndex, filteredTrades.length]);
  const visibleTrades = useMemo(() => filteredTrades.slice(0, clampedReplayIndex + 1), [filteredTrades, clampedReplayIndex]);
  const currentTrade = filteredTrades[clampedReplayIndex] || null;
  const currentSymbol = currentTrade ? getTradeSymbol(currentTrade) : (draft.symbol !== 'all' ? draft.symbol : (filteredTrades[0] ? getTradeSymbol(filteredTrades[0]) : 'EURUSD'));
  const progressPct = filteredTrades.length ? Math.round(((clampedReplayIndex + 1) / filteredTrades.length) * 100) : 0;

  useEffect(() => {
    if (replayIndex !== clampedReplayIndex) {
      setReplayIndex(clampedReplayIndex);
    }
  }, [clampedReplayIndex, replayIndex]);

  useEffect(() => {
    if (!isPlaying || filteredTrades.length <= 1) return undefined;
    if (clampedReplayIndex >= filteredTrades.length - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setReplayIndex((value) => Math.min(filteredTrades.length - 1, value + 1));
    }, getPlaybackDelay(draft.playbackSpeed));
    return () => window.clearTimeout(timer);
  }, [isPlaying, clampedReplayIndex, filteredTrades.length, draft.playbackSpeed]);

  const visibleSummary = useMemo(() => summarizeTradeSet(visibleTrades), [visibleTrades]);
  const fullSummary = useMemo(() => summarizeTradeSet(filteredTrades), [filteredTrades]);
  const replaySeries = useMemo(() => buildEquityDrawdownSeries(visibleTrades), [visibleTrades]);
  const rollingWinRate = useMemo(() => {
    const windowSize = visibleTrades.length >= 20 ? 12 : Math.max(4, visibleTrades.length);
    return buildRollingWinRateSeries(visibleTrades, windowSize || 4);
  }, [visibleTrades]);
  const performanceBars = useMemo(() => buildPerformanceBars(visibleTrades), [visibleTrades]);
  const executionTape = useMemo(() => buildReplayTape(visibleTrades), [visibleTrades]);
  const insights = useMemo(() => buildReplayInsights(filteredTrades, visibleSummary, fullSummary, currentTrade), [filteredTrades, visibleSummary, fullSummary, currentTrade]);
  const sessionScopeLabel = useMemo(() => buildSessionScopeText(draft, accountOptions), [draft, accountOptions]);

  useEffect(() => {
    if (!activeSessionId) return;
    setSavedSessions((current) => {
      let changed = false;
      const next = current.map((session) => {
        if (session.id !== activeSessionId) return session;
        const updated = normalizeBacktestSession({
          ...session,
          name: draft.name || session.name || buildBacktestSessionName(draft),
          symbol: draft.symbol,
          setup: draft.setup,
          session: draft.session,
          interval: draft.interval,
          playbackSpeed: draft.playbackSpeed,
          replayIndex: clampedReplayIndex,
          accountScope: draft.accountScope,
          plan,
          tradeCount: filteredTrades.length,
          progressPct,
          lastSymbol: currentSymbol,
          notes: draft.notes,
          updatedAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        });
        if (!sessionsAreEqual(session, updated)) {
          changed = true;
          return updated;
        }
        return session;
      });
      return changed ? next : current;
    });
  }, [
    activeSessionId,
    clampedReplayIndex,
    currentSymbol,
    draft.accountScope,
    draft.interval,
    draft.name,
    draft.notes,
    draft.playbackSpeed,
    draft.session,
    draft.setup,
    draft.symbol,
    filteredTrades.length,
    plan,
    progressPct,
  ]);

  const handleDraftChange = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'symbol' || field === 'setup' || field === 'session' || field === 'accountScope') {
      setReplayIndex(0);
      setIsPlaying(false);
    }
  };

  const handleStartNew = () => {
    setIsPlaying(false);
    setActiveSessionId('');
    setReplayIndex(0);
    setDraft((current) => ({
      ...BASE_DRAFT,
      accountScope: current.accountScope || activeAccount || 'all',
      interval: current.interval || '15',
      playbackSpeed: current.playbackSpeed || 2,
    }));
  };

  const handleOpenSession = (session) => {
    setIsPlaying(false);
    setActiveSessionId(session.id);
    setDraft({
      name: session.name || '',
      symbol: session.symbol || 'all',
      setup: session.setup || 'all',
      session: session.session || 'all',
      interval: session.interval || '15',
      playbackSpeed: session.playbackSpeed || 2,
      accountScope: session.accountScope || 'all',
      notes: session.notes || '',
    });
    setReplayIndex(session.replayIndex || 0);
  };

  const handleDeleteSession = (sessionId) => {
    setSavedSessions((current) => current.filter((session) => session.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleStartNew();
    }
    toast.success('Replay session removed.');
  };

  const handleSaveSession = () => {
    if (!filteredTrades.length) {
      toast.error('No trades match this replay scope yet.');
      return;
    }

    if (!activeSessionId && savedSessions.length >= sessionLimit) {
      toast.error(`Your ${plan} plan keeps ${sessionLimit} replay session${sessionLimit > 1 ? 's' : ''}.`);
      return;
    }

    if (activeSessionId) {
      setSavedSessions((current) => current.map((session) => (
        session.id === activeSessionId
          ? normalizeBacktestSession({
              ...session,
              name: draft.name || session.name || buildBacktestSessionName(draft),
              symbol: draft.symbol,
              setup: draft.setup,
              session: draft.session,
              interval: draft.interval,
              playbackSpeed: draft.playbackSpeed,
              replayIndex: clampedReplayIndex,
              accountScope: draft.accountScope,
              plan,
              tradeCount: filteredTrades.length,
              progressPct,
              lastSymbol: currentSymbol,
              notes: draft.notes,
              updatedAt: new Date().toISOString(),
              lastOpenedAt: new Date().toISOString(),
            })
          : session
      )));
      toast.success('Replay session saved.');
      return;
    }

    const nextSession = createBacktestSession({
      name: draft.name || buildBacktestSessionName(draft),
      symbol: draft.symbol,
      setup: draft.setup,
      session: draft.session,
      interval: draft.interval,
      playbackSpeed: draft.playbackSpeed,
      replayIndex: clampedReplayIndex,
      accountScope: draft.accountScope,
      plan,
      tradeCount: filteredTrades.length,
      progressPct,
      lastSymbol: currentSymbol,
      notes: draft.notes,
    });

    setSavedSessions((current) => [nextSession, ...current].slice(0, sessionLimit));
    setActiveSessionId(nextSession.id);
    setDraft((current) => ({ ...current, name: nextSession.name }));
    toast.success('Replay session created.');
  };

  const handleDuplicateSession = () => {
    if (!filteredTrades.length) {
      toast.error('There is no replay scope to duplicate yet.');
      return;
    }
    if (savedSessions.length >= sessionLimit) {
      toast.error(`Your ${plan} plan keeps ${sessionLimit} replay session${sessionLimit > 1 ? 's' : ''}.`);
      return;
    }
    const nextSession = createBacktestSession({
      name: `${draft.name || buildBacktestSessionName(draft)} copy`,
      symbol: draft.symbol,
      setup: draft.setup,
      session: draft.session,
      interval: draft.interval,
      playbackSpeed: draft.playbackSpeed,
      replayIndex: clampedReplayIndex,
      accountScope: draft.accountScope,
      plan,
      tradeCount: filteredTrades.length,
      progressPct,
      lastSymbol: currentSymbol,
      notes: draft.notes,
    });
    setSavedSessions((current) => [nextSession, ...current].slice(0, sessionLimit));
    setActiveSessionId(nextSession.id);
    setDraft((current) => ({ ...current, name: nextSession.name }));
    toast.success('Replay session duplicated.');
  };

  const togglePlay = () => {
    if (!filteredTrades.length) {
      toast.error('Import trades first to unlock the replay desk.');
      return;
    }
    if (clampedReplayIndex >= filteredTrades.length - 1) {
      setReplayIndex(0);
    }
    setIsPlaying((value) => !value);
  };

  const emptyState = !tradeUniverse.length;
  const liveTone = visibleSummary.totalPnL >= 0 ? C.green : C.danger;
  const sessionTone = fullSummary.totalPnL >= 0 ? C.green : C.danger;

  if (sessionLimit <= 0) {
    return (
      <div style={{ padding: '30px', width: '100%', boxSizing: 'border-box' }}>
        <style>{PAGE_STYLES}</style>
        <SectionCard tone={C.gold} style={{ padding: '28px 28px 24px', maxWidth: 760 }}>
          <SectionTitle eyebrow="Backtest" title="Replay desk starts from Starter" tone={C.gold} icon={<Ic.Replay />} />
          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7 }}>
            Upgrade to Starter or above to unlock persistent replay sessions. Starter keeps 1 session, Pro keeps 5, and Elite keeps 25.
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="mf-backtest-page" style={{ padding: '30px 30px 56px', width: '100%', boxSizing: 'border-box' }}>
      <style>{PAGE_STYLES}</style>

      <motion.div
        {...panelMotion(0)}
        style={{
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: shade(C.accent, 0.9), marginBottom: 8 }}>
            Backtest
          </div>
          <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
            Replay desk
          </h1>
          <div style={{ fontSize: 12.5, color: C.text2, marginTop: 10, lineHeight: 1.7, maxWidth: 760 }}>
            MarketFlow replay runs from your real journal history. Continue a saved session or start a fresh one with a tighter scope.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <GhostButton onClick={handleStartNew} icon={<Ic.Plus />}>New replay</GhostButton>
          <GhostButton onClick={handleSaveSession} icon={<Ic.Save />} tone={C.accent}>Save session</GhostButton>
          <div style={{ padding: '7px 10px', borderRadius: 999, background: shade(C.accent, 0.12), border: `1px solid ${shade(C.accent, 0.18)}`, fontSize: 10.5, fontWeight: 800, color: C.accent }}>
            {savedSessions.length}/{sessionLimit} saved
          </div>
        </div>
      </motion.div>

      {emptyState ? (
        <SectionCard tone={C.accent} index={1} style={{ padding: '28px 26px' }}>
          <SectionTitle eyebrow="Backtest" title="Import trades to launch the replay desk" tone={C.accent} icon={<Ic.Replay />} />
          <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, maxWidth: 720 }}>
            The replay engine reads your journal history. Add or import trades in <strong style={{ color: C.text1 }}>All Trades</strong> and this desk will immediately build replay scopes, curves, and saved sessions.
          </div>
        </SectionCard>
      ) : (
        <div className="mf-backtest-shell">
          <div className="mf-backtest-rail">
            <SectionCard tone={C.accent} index={1} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle eyebrow="Library" title="Replay sessions" tone={C.accent} icon={<Ic.Replay />} />
              <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                <MiniStat label="Plan capacity" value={`${savedSessions.length}/${sessionLimit}`} caption={`${plan.toUpperCase()} replay slots`} tone={C.accent} />
              </div>
              <div className="mf-backtest-session-list">
                {savedSessions.length ? savedSessions.map((session) => (
                  <SessionTile
                    key={session.id}
                    session={session}
                    active={activeSessionId === session.id}
                    onOpen={() => handleOpenSession(session)}
                    onDelete={() => handleDeleteSession(session.id)}
                  />
                )) : (
                  <div style={{ padding: '14px 12px', borderRadius: 16, border: `1px dashed ${shade(C.borderHi, 0.8)}`, color: C.text2, fontSize: 12, lineHeight: 1.7 }}>
                    No saved replay yet. Build your scope and save the first session.
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard tone={C.blue} index={2} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle eyebrow="Setup" title="Replay scope" tone={C.blue} icon={<Ic.Bolt />} />

              <div className="mf-backtest-form-grid" style={{ marginBottom: 12 }}>
                <SelectField label="Account" value={draft.accountScope} onChange={(event) => handleDraftChange('accountScope', event.target.value)} options={accountScopeOptions} />
                <SelectField label="Pair" value={draft.symbol} onChange={(event) => handleDraftChange('symbol', event.target.value)} options={symbolOptions} />
                <SelectField label="Session" value={draft.session} onChange={(event) => handleDraftChange('session', event.target.value)} options={sessionOptions} />
                <SelectField label="Setup" value={draft.setup} onChange={(event) => handleDraftChange('setup', event.target.value)} options={setupOptions} />
                <SelectField label="Chart interval" value={draft.interval} onChange={(event) => handleDraftChange('interval', event.target.value)} options={INTERVAL_OPTIONS} />
                <SelectField
                  label="Replay speed"
                  value={String(draft.playbackSpeed)}
                  onChange={(event) => handleDraftChange('playbackSpeed', Number(event.target.value))}
                  options={PLAYBACK_OPTIONS.map((value) => ({ value: String(value), label: `${value}x` }))}
                />
              </div>

              <label style={{ display: 'grid', gap: 7, marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  Session name
                </span>
                <input
                  value={draft.name}
                  onChange={(event) => handleDraftChange('name', event.target.value)}
                  placeholder={buildBacktestSessionName(draft)}
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

              <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                <DetailRow label="Replay scope" value={sessionScopeLabel} tone={C.text1} />
                <DetailRow label="Trades in scope" value={`${filteredTrades.length}`} tone={C.accent} />
                <DetailRow label="Saved progress" value={`${progressPct}%`} tone={liveTone} />
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                <GhostButton onClick={handleSaveSession} icon={<Ic.Save />} tone={C.accent}>Save</GhostButton>
                <GhostButton onClick={handleDuplicateSession} icon={<Ic.Duplicate />}>Duplicate</GhostButton>
                <GhostButton onClick={handleStartNew} icon={<Ic.Plus />}>Reset scope</GhostButton>
              </div>

              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  Session notes
                </span>
                <textarea
                  value={draft.notes}
                  onChange={(event) => handleDraftChange('notes', event.target.value)}
                  placeholder="Execution notes, replay observations, plan refinements."
                  rows={5}
                  style={{
                    resize: 'vertical',
                    minHeight: 118,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`,
                    background: 'rgba(255,255,255,0.03)',
                    color: C.text1,
                    padding: '12px',
                    fontSize: 12.5,
                    lineHeight: 1.7,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </label>
            </SectionCard>

            <SectionCard tone={currentTrade ? (getTradePnl(currentTrade) >= 0 ? C.green : C.danger) : C.text2} index={3} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle eyebrow="Active trade" title={currentTrade ? getTradeSymbol(currentTrade) : 'Awaiting replay'} tone={currentTrade ? (getTradePnl(currentTrade) >= 0 ? C.green : C.text2) : C.text2} />
              {currentTrade ? (
                <div style={{ display: 'grid', gap: 2 }}>
                  <DetailRow label="Direction" value={currentTrade.direction || currentTrade.type || 'Long'} tone={C.text1} />
                  <DetailRow label="Entry" value={formatPrice(getTradeEntry(currentTrade))} tone={C.accent} />
                  <DetailRow label="Exit" value={formatPrice(getTradeExit(currentTrade))} tone={C.text1} />
                  <DetailRow label="Stop" value={formatPrice(getTradeStop(currentTrade))} tone={C.danger} />
                  <DetailRow label="Target" value={formatPrice(getTradeTarget(currentTrade))} tone={C.green} />
                  <DetailRow label="Size" value={getTradeSize(currentTrade) != null ? String(getTradeSize(currentTrade)) : '--'} tone={C.text1} />
                  <DetailRow label="P&L" value={formatAnalyticsMoney(getTradePnl(currentTrade))} tone={getTradePnl(currentTrade) >= 0 ? C.green : C.danger} />
                  <DetailRow label="R:R" value={formatAnalyticsRR(getTradeRR(currentTrade))} tone={C.blue} />
                  <DetailRow label="Setup" value={String(currentTrade.setup || '').trim() || 'Unlabeled'} tone={C.text1} />
                  <DetailRow label="Session" value={normalizeSessionLabel(currentTrade.session)} tone={C.text1} />
                </div>
              ) : (
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                  Choose a replay scope and reveal the first trade.
                </div>
              )}
            </SectionCard>
          </div>

          <div className="mf-backtest-stage">
            <SectionCard tone={liveTone} index={4} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle
                eyebrow="Replay desk"
                title={draft.name || buildBacktestSessionName(draft)}
                tone={liveTone}
                subtitle={`Running ${filteredTrades.length} trades from ${sessionScopeLabel}. Progress is persisted automatically while you replay.`}
                action={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <GhostButton onClick={() => { setIsPlaying(false); setReplayIndex(0); }} icon={<Ic.Back />}>Restart</GhostButton>
                    <GhostButton onClick={togglePlay} icon={isPlaying ? <Ic.Pause /> : <Ic.Play />} tone={C.accent}>
                      {isPlaying ? 'Pause' : 'Play'}
                    </GhostButton>
                  </div>
                }
                icon={<Ic.Replay />}
              />

              <div className="mf-backtest-insights">
                <MiniStat label="Visible P&L" value={formatAnalyticsMoney(visibleSummary.totalPnL || 0)} caption={`${visibleSummary.totalTrades || 0} revealed trades`} tone={liveTone} />
                <MiniStat label="Session win rate" value={formatAnalyticsPercent(fullSummary.winRate || 0, 1)} caption={`${fullSummary.wins || 0} wins / ${fullSummary.losses || 0} losses`} tone={fullSummary.winRate >= 50 ? C.green : C.warn} />
                <MiniStat label="Max drawdown" value={formatAnalyticsMoney(fullSummary.maxDrawdownCash || 0)} caption={formatAnalyticsPercent(fullSummary.maxDrawdownPct || 0, 1)} tone={Math.abs(fullSummary.maxDrawdownCash || 0) > Math.abs(fullSummary.avgWin || 0) * 2 ? C.danger : C.blue} />
              </div>
            </SectionCard>

            <div className="mf-backtest-top">
              <SectionCard tone={C.accent} index={5} style={{ padding: '18px 18px 16px' }}>
                <SectionTitle
                  eyebrow="Main chart"
                  title={`${currentSymbol} · ${draft.interval}`}
                  tone={C.accent}
                  subtitle={currentTrade ? `${getTradeDateLabel(currentTrade)} / ${currentTrade.time || formatCompactTime(getTradeDateValue(currentTrade))}` : 'Use the controls to scrub through the session.'}
                  action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <GhostButton onClick={() => { setIsPlaying(false); setReplayIndex((value) => Math.max(0, value - 1)); }} icon={<Ic.Back />}>Prev</GhostButton>
                      <GhostButton onClick={() => { setIsPlaying(false); setReplayIndex((value) => Math.min(filteredTrades.length - 1, value + 1)); }} icon={<Ic.Forward />}>Next</GhostButton>
                    </div>
                  }
                  icon={<Ic.Replay />}
                />

                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ padding: 14, borderRadius: 18, border: `1px solid ${shade(C.accent, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {PLAYBACK_OPTIONS.map((option) => (
                          <ChipButton key={option} active={draft.playbackSpeed === option} onClick={() => handleDraftChange('playbackSpeed', option)}>
                            {option}x
                          </ChipButton>
                        ))}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: C.text2 }}>
                        {Math.min(clampedReplayIndex + 1, filteredTrades.length)} / {filteredTrades.length} trades
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(filteredTrades.length - 1, 0)}
                      step={1}
                      value={clampedReplayIndex}
                      onChange={(event) => {
                        setIsPlaying(false);
                        setReplayIndex(Number(event.target.value));
                      }}
                      style={{ width: '100%' }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10, fontSize: 11, color: C.text3 }}>
                      <span>Start</span>
                      <span style={{ color: liveTone, fontWeight: 800 }}>{progressPct}% revealed</span>
                      <span>{filteredTrades.length ? getTradeDateLabel(filteredTrades[filteredTrades.length - 1]) : 'No scope'}</span>
                    </div>
                  </div>

                  <TradingViewEmbed symbol={currentSymbol} interval={draft.interval} height={468} />
                </div>
              </SectionCard>

              <div className="mf-backtest-right-stack">
                <SectionCard tone={C.blue} index={6} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Context chart" title={`${currentSymbol} · ${getContextInterval(draft.interval)}`} tone={C.blue} icon={<Ic.Bolt />} />
                  <TradingViewEmbed symbol={currentSymbol} interval={getContextInterval(draft.interval)} height={248} />
                </SectionCard>

                <SectionCard tone={sessionTone} index={7} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Session readout" title="Replay summary" tone={sessionTone} />
                  <div style={{ display: 'grid', gap: 10 }}>
                    <MiniStat label="Net P&L" value={formatAnalyticsMoney(fullSummary.totalPnL || 0)} tone={sessionTone} caption={`${filteredTrades.length} scoped trades`} />
                    <MiniStat label="Profit factor" value={formatAnalyticsFactor(fullSummary.profitFactor || 0)} tone={C.blue} caption={`${formatAnalyticsMoney(fullSummary.avgWin || 0)} avg win / ${formatAnalyticsMoney(fullSummary.avgLoss || 0)} avg loss`} />
                    <MiniStat label="Expectancy" value={formatAnalyticsMoney(fullSummary.expectancy || 0)} tone={C.teal} caption={`${formatAnalyticsRR(fullSummary.avgRR || 0)} average realized R:R`} />
                  </div>
                </SectionCard>
              </div>
            </div>

            <div className="mf-backtest-bottom">
              <SectionCard tone={C.green} index={8} style={{ padding: '18px 18px 16px' }}>
                <SectionTitle eyebrow="Replay curve" title="Equity and drawdown" tone={C.green} subtitle="The curve updates as each trade is revealed, so the tape, the chart, and the risk profile stay synchronized." />
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={replaySeries}>
                      <defs>
                        <linearGradient id="mfReplayEquity" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={shade(C.green, 0.48)} />
                          <stop offset="100%" stopColor={shade(C.green, 0.02)} />
                        </linearGradient>
                        <linearGradient id="mfReplayDrawdown" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor={shade(C.danger, 0.32)} />
                          <stop offset="100%" stopColor={shade(C.danger, 0.02)} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="dateLabel" interval="preserveStartEnd" minTickGap={24} {...CHART_AXIS} />
                      <YAxis yAxisId="equity" width={76} tickFormatter={(value) => formatSignedCompact(value)} {...CHART_AXIS} />
                      <YAxis yAxisId="drawdown" orientation="right" width={76} tickFormatter={(value) => formatSignedCompact(value)} {...CHART_AXIS} />
                      <Tooltip
                        cursor={chartCursor(C.green)}
                        content={<ChartTooltip tone={C.green} valueFormatter={(value, key) => key === 'drawdownCash' ? formatAnalyticsMoney(value || 0) : formatAnalyticsMoney(value || 0)} />}
                      />
                      <ReferenceLine yAxisId="equity" y={0} stroke={shade(C.text3, 0.55)} strokeDasharray="4 8" />
                      <Area
                        yAxisId="equity"
                        type="monotone"
                        dataKey="equity"
                        name="Equity"
                        stroke={C.green}
                        strokeWidth={2.2}
                        fill="url(#mfReplayEquity)"
                        activeDot={chartActiveDot(C.green)}
                        isAnimationActive
                      />
                      <Area
                        yAxisId="drawdown"
                        type="monotone"
                        dataKey="drawdownCash"
                        name="Drawdown"
                        stroke={C.danger}
                        strokeWidth={1.8}
                        fill="url(#mfReplayDrawdown)"
                        activeDot={chartActiveDot(C.danger, 4.5)}
                        isAnimationActive
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <div className="mf-backtest-right-stack">
                <SectionCard tone={C.purple} index={9} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Win rate" title="Live win-rate curve" tone={C.purple} subtitle="Cumulative and rolling win rate are both tied to the same replay segment." />
                  <div style={{ height: 214 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rollingWinRate}>
                        <CartesianGrid {...CHART_GRID} />
                        <XAxis dataKey="dateLabel" interval="preserveStartEnd" minTickGap={18} {...CHART_AXIS_SMALL} />
                        <YAxis width={46} domain={[0, 100]} tickFormatter={(value) => `${value}%`} {...CHART_AXIS_SMALL} />
                        <Tooltip cursor={chartCursor(C.purple)} content={<ChartTooltip tone={C.purple} valueFormatter={(value) => formatAnalyticsPercent(value || 0, 1)} />} />
                        <Line
                          type="monotone"
                          dataKey="cumulativeWinRate"
                          name="Cumulative"
                          stroke={C.purple}
                          strokeWidth={2.2}
                          dot={false}
                          activeDot={chartActiveDot(C.purple)}
                        />
                        <Line
                          type="monotone"
                          dataKey="rollingWinRate"
                          name="Rolling"
                          stroke={C.accent}
                          strokeWidth={1.9}
                          strokeDasharray="6 6"
                          dot={false}
                          activeDot={chartActiveDot(C.accent, 4.5)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <SectionCard tone={C.accent} index={10} style={{ padding: '18px 18px 16px' }}>
                  <SectionTitle eyebrow="Execution tape" title="Revealed trades" tone={C.accent} />
                  <div className="mf-backtest-tape">
                    {executionTape.length ? executionTape.map((trade) => {
                      const tone = trade.pnl >= 0 ? C.green : C.danger;
                      return (
                        <div key={trade.id} style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.text1 }}>{trade.symbol}</div>
                            <div style={{ fontSize: 11.5, fontWeight: 800, color: tone }}>{formatAnalyticsMoney(trade.pnl)}</div>
                          </div>
                          <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6 }}>
                            {trade.dateLabel} / {trade.timeLabel} / {trade.direction} / {trade.session}
                          </div>
                          <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                            {trade.setup} / {formatAnalyticsRR(trade.rr)}
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ padding: '12px', borderRadius: 16, border: `1px dashed ${shade(C.borderHi, 0.8)}`, fontSize: 12, color: C.text2 }}>
                        Start the replay to reveal the tape.
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </div>

            <SectionCard tone={C.gold} index={11} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle eyebrow="Review" title="Replay intelligence" tone={C.gold} subtitle="The desk keeps the feedback tight: what is working, where the drag sits, and what to tighten next." />
              <div className="mf-backtest-insights">
                {insights.map((insight) => (
                  <div key={insight.id} style={{ padding: '15px 15px 14px', borderRadius: 18, border: `1px solid ${shade(insight.tone, 0.14)}`, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: shade(insight.tone, 0.92), marginBottom: 8 }}>
                      {insight.label}
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.04em', color: C.text0, marginBottom: 7 }}>
                      {insight.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.65 }}>
                      {insight.detail}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard tone={C.blue} index={12} style={{ padding: '18px 18px 16px' }}>
              <SectionTitle eyebrow="Recent flow" title="Trade-by-trade distribution" tone={C.blue} subtitle="Every bar is one revealed trade. Keep the replay open until the bar sequence and the equity curve tell the same story." />
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceBars}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="index" {...CHART_AXIS_SMALL} />
                    <YAxis width={64} tickFormatter={(value) => formatSignedCompact(value)} {...CHART_AXIS_SMALL} />
                    <Tooltip cursor={chartCursor(C.blue)} content={<ChartTooltip tone={C.blue} valueFormatter={(value) => formatAnalyticsMoney(value || 0)} />} />
                    <ReferenceLine y={0} stroke={shade(C.text3, 0.55)} strokeDasharray="4 8" />
                    <Bar
                      dataKey="pnl"
                      name="P&L"
                      radius={[7, 7, 0, 0]}
                      isAnimationActive
                      fill={C.blue}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}
