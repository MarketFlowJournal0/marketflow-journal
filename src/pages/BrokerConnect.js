import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTradingContext } from '../context/TradingContext';
import { supabase } from '../lib/supabase';
import { shade } from '../lib/colorAlpha';
import { createBrokerAccount, fetchBrokerAccounts, markBrokerAccountConnected } from '../lib/brokerAccounts';
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

const BROKERS = [
  {
    id: 'mt4',
    name: 'MetaTrader 4',
    short: 'MT4',
    color: 'var(--mf-accent,#14C9E5)',
    desc: 'MarketFlow Bridge connection for MT4 accounts, with file upload fallback when a broker blocks live access.',
    features: ['Bridge sync', 'Multi-account', 'File fallback'],
    setup: [
      'Use the integrated connection panel at the top of this page to create the account feed.',
      'MarketFlow generates one scoped journal token per account and never asks for your broker password.',
      'If your broker blocks direct sync, use File Upload in All Trades with the same broker account selected.',
      'Live bridge payloads are accepted through the broker-sync endpoint, but the technical route stays hidden from the normal workflow.',
    ],
  },
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    short: 'MT5',
    color: 'var(--mf-green,#00D2B8)',
    desc: 'MarketFlow Bridge connection for MT5 accounts with hedge/netting account support.',
    features: ['Bridge sync', 'Hedging', 'Netting'],
    setup: [
      'Use the integrated connection panel at the top of this page to create the account feed.',
      'MarketFlow generates one scoped journal token per account and never asks for your broker password.',
      'If your broker blocks direct sync, use File Upload in All Trades with the same broker account selected.',
      'Live bridge payloads are accepted through the broker-sync endpoint, but the technical route stays hidden from the normal workflow.',
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
    desc: 'Flex query connection flow for statement-based importing without broker password access.',
    features: ['Flex query', 'Multi-currency', 'Statements'],
    setup: [
      'Use the integrated Interactive Brokers form and provide the Flex token plus Activity Flex Query ID.',
      'MarketFlow only imports activity history; it cannot execute orders or move funds.',
      'If Flex is unavailable, keep this account and import the IBKR CSV from All Trades.',
    ],
    status: 'csv',
  },
  {
    id: 'oanda',
    name: 'Oanda',
    short: 'OANDA',
    color: 'var(--mf-blue,#4D7CFF)',
    desc: 'Oanda REST account feed with practice/live environment selection.',
    features: ['REST API', 'Forex', 'File fallback'],
    setup: [
      'Use the integrated Oanda form and choose practice or live.',
      'MarketFlow stores the MarketFlow feed token separately from broker credentials.',
      'If API permissions are unavailable, use File Upload in All Trades.',
    ],
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    short: 'TRDV',
    color: 'var(--mf-purple,#A78BFA)',
    desc: 'Futures account connection desk for approved API or export workflows.',
    features: ['Futures', 'API key', 'File fallback'],
    setup: [
      'Use the integrated connection form and select demo or live.',
      'MarketFlow imports execution history only; trading permissions are not requested.',
      'If API access is not enabled on the broker side, use File Upload.',
    ],
  },
  {
    id: 'ninjatrader',
    name: 'NinjaTrader',
    short: 'NT',
    color: 'var(--mf-gold,#D7B36A)',
    desc: 'Futures and FX workflow for NinjaTrader exports or approved API bridge.',
    features: ['Futures', 'FX', 'File fallback'],
    setup: [
      'Use the integrated connection form to create the account feed.',
      'MarketFlow keeps broker credentials out of the journal UI unless a scoped provider token is available.',
      'File Upload remains available for account history exports.',
    ],
  },
  {
    id: 'webhook',
    name: 'Webhook / API',
    short: 'API',
    color: 'var(--mf-gold,#D7B36A)',
    desc: 'Universal bridge for any platform capable of posting trade payloads.',
    features: ['Any platform', 'REST', 'Custom routing'],
    setup: [
      'Use the integrated universal feed form to create a journal connection.',
      'MarketFlow generates a scoped feed token and keeps the account isolated from other users.',
      'Technical webhook routes stay available for developers, but the normal broker flow does not require manual endpoint setup.',
    ],
    status: 'webhook',
  },
];

