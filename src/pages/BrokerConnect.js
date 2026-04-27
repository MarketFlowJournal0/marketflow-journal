import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTradingContext } from '../context/TradingContext';
import { supabase } from '../lib/supabase';
import { shade } from '../lib/colorAlpha';
import { appUrl } from '../lib/appUrls';
import {
  ACCOUNT_ROLE_OPTIONS,
  COPY_SIZING_MODES,
  PLATFORM_OPTIONS,
  SESSION_OPTIONS,
  TRADE_COPIER_FEATURES,
  VENUE_OPTIONS,
  buildTradeCopierOverview,
  calculateAccountRiskState,
  createCopierAccount,
  createCopierLink,
  exportTradeCopierSnapshot,
  importTradeCopierSnapshot,
  loadTradeCopierState,
  normalizeCopierAccount,
  normalizeCopierLink,
  normalizeTradeCopierState,
  saveTradeCopierState,
  simulateTradeCopierDispatch,
} from '../lib/tradeCopier';

const C = {
  bg: 'var(--mf-bg,#01040A)',
  bgCard: 'var(--mf-card,#060D18)',
  bgHigh: 'var(--mf-high,#0B1525)',
  cyan: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  purple: 'var(--mf-purple,#A78BFA)',
  blue: 'var(--mf-blue,#4D7CFF)',
  gold: 'var(--mf-gold,#D7B36A)',
  danger: 'var(--mf-danger,#FF3D57)',
  warn: 'var(--mf-warn,#FFB31A)',
  t0: 'var(--mf-text-0,#FFFFFF)',
  t1: 'var(--mf-text-1,#E8EEFF)',
  t2: 'var(--mf-text-2,#7A90B8)',
  t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#142033)',
};

const SYNC_ENDPOINT = appUrl('/api/mt-sync');
const MT_PATH_ENDPOINT = appUrl('/api/mt/sync');
const WEBHOOK_ENDPOINT = appUrl('/api/webhook-sync');

const BROKERS = [
  {
    id: 'mt4',
    name: 'MetaTrader 4',
    short: 'MT4',
    color: 'var(--mf-accent,#14C9E5)',
    desc: 'Real-time sync through the MarketFlow EA and token handshake.',
    features: ['EA sync', 'Multi-account', 'Retry-safe'],
    setup: [
      'Create the broker account and copy the generated token. MarketFlow never asks for your broker password.',
      'Install the MarketFlow EA inside the MQL4 Experts folder.',
      `Allow WebRequest and whitelist ${SYNC_ENDPOINT}. The compatibility path ${MT_PATH_ENDPOINT} is also active.`,
      'Paste the token inside EA inputs and attach it to a live chart. The EA must POST api_token and trades[].',
    ],
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    short: 'MT5',
    color: 'var(--mf-green,#00D2B8)',
    desc: 'Live MT5 synchronization with hedge-aware position handling.',
    features: ['Live sync', 'Hedging', 'Netting'],
    setup: [
      'Create the broker account and copy the generated token. MarketFlow never asks for your broker password.',
      'Install the MarketFlow EA in MQL5/Experts and compile it.',
      `Allow WebRequest and whitelist ${SYNC_ENDPOINT}. The compatibility path ${MT_PATH_ENDPOINT} is also active.`,
      'Attach the EA to a chart and paste the token in the inputs panel. The EA must POST api_token and trades[].',
    ],
  },
  {
    id: 'ctrader',
    name: 'cTrader',
    short: 'cTrader',
    color: 'var(--mf-purple,#A78BFA)',
    desc: 'CSV ingestion today, cBot automation ready for the next sync wave.',
    features: ['CSV import', 'cBot ready', 'History sync'],
    setup: [
      'Export account history from cTrader as CSV.',
      'Use All Trades import to map and ingest the file.',
      'Keep the account connected here to prepare for the cBot rollout.',
    ],
    status: 'csv',
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    short: 'TV',
    color: 'var(--mf-blue,#4D7CFF)',
    desc: 'Webhook or CSV bridge for broker-linked TradingView workflows.',
    features: ['Webhook bridge', 'CSV import', 'Paper or live'],
    setup: [
      'Export fills from TradingView or your connected broker.',
      'Use the universal importer in All Trades.',
      'For automation, keep a webhook account here and post fills to MarketFlow.',
    ],
    status: 'csv',
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    short: 'IBKR',
    color: 'var(--mf-warn,#FFB31A)',
    desc: 'Flex query imports with commission-aware statement support.',
    features: ['Flex query', 'Multi-currency', 'Statements'],
    setup: [
      'Create an IBKR activity statement in CSV format.',
      'Import the file through All Trades.',
      'Use this broker slot to align the account inside the Elite copier desk.',
    ],
    status: 'csv',
  },
  {
    id: 'webhook',
    name: 'Webhook / API',
    short: 'API',
    color: 'var(--mf-gold,#D7B36A)',
    desc: 'Universal bridge for any platform capable of posting trade payloads.',
    features: ['Any platform', 'REST', 'Custom routing'],
    setup: [
      'Create a webhook account and copy its API token. Keep it private and rotate it if exposed.',
      `POST your fills to ${WEBHOOK_ENDPOINT}?token=YOUR_TOKEN or send api_token in the JSON body.`,
      'Use the same connection as a master or follower feed inside Elite copier.',
    ],
    status: 'webhook',
  },
];

const ICON = {
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10L10 4" />
      <path d="M5.25 4H10v4.75" />
    </svg>
  ),
  Plug: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v4" />
      <path d="M12 3v4" />
      <path d="M4 7h10" />
      <path d="M9 7v8" />
      <path d="M6 11.5h6" />
    </svg>
  ),
  Network: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="9" r="2" />
      <circle cx="14" cy="4" r="2" />
      <circle cx="14" cy="14" r="2" />
      <path d="M6 8.3l6-3" />
      <path d="M6 9.7l6 3" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.2l5 2.2v4.4c0 3.1-2 5.8-5 7-3-1.2-5-3.9-5-7V4.4z" />
      <path d="M6.8 8.9l1.5 1.6 2.9-3.2" />
    </svg>
  ),
  Risk: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5L16 15.5H2L9 2.5z" />
      <path d="M9 6.3v4.2" />
      <path d="M9 13h.01" />
    </svg>
  ),
  Account: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="6" r="3" />
      <path d="M3.3 15c1.3-2.5 3.4-3.7 5.7-3.7s4.4 1.2 5.7 3.7" />
    </svg>
  ),
  Link: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11l-1.8 1.8a2.5 2.5 0 11-3.5-3.6L3.5 7.5A2.5 2.5 0 017 7" />
      <path d="M11 7l1.8-1.8a2.5 2.5 0 013.5 3.6l-1.8 1.7A2.5 2.5 0 0111 11" />
      <path d="M6.5 11.5l5-5" />
    </svg>
  ),
  Spark: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5l1.4 3.4L13.8 7l-3.4 1.1L9 11.5l-1.4-3.4L4.2 7l3.4-1.1z" />
      <path d="M14 11.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
      <path d="M4 11.5l.5 1.2 1.2.5-1.2.5-.5 1.2-.5-1.2-1.2-.5 1.2-.5z" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5v7" />
      <path d="M6.2 7.8L9 10.6l2.8-2.8" />
      <path d="M3.5 14.5h11" />
    </svg>
  ),
  Upload: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14.5v-7" />
      <path d="M6.2 10.2L9 7.4l2.8 2.8" />
      <path d="M3.5 3.5h11" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.8v3.6l2.2 1.3" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.25" y="2.25" width="7" height="8.5" rx="1.3" />
      <path d="M2.75 9.5V4.7A1.45 1.45 0 014.2 3.25" />
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 3.25h9" />
      <path d="M5.25 1.75h3.5" />
      <path d="M3.5 3.25l.65 7.5a1.2 1.2 0 001.2 1.1h3.3a1.2 1.2 0 001.2-1.1l.65-7.5" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.2 2.2l3.6 3.6" />
      <path d="M2.4 11.6l2.2-.4 6-6a1.5 1.5 0 10-2.1-2.1l-6 6z" />
    </svg>
  ),
  Lock: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="8" width="11" height="7" rx="1.6" />
      <path d="M6 8V5.8a3 3 0 116 0V8" />
    </svg>
  ),
};