const BROKER_MARKETS = ['All Markets', 'Stocks', 'Options', 'Futures', 'Forex', 'Crypto'];
const POPULAR_BROKER_NAMES = ['cTrader', 'TopstepX', 'TradeLocker', 'Interactive Brokers', 'MetaTrader 4', 'MetaTrader 5', 'Thinkorswim', 'Tradovate'];
const BROKER_CATALOG = dedupeBrokerCatalog([
  brokerCatalogItem('Alpha Futures', ['Futures'], true, true, 'General'),
  brokerCatalogItem('Bybit', ['Futures', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('Charles Schwab', ['Stocks', 'Options', 'Futures'], true, true, 'General'),
  brokerCatalogItem('Coinbase', ['Crypto'], false, true, 'General'),
  brokerCatalogItem('cTrader', ['Stocks', 'Forex', 'Futures', 'Crypto'], false, true, 'General', 'ctrader'),
  brokerCatalogItem('Das Trader Pro', ['Stocks', 'Options'], true, true, 'General'),
  brokerCatalogItem('DXtrade', ['Stocks', 'Options', 'Forex', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('Fidelity', ['Stocks', 'Options'], false, true, 'General'),
  brokerCatalogItem('Interactive Brokers', ['Stocks', 'Options', 'Futures', 'Forex'], true, true, 'General', 'ibkr'),
  brokerCatalogItem('Lightspeed', ['Stocks', 'Options'], true, true, 'General'),
  brokerCatalogItem('Match-Trader', ['Stocks', 'Forex', 'Futures', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('MetaTrader 4', ['Stocks', 'Forex', 'Futures', 'Crypto'], true, true, 'General', 'mt4'),
  brokerCatalogItem('MetaTrader 5', ['Stocks', 'Forex', 'Futures', 'Crypto'], true, true, 'General', 'mt5'),
  brokerCatalogItem('MotiveWave', ['Stocks', 'Futures'], false, true, 'General'),
  brokerCatalogItem('NinjaTrader', ['Stocks', 'Forex', 'Futures'], true, true, 'General', 'ninjatrader'),
  brokerCatalogItem('Oanda', ['Forex'], true, true, 'General', 'oanda'),
  brokerCatalogItem('Power E Trade', ['Stocks', 'Options', 'Futures'], false, true, 'General'),
  brokerCatalogItem('Project X', ['Futures'], false, true, 'General'),
  brokerCatalogItem('Quantower', ['Futures', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('Questrade', ['Stocks', 'Options'], false, true, 'General'),
  brokerCatalogItem('Rithmic R Trader', ['Futures'], true, true, 'General'),
  brokerCatalogItem('Robinhood', ['Stocks', 'Options', 'Futures'], false, true, 'General'),
  brokerCatalogItem('Sierra Chart', ['Stocks', 'Futures'], false, true, 'General'),
  brokerCatalogItem('Sterling Trader Pro', ['Stocks', 'Options'], true, true, 'General'),
  brokerCatalogItem('Tastytrade', ['Stocks', 'Options', 'Futures'], false, true, 'General'),
  brokerCatalogItem('TC2000', ['Stocks', 'Options'], false, true, 'General'),
  brokerCatalogItem('Thinkorswim', ['Stocks', 'Options', 'Futures'], true, true, 'General'),
  brokerCatalogItem('Tickblaze', ['Stocks', 'Forex', 'Futures', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('TopstepX', ['Futures'], false, true, 'General'),
  brokerCatalogItem('TradeLocker', ['Stocks', 'Forex', 'Crypto'], false, true, 'General'),
  brokerCatalogItem('TradeStation', ['Stocks', 'Options', 'Futures'], true, true, 'General'),
  brokerCatalogItem('TradeZero', ['Stocks', 'Options', 'Futures'], true, true, 'General'),
  brokerCatalogItem('TradingView Paper Trading', ['Stocks', 'Options', 'Forex', 'Futures', 'Crypto'], false, true, 'General', 'tradingview'),
  brokerCatalogItem('Tradovate', ['Futures'], true, true, 'General', 'tradovate'),
  brokerCatalogItem('Webull', ['Stocks', 'Options', 'Futures', 'Crypto'], false, true, 'General'),
  ...[
    'AAAFX', 'AAFX', 'Accuindex', 'ActivTrades', 'ACY Capital', 'Admiral Markets', 'ADN Broker', 'Advanced Markets',
    'Aetos', 'Afterprime', 'Aiko International', 'Alpari', 'Amana Capital', 'Axi', 'Axiory', 'BlackBull Markets',
    'Blueberry Markets', 'Capital.com', 'City Index', 'CMC Markets', 'Coinexx', 'CPT Markets', 'Darwinex',
    'Dukascopy', 'Eightcap', 'Equiti', 'Errante', 'Exness', 'FBS', 'FIBO Group', 'Finalto', 'FlowBank',
    'Forex.com', 'ForexMart', 'FP Markets', 'FTMO', 'Fusion Markets', 'FXCM', 'FXDD', 'FXFlat', 'FXGlobe',
    'FXOpen', 'FXPrimus', 'FXPro', 'Global Prime', 'Hankotrade', 'Hantec Markets', 'HF Markets', 'HYCM',
    'IC Markets', 'ICM Capital', 'IG', 'Infinox', 'IronFX', 'JFD Brokers', 'JustMarkets', 'Key To Markets',
    'KOT4X', 'LMAX', 'LiteFinance', 'Markets.com', 'Moneta Markets', 'MyForexFunds', 'NAGA', 'NordFX',
    'OctaFX', 'Orbex', 'Pepperstone', 'PU Prime', 'Purple Trading', 'RoboForex', 'Saxo Bank', 'Scope Markets',
    'Skilling', 'Swissquote', 'Switch Markets', 'ThinkMarkets', 'Tickmill', 'Titan FX', 'TopFX', 'Trade245',
    'Trade Nation', 'Traders Global Group', 'Traders Way', 'Tradeview', 'Trive', 'True Proprietary Funds',
    'Ultima Markets', 'Valutrades', 'Vantage', 'VT Markets', 'Weltrade', 'XM', 'XTB', 'YaMarkets', 'Zenfinex'
  ].map((name) => brokerCatalogItem(name, ['Forex'], true, true, 'MT4 / MT5 Forex Brokers', name.toLowerCase().includes('mt5') ? 'mt5' : 'mt4')),
]).sort((left, right) => left.name.localeCompare(right.name));

function brokerCatalogItem(name, markets, autoSync = false, fileUpload = true, group = 'General', platformId = '') {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    name,
    markets,
    autoSync,
    fileUpload,
    group,
    platformId,
  };
}

function dedupeBrokerCatalog(items = []) {
  const seen = new Map();
  items.forEach((item) => {
    if (!item?.id) return;
    const previous = seen.get(item.id);
    if (!previous) {
      seen.set(item.id, item);
      return;
    }
    seen.set(item.id, {
      ...previous,
      markets: Array.from(new Set([...(previous.markets || []), ...(item.markets || [])])),
      autoSync: Boolean(previous.autoSync || item.autoSync),
      fileUpload: Boolean(previous.fileUpload || item.fileUpload),
      group: previous.group || item.group,
      platformId: previous.platformId || item.platformId,
    });
  });
  return Array.from(seen.values());
}

function resolveCatalogPlatformId(item = {}) {
  if (item.platformId) return item.platformId;
  const name = String(item.name || '').toLowerCase();
  if (name.includes('metatrader 4') || name.includes('mt4')) return 'mt4';
  if (name.includes('metatrader 5') || name.includes('mt5')) return 'mt5';
  if (name.includes('ctrader')) return 'ctrader';
  if (name.includes('oanda')) return 'oanda';
  if (name.includes('tradovate')) return 'tradovate';
  if (name.includes('ninja')) return 'ninjatrader';
  if (name.includes('interactive')) return 'ibkr';
  if (name.includes('tradingview')) return 'tradingview';
  return item.autoSync ? 'webhook' : 'webhook';
}

function buildInitialConnectionDraft(item = {}, method = '') {
  const platformId = resolveCatalogPlatformId(item);
  const label = item?.name ? `${item.name} Account` : '';
  return {
    accountLabel: label,
    accountNumber: '',
    serverName: item?.group || '',
    environment: platformId === 'oanda' ? 'practice' : 'live',
    flexToken: '',
    flexQueryId: '',
    apiToken: '',
    apiKey: '',
    accountId: '',
    sourceName: item?.name || '',
    baseCurrency: 'USD',
    importFormat: method === 'file' ? 'CSV / Excel' : '',
  };
}

function getConnectionBlueprint(item = {}, method = '') {
  if (!item || !method) return null;
  const platformId = resolveCatalogPlatformId(item);
  const markets = item.markets || [];
  const commonSecurity = [
    'MarketFlow never asks for your broker password.',
    'The journal imports execution history only; it cannot place orders or move funds.',
    'Auto Sync is only enabled when the selected broker exposes a compatible API, Flex report, token, or bridge flow.',
  ];

  if (method === 'file') {
    return {
      key: 'file',
      title: 'File Upload',
      subtitle: `Create a clean ${item.name} account slot, then import CSV, Excel, or broker exports in All Trades.`,
      connectLabel: 'Create account and open importer',
      status: 'disconnected',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: `${item.name} Main`, required: true },
        { id: 'accountNumber', label: 'Account number', placeholder: 'Optional broker account ID' },
        { id: 'importFormat', label: 'Import format', type: 'select', options: ['CSV / Excel', 'Broker statement', 'Generic structured file'], required: true },
      ],
      security: commonSecurity,
      guide: 'Use File Upload when a broker does not expose a safe auto-sync API or when you want to import a historical export first.',
    };
  }

  if (method === 'manual') {
    return {
      key: 'manual',
      title: 'Manual Account',
      subtitle: `Create a ${item.name} journal account and add trades manually from All Trades.`,
      connectLabel: 'Create manual account',
      status: 'disconnected',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: `${item.name} Manual`, required: true },
        { id: 'accountNumber', label: 'Account number', placeholder: 'Optional broker account ID' },
        { id: 'baseCurrency', label: 'Base currency', type: 'select', options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF'], required: true },
      ],
      security: commonSecurity,
      guide: 'Manual accounts are useful for brokers without export files, prop accounts with limited portals, or fast trade reviews.',
    };
  }

  if (platformId === 'ibkr') {
    return {
      key: 'ibkr-flex',
      title: 'Interactive Brokers Flex Sync',
      subtitle: 'Connect an IBKR activity feed with Flex Token and Activity Flex Query ID, directly inside MarketFlow.',
      connectLabel: 'Connect IBKR feed',
      status: 'ready',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: 'IBKR Main', required: true },
        { id: 'flexToken', label: 'Flex token', placeholder: 'Paste IBKR Flex token', required: true, secret: true },
        { id: 'flexQueryId', label: 'Activity Flex Query ID', placeholder: '123456', required: true },
        { id: 'accountNumber', label: 'IBKR account number', placeholder: 'U1234567' },
      ],
      security: commonSecurity,
      guide: 'IBKR sync is statement-based through Flex reports. MarketFlow reads activity history and keeps execution permissions out of scope.',
    };
  }

  if (platformId === 'oanda') {
    return {
      key: 'oanda-rest',
      title: 'Oanda REST Sync',
      subtitle: 'Connect an Oanda practice or live account with scoped REST credentials.',
      connectLabel: 'Connect Oanda feed',
      status: 'ready',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: 'Oanda London', required: true },
        { id: 'accountId', label: 'Oanda account ID', placeholder: '101-001-1234567-001', required: true },
        { id: 'apiToken', label: 'API token', placeholder: 'Paste scoped Oanda token', required: true, secret: true },
        { id: 'environment', label: 'Environment', type: 'select', options: ['practice', 'live'], required: true },
      ],
      security: commonSecurity,
      guide: 'Oanda accounts use practice/live environments. MarketFlow only needs read/import permissions for journal sync.',
    };
  }

  if (platformId === 'mt4' || platformId === 'mt5') {
    return {
      key: `${platformId}-bridge`,
      title: `${platformId.toUpperCase()} MarketFlow Bridge`,
      subtitle: `Create the ${platformId.toUpperCase()} feed in MarketFlow. If live bridge is unavailable, keep the same account for File Upload.`,
      connectLabel: 'Create bridge feed',
      status: 'ready',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: `${item.name} Main`, required: true },
        { id: 'accountNumber', label: 'Account number', placeholder: '50123456', required: true },
        { id: 'serverName', label: 'Server / prop environment', placeholder: 'Broker-Live01', required: true },
      ],
      security: commonSecurity,
      guide: 'MT4/MT5 brokers vary. MarketFlow creates the feed and token inside the journal; the broker-side bridge can be attached later without changing the account.',
    };
  }

  if (platformId === 'tradovate' || platformId === 'ninjatrader') {
    return {
      key: `${platformId}-api`,
      title: `${item.name} API / Export Sync`,
      subtitle: 'Use an approved broker token when available, or keep the account ready for file-based futures imports.',
      connectLabel: `Connect ${item.name}`,
      status: 'ready',
      markets,
      fields: [
        { id: 'accountLabel', label: 'Account label', placeholder: `${item.name} Futures`, required: true },
        { id: 'accountNumber', label: 'Account ID', placeholder: 'Broker account ID', required: true },
        { id: 'apiKey', label: 'API key / access token', placeholder: 'Optional if File Upload only', secret: true },
        { id: 'environment', label: 'Environment', type: 'select', options: ['demo', 'live'], required: true },
      ],
      security: commonSecurity,
      guide: 'Futures platforms often require account-level API approval. MarketFlow keeps File Upload available whenever direct sync is not approved yet.',
    };
  }

  return {
    key: 'universal',
    title: `${item.name} Sync`,
    subtitle: 'Create a universal MarketFlow feed for API, webhook, export, or future provider sync.',
    connectLabel: `Connect ${item.name}`,
    status: 'ready',
    markets,
    fields: [
      { id: 'accountLabel', label: 'Account label', placeholder: `${item.name} Main`, required: true },
      { id: 'accountNumber', label: 'Account number', placeholder: 'Broker account ID' },
      { id: 'apiKey', label: 'API key / provider token', placeholder: 'Optional when supported', secret: true },
      { id: 'serverName', label: 'Server / platform', placeholder: item.group || item.name },
    ],
    security: commonSecurity,
    guide: 'Universal feeds are used for brokers with custom exports, provider APIs, or webhook-capable platforms. Unsupported brokers should use File Upload first.',
  };
}

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
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5v11" />
      <path d="M3.5 9h11" />
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
  if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
    return `mf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 18)}`;
  }
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
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function safeDateLabel(date) {
  if (!date) return 'Unknown';
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return 'Unknown';
  return parsed.toLocaleDateString('en-GB');
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
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(String(value || '')).catch(() => {});
  } else if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.value = String(value || '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(textarea);
  }
  toast.success(successMessage);
}