function generateToken() {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map((value) => value.toString(16).padStart(2, '0')).join('');
}

function maskToken(token = '') {
  const clean = String(token || '');
  if (clean.length <= 14) return clean ? `${clean.slice(0, 4)}...` : '';
  return `${clean.slice(0, 8)}...${clean.slice(-6)}`;
}

function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function moneyExact(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function percentage(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`;
}

function downloadJson(payload, filename) {
  if (typeof window === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function copyText(value, successMessage = 'Copied.') {
  navigator.clipboard.writeText(value);
  toast.success(successMessage);
}

function roleLabel(role) {
  return ACCOUNT_ROLE_OPTIONS.find((item) => item.id === role)?.label || role;
}

function sizingModeLabel(value) {
  return COPY_SIZING_MODES.find((item) => item.id === value)?.label || value;
}

function statusTone(status) {
  if (status === 'connected' || status === 'ready' || status === 'active') return { color: C.green, bg: shade(C.green, 0.12), border: shade(C.green, 0.22) };
  if (status === 'warning' || status === 'watch') return { color: C.warn, bg: shade(C.warn, 0.12), border: shade(C.warn, 0.22) };
  if (status === 'blocked' || status === 'offline') return { color: C.danger, bg: shade(C.danger, 0.12), border: shade(C.danger, 0.22) };
  return { color: C.t2, bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' };
}

function initialBrokerForm() {
  return {
    broker_type: 'mt4',
    account_number: '',
    account_name: '',
    server_name: '',
  };
}

function initialCopierAccountForm() {
  return {
    label: '',
    platform: 'MT5',
    venue: 'CFD',
    role: 'follower',
    balance: 10000,
    equity: 10000,
    currency: 'USD',
    riskPerTrade: 0.5,
    maxDailyLoss: 3,
    currentDailyLoss: 0,
    maxDrawdown: 8,
    currentDrawdown: 0,
    maxOpenRisk: 1.5,
    maxLot: 5,
    status: 'connected',
    phase: '',
    propFirm: '',
    symbolSuffix: '',
    latencyMs: 350,
    heartbeatSeconds: 8,
    notes: '',
    brokerAccountId: '',
  };
}

function initialCopierLinkForm(masterId = '', followerId = '') {
  return {
    label: '',
    masterAccountId: masterId,
    followerAccountId: followerId,
    status: 'active',
    sizingMode: 'smart-risk',
    multiplier: 1,
    fixedLot: 0.1,
    riskPercent: 0.5,
    maxLot: 5,
    reverseSide: false,
    propShield: true,
    stepDown: true,
    latencyGuardMs: 4000,
    sessionFilter: SESSION_OPTIONS.map((item) => item.id),
    symbolAllowlist: '',
    symbolRemap: '',
    notes: '',
  };
}

function initialDispatchForm(masterId = '') {
  return {
    masterAccountId: masterId,
    symbol: 'EURUSD',
    side: 'long',
    entry: 1.085,
    stop: 1.081,
    target: 1.094,
    session: 'london',
    masterSize: 1,
    masterRiskCash: 400,
    notes: '',
  };
}

function Field({ label, children, hint }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</span>
        {hint ? <span style={{ fontSize: 10, color: C.t3 }}>{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function inputStyle() {
  return {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 12,
    border: `1px solid ${shade(C.t3, 0.18)}`,
    background: 'rgba(5,9,16,0.88)',
    color: C.t0,
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.14s ease, background 0.14s ease',
  };
}

function pageCardStyle(extra = {}) {
  return {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    border: `1px solid ${shade(C.cyan, 0.12)}`,
    background: 'linear-gradient(180deg, rgba(12,18,31,0.94), rgba(7,11,20,0.96))',
    boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
    ...extra,
  };
}

function ActionButton({ children, tone = 'primary', ...props }) {
  const tones = {
    primary: {
      background: `linear-gradient(135deg, ${shade(C.cyan, 0.92)}, ${shade(C.green, 0.92)})`,
      border: 'none',
      color: '#041019',
      boxShadow: `0 14px 32px ${shade(C.cyan, 0.18)}`,
    },
    subtle: {
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${shade(C.t3, 0.22)}`,
      color: C.t1,
      boxShadow: 'none',
    },
    danger: {
      background: shade(C.danger, 0.1),
      border: `1px solid ${shade(C.danger, 0.2)}`,
      color: C.danger,
      boxShadow: 'none',
    },
  };

  return (
    <button
      {...props}
      style={{
        padding: '11px 16px',
        borderRadius: 12,
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'transform 0.14s ease, opacity 0.14s ease',
        ...tones[tone],
        ...(props.style || {}),
      }}
    >
      {children}
    </button>
  );
}

function MetricCard({ label, value, tone = C.cyan, detail, icon: Icon }) {
  return (
    <div style={{ ...pageCardStyle({ padding: 18, minHeight: 130 }) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
        {Icon ? (
          <div style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', color: tone, background: shade(tone, 0.12), border: `1px solid ${shade(tone, 0.2)}` }}>
            <Icon />
          </div>
        ) : null}
      </div>
      <div style={{ marginTop: 24, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.05em', color: tone }}>{value}</div>
        <div style={{ fontSize: 12.5, color: C.t2, lineHeight: 1.6 }}>{detail}</div>
      </div>
      <div style={{ position: 'absolute', right: -40, top: -40, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${shade(tone, 0.18)} 0%, transparent 72%)` }} />
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ maxWidth: 760 }}>
        {eyebrow ? (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.t3, marginBottom: 8 }}>{eyebrow}</div>
        ) : null}
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: C.t0 }}>{title}</div>
        {description ? <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.65, color: C.t2, maxWidth: 720 }}>{description}</div> : null}
      </div>
      {actions ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

function BrokerConnect() {
  const { user } = useAuth();
  const { accountOptions, downloadBackup } = useTradingContext();
  const isElite = String(user?.plan || '').toLowerCase() === 'elite';
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBrokerForm, setShowBrokerForm] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [brokerForm, setBrokerForm] = useState(initialBrokerForm);

  const [copierLoaded, setCopierLoaded] = useState(false);
  const [copierState, setCopierState] = useState(() => normalizeTradeCopierState({}));
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [copierAccountForm, setCopierAccountForm] = useState(initialCopierAccountForm);
  const [copierLinkForm, setCopierLinkForm] = useState(initialCopierLinkForm);
  const [dispatchForm, setDispatchForm] = useState(initialDispatchForm);
  const [dispatchResults, setDispatchResults] = useState([]);
  const [dispatchSummary, setDispatchSummary] = useState(null);
  const restoreInputRef = useRef(null);

  const brokerAccounts = accounts;
  const copierAccounts = copierState.accounts || [];
  const copierLinks = copierState.links || [];
  const copierOverview = useMemo(() => buildTradeCopierOverview(copierState), [copierState]);
  const riskRows = useMemo(() => copierAccounts.map((account) => calculateAccountRiskState(account)), [copierAccounts]);
  const masterAccounts = useMemo(() => copierAccounts.filter((account) => account.role === 'master'), [copierAccounts]);
  const followerAccounts = useMemo(() => copierAccounts.filter((account) => account.role === 'follower'), [copierAccounts]);
  const totalSynced = useMemo(() => brokerAccounts.reduce((sum, account) => sum + (account.total_trades_synced || 0), 0), [brokerAccounts]);
  const connectedCount = useMemo(() => brokerAccounts.filter((account) => account.status === 'connected').length, [brokerAccounts]);
  const journalAccounts = useMemo(() => (accountOptions || []).filter((item) => item.id !== 'all'), [accountOptions]);

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) toast.error(error.message);
    else setAccounts(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!user?.id) {
      setCopierState(normalizeTradeCopierState({}));
      setCopierLoaded(false);
      return;
    }
    const loaded = loadTradeCopierState(user.id, brokerAccounts);
    setCopierState(loaded);
    setCopierLoaded(true);
  }, [user?.id]);

  useEffect(() => {
    if (!copierLoaded) return;
    setCopierState((current) => normalizeTradeCopierState(current, brokerAccounts));
  }, [brokerAccounts, copierLoaded]);

  useEffect(() => {
    if (!copierLoaded || !user?.id) return;
    saveTradeCopierState(user.id, copierState);
  }, [copierLoaded, copierState, user?.id]);

  useEffect(() => {
    if (!dispatchForm.masterAccountId && masterAccounts[0]?.id) {
      setDispatchForm((current) => ({ ...current, masterAccountId: masterAccounts[0].id }));
    }
  }, [dispatchForm.masterAccountId, masterAccounts]);

  async function handleAddBroker(event) {
    event.preventDefault();
    if (!brokerForm.account_number.trim()) {
      toast.error('Account number required.');
      return;
    }

    const token = generateToken();
    const { error } = await supabase
      .from('broker_accounts')
      .insert({
        user_id: user.id,
        broker_type: brokerForm.broker_type,
        account_number: brokerForm.account_number.trim(),
        account_name: brokerForm.account_name.trim(),
        server_name: brokerForm.server_name.trim(),
        api_token: token,
        status: 'disconnected',
      });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Broker account created. Copy the token and finish the platform setup.');
    setBrokerForm(initialBrokerForm());
    setShowBrokerForm(false);
    fetchAccounts();
  }

  async function handleDeleteBroker(id) {
    setDeletingId(id);
    const { error } = await supabase.from('broker_accounts').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Broker connection removed.');
    fetchAccounts();
  }

  async function handleSyncBroker(id) {
    setSyncingId(id);
    const account = brokerAccounts.find((item) => item.id === id);
    if (!account) {
      setSyncingId(null);
      return;
    }

    try {
      const response = await fetch('/api/mt-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_token: account.api_token, trades: [] }),
      });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || 'Sync failed.');
        setSyncingId(null);
        return;
      }

      await supabase
        .from('broker_accounts')
        .update({
          status: 'connected',
          last_sync_at: new Date().toISOString(),
        })
        .eq('id', id);

      toast.success(`${payload.inserted || 0} trade(s) synced.`);
      fetchAccounts();
    } catch {
      toast.error('Connection failed. Re-check the platform setup and endpoint permissions.');
    } finally {
      setSyncingId(null);
    }
  }

  function openSetup(broker) {
    setSelectedBroker(broker);
    setSetupOpen(true);
  }

  function openAccountEditor(account = null) {
    if (account) {
      setEditingAccountId(account.id);
      setCopierAccountForm({
        ...initialCopierAccountForm(),
        ...normalizeCopierAccount(account),
        brokerAccountId: account.brokerAccountId || '',
      });
    } else {
      setEditingAccountId(null);
      setCopierAccountForm(initialCopierAccountForm());
    }
    setShowAccountForm(true);
  }

  function openLinkEditor(link = null, masterId = '', followerId = '') {
    if (link) {
      setEditingLinkId(link.id);
      setCopierLinkForm({
        ...initialCopierLinkForm(),
        ...normalizeCopierLink(link),
      });
    } else {
      setEditingLinkId(null);
      setCopierLinkForm(initialCopierLinkForm(masterId, followerId));
    }
    setShowLinkForm(true);
  }

  function saveCopierAccount() {
    const brokerReference = brokerAccounts.find((item) => String(item.id) === String(copierAccountForm.brokerAccountId || ''));
    const nextAccount = editingAccountId
      ? normalizeCopierAccount({ ...copierAccountForm, id: editingAccountId })
      : createCopierAccount(copierAccountForm, brokerReference || null);

    setCopierState((current) => {
      const nextAccounts = editingAccountId
        ? current.accounts.map((account) => (account.id === editingAccountId ? { ...nextAccount, updatedAt: new Date().toISOString() } : account))
        : [nextAccount, ...current.accounts];

      return normalizeTradeCopierState({ ...current, accounts: nextAccounts }, brokerAccounts);
    });

    setShowAccountForm(false);
    setEditingAccountId(null);
    setCopierAccountForm(initialCopierAccountForm());
    toast.success(editingAccountId ? 'Copier account updated.' : 'Copier account created.');
  }

  function deleteCopierAccount(accountId) {
    setCopierState((current) => normalizeTradeCopierState({
      ...current,
      accounts: current.accounts.filter((account) => account.id !== accountId),
      links: current.links.filter((link) => link.masterAccountId !== accountId && link.followerAccountId !== accountId),
    }, brokerAccounts));
    toast.success('Copier account removed.');
  }

  function saveCopierLink() {
    if (!copierLinkForm.masterAccountId || !copierLinkForm.followerAccountId) {
      toast.error('Select both a master and a follower account.');
      return;
    }

    if (copierLinkForm.masterAccountId === copierLinkForm.followerAccountId) {
      toast.error('A link requires two different accounts.');
      return;
    }

    const nextLink = editingLinkId
      ? normalizeCopierLink({ ...copierLinkForm, id: editingLinkId })
      : createCopierLink(copierLinkForm);

    setCopierState((current) => normalizeTradeCopierState({
      ...current,
      links: editingLinkId
        ? current.links.map((link) => (link.id === editingLinkId ? { ...nextLink, updatedAt: new Date().toISOString() } : link))
        : [nextLink, ...current.links],
    }, brokerAccounts));

    setShowLinkForm(false);
    setEditingLinkId(null);
    setCopierLinkForm(initialCopierLinkForm());
    toast.success(editingLinkId ? 'Copy link updated.' : 'Copy link created.');
  }

  function deleteCopierLink(linkId) {
    setCopierState((current) => normalizeTradeCopierState({
      ...current,
      links: current.links.filter((link) => link.id !== linkId),
    }, brokerAccounts));
    toast.success('Copy link removed.');
  }

  function handleDispatchSubmit(event) {
    event.preventDefault();
    const result = simulateTradeCopierDispatch(copierState, dispatchForm);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setCopierState(result.nextState);
    setDispatchResults(result.results);
    setDispatchSummary(result.activityItem);
    toast.success(`Dispatch simulation completed for ${result.results.length} follower account(s).`);
  }

  function handleExportDesk() {
    const snapshot = exportTradeCopierSnapshot(copierState, {
      userId: user?.id || null,
      email: user?.email || null,
      plan: user?.plan || null,
    });
    downloadJson(snapshot, `marketflow-trade-copier-${new Date().toISOString().slice(0, 10)}.json`);
    toast.success('Trade copier backup downloaded.');
  }

  function handleRestoreClick() {
    restoreInputRef.current?.click();
  }

  async function handleRestoreDesk(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const imported = importTradeCopierSnapshot(parsed, brokerAccounts);
      setCopierState(imported);
      toast.success('Trade copier desk restored.');
    } catch {
      toast.error('This backup could not be restored.');
    }
  }

  function handleJournalBackup() {
    downloadBackup({ scope: 'all' });
    toast.success('Journal backup downloaded.');
  }

  const activityFeed = copierState.activity || [];

  return (
    <div style={{ padding: '34px 34px 72px', maxWidth: 1520, margin: '0 auto', display: 'grid', gap: 24 }}>
      <div style={{ ...pageCardStyle({ padding: 28 }) }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(360px, 0.9fr)', gap: 18 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 999, border: `1px solid ${shade(C.cyan, 0.18)}`, background: shade(C.cyan, 0.08), color: C.cyan, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <ICON.Network />
              Broker Sync / Elite Copier
            </div>
            <h1 style={{ margin: '18px 0 0', fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.07em', color: C.t0 }}>
              MarketFlow
              <span style={{ color: C.cyan }}> execution infrastructure</span>
            </h1>
            <p style={{ margin: '18px 0 0', maxWidth: 760, fontSize: 15, lineHeight: 1.8, color: C.t2 }}>
              Connect live broker feeds, structure master and follower accounts, protect each account with risk-aware copy rules, and rehearse a full copier dispatch before it ever touches the market. The sync layer stays available to Pro. The copier desk is unlocked only for Elite.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              {[
                `Broker feeds: ${connectedCount}/${brokerAccounts.length || 0}`,
                `Elite links: ${copierOverview.activeLinks}`,
                `Journal scopes: ${journalAccounts.length}`,
              ].map((item) => (
                <div key={item} style={{ padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.035)', border: `1px solid ${shade(C.t3, 0.18)}`, color: C.t1, fontSize: 12 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <MetricCard label="Connected feeds" value={String(connectedCount)} detail="Accounts already online and eligible to drive sync." tone={C.green} icon={ICON.Plug} />
            <MetricCard label="Trades synced" value={totalSynced.toLocaleString()} detail="Recorded trade rows delivered through broker or API sync." tone={C.cyan} icon={ICON.Network} />
            <MetricCard label="Elite copy links" value={String(copierOverview.activeLinks)} detail="Active master to follower relationships inside the copier desk." tone={C.purple} icon={ICON.Link} />
            <MetricCard label="Protected capital" value={money(copierOverview.capital)} detail="Follower and master capital currently modeled by the risk engine." tone={C.gold} icon={ICON.Shield} />
          </div>
        </div>
      </div>

      <div style={{ ...pageCardStyle({ padding: 24 }) }}>
        <SectionHeader
          eyebrow="Broker Sync"
          title="Connection desk"
          description="Create broker feeds, generate tokens, and prepare each platform for live synchronization. The same connected accounts can then be promoted into the Elite copier structure."
          actions={(
            <>
              <ActionButton tone="subtle" onClick={handleJournalBackup}>
                <ICON.Download />
                Journal backup
              </ActionButton>
              <ActionButton onClick={() => setShowBrokerForm((value) => !value)}>
                <ICON.Plug />
                {showBrokerForm ? 'Close broker form' : 'Connect broker'}
              </ActionButton>
            </>
          )}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 18 }}>
          {[
            {
              label: 'MarketFlow EA',
              value: SYNC_ENDPOINT,
              body: 'MT4/MT5 posts api_token and trades[]. Empty heartbeats update last sync; duplicate tickets are skipped.',
            },
            {
              label: 'Compatibility path',
              value: MT_PATH_ENDPOINT,
              body: 'Same payload, kept for EA builds that prefer /api/mt/sync.',
            },
            {
              label: 'Universal webhook',
              value: `${WEBHOOK_ENDPOINT}?token=YOUR_TOKEN`,
              body: 'For cBots, bridges, prop dashboards, and custom platforms that can POST structured fills.',
            },
          ].map((item) => (
            <div key={item.label} style={{ padding: 14, borderRadius: 18, border: `1px solid ${shade(C.t3, 0.13)}`, background: 'rgba(255,255,255,0.026)', minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3, marginBottom: 7 }}>{item.label}</div>
              <button
                type="button"
                onClick={() => copyText(item.value, `${item.label} copied.`)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: `1px solid ${shade(C.cyan, 0.12)}`,
                  background: 'rgba(3,7,13,0.58)',
                  color: C.t1,
                  borderRadius: 12,
                  padding: '9px 10px',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'copy',
                }}
              >
                {item.value}
              </button>
              <div style={{ marginTop: 9, fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>{item.body}</div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {showBrokerForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.16 }} style={{ ...pageCardStyle({ padding: 18, marginBottom: 20, borderRadius: 18, background: 'linear-gradient(180deg, rgba(9,15,24,0.95), rgba(7,12,18,0.96))' }) }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t0, marginBottom: 14 }}>New broker connection</div>
              <form onSubmit={handleAddBroker} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <Field label="Platform">
                  <select value={brokerForm.broker_type} onChange={(event) => setBrokerForm((current) => ({ ...current, broker_type: event.target.value }))} style={inputStyle()}>
                    {BROKERS.map((broker) => <option key={broker.id} value={broker.id}>{broker.name}</option>)}
                  </select>
                </Field>
                <Field label="Account number">
                  <input value={brokerForm.account_number} onChange={(event) => setBrokerForm((current) => ({ ...current, account_number: event.target.value }))} placeholder="50123456" style={inputStyle()} />
                </Field>
                <Field label="Account label">
                  <input value={brokerForm.account_name} onChange={(event) => setBrokerForm((current) => ({ ...current, account_name: event.target.value }))} placeholder="FTMO Master" style={inputStyle()} />
                </Field>
                <Field label="Server">
                  <input value={brokerForm.server_name} onChange={(event) => setBrokerForm((current) => ({ ...current, server_name: event.target.value }))} placeholder="Broker-Live01" style={inputStyle()} />
                </Field>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                  <ActionButton type="submit">
                    <ICON.Spark />
                    Generate token
                  </ActionButton>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(320px, 0.85fr)', gap: 18 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            {loading ? (
              <div style={{ ...pageCardStyle({ padding: 28, borderRadius: 18, color: C.t2 }) }}>Loading broker connections…</div>
            ) : brokerAccounts.length === 0 ? (
              <div style={{ ...pageCardStyle({ padding: 30, borderRadius: 18 }) }}>
                <div style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', color: C.cyan, background: shade(C.cyan, 0.12), border: `1px solid ${shade(C.cyan, 0.18)}` }}>
                    <ICON.Plug />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.t0 }}>No broker connection yet</div>
                  <div style={{ maxWidth: 520, fontSize: 13.5, lineHeight: 1.7, color: C.t2 }}>
                    Add the first feed to begin syncing live accounts. Every connection generates its own API token and can later become a master or follower account in the Elite copier desk.
                  </div>
                </div>
              </div>
            ) : brokerAccounts.map((account) => {
              const broker = BROKERS.find((item) => item.id === account.broker_type) || BROKERS[0];
              const tone = statusTone(account.status);

              return (
                <motion.div key={account.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} style={{ ...pageCardStyle({ padding: 20, borderRadius: 18, border: `1px solid ${tone.border}` }) }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 18 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', color: broker.color, background: shade(broker.color, 0.12), border: `1px solid ${shade(broker.color, 0.18)}`, fontSize: 12, fontWeight: 800 }}>
                          {broker.short}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>{account.account_name || account.account_number}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: C.t2 }}>{broker.name} · {account.server_name || 'Default server'}</div>
                        </div>
                        <div style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                          {account.status || 'Disconnected'}
                        </div>
                      </div>

                      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center' }}>
                        <code style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '11px 12px', borderRadius: 12, background: 'rgba(5,9,16,0.88)', border: `1px solid ${shade(C.t3, 0.16)}`, color: broker.color, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12.5 }}>
                          {maskToken(account.api_token)}
                        </code>
                        <ActionButton tone="subtle" onClick={() => { copyText(account.api_token, 'Token copied.'); setCopiedToken(account.api_token); setTimeout(() => setCopiedToken(null), 1600); }} style={{ minWidth: 108, justifyContent: 'center' }}>
                          <ICON.Copy />
                          {copiedToken === account.api_token ? 'Copied' : 'Copy'}
                        </ActionButton>
                      </div>

                      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                        <MetaItem label="Last sync" value={timeAgo(account.last_sync_at)} />
                        <MetaItem label="Trades" value={String(account.total_trades_synced || 0)} />
                        <MetaItem label="Created" value={new Date(account.created_at).toLocaleDateString('en-GB')} />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.55, color: C.t3 }}>
                        Passwords are never collected here. Broker bridges use scoped API tokens, each tied to one MarketFlow account feed.
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                      {(account.broker_type === 'mt4' || account.broker_type === 'mt5') ? (
                        <ActionButton tone="subtle" onClick={() => handleSyncBroker(account.id)} disabled={syncingId === account.id} style={{ minWidth: 130, justifyContent: 'center' }}>
                          <ICON.Network />
                          {syncingId === account.id ? 'Syncing…' : 'Sync now'}
                        </ActionButton>
                      ) : null}
                      <ActionButton tone="subtle" onClick={() => openSetup(broker)} style={{ minWidth: 130, justifyContent: 'center' }}>
                        <ICON.Spark />
                        Setup guide
                      </ActionButton>
                      <ActionButton tone="danger" onClick={() => handleDeleteBroker(account.id)} disabled={deletingId === account.id} style={{ minWidth: 130, justifyContent: 'center' }}>
                        <ICON.Trash />
                        {deletingId === account.id ? 'Removing…' : 'Remove'}
                      </ActionButton>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>Supported platforms</div>
              <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {BROKERS.map((broker) => (
                  <button key={broker.id} onClick={() => openSetup(broker)} style={{ textAlign: 'left', width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${shade(C.t3, 0.14)}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>{broker.name}</div>
                        <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.55, color: C.t2 }}>{broker.desc}</div>
                      </div>
                      <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: shade(broker.color, 0.12), border: `1px solid ${shade(broker.color, 0.18)}`, color: broker.color, fontSize: 11, fontWeight: 800 }}>
                        {broker.short}
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {broker.features.map((feature) => (
                        <div key={feature} style={{ padding: '4px 8px', borderRadius: 999, background: shade(broker.color, 0.1), border: `1px solid ${shade(broker.color, 0.16)}`, color: broker.color, fontSize: 10.5, fontWeight: 600 }}>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>Journal scope alignment</div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.65, color: C.t2 }}>
                Every broker or copier account can be matched against the journal scopes already present in MarketFlow, so performance review and execution infrastructure stay aligned.
              </div>
              <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
                {journalAccounts.length ? journalAccounts.slice(0, 5).map((scope) => (
                  <div key={scope.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: C.t1 }}>{scope.label}</div>
                      <div style={{ marginTop: 4, fontSize: 11, color: C.t3 }}>{scope.count || 0} trade(s)</div>
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: (scope.pnl || 0) >= 0 ? C.green : C.danger }}>
                      {money(scope.pnl || 0)}
                    </div>
                  </div>
                )) : (
                  <div style={{ padding: '14px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${shade(C.t3, 0.12)}`, fontSize: 12.5, color: C.t2 }}>
                    Imported journal accounts will appear here once trades are segmented by account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...pageCardStyle({ padding: 24, border: `1px solid ${shade(isElite ? C.gold : C.t3, isElite ? 0.16 : 0.12)}` }) }}>
        <SectionHeader
          eyebrow="Elite Only"
          title="Trade copier desk"
          description="Master accounts, follower accounts, per-account risk budgets, step-down sizing, prop protection, symbol remapping, dispatch simulation, and backup/restore are managed here."
          actions={isElite ? (
            <>
              <input ref={restoreInputRef} type="file" accept="application/json" onChange={handleRestoreDesk} style={{ display: 'none' }} />
              <ActionButton tone="subtle" onClick={handleExportDesk}>
                <ICON.Download />
                Export desk
              </ActionButton>
              <ActionButton tone="subtle" onClick={handleRestoreClick}>
                <ICON.Upload />
                Restore desk
              </ActionButton>
              <ActionButton tone="subtle" onClick={() => openLinkEditor()}>
                <ICON.Link />
                New link
              </ActionButton>
              <ActionButton onClick={() => openAccountEditor()}>
                <ICON.Account />
                New copier account
              </ActionButton>
            </>
          ) : null}
        />

        {!isElite ? (
          <div style={{ ...pageCardStyle({ padding: 24, borderRadius: 18, border: `1px solid ${shade(C.gold, 0.16)}` }) }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(260px, 0.9fr)', gap: 18 }}>
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', color: C.gold, background: shade(C.gold, 0.12), border: `1px solid ${shade(C.gold, 0.2)}` }}>
                  <ICON.Lock />
                </div>
                <div style={{ marginTop: 16, fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: C.t0 }}>Elite unlocks the complete copier infrastructure</div>
                <div style={{ marginTop: 12, maxWidth: 680, fontSize: 13.5, lineHeight: 1.75, color: C.t2 }}>
                  Broker sync remains available, but the master and follower architecture, risk-aware order sizing, copy network, dispatch simulator, and copier backups are reserved for Elite accounts.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {TRADE_COPIER_FEATURES.map((feature) => (
                  <div key={feature.id} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{feature.label}</div>
                    <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.6, color: C.t2 }}>{feature.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {showAccountForm && (
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.16 }} style={{ ...pageCardStyle({ padding: 18, marginBottom: 18, borderRadius: 18 }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{editingAccountId ? 'Edit copier account' : 'New copier account'}</div>
                    <ActionButton tone="subtle" onClick={() => { setShowAccountForm(false); setEditingAccountId(null); }}>
                      Close
                    </ActionButton>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                    <Field label="Label"><input value={copierAccountForm.label} onChange={(event) => setCopierAccountForm((current) => ({ ...current, label: event.target.value }))} placeholder="London master" style={inputStyle()} /></Field>
                    <Field label="Role">
                      <select value={copierAccountForm.role} onChange={(event) => setCopierAccountForm((current) => ({ ...current, role: event.target.value }))} style={inputStyle()}>
                        {ACCOUNT_ROLE_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Platform">
                      <select value={copierAccountForm.platform} onChange={(event) => setCopierAccountForm((current) => ({ ...current, platform: event.target.value }))} style={inputStyle()}>
                        {PLATFORM_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </Field>
                    <Field label="Venue">
                      <select value={copierAccountForm.venue} onChange={(event) => setCopierAccountForm((current) => ({ ...current, venue: event.target.value }))} style={inputStyle()}>
                        {VENUE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </Field>

                    <Field label="Balance"><input type="number" value={copierAccountForm.balance} onChange={(event) => setCopierAccountForm((current) => ({ ...current, balance: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Equity"><input type="number" value={copierAccountForm.equity} onChange={(event) => setCopierAccountForm((current) => ({ ...current, equity: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Risk / trade"><input type="number" step="0.1" value={copierAccountForm.riskPerTrade} onChange={(event) => setCopierAccountForm((current) => ({ ...current, riskPerTrade: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Max open risk"><input type="number" step="0.1" value={copierAccountForm.maxOpenRisk} onChange={(event) => setCopierAccountForm((current) => ({ ...current, maxOpenRisk: Number(event.target.value) }))} style={inputStyle()} /></Field>

                    <Field label="Daily loss limit"><input type="number" step="0.1" value={copierAccountForm.maxDailyLoss} onChange={(event) => setCopierAccountForm((current) => ({ ...current, maxDailyLoss: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Current day loss"><input type="number" step="0.1" value={copierAccountForm.currentDailyLoss} onChange={(event) => setCopierAccountForm((current) => ({ ...current, currentDailyLoss: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Max drawdown"><input type="number" step="0.1" value={copierAccountForm.maxDrawdown} onChange={(event) => setCopierAccountForm((current) => ({ ...current, maxDrawdown: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Current drawdown"><input type="number" step="0.1" value={copierAccountForm.currentDrawdown} onChange={(event) => setCopierAccountForm((current) => ({ ...current, currentDrawdown: Number(event.target.value) }))} style={inputStyle()} /></Field>

                    <Field label="Max lot"><input type="number" step="0.1" value={copierAccountForm.maxLot} onChange={(event) => setCopierAccountForm((current) => ({ ...current, maxLot: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Status">
                      <select value={copierAccountForm.status} onChange={(event) => setCopierAccountForm((current) => ({ ...current, status: event.target.value }))} style={inputStyle()}>
                        <option value="connected">Connected</option>
                        <option value="warning">Warning</option>
                        <option value="offline">Offline</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </Field>
                    <Field label="Broker feed">
                      <select value={copierAccountForm.brokerAccountId} onChange={(event) => setCopierAccountForm((current) => ({ ...current, brokerAccountId: event.target.value }))} style={inputStyle()}>
                        <option value="">Manual / not linked</option>
                        {brokerAccounts.map((item) => <option key={item.id} value={item.id}>{item.account_name || item.account_number}</option>)}
                      </select>
                    </Field>
                    <Field label="Symbol suffix"><input value={copierAccountForm.symbolSuffix} onChange={(event) => setCopierAccountForm((current) => ({ ...current, symbolSuffix: event.target.value }))} placeholder=".m" style={inputStyle()} /></Field>

                    <Field label="Prop firm"><input value={copierAccountForm.propFirm} onChange={(event) => setCopierAccountForm((current) => ({ ...current, propFirm: event.target.value }))} placeholder="FTMO" style={inputStyle()} /></Field>
                    <Field label="Phase"><input value={copierAccountForm.phase} onChange={(event) => setCopierAccountForm((current) => ({ ...current, phase: event.target.value }))} placeholder="Challenge" style={inputStyle()} /></Field>
                    <Field label="Latency ms"><input type="number" value={copierAccountForm.latencyMs} onChange={(event) => setCopierAccountForm((current) => ({ ...current, latencyMs: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Heartbeat s"><input type="number" value={copierAccountForm.heartbeatSeconds} onChange={(event) => setCopierAccountForm((current) => ({ ...current, heartbeatSeconds: Number(event.target.value) }))} style={inputStyle()} /></Field>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Notes"><textarea value={copierAccountForm.notes} onChange={(event) => setCopierAccountForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} /></Field>
                    </div>
                  </div>
                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <ActionButton tone="subtle" onClick={() => { setShowAccountForm(false); setEditingAccountId(null); }}>Cancel</ActionButton>
                    <ActionButton onClick={saveCopierAccount}>
                      <ICON.Account />
                      {editingAccountId ? 'Update account' : 'Save account'}
                    </ActionButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showLinkForm && (
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.16 }} style={{ ...pageCardStyle({ padding: 18, marginBottom: 18, borderRadius: 18 }) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{editingLinkId ? 'Edit copy link' : 'New copy link'}</div>
                    <ActionButton tone="subtle" onClick={() => { setShowLinkForm(false); setEditingLinkId(null); }}>Close</ActionButton>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                    <Field label="Label"><input value={copierLinkForm.label} onChange={(event) => setCopierLinkForm((current) => ({ ...current, label: event.target.value }))} placeholder="London desk to prop stack" style={inputStyle()} /></Field>
                    <Field label="Master">
                      <select value={copierLinkForm.masterAccountId} onChange={(event) => setCopierLinkForm((current) => ({ ...current, masterAccountId: event.target.value }))} style={inputStyle()}>
                        <option value="">Select master</option>
                        {masterAccounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Follower">
                      <select value={copierLinkForm.followerAccountId} onChange={(event) => setCopierLinkForm((current) => ({ ...current, followerAccountId: event.target.value }))} style={inputStyle()}>
                        <option value="">Select follower</option>
                        {followerAccounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Status">
                      <select value={copierLinkForm.status} onChange={(event) => setCopierLinkForm((current) => ({ ...current, status: event.target.value }))} style={inputStyle()}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                      </select>
                    </Field>

                    <Field label="Sizing mode">
                      <select value={copierLinkForm.sizingMode} onChange={(event) => setCopierLinkForm((current) => ({ ...current, sizingMode: event.target.value }))} style={inputStyle()}>
                        {COPY_SIZING_MODES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Multiplier"><input type="number" step="0.1" value={copierLinkForm.multiplier} onChange={(event) => setCopierLinkForm((current) => ({ ...current, multiplier: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Fixed size"><input type="number" step="0.1" value={copierLinkForm.fixedLot} onChange={(event) => setCopierLinkForm((current) => ({ ...current, fixedLot: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Risk %"><input type="number" step="0.1" value={copierLinkForm.riskPercent} onChange={(event) => setCopierLinkForm((current) => ({ ...current, riskPercent: Number(event.target.value) }))} style={inputStyle()} /></Field>

                    <Field label="Max size"><input type="number" step="0.1" value={copierLinkForm.maxLot} onChange={(event) => setCopierLinkForm((current) => ({ ...current, maxLot: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Latency guard ms"><input type="number" value={copierLinkForm.latencyGuardMs} onChange={(event) => setCopierLinkForm((current) => ({ ...current, latencyGuardMs: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Allowed sessions" hint="Multi-select">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {SESSION_OPTIONS.map((option) => {
                          const active = copierLinkForm.sessionFilter.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setCopierLinkForm((current) => ({
                                ...current,
                                sessionFilter: active
                                  ? current.sessionFilter.filter((item) => item !== option.id)
                                  : [...current.sessionFilter, option.id],
                              }))}
                              style={{
                                padding: '8px 10px',
                                borderRadius: 11,
                                border: `1px solid ${active ? shade(C.cyan, 0.2) : shade(C.t3, 0.16)}`,
                                background: active ? shade(C.cyan, 0.12) : 'rgba(255,255,255,0.03)',
                                color: active ? C.cyan : C.t2,
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                    <Field label="Safety switches">
                      <div style={{ display: 'grid', gap: 8 }}>
                        <ToggleRow label="Reverse side" checked={copierLinkForm.reverseSide} onChange={(checked) => setCopierLinkForm((current) => ({ ...current, reverseSide: checked }))} />
                        <ToggleRow label="Prop Shield" checked={copierLinkForm.propShield} onChange={(checked) => setCopierLinkForm((current) => ({ ...current, propShield: checked }))} />
                        <ToggleRow label="Step-down sizing" checked={copierLinkForm.stepDown} onChange={(checked) => setCopierLinkForm((current) => ({ ...current, stepDown: checked }))} />
                      </div>
                    </Field>

                    <div style={{ gridColumn: 'span 2' }}>
                      <Field label="Allowed symbols" hint="Comma separated">
                        <input value={copierLinkForm.symbolAllowlist} onChange={(event) => setCopierLinkForm((current) => ({ ...current, symbolAllowlist: event.target.value }))} placeholder="EURUSD, XAUUSD, NAS100" style={inputStyle()} />
                      </Field>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <Field label="Symbol remap" hint="One mapping per line">
                        <textarea value={copierLinkForm.symbolRemap} onChange={(event) => setCopierLinkForm((current) => ({ ...current, symbolRemap: event.target.value }))} rows={3} placeholder={`US30=US30.cash\nGER40=DE40`} style={{ ...inputStyle(), resize: 'vertical' }} />
                      </Field>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <Field label="Notes">
                        <textarea value={copierLinkForm.notes} onChange={(event) => setCopierLinkForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} />
                      </Field>
                    </div>
                  </div>
                  <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <ActionButton tone="subtle" onClick={() => { setShowLinkForm(false); setEditingLinkId(null); }}>Cancel</ActionButton>
                    <ActionButton onClick={saveCopierLink}>
                      <ICON.Link />
                      {editingLinkId ? 'Update link' : 'Save link'}
                    </ActionButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
              <MetricCard label="Master accounts" value={String(copierOverview.masters)} detail="Accounts authorised to originate copy flow." tone={C.cyan} icon={ICON.Account} />
              <MetricCard label="Followers ready" value={String(copierOverview.readyFollowers)} detail="Follower accounts currently clear to receive copied orders." tone={C.green} icon={ICON.Shield} />
              <MetricCard label="Protected accounts" value={String(copierOverview.protectedAccounts)} detail="Accounts tagged as prop or operating with hard loss constraints." tone={C.gold} icon={ICON.Risk} />
              <MetricCard label="Blocked followers" value={String(copierOverview.blockedFollowers)} detail="Accounts stopped by connection or risk protection logic." tone={C.danger} icon={ICON.Lock} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 0.9fr)', gap: 18, alignItems: 'start' }}>
              <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Copier accounts</div>
                    <div style={{ marginTop: 5, fontSize: 12.5, color: C.t2 }}>Structure masters, followers, and standalone feeds with exact account-level constraints.</div>
                  </div>
                  <ActionButton tone="subtle" onClick={() => openAccountEditor()}>
                    <ICON.Account />
                    Add account
                  </ActionButton>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {copierAccounts.length ? copierAccounts.map((account) => {
                    const risk = calculateAccountRiskState(account);
                    const tone = statusTone(risk.state);

                    return (
                      <div key={account.id} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.028)', border: `1px solid ${tone.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{account.label}</div>
                              <Pill tone={risk.state}>{roleLabel(account.role)}</Pill>
                              <Pill tone={account.status}>{account.status}</Pill>
                              {account.propFirm ? <Pill tone="watch">{account.propFirm}</Pill> : null}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 12, color: C.t2 }}>
                              {account.platform} · {account.venue} · {money(account.equity || account.balance)} equity
                            </div>

                            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                              <RiskStat label="Per-trade" value={moneyExact(risk.perTradeBudgetCash)} tone={C.cyan} />
                              <RiskStat label="Daily left" value={moneyExact(risk.dailyLossRemainingCash)} tone={C.green} />
                              <RiskStat label="DD left" value={moneyExact(risk.drawdownRemainingCash)} tone={C.gold} />
                              <RiskStat label="Open risk" value={moneyExact(risk.openRiskBudgetCash)} tone={C.purple} />
                            </div>

                            {risk.reasons.length ? (
                              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {risk.reasons.slice(0, 2).map((reason) => (
                                  <div key={reason} style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 11 }}>
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                            <ActionButton tone="subtle" onClick={() => openAccountEditor(account)} style={{ justifyContent: 'center' }}>
                              <ICON.Edit />
                              Edit
                            </ActionButton>
                            {account.role === 'master' ? (
                              <ActionButton tone="subtle" onClick={() => openLinkEditor(null, account.id)} style={{ justifyContent: 'center' }}>
                                <ICON.Link />
                                Add follower
                              </ActionButton>
                            ) : null}
                            <ActionButton tone="danger" onClick={() => deleteCopierAccount(account.id)} style={{ justifyContent: 'center' }}>
                              <ICON.Trash />
                              Remove
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <EmptyPanel title="No copier accounts yet" description="Create at least one master account and one follower account to activate the Elite copier desk." icon={ICON.Account} />
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Risk board</div>
                  <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.65, color: C.t2 }}>
                    Each follower is evaluated with its own per-trade budget, daily loss buffer, drawdown buffer, and connection health before any copied order is approved.
                  </div>
                  <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                    {riskRows.filter((row) => row.role !== 'standalone').length ? riskRows.filter((row) => row.role !== 'standalone').map((row) => {
                      const tone = statusTone(row.state);
                      return (
                        <div key={row.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${tone.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{row.label}</div>
                              <div style={{ marginTop: 4, fontSize: 11.5, color: C.t3 }}>{row.platform} · {roleLabel(row.role)}</div>
                            </div>
                            <Pill tone={row.state}>{row.state}</Pill>
                          </div>
                          <div style={{ marginTop: 12, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, row.pressure * 100)}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(C.green, 0.9)}, ${row.pressure > 0.6 ? shade(C.warn, 0.95) : shade(C.cyan, 0.95)}, ${row.pressure > 0.8 ? shade(C.danger, 0.95) : shade(C.cyan, 0.95)})` }} />
                          </div>
                          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                            <SmallReadout label="Daily left" value={moneyExact(row.dailyLossRemainingCash)} />
                            <SmallReadout label="DD left" value={moneyExact(row.drawdownRemainingCash)} />
                            <SmallReadout label="Per-trade" value={moneyExact(row.perTradeBudgetCash)} />
                            <SmallReadout label="Open risk" value={moneyExact(row.openRiskBudgetCash)} />
                          </div>
                        </div>
                      );
                    }) : (
                      <EmptyPanel title="Risk board is empty" description="Follower accounts will appear here once they are created inside the Elite copier desk." icon={ICON.Risk} compact />
                    )}
                  </div>
                </div>

                <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Elite differentiators</div>
                  <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                    {TRADE_COPIER_FEATURES.map((feature) => (
                      <div key={feature.id} style={{ padding: 13, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{feature.label}</div>
                        <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.6, color: C.t2 }}>{feature.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)', gap: 18, alignItems: 'start', marginTop: 18 }}>
              <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Copy network</div>
                    <div style={{ marginTop: 5, fontSize: 12.5, color: C.t2 }}>Connect every master to the right follower accounts with platform-safe sizing rules.</div>
                  </div>
                  <ActionButton tone="subtle" onClick={() => openLinkEditor()}>
                    <ICON.Link />
                    New link
                  </ActionButton>
                </div>

                <div style={{ display: 'grid', gap: 12 }}>
                  {copierLinks.length ? copierLinks.map((link) => {
                    const master = copierAccounts.find((item) => item.id === link.masterAccountId);
                    const follower = copierAccounts.find((item) => item.id === link.followerAccountId);
                    const tone = statusTone(link.status);

                    return (
                      <div key={link.id} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.028)', border: `1px solid ${tone.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{link.label || `${master?.label || 'Master'} → ${follower?.label || 'Follower'}`}</div>
                              <Pill tone={link.status}>{link.status}</Pill>
                              {link.propShield ? <Pill tone="ready">Prop Shield</Pill> : null}
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', color: C.t2, fontSize: 12.5 }}>
                              <span>{master?.label || 'Unknown master'}</span>
                              <ICON.ArrowUpRight />
                              <span>{follower?.label || 'Unknown follower'}</span>
                            </div>
                            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                              <RiskStat label="Mode" value={sizingModeLabel(link.sizingMode)} tone={C.cyan} subtle />
                              <RiskStat label="Multiplier" value={`${Number(link.multiplier || 0).toFixed(2)}x`} tone={C.green} subtle />
                              <RiskStat label="Max size" value={`${Number(link.maxLot || 0).toFixed(2)}`} tone={C.gold} subtle />
                              <RiskStat label="Latency guard" value={`${link.latencyGuardMs || 0} ms`} tone={C.purple} subtle />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                            <ActionButton tone="subtle" onClick={() => openLinkEditor(link)} style={{ justifyContent: 'center' }}>
                              <ICON.Edit />
                              Edit
                            </ActionButton>
                            <ActionButton tone="danger" onClick={() => deleteCopierLink(link.id)} style={{ justifyContent: 'center' }}>
                              <ICON.Trash />
                              Remove
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <EmptyPanel title="No copy link yet" description="Create the first master to follower relationship to activate the copier engine." icon={ICON.Link} />
                  )}
                </div>
              </div>

              <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Dispatch simulator</div>
                <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.65, color: C.t2 }}>
                  Test a live trade idea before dispatch. MarketFlow computes each follower size, applies Prop Shield and step-down logic, then shows exactly which accounts are ready, watching, or blocked.
                </div>

                <form onSubmit={handleDispatchSubmit} style={{ marginTop: 14, display: 'grid', gap: 12 }}>
                  <Field label="Master">
                    <select value={dispatchForm.masterAccountId} onChange={(event) => setDispatchForm((current) => ({ ...current, masterAccountId: event.target.value }))} style={inputStyle()}>
                      <option value="">Select master</option>
                      {masterAccounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <Field label="Symbol"><input value={dispatchForm.symbol} onChange={(event) => setDispatchForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))} style={inputStyle()} /></Field>
                    <Field label="Side">
                      <select value={dispatchForm.side} onChange={(event) => setDispatchForm((current) => ({ ...current, side: event.target.value }))} style={inputStyle()}>
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                      </select>
                    </Field>
                    <Field label="Entry"><input type="number" step="0.0001" value={dispatchForm.entry} onChange={(event) => setDispatchForm((current) => ({ ...current, entry: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Stop"><input type="number" step="0.0001" value={dispatchForm.stop} onChange={(event) => setDispatchForm((current) => ({ ...current, stop: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Target"><input type="number" step="0.0001" value={dispatchForm.target} onChange={(event) => setDispatchForm((current) => ({ ...current, target: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Session">
                      <select value={dispatchForm.session} onChange={(event) => setDispatchForm((current) => ({ ...current, session: event.target.value }))} style={inputStyle()}>
                        {SESSION_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Master size"><input type="number" step="0.1" value={dispatchForm.masterSize} onChange={(event) => setDispatchForm((current) => ({ ...current, masterSize: Number(event.target.value) }))} style={inputStyle()} /></Field>
                    <Field label="Master risk"><input type="number" step="1" value={dispatchForm.masterRiskCash} onChange={(event) => setDispatchForm((current) => ({ ...current, masterRiskCash: Number(event.target.value) }))} style={inputStyle()} /></Field>
                  </div>

                  <Field label="Notes"><textarea value={dispatchForm.notes} onChange={(event) => setDispatchForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} /></Field>

                  <ActionButton type="submit" style={{ justifyContent: 'center' }}>
                    <ICON.Network />
                    Simulate dispatch
                  </ActionButton>
                </form>

                {dispatchSummary ? (
                  <div style={{ marginTop: 14, padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{dispatchSummary.symbol} · {dispatchSummary.side.toUpperCase()}</div>
                        <div style={{ marginTop: 4, fontSize: 11.5, color: C.t3 }}>{dispatchSummary.masterLabel} · {dispatchSummary.session} session</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.t2, fontSize: 11.5 }}>
                        <ICON.Clock />
                        {new Date(dispatchSummary.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.08fr) minmax(340px, 0.92fr)', gap: 18, alignItems: 'start', marginTop: 18 }}>
              <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Dispatch matrix</div>
                <div style={{ marginTop: 6, fontSize: 12.5, color: C.t2 }}>Live copy sizing, utilization, and execution status for the last dispatch test.</div>
                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                  {dispatchResults.length ? dispatchResults.map((row) => {
                    const tone = statusTone(row.state);
                    return (
                      <div key={row.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${tone.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{row.followerLabel}</div>
                              <Pill tone={row.state}>{row.state}</Pill>
                              <Pill tone="subtle">{row.symbol}</Pill>
                            </div>
                            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                              <RiskStat label="Side" value={row.side.toUpperCase()} tone={C.cyan} subtle />
                              <RiskStat label="Size" value={String(row.recommendedSize)} tone={C.green} subtle />
                              <RiskStat label="Risk" value={moneyExact(row.estimatedRiskCash)} tone={C.gold} subtle />
                              <RiskStat label="Use" value={percentage(row.utilization, 1)} tone={row.utilization > 85 ? C.danger : C.purple} subtle />
                            </div>
                            {row.reasons?.length ? (
                              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {row.reasons.slice(0, 3).map((reason) => (
                                  <div key={reason} style={{ padding: '6px 10px', borderRadius: 999, background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: 11 }}>
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div style={{ fontSize: 12, color: C.t2, minWidth: 110, textAlign: 'right' }}>
                            <div>Mode: {sizingModeLabel(row.sizingMode)}</div>
                            <div style={{ marginTop: 6 }}>Step-down: {row.stepDownApplied}x</div>
                            <div style={{ marginTop: 6 }}>Capacity: {moneyExact(row.capacityCash)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <EmptyPanel title="No dispatch simulation yet" description="Run a copier simulation to see follower sizing, risk budget usage, and protective blocks in one matrix." icon={ICON.Network} />
                  )}
                </div>
              </div>

              <div style={{ ...pageCardStyle({ padding: 18, borderRadius: 18 }) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>Activity log</div>
                    <div style={{ marginTop: 6, fontSize: 12.5, color: C.t2 }}>Every simulated dispatch is archived here for replay and review.</div>
                  </div>
                  <div style={{ padding: '6px 10px', borderRadius: 999, background: shade(C.t3, 0.08), border: `1px solid ${shade(C.t3, 0.14)}`, color: C.t2, fontSize: 11.5 }}>
                    {activityFeed.length} item(s)
                  </div>
                </div>
                <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                  {activityFeed.length ? activityFeed.map((item) => (
                    <div key={item.id} style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{item.symbol} · {item.side.toUpperCase()} · {item.masterLabel}</div>
                          <div style={{ marginTop: 4, fontSize: 11.5, color: C.t3 }}>{new Date(item.timestamp).toLocaleString('fr-FR')}</div>
                        </div>
                        <div style={{ padding: '6px 10px', borderRadius: 999, background: shade(C.cyan, 0.08), border: `1px solid ${shade(C.cyan, 0.14)}`, color: C.cyan, fontSize: 11 }}>
                          {item.results.length} follower(s)
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {item.results.slice(0, 3).map((result) => {
                          const tone = statusTone(result.state);
                          return (
                            <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, background: tone.bg, border: `1px solid ${tone.border}` }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: tone.color }}>{result.followerLabel}</div>
                                <div style={{ marginTop: 4, fontSize: 11, color: C.t2 }}>{result.symbol} · {result.side.toUpperCase()}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: tone.color }}>{result.recommendedSize}</div>
                                <div style={{ marginTop: 4, fontSize: 11, color: C.t2 }}>{moneyExact(result.estimatedRiskCash)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )) : (
                    <EmptyPanel title="No activity recorded yet" description="Dispatch simulations will appear here with the full set of follower decisions." icon={ICON.Clock} compact />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {setupOpen && selectedBroker ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(2,4,8,0.82)', backdropFilter: 'blur(14px)', zIndex: 1200, display: 'grid', placeItems: 'center', padding: 24 }} onClick={() => setSetupOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }} transition={{ duration: 0.18 }} onClick={(event) => event.stopPropagation()} style={{ width: 'min(620px, 100%)', ...pageCardStyle({ padding: 24, borderRadius: 24, border: `1px solid ${shade(selectedBroker.color, 0.18)}` }) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 10px', borderRadius: 999, background: shade(selectedBroker.color, 0.12), border: `1px solid ${shade(selectedBroker.color, 0.18)}`, color: selectedBroker.color, fontSize: 11, fontWeight: 700 }}>
                    {selectedBroker.short}
                  </div>
                  <div style={{ marginTop: 12, fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: C.t0 }}>{selectedBroker.name} setup</div>
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: C.t2 }}>{selectedBroker.desc}</div>
                </div>
                <ActionButton tone="subtle" onClick={() => setSetupOpen(false)}>Close</ActionButton>
              </div>
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {selectedBroker.setup.map((step, index) => (
                  <div key={step} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr)', gap: 12, alignItems: 'start', padding: '12px 0', borderTop: index === 0 ? 'none' : `1px solid ${shade(C.t3, 0.12)}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center', background: shade(selectedBroker.color, 0.14), border: `1px solid ${shade(selectedBroker.color, 0.2)}`, color: selectedBroker.color, fontSize: 11, fontWeight: 800 }}>
                      {index + 1}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.75, color: C.t1 }}>{step}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ fontSize: 12, color: C.t1 }}>{value}</div>
    </div>
  );
}

function Pill({ tone, children }) {
  const palette = statusTone(tone);
  return (
    <div style={{ padding: '5px 9px', borderRadius: 999, background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

function RiskStat({ label, value, tone, subtle = false }) {
  return (
    <div style={{ padding: '10px 11px', borderRadius: 12, background: subtle ? 'rgba(255,255,255,0.025)' : shade(tone, 0.08), border: `1px solid ${subtle ? shade(C.t3, 0.12) : shade(tone, 0.16)}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 700, color: subtle ? C.t1 : tone }}>{value}</div>
    </div>
  );
}

function SmallReadout({ label, value }) {
  return (
    <div style={{ padding: '9px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
      <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ marginTop: 5, fontSize: 12, fontWeight: 700, color: C.t1 }}>{value}</div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: `1px solid ${shade(C.t3, 0.14)}`, background: 'rgba(255,255,255,0.03)', color: C.t1, cursor: 'pointer', fontFamily: 'inherit' }}>
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <span style={{ width: 40, height: 22, borderRadius: 999, background: checked ? shade(C.cyan, 0.22) : 'rgba(255,255,255,0.06)', border: `1px solid ${checked ? shade(C.cyan, 0.24) : shade(C.t3, 0.14)}`, position: 'relative', transition: 'all 0.16s ease' }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 20 : 2, width: 16, height: 16, borderRadius: '50%', background: checked ? C.cyan : C.t2, boxShadow: checked ? `0 0 12px ${shade(C.cyan, 0.25)}` : 'none', transition: 'all 0.16s ease' }} />
      </span>
    </button>
  );
}

function EmptyPanel({ title, description, icon: Icon, compact = false }) {
  return (
    <div style={{ padding: compact ? 18 : 24, borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: `1px dashed ${shade(C.t3, 0.18)}`, display: 'grid', gap: 10, justifyItems: 'start' }}>
      <div style={{ width: 40, height: 40, borderRadius: 14, display: 'grid', placeItems: 'center', background: shade(C.cyan, 0.1), border: `1px solid ${shade(C.cyan, 0.16)}`, color: C.cyan }}>
        <Icon />
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>{title}</div>
      <div style={{ maxWidth: 560, fontSize: 13, lineHeight: 1.7, color: C.t2 }}>{description}</div>
    </div>
  );
}

export default BrokerConnect;