function sanitizeBrokerAccounts(accounts = []) {
  if (!Array.isArray(accounts)) return [];
  return accounts
    .filter((account) => account && typeof account === 'object')
    .map((account) => ({
      ...account,
      id: account.id || account.api_token || `${account.broker_type || 'broker'}-${account.account_number || 'account'}`,
      broker_type: account.broker_type || 'webhook',
      account_name: account.account_name || account.account_number || 'Broker account',
      account_number: account.account_number || '',
      server_name: account.server_name || '',
      api_token: account.api_token || '',
      status: account.status || account.connection_status || (account.last_sync_at ? 'connected' : 'disconnected'),
      total_trades_synced: Number(account.total_trades_synced || account.synced_trades || 0) || 0,
    }));
}

function safeUpper(value, fallback = '') {
  return String(value || fallback).toUpperCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function roleLabel(role) {
  return ACCOUNT_ROLE_OPTIONS.find((item) => item.id === role)?.label || role;
}

function sizingModeLabel(value) {
  return COPY_SIZING_MODES.find((item) => item.id === value)?.label || value;
}

function statusTone(status) {
  if (status === 'connected' || status === 'ready' || status === 'active') return { color: C.green, bg: shade(C.green, 0.12), border: shade(C.green, 0.22) };
  if (status === 'pending' || status === 'queued') return { color: C.cyan, bg: shade(C.cyan, 0.1), border: shade(C.cyan, 0.18) };
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

function BrokerChoiceCard({ broker, active, onClick }) {
  if (!broker) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? shade(C.cyan, 0.34) : shade(C.t3, 0.14)}`,
        borderRadius: 18,
        background: active
          ? `linear-gradient(145deg, ${shade(C.cyan, 0.12)}, rgba(255,255,255,0.026))`
          : 'rgba(255,255,255,0.022)',
        color: C.t1,
        padding: 16,
        minHeight: 118,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: active ? `0 18px 42px ${shade(C.cyan, 0.1)}` : 'none',
        display: 'grid',
        gap: 10,
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          color: active ? C.bg : C.cyan,
          background: active ? `linear-gradient(135deg, ${C.cyan}, ${C.green})` : shade(C.cyan, 0.1),
          border: `1px solid ${shade(C.cyan, active ? 0.22 : 0.16)}`,
          fontSize: 12,
          fontWeight: 950,
          letterSpacing: '-0.04em',
        }}>
          {broker.name.slice(0, 2).toUpperCase()}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', color: C.t0, fontSize: 13.5, fontWeight: 950, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {broker.name}
          </span>
          <span style={{ display: 'block', marginTop: 3, color: C.t3, fontSize: 10.5, fontWeight: 800 }}>
            {broker.group}
          </span>
        </span>
      </span>
      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {(broker.markets || []).slice(0, 3).map((market) => (
          <span key={market} style={{ padding: '4px 7px', borderRadius: 999, border: `1px solid ${shade(C.t3, 0.12)}`, color: C.t2, fontSize: 10, fontWeight: 800 }}>
            {market}
          </span>
        ))}
      </span>
      <span style={{ display: 'flex', gap: 7, flexWrap: 'wrap', color: C.t3, fontSize: 10.5, fontWeight: 850 }}>
        <span style={{ color: broker.autoSync ? C.green : C.t3 }}>Auto Sync {broker.autoSync ? 'available' : 'not available'}</span>
        <span style={{ color: broker.fileUpload ? C.green : C.t3 }}>File {broker.fileUpload ? 'available' : 'not available'}</span>
      </span>
    </button>
  );
}

function MethodChoiceCard({ method, active, onClick }) {
  if (!method) return null;
  const disabled = !method.available;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative',
        border: `1px solid ${active ? shade(C.cyan, 0.36) : shade(disabled ? C.t3 : C.t3, 0.14)}`,
        borderRadius: 22,
        background: active
          ? `linear-gradient(145deg, ${shade(C.cyan, 0.12)}, rgba(255,255,255,0.028))`
          : disabled
            ? 'rgba(255,255,255,0.014)'
            : 'rgba(255,255,255,0.024)',
        color: disabled ? C.t3 : C.t1,
        padding: 22,
        minHeight: 190,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.62 : 1,
        display: 'grid',
        justifyItems: 'center',
        alignContent: 'center',
        gap: 12,
      }}
    >
      {method.recommended ? (
        <span style={{ position: 'absolute', left: 14, top: 14, padding: '5px 8px', borderRadius: 999, background: shade(C.blue, 0.14), border: `1px solid ${shade(C.blue, 0.22)}`, color: C.blue, fontSize: 9.5, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Recommended
        </span>
      ) : null}
      {!method.available ? (
        <span style={{ position: 'absolute', left: 14, top: 14, padding: '5px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: `1px solid ${shade(C.t3, 0.16)}`, color: C.t3, fontSize: 9.5, fontWeight: 950, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Not available
        </span>
      ) : null}
      <span style={{
        width: 58,
        height: 58,
        borderRadius: 20,
        display: 'grid',
        placeItems: 'center',
        color: active ? C.bg : disabled ? C.t3 : C.cyan,
        background: active ? `linear-gradient(135deg, ${C.cyan}, ${C.green})` : shade(disabled ? C.t3 : C.cyan, 0.1),
        border: `1px solid ${shade(disabled ? C.t3 : C.cyan, 0.16)}`,
      }}>
        {method.id === 'auto' ? <ICON.Network /> : method.id === 'file' ? <ICON.Upload /> : <ICON.Plus />}
      </span>
      <span style={{ display: 'grid', gap: 7 }}>
        <span style={{ color: disabled ? C.t3 : C.t0, fontSize: 18, fontWeight: 950, letterSpacing: '-0.04em' }}>
          {method.title}
        </span>
        <span style={{ maxWidth: 230, color: disabled ? C.t3 : C.t2, fontSize: 12.5, lineHeight: 1.55 }}>
          {method.body}
        </span>
      </span>
    </button>
  );
}

function WizardBrokerHeader({ broker, method, onBack, compact = false }) {
  if (!broker) return null;
  return (
    <div style={{
      display: 'flex',
      alignItems: compact ? 'center' : 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
      flexWrap: 'wrap',
      padding: compact ? 0 : 16,
      borderRadius: compact ? 0 : 18,
      border: compact ? 0 : `1px solid ${shade(C.t3, 0.12)}`,
      background: compact ? 'transparent' : 'rgba(255,255,255,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: compact ? 38 : 48,
          height: compact ? 38 : 48,
          borderRadius: compact ? 13 : 16,
          display: 'grid',
          placeItems: 'center',
          color: C.bg,
          background: `linear-gradient(135deg, ${C.cyan}, ${C.green})`,
          fontSize: compact ? 12 : 15,
          fontWeight: 950,
          letterSpacing: '-0.05em',
          flex: '0 0 auto',
        }}>
          {broker.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: C.t0, fontSize: compact ? 15 : 20, fontWeight: 950, letterSpacing: '-0.05em' }}>{broker.name}</div>
          <div style={{ marginTop: 4, color: C.t2, fontSize: 11.5, lineHeight: 1.45 }}>
            {method?.title ? `${method.title} selected` : `${(broker.markets || []).join(', ')} account workflow`}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{
          border: `1px solid ${shade(C.t3, 0.16)}`,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.026)',
          color: C.t1,
          padding: '8px 12px',
          fontSize: 11,
          fontWeight: 900,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Back
      </button>
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
  const [brokerSearch, setBrokerSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('All Markets');
  const [selectedCatalogBroker, setSelectedCatalogBroker] = useState(null);
  const [selectedImportMethod, setSelectedImportMethod] = useState('');
  const [connectionComplete, setConnectionComplete] = useState(null);
  const [connectionDraft, setConnectionDraft] = useState(() => buildInitialConnectionDraft());
  const [connectionSubmitting, setConnectionSubmitting] = useState(false);

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

  const brokerAccounts = useMemo(() => sanitizeBrokerAccounts(accounts), [accounts]);
  const copierAccounts = copierState.accounts || [];
  const copierLinks = copierState.links || [];
  const copierOverview = useMemo(() => buildTradeCopierOverview(copierState), [copierState]);
  const riskRows = useMemo(() => copierAccounts.map((account) => calculateAccountRiskState(account)), [copierAccounts]);
  const masterAccounts = useMemo(() => copierAccounts.filter((account) => account.role === 'master'), [copierAccounts]);
  const followerAccounts = useMemo(() => copierAccounts.filter((account) => account.role === 'follower'), [copierAccounts]);
  const totalSynced = useMemo(() => brokerAccounts.reduce((sum, account) => sum + (account.total_trades_synced || 0), 0), [brokerAccounts]);
  const connectedCount = useMemo(() => brokerAccounts.filter((account) => account.status === 'connected').length, [brokerAccounts]);
  const journalAccounts = useMemo(() => (accountOptions || []).filter((item) => item.id !== 'all'), [accountOptions]);
  const filteredCatalog = useMemo(() => {
    const query = brokerSearch.trim().toLowerCase();
    return BROKER_CATALOG.filter((broker) => {
      const brokerMarkets = safeArray(broker.markets);
      const matchesMarket = marketFilter === 'All Markets' || brokerMarkets.includes(marketFilter);
      const matchesSearch = !query || [broker.name, broker.group, ...brokerMarkets].join(' ').toLowerCase().includes(query);
      return matchesMarket && matchesSearch;
    }).slice(0, 80);
  }, [brokerSearch, marketFilter]);
  const popularCatalog = useMemo(() => POPULAR_BROKER_NAMES
    .map((name) => BROKER_CATALOG.find((broker) => broker.name.toLowerCase() === name.toLowerCase()))
    .filter(Boolean), []);
  const connectionBlueprint = useMemo(
    () => getConnectionBlueprint(selectedCatalogBroker, selectedImportMethod),
    [selectedCatalogBroker, selectedImportMethod]
  );

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchBrokerAccounts(supabase, user.id);
      setAccounts(sanitizeBrokerAccounts(data));
    } catch (error) {
      toast.error(error.message);
      setAccounts([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('setup') === '1') {
      toast.success('Choose your broker to connect the first account.');
      window.history.replaceState({}, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

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

  useEffect(() => {
    setConnectionDraft(buildInitialConnectionDraft(selectedCatalogBroker, selectedImportMethod));
  }, [selectedCatalogBroker, selectedImportMethod]);

  async function handleAddBroker(event) {
    event.preventDefault();
    if (!brokerForm.account_number.trim()) {
      toast.error('Account number required.');
      return;
    }

    const token = generateToken();

    try {
      await createBrokerAccount(supabase, {
        user_id: user.id,
        broker_type: brokerForm.broker_type,
        account_number: brokerForm.account_number.trim(),
        account_name: brokerForm.account_name.trim(),
        server_name: brokerForm.server_name.trim(),
        api_token: token,
        status: 'disconnected',
      });
    } catch (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Broker account created. MarketFlow generated a scoped journal token.');
    setBrokerForm(initialBrokerForm());
    setShowBrokerForm(false);
    fetchAccounts();
  }

  async function handleIntegratedConnectionSubmit(event) {
    event.preventDefault();
    if (!user?.id) {
      toast.error('Sign in required.');
      return;
    }
    if (!selectedCatalogBroker || !selectedImportMethod || !connectionBlueprint) {
      toast.error('Choose a broker and connection method first.');
      return;
    }

    const missingField = (connectionBlueprint.fields || []).find((field) => (
      field.required && !String(connectionDraft[field.id] || '').trim()
    ));
    if (missingField) {
      toast.error(`${missingField.label} required.`);
      return;
    }

    const platformId = resolveCatalogPlatformId(selectedCatalogBroker);
    const token = generateToken();
    const accountNumber = String(
      connectionDraft.accountNumber
      || connectionDraft.accountId
      || connectionDraft.flexQueryId
      || selectedCatalogBroker.id
    ).trim();
    const accountName = String(connectionDraft.accountLabel || selectedCatalogBroker.name).trim();
    const serverName = String(
      connectionDraft.serverName
      || connectionDraft.environment
      || connectionBlueprint.title
    ).trim();

    setConnectionSubmitting(true);
    try {
      const createdAccount = await createBrokerAccount(supabase, {
        user_id: user.id,
        broker_type: platformId,
        account_number: accountNumber,
        account_name: accountName,
        server_name: serverName,
        api_token: token,
        status: connectionBlueprint.status || 'pending',
      });

      if (typeof window !== 'undefined') {
        const safeDraft = {};
        (connectionBlueprint.fields || []).forEach((field) => {
          if (!field.secret) safeDraft[field.id] = connectionDraft[field.id] || '';
        });
        window.localStorage.setItem(`mfj_broker_connection_${createdAccount.id || token}`, JSON.stringify({
          broker: selectedCatalogBroker.name,
          brokerId: selectedCatalogBroker.id,
          platformId,
          method: selectedImportMethod,
          blueprint: connectionBlueprint.key,
          markets: selectedCatalogBroker.markets || [],
          fields: safeDraft,
          createdAt: new Date().toISOString(),
        }));
      }

      toast.success(selectedImportMethod === 'file'
        ? 'Account created. Open All Trades to import the broker file.'
        : 'Connection created inside MarketFlow. First broker data sync will update this feed automatically.');
      setConnectionComplete({
        broker: selectedCatalogBroker.name,
        method: selectedImportMethod,
        accountName,
        accountNumber,
        status: connectionBlueprint.status || 'pending',
      });
      setShowBrokerForm(false);
      fetchAccounts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setConnectionSubmitting(false);
    }
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
      const response = await fetch('/api/broker-sync?mode=mt', {
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

      await markBrokerAccountConnected(supabase, id);

      toast.success(`${payload.inserted || 0} trade(s) synced.`);
      fetchAccounts();
    } catch {
      toast.error('Connection failed. Re-check the broker feed and try again.');
    } finally {
      setSyncingId(null);
    }
  }

  function openSetup(broker) {
    setSelectedBroker(broker);
    setSetupOpen(true);
  }

  function selectCatalogBroker(item) {
    setSelectedCatalogBroker(item);
    setSelectedImportMethod('');
    setConnectionComplete(null);
  }

  function beginCatalogConnection(item = selectedCatalogBroker, method = selectedImportMethod) {
    if (!item) {
      toast.error('Choose a broker or platform first.');
      return;
    }
    if (!method) {
      toast.error('Choose Auto Sync, File Upload, or Manual entry.');
      return;
    }

    setConnectionDraft(buildInitialConnectionDraft(item, method));
    setConnectionComplete(null);
    toast.success('Connection form ready inside MarketFlow.');
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
    toast.success(`Dispatch simulation completed for ${safeArray(result.results).length} follower account(s).`);
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
  const connectionMethods = [
    {
      id: 'auto',
      title: 'Auto Sync',
      body: 'Broker API, Flex report, webhook, or provider-approved bridge when available.',
      available: Boolean(selectedCatalogBroker?.autoSync),
      recommended: Boolean(selectedCatalogBroker?.autoSync),
    },
    {
      id: 'file',
      title: 'File Upload',
      body: 'Upload CSV, Excel, statements, or broker exports through All Trades.',
      available: Boolean(selectedCatalogBroker?.fileUpload),
      recommended: Boolean(selectedCatalogBroker && !selectedCatalogBroker.autoSync),
    },
    {
      id: 'manual',
      title: 'Add manually',
      body: 'Create the account now and add trades one by one from All Trades.',
      available: Boolean(selectedCatalogBroker),
      recommended: false,
    },
  ];
  const selectedMethod = connectionMethods.find((method) => method.id === selectedImportMethod);
  const wizardStep = connectionComplete ? 4 : selectedImportMethod ? 3 : selectedCatalogBroker ? 2 : 1;

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

      <div style={{ ...pageCardStyle({ padding: 28 }) }}>
        <SectionHeader
          eyebrow="Add trades"
          title={wizardStep === 1 ? 'Choose Broker, Prop Firm or Trading Platform' : wizardStep === 2 ? 'Select Import Method' : wizardStep === 3 ? 'Broker Sync' : 'Connection ready'}
          description="A clean broker connection flow: choose the platform, choose the import method, then connect the feed or create the account slot. MarketFlow never asks for broker passwords."
          actions={(
            <div style={{ padding: '7px 10px', borderRadius: 999, border: `1px solid ${shade(C.green, 0.18)}`, background: shade(C.green, 0.08), color: C.green, fontSize: 10.5, fontWeight: 800 }}>
              {BROKER_CATALOG.length}+ integrations indexed
            </div>
          )}
        />

        <div style={{ maxWidth: 920, margin: '0 auto 26px' }}>
          <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 14 }}>
            <motion.div
              initial={false}
              animate={{ width: `${Math.min(100, wizardStep * 25)}%` }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${C.cyan}, ${C.green})` }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {['Broker', 'Method', 'Connect', 'Ready'].map((label, index) => {
              const active = wizardStep >= index + 1;
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: active ? C.t1 : C.t3, fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${active ? shade(C.cyan, 0.34) : shade(C.t3, 0.16)}`, background: active ? shade(C.cyan, 0.1) : 'rgba(255,255,255,0.025)', color: active ? C.cyan : C.t3, fontSize: 10 }}>{index + 1}</span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {wizardStep === 1 ? (
            <motion.div key="broker-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: 18 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: C.t2, marginBottom: 12 }}>Search your broker, prop firm or trading platform</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 180px', gap: 10, maxWidth: 720, margin: '0 auto' }}>
                  <input
                    value={brokerSearch}
                    onChange={(event) => setBrokerSearch(event.target.value)}
                    placeholder="Start typing the broker, prop firm or platform"
                    style={{ ...inputStyle(), padding: '14px 15px', borderRadius: 14 }}
                  />
                  <select value={marketFilter} onChange={(event) => setMarketFilter(event.target.value)} style={{ ...inputStyle(), padding: '14px 15px', borderRadius: 14 }}>
                    {BROKER_MARKETS.map((market) => <option key={market} value={market}>{market}</option>)}
                  </select>
                </div>
              </div>

              {!brokerSearch.trim() && marketFilter === 'All Markets' ? (
                <div>
                  <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: C.t0, marginBottom: 12 }}>Popular brokers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                    {popularCatalog.map((broker) => (
                      <BrokerChoiceCard key={broker.id} broker={broker} active={selectedCatalogBroker?.id === broker.id} onClick={() => selectCatalogBroker(broker)} />
                    ))}
                  </div>
                </div>
              ) : null}

              <div style={{ borderRadius: 20, border: `1px solid ${shade(C.t3, 0.14)}`, background: 'rgba(255,255,255,0.018)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) 170px 92px 92px', gap: 10, padding: '10px 13px', borderBottom: `1px solid ${shade(C.t3, 0.14)}`, color: C.t3, fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  <span>Integration / Broker</span>
                  <span>Markets</span>
                  <span>Auto Sync</span>
                  <span>File</span>
                </div>
                <div style={{ maxHeight: 420, overflow: 'auto' }}>
                  {filteredCatalog.map((broker) => (
                    <button
                      key={broker.id}
                      type="button"
                      onClick={() => selectCatalogBroker(broker)}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(220px, 1.4fr) 170px 92px 92px',
                        gap: 10,
                        alignItems: 'center',
                        padding: '12px 13px',
                        border: 0,
                        borderBottom: `1px solid ${shade(C.t3, 0.08)}`,
                        background: selectedCatalogBroker?.id === broker.id ? shade(C.cyan, 0.08) : 'transparent',
                        color: C.t1,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span>
                        <span style={{ display: 'block', fontSize: 13, fontWeight: 900, color: C.t0 }}>{broker.name}</span>
                        <span style={{ display: 'block', marginTop: 3, fontSize: 10.5, color: C.t3 }}>{broker.group}</span>
                      </span>
                      <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {safeArray(broker.markets).slice(0, 3).map((market) => (
                          <span key={market} style={{ padding: '3px 7px', borderRadius: 999, border: `1px solid ${shade(C.t3, 0.12)}`, color: C.t2, fontSize: 10.5 }}>{market}</span>
                        ))}
                      </span>
                      <span style={{ color: broker.autoSync ? C.green : C.t3, fontWeight: 900 }}>{broker.autoSync ? 'Yes' : 'No'}</span>
                      <span style={{ color: broker.fileUpload ? C.green : C.t3, fontWeight: 900 }}>{broker.fileUpload ? 'Yes' : 'No'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}

          {wizardStep === 2 ? (
            <motion.div key="method-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gap: 18 }}>
              <WizardBrokerHeader broker={selectedCatalogBroker} onBack={() => { setSelectedCatalogBroker(null); setSelectedImportMethod(''); }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {connectionMethods.map((method) => (
                  <MethodChoiceCard
                    key={method.id}
                    method={method}
                    active={selectedImportMethod === method.id}
                    onClick={() => {
                      if (!method.available) return;
                      setSelectedImportMethod(method.id);
                      setConnectionComplete(null);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ) : null}

          {wizardStep === 3 && connectionBlueprint ? (
            <motion.div key="connect-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ maxWidth: 980, margin: '0 auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 0.82fr)', gap: 22, alignItems: 'start' }}>
                <div style={{ ...pageCardStyle({ padding: 22, borderRadius: 22, border: `1px solid ${shade(C.cyan, 0.18)}` }) }}>
                  <WizardBrokerHeader broker={selectedCatalogBroker} method={selectedMethod} onBack={() => setSelectedImportMethod('')} compact />
                  <div style={{ height: 3, borderRadius: 999, background: `linear-gradient(90deg, ${C.cyan}, ${C.green})`, margin: '18px 0' }} />
                  <div style={{ fontSize: 10, fontWeight: 900, color: C.t3, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Add trades</div>
                  <div style={{ marginTop: 6, fontSize: 28, fontWeight: 950, color: C.t0, letterSpacing: '-0.06em' }}>{connectionBlueprint.title}</div>
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: C.t2 }}>{connectionBlueprint.subtitle}</div>

                  <form onSubmit={handleIntegratedConnectionSubmit} style={{ marginTop: 18, display: 'grid', gap: 13 }}>
                    {(connectionBlueprint.fields || []).map((field) => (
                      <Field key={field.id} label={field.label} hint={field.secret ? 'Sensitive field' : field.required ? 'Required' : 'Optional'}>
                        {field.type === 'select' ? (
                          <select
                            value={connectionDraft[field.id] || field.options?.[0] || ''}
                            onChange={(event) => setConnectionDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                            style={inputStyle()}
                          >
                            {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.secret ? 'password' : 'text'}
                            value={connectionDraft[field.id] || ''}
                            onChange={(event) => setConnectionDraft((current) => ({ ...current, [field.id]: event.target.value }))}
                            placeholder={field.placeholder}
                            autoComplete="off"
                            style={inputStyle()}
                          />
                        )}
                      </Field>
                    ))}

                    <ActionButton type="submit" disabled={connectionSubmitting} style={{ justifyContent: 'center', opacity: connectionSubmitting ? 0.72 : 1 }}>
                      <ICON.Plug />
                      {connectionSubmitting ? 'Connecting...' : connectionBlueprint.connectLabel}
                    </ActionButton>
                  </form>
                </div>

                <div style={{ ...pageCardStyle({ padding: 22, borderRadius: 22 }) }}>
                  <div style={{ fontSize: 22, fontWeight: 950, color: C.t0, letterSpacing: '-0.04em' }}>{selectedCatalogBroker?.name}</div>
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {(connectionBlueprint.markets || []).map((market) => (
                      <span key={market} style={{ padding: '4px 8px', borderRadius: 999, background: shade(C.cyan, 0.08), border: `1px solid ${shade(C.cyan, 0.12)}`, color: C.t1, fontSize: 10.5, fontWeight: 800 }}>
                        {market}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 18, display: 'grid', gap: 9 }}>
                    {(connectionBlueprint.security || []).map((line) => (
                      <div key={line} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', gap: 9, alignItems: 'start', fontSize: 12, lineHeight: 1.6, color: C.t2 }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', color: C.green, background: shade(C.green, 0.1), border: `1px solid ${shade(C.green, 0.14)}`, fontSize: 8, fontWeight: 900 }}>OK</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                  <details style={{ marginTop: 16, color: C.t2, fontSize: 12, lineHeight: 1.65 }}>
                    <summary style={{ cursor: 'pointer', color: C.t1, fontWeight: 900 }}>Integration guide</summary>
                    <div style={{ marginTop: 8 }}>{connectionBlueprint.guide}</div>
                  </details>
                </div>
              </div>
            </motion.div>
          ) : null}

          {wizardStep === 4 ? (
            <motion.div key="ready-step" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }} style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{ ...pageCardStyle({ padding: 28, borderRadius: 24, textAlign: 'center', border: `1px solid ${shade(C.green, 0.22)}` }) }}>
                <div style={{ width: 54, height: 54, margin: '0 auto 16px', borderRadius: 18, display: 'grid', placeItems: 'center', color: C.green, background: shade(C.green, 0.12), border: `1px solid ${shade(C.green, 0.2)}` }}>
                  <ICON.Plug />
                </div>
                <div style={{ fontSize: 30, fontWeight: 950, color: C.t0, letterSpacing: '-0.06em' }}>Broker feed created</div>
                <div style={{ margin: '10px auto 0', maxWidth: 560, color: C.t2, fontSize: 13, lineHeight: 1.7 }}>
                  {connectionComplete?.accountName || 'Your account'} is now linked to {connectionComplete?.broker || 'the selected broker'}. Auto Sync accounts can refresh from the connection desk; file and manual accounts stay ready for All Trades.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
                  <ActionButton onClick={() => { window.location.href = '/all-trades'; }}>
                    Open All Trades
                    <ICON.ArrowUpRight />
                  </ActionButton>
                  <ActionButton tone="subtle" onClick={() => {
                    setSelectedCatalogBroker(null);
                    setSelectedImportMethod('');
                    setConnectionComplete(null);
                    setBrokerSearch('');
                    setMarketFilter('All Markets');
                  }}>
                    Connect another broker
                  </ActionButton>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div style={{ ...pageCardStyle({ padding: 24 }) }}>
        <SectionHeader
          eyebrow="Broker Sync"
          title="Connection desk"
          description="Manage connected broker feeds without leaving MarketFlow. Direct API, file imports, manual accounts, and Elite copier accounts all stay linked to the same journal data layer."
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
              label: 'Direct API / approved sync',
              value: 'Available only when the broker exposes a compatible read-only feed.',
              body: 'Use this for brokers like IBKR Flex, Oanda REST, Tradovate-style APIs, or platform-approved bridge connections.',
            },
            {
              label: 'File upload fallback',
              value: 'CSV, Excel, statements, and structured broker exports.',
              body: 'When auto sync is not safe or not available, MarketFlow keeps the same broker account and imports the history from All Trades.',
            },
            {
              label: 'Manual account',
              value: 'For unsupported brokers, prop dashboards, and review-only workflows.',
              body: 'Create the account, add trades manually, then keep analytics, calendar, psychology, and reports connected to that account.',
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
                  fontFamily: 'inherit',
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
              <div style={{ ...pageCardStyle({ padding: 28, borderRadius: 18, color: C.t2 }) }}>Loading broker connections...</div>
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
                        <MetaItem label="Created" value={safeDateLabel(account.created_at)} />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.55, color: C.t3 }}>
                        Passwords are never collected here. Broker bridges use scoped API tokens, each tied to one MarketFlow account feed.
                      </div>
                    </div>

                    <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
                      {(account.broker_type === 'mt4' || account.broker_type === 'mt5') ? (
                        <ActionButton tone="subtle" onClick={() => handleSyncBroker(account.id)} disabled={syncingId === account.id} style={{ minWidth: 130, justifyContent: 'center' }}>
                          <ICON.Network />
                          {syncingId === account.id ? 'Syncing...' : 'Sync now'}
                        </ActionButton>
                      ) : null}
                      <ActionButton tone="subtle" onClick={() => openSetup(broker)} style={{ minWidth: 130, justifyContent: 'center' }}>
                        <ICON.Spark />
                        Connection details
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
              <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>Connection methods</div>
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
                      {safeArray(broker.features).map((feature) => (
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
                          const active = safeArray(copierLinkForm.sessionFilter).includes(option.id);
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.t1 }}>{dispatchSummary.symbol} · {safeUpper(dispatchSummary.side)}</div>
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
                            <RiskStat label="Side" value={safeUpper(row.side)} tone={C.cyan} subtle />
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
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t1 }}>{item.symbol} · {safeUpper(item.side)} · {item.masterLabel}</div>
                          <div style={{ marginTop: 4, fontSize: 11.5, color: C.t3 }}>{new Date(item.timestamp).toLocaleString('fr-FR')}</div>
                        </div>
                        <div style={{ padding: '6px 10px', borderRadius: 999, background: shade(C.cyan, 0.08), border: `1px solid ${shade(C.cyan, 0.14)}`, color: C.cyan, fontSize: 11 }}>
                          {safeArray(item.results).length} follower(s)
                        </div>
                      </div>
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {safeArray(item.results).slice(0, 3).map((result) => {
                          const tone = statusTone(result.state);
                          return (
                            <div key={result.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 12px', borderRadius: 12, background: tone.bg, border: `1px solid ${tone.border}` }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: tone.color }}>{result.followerLabel}</div>
                                <div style={{ marginTop: 4, fontSize: 11, color: C.t2 }}>{result.symbol} · {safeUpper(result.side)}</div>
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
                  <div style={{ marginTop: 12, fontSize: 24, fontWeight: 800, letterSpacing: '-0.05em', color: C.t0 }}>{selectedBroker.name} connection</div>
                  <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.7, color: C.t2 }}>{selectedBroker.desc}</div>
                </div>
                <ActionButton tone="subtle" onClick={() => setSetupOpen(false)}>Close</ActionButton>
              </div>
              <div style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                {safeArray(selectedBroker.setup).map((step, index) => (
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
