import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PROP_FIRMS = [
  'FTMO',
  'The5ers',
  'Topstep',
  'FundedNext',
  'Funding Pips',
  'E8 Markets',
  'Blue Guardian',
  'Alpha Capital Group',
];

const FEATURE_CARDS = [
  {
    icon: 'journal',
    title: 'Smart Trade Journal',
    desc: 'Import CSV, XLSX, XLS, TSV, JSON, or paste raw trade history, then review everything inside a cleaner execution ledger.',
  },
  {
    icon: 'analytics',
    title: 'Tiered Analytics',
    desc: 'Starter gets core analytics, Pro unlocks the deeper review stack, and Elite gets boosted overlays on top of that.',
  },
  {
    icon: 'calendar',
    title: 'Performance Calendar',
    desc: 'Monthly trade view with day selection, day review, and the same dataset connected to dashboard and journal pages.',
  },
  {
    icon: 'psychology',
    title: 'Psychology Tracking',
    desc: 'Score discipline, behavior, routine, confidence, and session quality inside a dedicated review workflow.',
  },
  {
    icon: 'backtest',
    title: 'Backtest Sessions',
    desc: 'Starter includes 1 session, Pro includes 5, and Elite includes 25 resumable backtest sessions.',
  },
  {
    icon: 'stack',
    title: 'Reports, Alerts, API',
    desc: 'Plan-based operational tools are exposed only where they already exist today in the journal.',
  },
];

const MODULE_PILLARS = [
  {
    overline: 'Workspace',
    title: 'A clearer daily operating desk.',
    desc: 'Dashboard, All Trades, Calendar, Competition, and the workflow layer stay connected so the journal reads like one system instead of isolated pages.',
    points: ['Command-center dashboard', 'Execution-ledger review', 'Calendar and daily flow visibility'],
  },
  {
    overline: 'Analytics',
    title: 'Each plan unlocks a real review layer.',
    desc: 'Starter keeps the essential readouts, Pro opens the deeper review stack, and Elite adds faster overlays and richer operational tooling.',
    points: ['Starter: core performance analytics', 'Pro: deeper review stack', 'Elite: boosted overlays and richer readouts'],
  },
  {
    overline: 'Operations',
    title: 'Reports, alerts, API, and account tooling stay mapped to the live product.',
    desc: 'The commercial site is written against the modules already present in the journal so the plan grid and the product shell stay aligned.',
    points: ['Reports and exports', 'Alerts and API by plan', 'Billing and support transparency'],
  },
];

const FAQS = [
  {
    q: 'What can I import into MarketFlow?',
    a: 'The journal currently supports CSV, XLSX, XLS, TSV, JSON, and pasted raw trade history inside All Trades.',
  },
  {
    q: 'Does Starter include analytics?',
    a: 'Yes. Starter includes the core analytics layer. Pro unlocks the deeper review stack, and Elite adds richer overlays and operational modules.',
  },
  {
    q: 'When does billing start?',
    a: 'Activation is card-backed, but the selected plan is not charged during the 14-day trial. Billing starts automatically when the trial ends unless the subscription is canceled before renewal.',
  },
  {
    q: 'Can I cancel online?',
    a: 'Yes. Subscription management is available from the account area. Access stays active until the end of the already-paid period or trial window.',
  },
  {
    q: 'Are the prop firm names official partnerships?',
    a: 'No. They are shown as examples of trading environments people recognize, not as endorsements, affiliations, or official partnerships.',
  },
  {
    q: 'What data is used to run the journal?',
    a: 'MarketFlow uses account, subscription, onboarding, and trade-journal data needed to provide the workspace, imports, analytics, and support flow.',
  },
  {
    q: 'Does the landing only describe live modules?',
    a: 'That is the goal of this page. The public copy is kept tied to the modules that are already accessible in the journal by plan.',
  },
];

const PAGE_CONTENT = {
  changelog: {
    title: 'Changelog',
    subtitle: 'Recent product updates',
    items: [
      'Landing page rewritten with cleaner structure and stricter claims.',
      'Dashboard, calendar, all-trades import, and journal access flow have been reworked.',
      'Plan access now reflects the current journal modules more accurately.',
    ],
  },
  roadmap: {
    title: 'Roadmap',
    subtitle: 'Direction, not a promise contract',
    items: [
      'Mobile app workstream',
      'Broker connectivity hardening',
      'Backtest lab upgrades',
      'Elite execution infrastructure maturation',
    ],
  },
  support: {
    title: 'Support',
    subtitle: 'Access, billing, and account help',
    items: [
      'Email: marketflowjournal0@gmail.com',
      'In-app support page after login',
      'Subscription management from the journal account area',
    ],
  },
  legal: {
    title: 'Legal and Billing',
    subtitle: 'Operational points visible on the public site',
    items: [
      'Payments are processed via Stripe.',
      'Plan access depends on the selected subscription tier.',
      'Prop firm names shown on the site are references, not endorsements.',
      'Billing terms are stated before checkout and remain visible in the account flow.',
    ],
  },
  privacy: {
    title: 'Privacy',
    subtitle: 'What the public site states clearly',
    items: [
      'Account, onboarding, subscription, and trade-journal data are used to operate the product.',
      'Support requests can be sent by email or from the in-app support area.',
      'Data export and deletion controls exist inside the journal flow.',
    ],
  },
  billing: {
    title: 'Billing',
    subtitle: 'Short version of the plan flow',
    items: [
      'Activation is card-backed before the journal opens.',
      'The 14-day trial is not charged during the trial window.',
      'Renewal continues until canceled from the account area.',
    ],
  },
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 15,
    annual: 11,
    priceMonthly: 'price_1T9t9L2Ouddv7uendIMAR6IP',
    priceAnnual: 'price_1TDQ7w2Ouddv7ueno5CuaNTH',
    accent: '#00F5D4',
    badge: 'Focused journal',
    desc: 'Core journal access with dashboard, all trades, calendar, competition, basic analytics, and one backtest session.',
    features: [
      'Unlimited trade journal',
      'Dashboard and daily workflow',
      'CSV, Excel, and raw import',
      'Performance calendar',
      'Competition page',
      'Core analytics',
      '1 backtest session',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 22,
    annual: 15,
    priceMonthly: 'price_1T9t9U2Ouddv7uenfg38PRZ2',
    priceAnnual: 'price_1T9t9U2Ouddv7uenK6oT1O13',
    accent: '#06E6FF',
    badge: 'Most complete review layer',
    desc: 'Adds the deeper review stack: Analytics Pro, psychology, equity, reports, broker desk access, and more sessions.',
    features: [
      'Everything in Starter',
      'Analytics Pro',
      'Psychology tracker',
      'Equity curve and drawdown',
      'Broker desk access',
      '5 backtest sessions',
      'Downloadable reports',
    ],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    monthly: 38,
    annual: 27,
    priceMonthly: 'price_1T9t9L2Ouddv7uen4DXuOatj',
    priceAnnual: 'price_1T9t9K2Ouddv7uennnWOJ44p',
    accent: '#FFD700',
    badge: 'Elite unlocks',
    desc: 'Adds the highest-access modules already live in the journal, plus Elite analytics overlays and operational tooling.',
    features: [
      'Everything in Pro',
      'AI assistant access',
      'Unlimited accounts',
      'Elite analytics overlays',
      'Alerts and notifications',
      'API access',
      '25 backtest sessions',
      'Priority support channel',
    ],
  },
];

const FEATURE_REEL_SCENES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    section: 'Command center',
    title: 'Daily review, account scope, and execution context.',
    desc: 'Start in one place, scan the desk state, then move directly into the next action instead of hopping between disconnected widgets.',
    stats: [
      { label: 'Net PnL', value: '$8,620', tone: 'positive', sub: '9 trading days in scope' },
      { label: 'Win rate', value: '68.4%', tone: 'neutral', sub: 'Rolling and cumulative' },
      { label: 'Max DD', value: '-$920', tone: 'negative', sub: 'Linked to equity' },
      { label: 'Workflow', value: '3/4', tone: 'accent', sub: 'Daily tasks completed' },
    ],
  },
  {
    id: 'all-trades',
    label: 'All Trades',
    section: 'Execution ledger',
    title: 'A table-first review flow for real execution work.',
    desc: 'Import fills, isolate a segment fast, then open the trade details without losing the broader ledger context.',
    rows: [
      ['EURUSD', 'London breakout', 'Long', '+$380'],
      ['BTCUSD', 'NY reclaim', 'Short', '+$650'],
      ['US30', 'Open drive', 'Long', '+$4,500'],
      ['GBPUSD', 'Pullback', 'Long', '-$120'],
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    section: 'Edge read',
    title: 'Win rate, drawdown, and timing readouts in one layer.',
    desc: 'Starter reads the basics, Pro goes deeper, and Elite overlays surface timing edge, setup edge, and confluence density faster.',
    bars: [46, 58, 52, 64, 49, 72, 61, 74, 68, 78],
    tags: ['Win rate', 'Setup edge', 'Timing edge', 'Drawdown'],
  },
  {
    id: 'psychology',
    label: 'Psychology',
    section: 'Behavior',
    title: 'Discipline, patience, confidence, and emotional control.',
    desc: 'The review is not just financial. Session quality and behavioral drift stay visible inside the same product loop.',
    meters: [
      { label: 'Discipline', value: 82, tone: 'positive' },
      { label: 'Patience', value: 76, tone: 'accent' },
      { label: 'Confidence', value: 71, tone: 'neutral' },
      { label: 'Risk control', value: 88, tone: 'positive' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    section: 'Performance map',
    title: 'A month view that makes winning and losing clusters obvious.',
    desc: 'Day selection, monthly flow, and fast context review make the calendar useful instead of decorative.',
    days: [
      ['04', '+$2.9k', 'positive'],
      ['09', '+$4.7k', 'positive'],
      ['16', '-$1.5k', 'negative'],
      ['24', '+$123', 'positive'],
      ['26', '+$608', 'positive'],
      ['29', '-$337', 'negative'],
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    section: 'Operations',
    title: 'Exports, alerts, and integrations that stay grounded.',
    desc: 'Operational modules stay available only where they already exist in the product, with exports tied to the current journal state.',
    cards: [
      { title: 'Report desk', meta: 'HTML report - CSV ledger - backup snapshot' },
      { title: 'Alerts', meta: 'Rule-based checks tied to journal data' },
      { title: 'API desk', meta: 'Live MT sync and market data routes only' },
    ],
  },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root {
    --lp-bg: #03060c;
    --lp-bg-soft: #09111d;
    --lp-card: rgba(10, 16, 27, 0.78);
    --lp-card-strong: rgba(12, 20, 34, 0.92);
    --lp-border: rgba(125, 150, 190, 0.16);
    --lp-border-soft: rgba(125, 150, 190, 0.08);
    --lp-text: #eef4ff;
    --lp-text-2: #a6b6d6;
    --lp-text-3: #6e81a7;
    --lp-accent: #06e6ff;
    --lp-accent-2: #00ff88;
    --lp-positive: #12e39b;
    --lp-negative: #ff6875;
    --lp-shadow: 0 26px 90px rgba(0, 0, 0, 0.38);
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    background: var(--lp-bg);
    color: var(--lp-text);
  }

  .lp-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at 12% 12%, rgba(6, 230, 255, 0.08), transparent 24%),
      radial-gradient(circle at 88% 16%, rgba(0, 255, 136, 0.05), transparent 20%),
      linear-gradient(180deg, #03060c 0%, #09111d 34%, #03060c 100%);
    overflow-x: hidden;
  }

  .lp-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    height: 78px;
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(3, 6, 12, 0.46);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .lp-nav.scrolled {
    background: rgba(3, 6, 12, 0.92);
    border-bottom-color: var(--lp-border);
  }

  .lp-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .lp-brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 11px;
    border: 1px solid rgba(6, 230, 255, 0.16);
    background: rgba(7, 14, 24, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.24);
  }

  .lp-brand-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 2px;
  }

  .lp-brand-wordmark {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .lp-brand-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-brand-title span {
    background: linear-gradient(90deg, #b5f2ff 0%, #06e6ff 48%, #00ff88 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lp-brand-sub {
    margin-top: 3px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .lp-nav-links a {
    padding: 10px 14px;
    border-radius: 999px;
    color: var(--lp-text-2);
    text-decoration: none;
    font-size: 13px;
    font-weight: 600;
    transition: color 0.18s ease, background 0.18s ease;
  }

  .lp-nav-links a:hover {
    color: var(--lp-text);
    background: rgba(255, 255, 255, 0.04);
  }

  .lp-nav-cta {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lp-btn-ghost,
  .lp-btn-primary,
  .lp-btn-secondary,
  .lp-btn-plan {
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  }

  .lp-btn-ghost {
    height: 42px;
    padding: 0 18px;
    border-radius: 999px;
    color: var(--lp-text);
    border: 1px solid var(--lp-border);
    background: transparent;
    font-size: 13px;
    font-weight: 700;
  }

  .lp-btn-primary {
    height: 46px;
    padding: 0 22px;
    border-radius: 999px;
    color: #041017;
    border: none;
    background: linear-gradient(135deg, #8ae9ff 0%, #06e6ff 44%, #00ff88 100%);
    box-shadow: 0 10px 34px rgba(6, 230, 255, 0.22);
    font-size: 14px;
    font-weight: 800;
  }

  .lp-btn-secondary,
  .lp-btn-plan {
    height: 46px;
    padding: 0 20px;
    border-radius: 999px;
    color: var(--lp-text);
    border: 1px solid var(--lp-border);
    background: rgba(255, 255, 255, 0.02);
    font-size: 14px;
    font-weight: 700;
  }

  .lp-btn-ghost:hover,
  .lp-btn-secondary:hover,
  .lp-btn-plan:hover {
    border-color: rgba(6, 230, 255, 0.22);
    color: #d9fbff;
    transform: translateY(-1px);
  }

  .lp-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 18px 40px rgba(6, 230, 255, 0.28);
  }

  .lp-section { padding: 100px 32px; }
  .lp-section-inner { max-width: 1240px; margin: 0 auto; }

  .lp-hero {
    position: relative;
    min-height: 100vh;
    padding: 128px 32px 72px;
    overflow: hidden;
  }

  .lp-hero-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .lp-hero-bg::before {
    content: '';
    position: absolute;
    inset: -18% -6% 36% -6%;
    background:
      radial-gradient(circle at 14% 18%, rgba(6, 230, 255, 0.14), transparent 28%),
      radial-gradient(circle at 86% 12%, rgba(18, 227, 155, 0.12), transparent 24%),
      radial-gradient(circle at 54% 34%, rgba(120, 160, 255, 0.08), transparent 34%);
    filter: blur(34px);
    opacity: 0.9;
  }

  .lp-hero-grid {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(rgba(142, 165, 202, 0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(142, 165, 202, 0.04) 1px, transparent 1px);
    background-size: 112px 112px, 112px 112px;
    opacity: 0.28;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.08) 72%, transparent);
  }

  .lp-hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1240px;
    margin: 0 auto;
    text-align: left;
  }

  .lp-hero-copy {
    position: relative;
    z-index: 2;
    max-width: 920px;
  }

  .lp-overline {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.18);
    background: rgba(6, 230, 255, 0.05);
    color: #a9f0ff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 22px;
    backdrop-filter: blur(10px);
  }

  .lp-overline::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    box-shadow: 0 0 16px rgba(6, 230, 255, 0.5);
  }

  .lp-hero-title {
    max-width: 860px;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(46px, 7vw, 88px);
    line-height: 0.95;
    letter-spacing: -0.06em;
    color: var(--lp-text);
  }

  .lp-hero-title span {
    background: linear-gradient(180deg, #f7fbff 0%, #d6f7ff 42%, #9de8ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .lp-hero-sub {
    margin: 22px 0 0;
    max-width: 760px;
    color: var(--lp-text-2);
    font-size: 18px;
    line-height: 1.8;
  }

  .lp-hero-note {
    margin-top: 14px;
    max-width: 760px;
    color: var(--lp-text-3);
    font-size: 13px;
    line-height: 1.8;
  }

  .lp-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .lp-hero-micro {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .lp-hero-micro-item {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(7, 12, 22, 0.46);
    color: var(--lp-text-2);
    font-size: 12px;
    font-weight: 600;
    backdrop-filter: blur(10px);
  }

  .lp-hero-micro-item::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    box-shadow: 0 0 14px rgba(6, 230, 255, 0.3);
  }

  .lp-hero-preview-shell {
    position: relative;
    margin-top: 52px;
    padding-top: 56px;
  }

  .lp-hero-preview-shell::before {
    content: '';
    position: absolute;
    inset: 0 8% auto;
    height: 220px;
    background: linear-gradient(180deg, rgba(6, 230, 255, 0), rgba(6, 230, 255, 0.08) 38%, rgba(0, 255, 136, 0.06) 62%, rgba(4, 7, 13, 0) 100%);
    filter: blur(36px);
    pointer-events: none;
  }

  .lp-prop-floating-wrap {
    position: absolute;
    inset: 80px 0 auto;
    pointer-events: none;
    overflow: hidden;
    opacity: 0.9;
  }

  .lp-prop-floating-head {
    max-width: 1240px;
    margin: 0 auto 14px;
    padding: 0 32px;
    display: flex;
    justify-content: flex-end;
    gap: 16px;
    align-items: center;
  }

  .lp-prop-floating-head strong {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(206, 223, 255, 0.56);
  }

  .lp-prop-floating-head span {
    font-size: 11px;
    color: rgba(150, 170, 206, 0.54);
  }

  .lp-prop-marquee-floating {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .lp-prop-marquee-floating::before,
  .lp-prop-marquee-floating::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 180px;
    z-index: 1;
  }

  .lp-prop-marquee-floating::before {
    left: 0;
    background: linear-gradient(90deg, rgba(3,6,12,0.96), rgba(3,6,12,0));
  }

  .lp-prop-marquee-floating::after {
    right: 0;
    background: linear-gradient(270deg, rgba(3,6,12,0.96), rgba(3,6,12,0));
  }

  .lp-prop-marquee-track {
    display: flex;
    width: max-content;
    animation: lpPropMove 34s linear infinite;
    padding: 0 20px;
  }

  .lp-prop-marquee-track:hover { animation-play-state: paused; }

  @keyframes lpPropMove {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .lp-prop-item {
    margin-right: 12px;
    padding: 11px 15px;
    border-radius: 999px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(125, 150, 190, 0.08);
    color: rgba(226, 236, 255, 0.82);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    backdrop-filter: blur(10px);
  }

  .lp-window {
    position: relative;
    z-index: 1;
    border-radius: 30px;
    overflow: hidden;
    border: 1px solid rgba(125, 150, 190, 0.18);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
      rgba(6, 12, 21, 0.92);
    box-shadow: var(--lp-shadow);
  }

  .lp-window-top {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 56px;
    padding: 0 20px;
    border-bottom: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(6, 10, 18, 0.94);
  }

  .lp-window-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
  }

  .lp-window-label {
    margin-left: 10px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-window-body {
    display: grid;
    grid-template-columns: 190px minmax(0, 1fr);
    min-height: 560px;
  }

  .lp-sidebar {
    padding: 18px 14px;
    border-right: 1px solid rgba(125, 150, 190, 0.12);
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0));
  }

  .lp-sidebar-group { margin-top: 18px; }
  .lp-sidebar-label {
    margin: 0 0 10px 4px;
    color: var(--lp-text-3);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .lp-sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    border-radius: 14px;
    color: var(--lp-text-2);
    font-size: 13px;
    font-weight: 600;
    background: transparent;
  }

  .lp-sidebar-link.active {
    color: var(--lp-text);
    background: rgba(6, 230, 255, 0.08);
    border: 1px solid rgba(6, 230, 255, 0.14);
  }

  .lp-sidebar-icon {
    width: 28px;
    height: 28px;
    border-radius: 9px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--lp-text-3);
    background: rgba(255, 255, 255, 0.02);
    flex-shrink: 0;
  }

  .lp-sidebar-link.active .lp-sidebar-icon {
    color: #c8f8ff;
    border-color: rgba(6, 230, 255, 0.22);
    background: rgba(6, 230, 255, 0.08);
  }

  .lp-main {
    padding: 22px;
  }

  .lp-reel-shell {
    display: grid;
    gap: 16px;
  }

  .lp-reel-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    align-items: end;
  }

  .lp-reel-overline {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-reel-head strong {
    display: block;
    margin-top: 6px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 28px;
    line-height: 1.02;
    letter-spacing: -0.05em;
    color: var(--lp-text);
    max-width: 560px;
  }

  .lp-reel-head p {
    margin: 10px 0 0;
    max-width: 600px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--lp-text-2);
  }

  .lp-reel-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .lp-reel-nav button {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(255, 255, 255, 0.02);
    color: var(--lp-text-2);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  }

  .lp-reel-nav button:hover {
    border-color: rgba(6, 230, 255, 0.16);
    color: #dffbff;
    background: rgba(255,255,255,0.04);
  }

  .lp-reel-nav button.active {
    border-color: rgba(6, 230, 255, 0.2);
    background: rgba(6, 230, 255, 0.08);
    color: #d0fbff;
  }

  .lp-reel-stage {
    min-height: 320px;
    padding: 18px;
    border-radius: 24px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background:
      radial-gradient(circle at top right, rgba(6, 230, 255, 0.08), transparent 26%),
      linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)),
      rgba(9, 15, 26, 0.9);
    overflow: hidden;
  }

  .lp-reel-screen {
    height: 100%;
  }

  .lp-scene-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    height: 100%;
  }

  .lp-scene-grid.analytics {
    grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
  }

  .lp-scene-card {
    min-height: 118px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.025);
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .lp-scene-card:hover {
    transform: translateY(-3px);
    border-color: rgba(6, 230, 255, 0.16);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
  }

  .lp-scene-card.wide {
    min-height: 254px;
  }

  .lp-scene-card.positive {
    border-color: rgba(18, 227, 155, 0.2);
    background: linear-gradient(180deg, rgba(18, 227, 155, 0.12), rgba(18, 227, 155, 0.04));
  }

  .lp-scene-card.negative {
    border-color: rgba(255, 104, 117, 0.18);
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.1), rgba(255, 104, 117, 0.03));
  }

  .lp-scene-card.accent {
    border-color: rgba(6, 230, 255, 0.18);
    background: linear-gradient(180deg, rgba(6, 230, 255, 0.1), rgba(6, 230, 255, 0.03));
  }

  .lp-scene-kicker {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-scene-value {
    display: block;
    margin-top: 14px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 26px;
    line-height: 1;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-scene-sub {
    margin-top: 8px;
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-scene-list {
    display: grid;
    gap: 10px;
  }

  .lp-scene-list-row {
    display: grid;
    grid-template-columns: 1.1fr 1fr 0.8fr auto;
    gap: 10px;
    align-items: center;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(125, 150, 190, 0.08);
    color: var(--lp-text-2);
    font-size: 12px;
    transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
  }

  .lp-scene-list-row:hover {
    transform: translateX(4px);
    border-color: rgba(6, 230, 255, 0.16);
    background: rgba(255,255,255,0.04);
  }

  .lp-scene-list-row strong {
    color: var(--lp-text);
  }

  .lp-scene-bars {
    height: 188px;
    margin-top: 18px;
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .lp-scene-bar {
    flex: 1;
    border-radius: 10px 10px 3px 3px;
    background: linear-gradient(180deg, rgba(6, 230, 255, 0.9), rgba(6, 230, 255, 0.16));
    transform-origin: bottom center;
    animation: lpBarPulse 2.8s ease-in-out infinite;
  }

  .lp-scene-bar.negative {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.9), rgba(255, 104, 117, 0.16));
  }

  @keyframes lpBarPulse {
    0%, 100% { transform: scaleY(0.96); opacity: 0.86; }
    50% { transform: scaleY(1.04); opacity: 1; }
  }

  .lp-scene-tag-grid {
    margin-top: 16px;
    display: grid;
    gap: 10px;
  }

  .lp-scene-tag {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.03);
    color: var(--lp-text);
    font-size: 12px;
    font-weight: 700;
    transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
  }

  .lp-scene-tag:hover {
    transform: translateX(4px);
    border-color: rgba(6, 230, 255, 0.16);
    background: rgba(6, 230, 255, 0.08);
  }

  .lp-scene-meter-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
  }

  .lp-scene-meter-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--lp-text);
  }

  .lp-scene-meter {
    position: relative;
    margin-top: 18px;
    height: 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
  }

  .lp-scene-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #8ae9ff 0%, #06e6ff 54%, #00ff88 100%);
    box-shadow: 0 0 22px rgba(6, 230, 255, 0.22);
  }

  .lp-scene-calendar {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
  }

  .lp-scene-calendar-cell {
    min-height: 92px;
    padding: 12px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.025);
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .lp-scene-calendar-cell:hover {
    transform: translateY(-3px);
    border-color: rgba(6, 230, 255, 0.16);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
  }

  .lp-scene-calendar-cell strong {
    display: block;
    font-size: 12px;
    color: var(--lp-text);
  }

  .lp-scene-calendar-cell span {
    display: block;
    margin-top: 18px;
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-scene-calendar-cell.positive {
    background: linear-gradient(180deg, rgba(18, 227, 155, 0.18), rgba(18, 227, 155, 0.06));
    border-color: rgba(18, 227, 155, 0.2);
  }

  .lp-scene-calendar-cell.negative {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.16), rgba(255, 104, 117, 0.05));
    border-color: rgba(255, 104, 117, 0.18);
  }

  .lp-scene-calendar-cell.neutral {
    opacity: 0.72;
  }

  .lp-reel-footer {
    display: grid;
    gap: 12px;
  }

  .lp-reel-progress {
    height: 5px;
    border-radius: 999px;
    background: rgba(255,255,255,0.05);
    overflow: hidden;
  }

  .lp-reel-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #8ae9ff 0%, #06e6ff 45%, #00ff88 100%);
    box-shadow: 0 0 18px rgba(6, 230, 255, 0.22);
    transition: width 0.28s ease;
  }

  .lp-reel-film {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
  }

  .lp-reel-film-item {
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid rgba(125, 150, 190, 0.08);
    background: rgba(255,255,255,0.025);
    transition: transform 0.22s ease, border-color 0.22s ease, background 0.22s ease;
  }

  .lp-reel-film-item:hover {
    transform: translateY(-2px);
    border-color: rgba(6, 230, 255, 0.16);
    background: rgba(255,255,255,0.04);
  }

  .lp-reel-film-item.active {
    border-color: rgba(6, 230, 255, 0.16);
    background: rgba(6, 230, 255, 0.06);
  }

  .lp-reel-film-item span {
    display: block;
    font-size: 10px;
    color: var(--lp-text-3);
  }

  .lp-reel-film-item strong {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: var(--lp-text);
  }

  .lp-panel {
    border-radius: 22px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(8, 13, 22, 0.84);
  }

  .lp-command {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px;
    margin-bottom: 16px;
  }

  .lp-command-copy {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .lp-command-copy span {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-command-copy strong {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.04em;
    color: var(--lp-text);
    max-width: 620px;
  }

  .lp-command-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
  }

  .lp-pill {
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background: rgba(255, 255, 255, 0.02);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lp-text-2);
  }

  .lp-pill.accent {
    color: #d0fbff;
    border-color: rgba(6, 230, 255, 0.18);
    background: rgba(6, 230, 255, 0.08);
  }

  .lp-kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .lp-kpi-card {
    padding: 16px;
  }

  .lp-kpi-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-kpi-value {
    margin-top: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-kpi-meta {
    margin-top: 7px;
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-positive { color: var(--lp-positive); }
  .lp-negative { color: var(--lp-negative); }

  .lp-preview-grid {
    display: grid;
    grid-template-columns: 1.08fr 0.92fr;
    gap: 16px;
  }

  .lp-calendar-panel,
  .lp-side-card,
  .lp-showcase-card,
  .lp-feature-card,
  .lp-module-card,
  .lp-pricing-card,
  .lp-faq-item {
    border-radius: 20px;
    border: 1px solid rgba(125, 150, 190, 0.12);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)),
      rgba(10, 16, 27, 0.84);
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.2);
  }

  .lp-calendar-panel { padding: 16px; }
  .lp-calendar-head,
  .lp-mini-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .lp-calendar-title,
  .lp-mini-head strong {
    font-size: 14px;
    font-weight: 700;
    color: var(--lp-text);
  }

  .lp-calendar-meta,
  .lp-mini-head span {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .lp-day {
    min-height: 74px;
    padding: 10px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.02);
  }

  .lp-day.win {
    background: linear-gradient(180deg, rgba(18, 227, 155, 0.18), rgba(18, 227, 155, 0.08));
    border-color: rgba(18, 227, 155, 0.22);
  }

  .lp-day.loss {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.16), rgba(255, 104, 117, 0.06));
    border-color: rgba(255, 104, 117, 0.2);
  }

  .lp-day.muted { opacity: 0.55; }

  .lp-day-number {
    font-size: 11px;
    font-weight: 700;
    color: var(--lp-text-2);
  }

  .lp-day-value {
    margin-top: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--lp-text);
  }

  .lp-day-caption {
    margin-top: 6px;
    font-size: 10px;
    color: var(--lp-text-3);
  }

  .lp-side-stack {
    display: grid;
    gap: 16px;
  }

  .lp-side-card { padding: 16px; }

  .lp-checklist {
    display: grid;
    gap: 10px;
  }

  .lp-check-item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(125, 150, 190, 0.08);
  }

  .lp-check-copy {
    display: flex;
    gap: 10px;
  }

  .lp-check-bullet {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.22);
    background: rgba(6, 230, 255, 0.08);
    flex-shrink: 0;
  }

  .lp-check-copy strong {
    display: block;
    font-size: 12px;
    color: var(--lp-text);
  }

  .lp-check-copy span {
    display: block;
    margin-top: 3px;
    font-size: 11px;
    color: var(--lp-text-3);
  }

  .lp-check-badge {
    padding: 6px 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid rgba(18, 227, 155, 0.2);
    background: rgba(18, 227, 155, 0.12);
    color: #cbfbf2;
    white-space: nowrap;
  }

  .lp-ledger {
    display: grid;
    gap: 8px;
  }

  .lp-ledger-row {
    display: grid;
    grid-template-columns: 1.25fr 1fr 0.75fr 0.8fr;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(125, 150, 190, 0.08);
    font-size: 11px;
    color: var(--lp-text-2);
  }

  .lp-ledger-row strong {
    color: var(--lp-text);
    font-weight: 600;
  }

  .lp-section-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 999px;
    border: 1px solid rgba(6, 230, 255, 0.14);
    background: rgba(6, 230, 255, 0.05);
    color: #9fe8ff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .lp-section h2 {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(34px, 4vw, 54px);
    line-height: 1.04;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-section-sub {
    margin: 16px 0 0;
    max-width: 760px;
    color: var(--lp-text-2);
    font-size: 16px;
    line-height: 1.8;
  }

  .lp-features-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 48px;
  }

  .lp-feature-card,
  .lp-module-card {
    padding: 22px;
  }

  .lp-feature-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 18px;
  }

  .lp-icon-chip {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid rgba(6, 230, 255, 0.14);
    background: rgba(6, 230, 255, 0.08);
    color: #c8f8ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .lp-feature-card h3,
  .lp-module-card h3,
  .lp-showcase-card h3,
  .lp-pricing-card h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: var(--lp-text);
  }

  .lp-feature-card p,
  .lp-module-card p,
  .lp-showcase-card p,
  .lp-pricing-card p {
    margin: 10px 0 0;
    font-size: 14px;
    line-height: 1.75;
    color: var(--lp-text-2);
  }

  .lp-module-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 48px;
  }

  .lp-module-overline {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
    margin-bottom: 14px;
  }

  .lp-points {
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 9px;
  }

  .lp-points li {
    display: flex;
    gap: 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--lp-text-2);
  }

  .lp-points li::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    margin-top: 7px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    flex-shrink: 0;
  }

  .lp-showcase-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-top: 46px;
  }

  .lp-showcase-card {
    padding: 20px;
    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
  }

  .lp-showcase-card:hover,
  .lp-feature-card:hover,
  .lp-module-card:hover,
  .lp-pricing-card:hover {
    transform: translateY(-4px);
    border-color: rgba(6, 230, 255, 0.18);
    box-shadow: 0 24px 70px rgba(0,0,0,0.26);
  }

  .lp-chart-bars {
    height: 190px;
    display: flex;
    align-items: flex-end;
    gap: 7px;
    margin-top: 16px;
  }

  .lp-bar {
    flex: 1;
    border-radius: 8px 8px 2px 2px;
    background: linear-gradient(180deg, rgba(6, 230, 255, 0.85), rgba(6, 230, 255, 0.16));
    transition: transform 0.28s ease, opacity 0.28s ease;
    transform-origin: bottom center;
  }

  .lp-bar.negative {
    background: linear-gradient(180deg, rgba(255, 104, 117, 0.9), rgba(255, 104, 117, 0.15));
  }

  .lp-showcase-card:hover .lp-bar {
    transform: scaleY(1.08) translateY(-2px);
  }

  .lp-mini-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-top: 16px;
  }

  .lp-mini-box {
    padding: 16px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.02);
  }

  .lp-mini-box span {
    display: block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-mini-box strong {
    display: block;
    margin-top: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.04em;
    color: var(--lp-text);
  }

  .lp-pricing-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 18px;
  }

  .lp-billing-toggle {
    display: inline-flex;
    align-items: center;
    padding: 3px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
  }

  .lp-billing-toggle button {
    border: none;
    background: transparent;
    color: var(--lp-text-2);
    font-family: 'Inter', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 999px;
    cursor: pointer;
  }

  .lp-billing-toggle button.active {
    background: #06e6ff;
    color: #031018;
  }

  .lp-billing-note {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #8bf6d2;
  }

  .lp-price-support {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .lp-price-rail-item {
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.025);
  }

  .lp-price-rail-item span {
    display: block;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text-3);
  }

  .lp-price-rail-item strong {
    display: block;
    margin-top: 8px;
    font-size: 14px;
    color: var(--lp-text);
  }

  .lp-pricing-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-top: 36px;
    align-items: stretch;
  }

  .lp-pricing-card {
    padding: 26px 24px;
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .lp-pricing-card.popular {
    border-color: rgba(6, 230, 255, 0.26);
    box-shadow: 0 0 0 1px rgba(6, 230, 255, 0.12), 0 22px 70px rgba(0,0,0,0.26);
  }

  .lp-pricing-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
  }

  .lp-plan-badge {
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c8f8ff;
    border: 1px solid rgba(6, 230, 255, 0.18);
    background: rgba(6, 230, 255, 0.08);
    white-space: nowrap;
  }

  .lp-price {
    margin-top: 18px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-price small {
    font-size: 15px;
    color: var(--lp-text-3);
    letter-spacing: 0;
  }

  .lp-price-line {
    font-size: 12px;
    color: var(--lp-text-3);
    margin-top: 8px;
  }

  .lp-save {
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid rgba(18, 227, 155, 0.18);
    background: rgba(18, 227, 155, 0.08);
    color: #8ff0ca;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .lp-price-feats {
    list-style: none;
    padding: 0;
    margin: 22px 0 26px;
    display: grid;
    gap: 10px;
    flex: 1;
  }

  .lp-card-foot {
    margin: 0 0 18px;
    font-size: 11.5px;
    color: var(--lp-text-3);
    line-height: 1.7;
  }

  .lp-price-feats li {
    display: flex;
    gap: 10px;
    color: var(--lp-text-2);
    font-size: 13px;
    line-height: 1.6;
  }

  .lp-price-feats li::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 999px;
    margin-top: 7px;
    background: linear-gradient(135deg, #8ae9ff, #00ff88);
    flex-shrink: 0;
  }

  .lp-faq-list {
    margin-top: 42px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 860px;
  }

  .lp-faq-item {
    overflow: hidden;
    transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
  }

  .lp-faq-item:hover {
    transform: translateY(-2px);
    border-color: rgba(6, 230, 255, 0.16);
    box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
  }

  .lp-faq-q {
    padding: 18px 22px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    font-size: 14.5px;
    font-weight: 700;
    color: var(--lp-text);
  }

  .lp-faq-arrow {
    color: var(--lp-text-3);
    font-size: 18px;
    transition: transform 0.24s ease, color 0.24s ease;
  }

  .lp-faq-item.open .lp-faq-arrow {
    transform: rotate(45deg);
    color: #bff3ff;
  }

  .lp-faq-a {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.28s ease;
  }

  .lp-faq-item.open .lp-faq-a {
    max-height: 240px;
  }

  .lp-faq-a-inner {
    padding: 0 22px 18px;
    font-size: 13.5px;
    color: var(--lp-text-2);
    line-height: 1.75;
  }

  .lp-cta {
    padding: 90px 32px;
    text-align: center;
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }

  .lp-cta-inner { max-width: 920px; margin: 0 auto; }

  .lp-cta h2 {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(36px, 4vw, 58px);
    line-height: 1.04;
    letter-spacing: -0.05em;
    color: var(--lp-text);
  }

  .lp-cta p {
    margin: 16px auto 0;
    max-width: 720px;
    font-size: 16px;
    color: var(--lp-text-2);
    line-height: 1.8;
  }

  .lp-cta-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .lp-footer {
    padding: 62px 32px 30px;
    border-top: 1px solid rgba(255,255,255,0.04);
  }

  .lp-footer-inner { max-width: 1240px; margin: 0 auto; }

  .lp-footer-top {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 36px;
    margin-bottom: 38px;
  }

  .lp-footer-brand p {
    margin-top: 12px;
    max-width: 340px;
    color: var(--lp-text-3);
    font-size: 12.5px;
    line-height: 1.75;
  }

  .lp-footer-col h4 {
    margin: 0 0 12px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--lp-text-2);
  }

  .lp-footer-col a,
  .lp-footer-col button {
    display: block;
    margin-bottom: 9px;
    color: var(--lp-text-3);
    text-decoration: none;
    font: inherit;
    font-size: 12.5px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .lp-footer-col a:hover,
  .lp-footer-col button:hover {
    color: var(--lp-text);
  }

  .lp-footer-bottom {
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .lp-footer-bottom p {
    margin: 0;
    color: var(--lp-text-3);
    font-size: 11.5px;
  }

  .lp-social-row {
    display: flex;
    gap: 8px;
  }

  .lp-social-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--lp-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--lp-text-3);
    text-decoration: none;
    background: transparent;
    font-size: 12px;
    font-weight: 700;
  }

  .lp-social-btn:hover {
    border-color: rgba(6, 230, 255, 0.22);
    color: #d9fbff;
  }

  .lp-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(2, 4, 10, 0.85);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .lp-modal {
    width: min(680px, calc(100vw - 32px));
    max-height: 80vh;
    overflow: auto;
    border-radius: 20px;
    border: 1px solid rgba(125, 150, 190, 0.16);
    background: linear-gradient(160deg, #0c1830, #080f1e);
    box-shadow: 0 28px 90px rgba(0,0,0,0.52);
  }

  .lp-modal-header {
    padding: 24px 28px 18px;
    border-bottom: 1px solid rgba(125, 150, 190, 0.14);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .lp-modal-header h3 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: var(--lp-text);
  }

  .lp-modal-header p {
    margin: 6px 0 0;
    color: var(--lp-text-3);
    font-size: 12px;
  }

  .lp-modal-close {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid rgba(125, 150, 190, 0.14);
    background: transparent;
    color: var(--lp-text-2);
    font-size: 16px;
    cursor: pointer;
  }

  .lp-modal-body {
    padding: 24px 28px;
    display: grid;
    gap: 14px;
  }

  .lp-modal-item {
    color: var(--lp-text-2);
    font-size: 13.5px;
    line-height: 1.7;
  }

  .lp-modal-section {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(125, 150, 190, 0.1);
    background: rgba(255,255,255,0.02);
  }

  .lp-modal-section strong {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--lp-text);
  }

  .lp-modal-section-list {
    display: grid;
    gap: 10px;
  }

  @media (max-width: 1180px) {
    .lp-features-grid,
    .lp-module-grid,
    .lp-pricing-grid,
    .lp-showcase-grid,
    .lp-preview-grid {
      grid-template-columns: 1fr;
    }

    .lp-window-body {
      grid-template-columns: 1fr;
    }

    .lp-reel-head,
    .lp-scene-grid.analytics,
    .lp-reel-film {
      grid-template-columns: 1fr;
    }

    .lp-price-support {
      grid-template-columns: 1fr;
    }

    .lp-sidebar {
      border-right: none;
      border-bottom: 1px solid rgba(125, 150, 190, 0.12);
    }
  }

  @media (max-width: 920px) {
    .lp-nav {
      padding: 0 18px;
    }

    .lp-nav-links {
      display: none;
    }

    .lp-section,
    .lp-hero,
    .lp-cta,
    .lp-footer {
      padding-left: 20px;
      padding-right: 20px;
    }

    .lp-prop-floating-head {
      padding: 0 20px;
      justify-content: flex-start;
    }

    .lp-command {
      flex-direction: column;
      align-items: flex-start;
    }

    .lp-command-pills {
      justify-content: flex-start;
    }

    .lp-kpi-grid {
      grid-template-columns: 1fr;
    }

    .lp-calendar-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .lp-scene-grid,
    .lp-scene-calendar {
      grid-template-columns: 1fr 1fr;
    }

    .lp-footer-top {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 720px) {
    .lp-nav-cta {
      display: none;
    }

    .lp-hero-title {
      font-size: clamp(38px, 12vw, 56px);
    }

    .lp-prop-floating-head {
      display: none;
    }

    .lp-calendar-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lp-scene-grid,
    .lp-scene-calendar {
      grid-template-columns: 1fr;
    }

    .lp-day {
      min-height: 68px;
    }

    .lp-ledger-row {
      grid-template-columns: 1fr;
    }

    .lp-reel-stage {
      min-height: auto;
    }

    .lp-scene-list-row {
      grid-template-columns: 1fr;
    }

    .lp-footer-top {
      grid-template-columns: 1fr;
    }
  }
`;

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useReveal();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(26px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Icon({ name, size = 18 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.6',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (name) {
    case 'journal':
      return (
        <svg {...shared}>
          <rect x="3" y="3" width="14" height="14" rx="3" />
          <path d="M6.5 7h7" />
          <path d="M6.5 10h7" />
          <path d="M6.5 13h4.5" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...shared}>
          <path d="M4 15l3.2-4.2 2.8 2.7 5-6" />
          <path d="M15 4h-3.5V7.5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...shared}>
          <rect x="3" y="4" width="14" height="13" rx="2.4" />
          <path d="M6 2.8v2.6" />
          <path d="M14 2.8v2.6" />
          <path d="M3 8h14" />
        </svg>
      );
    case 'psychology':
      return (
        <svg {...shared}>
          <path d="M10 3.2c3.1 0 5.6 2.5 5.6 5.6 0 2.5-1.5 4.5-3.8 5.3-.5.2-.8.6-.8 1.1v.8H9v-.8c0-.5-.3-.9-.8-1.1-2.3-.8-3.8-2.8-3.8-5.3 0-3.1 2.5-5.6 5.6-5.6z" />
          <path d="M8 8.4c.4-.9 1.1-1.4 2-1.4 1.2 0 2 1 2 2.1 0 1.4-1.1 2.1-2 2.9" />
          <path d="M10 14.8v.1" />
        </svg>
      );
    case 'backtest':
      return (
        <svg {...shared}>
          <path d="M4 4v12" />
          <path d="M8 16V9" />
          <path d="M12 16V6" />
          <path d="M16 16V11" />
          <path d="M6 6.5l7-3.5v7z" />
        </svg>
      );
    case 'stack':
      return (
        <svg {...shared}>
          <path d="M4 6l6-3 6 3-6 3z" />
          <path d="M4 10l6 3 6-3" />
          <path d="M4 14l6 3 6-3" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <circle cx="10" cy="10" r="5" />
        </svg>
      );
  }
}

function AnimatedCandleBg() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let candles = [];

    const createCandle = (x, previousClose = 0.52) => {
      const drift = (Math.random() - 0.5) * 0.18;
      const open = Math.min(0.82, Math.max(0.18, previousClose + drift));
      const close = Math.min(0.82, Math.max(0.18, open + (Math.random() - 0.5) * 0.22));
      const high = Math.min(0.9, Math.max(open, close) + Math.random() * 0.1);
      const low = Math.max(0.1, Math.min(open, close) - Math.random() * 0.1);
      return {
        x,
        width: 8 + Math.random() * 3,
        speed: 0.36 + Math.random() * 0.22,
        open,
        close,
        high,
        low,
      };
    };

    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      candles = [];
      let x = -60;
      let previous = 0.52;
      while (x < width + 120) {
        const candle = createCandle(x, previous);
        candles.push(candle);
        previous = candle.close;
        x += 16 + Math.random() * 10;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < 7; i += 1) {
        const y = ((i + 1) / 8) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.strokeStyle = 'rgba(154, 178, 219, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < 9; i += 1) {
        const x = ((i + 1) / 10) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.strokeStyle = 'rgba(154, 178, 219, 0.03)';
        ctx.stroke();
      }

      ctx.beginPath();
      candles.forEach((candle, index) => {
        const y = height * (1 - candle.close);
        if (index === 0) ctx.moveTo(candle.x, y);
        else ctx.lineTo(candle.x, y);
      });
      ctx.strokeStyle = 'rgba(111, 223, 255, 0.12)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      candles.forEach((candle, index) => {
        candle.x -= candle.speed;
        if (candle.x < -36) {
          const last = candles[(index - 1 + candles.length) % candles.length];
          const recycled = createCandle(Math.max(width + 20, last.x + 24), last.close);
          Object.assign(candle, recycled);
        }

        const bullish = candle.close >= candle.open;
        const color = bullish ? 'rgba(18, 227, 155, 0.78)' : 'rgba(255, 104, 117, 0.78)';
        const fill = bullish ? 'rgba(18, 227, 155, 0.16)' : 'rgba(255, 104, 117, 0.14)';
        const openY = height * (1 - candle.open);
        const closeY = height * (1 - candle.close);
        const highY = height * (1 - candle.high);
        const lowY = height * (1 - candle.low);
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(4, Math.abs(closeY - openY));

        ctx.beginPath();
        ctx.moveTo(candle.x, highY);
        ctx.lineTo(candle.x, lowY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = fill;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(candle.x - candle.width / 2, bodyTop, candle.width, bodyHeight, 3);
        ctx.fill();
        ctx.stroke();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block', opacity: 0.9 }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(3,6,12,0.92) 0%, rgba(3,6,12,0.26) 28%, rgba(3,6,12,0.14) 56%, rgba(3,6,12,0.88) 100%), linear-gradient(180deg, rgba(3,6,12,0.08) 0%, rgba(3,6,12,0.32) 62%, rgba(3,6,12,0.92) 100%)',
        }}
      />
    </div>
  );
}

function PageModal({ page, onClose }) {
  const content = PAGE_CONTENT[page];
  if (!content) return null;

  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={(event) => event.stopPropagation()}>
        <div className="lp-modal-header">
          <div>
            <h3>{content.title}</h3>
            <p>{content.subtitle}</p>
          </div>
          <button className="lp-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="lp-modal-body">
          {(content.sections || []).map((section) => (
            <div key={section.title} className="lp-modal-section">
              <strong>{section.title}</strong>
              <div className="lp-modal-section-list">
                {section.items.map((item) => (
                  <div key={item} className="lp-modal-item">{item}</div>
                ))}
              </div>
            </div>
          ))}
          {(content.items || []).map((item) => (
            <div key={item} className="lp-modal-item">{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureScene({ scene }) {
  if (scene.id === 'dashboard') {
    return (
      <div className="lp-scene-grid">
        {scene.stats.map((stat) => (
          <div key={stat.label} className={`lp-scene-card ${stat.tone}`}>
            <span className="lp-scene-kicker">{stat.label}</span>
            <strong className="lp-scene-value">{stat.value}</strong>
            <div className="lp-scene-sub">{stat.sub}</div>
          </div>
        ))}
      </div>
    );
  }

  if (scene.id === 'all-trades') {
    return (
      <div className="lp-scene-list">
        {scene.rows.map((row) => (
          <div key={row.join('-')} className="lp-scene-list-row">
            <strong>{row[0]}</strong>
            <span>{row[1]}</span>
            <span>{row[2]}</span>
            <strong className={String(row[3]).startsWith('-') ? 'lp-negative' : 'lp-positive'}>{row[3]}</strong>
          </div>
        ))}
      </div>
    );
  }

  if (scene.id === 'analytics') {
    return (
      <div className="lp-scene-grid analytics">
        <div className="lp-scene-card wide">
          <span className="lp-scene-kicker">Animated analytics surface</span>
          <div className="lp-scene-bars">
            {scene.bars.map((bar, index) => (
              <div
                key={String(bar) + String(index)}
                className={`lp-scene-bar ${index === 3 || index === 8 ? 'negative' : ''}`}
                style={{ height: `${bar}%` }}
              />
            ))}
          </div>
        </div>
        <div className="lp-scene-card">
          <span className="lp-scene-kicker">Readouts</span>
          <div className="lp-scene-tag-grid">
            {scene.tags.map((tag) => (
              <div key={tag} className="lp-scene-tag">{tag}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (scene.id === 'psychology') {
    return (
      <div className="lp-scene-grid">
        {scene.meters.map((meter) => (
          <div key={meter.label} className={`lp-scene-card ${meter.tone}`}>
            <div className="lp-scene-meter-head">
              <span className="lp-scene-kicker">{meter.label}</span>
              <strong className="lp-scene-meter-value">{meter.value}/100</strong>
            </div>
            <div className="lp-scene-meter">
              <span style={{ width: `${meter.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (scene.id === 'calendar') {
    return (
      <div className="lp-scene-calendar">
        {Array.from({ length: 14 }, (_, index) => {
          const hit = scene.days[index % scene.days.length];
          const active = [1, 4, 8, 10, 11, 13].includes(index);
          return (
            <div
              key={String(index)}
              className={`lp-scene-calendar-cell ${active ? hit[2] : 'neutral'}`}
            >
              <strong>{active ? hit[0] : String(index + 1).padStart(2, '0')}</strong>
              <span>{active ? hit[1] : '-'}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="lp-scene-grid">
      {scene.cards.map((card) => (
        <div key={card.title} className="lp-scene-card">
          <span className="lp-scene-kicker">{card.title}</span>
          <strong className="lp-scene-value" style={{ fontSize: 20 }}>{card.meta}</strong>
        </div>
      ))}
    </div>
  );
}

function AmbientPropRibbon() {
  const propLoop = [...PROP_FIRMS, ...PROP_FIRMS];

  return (
    <div className="lp-prop-floating-wrap" aria-hidden="true">
      <div className="lp-prop-floating-head">
        <strong>Known prop environments traders actually recognize</strong>
        <span>Shown as examples only, not as endorsements or partnerships.</span>
      </div>
      <div className="lp-prop-marquee-floating">
        <div className="lp-prop-marquee-track">
          {propLoop.map((name, index) => (
            <div key={name + String(index)} className="lp-prop-item">{name}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = FEATURE_REEL_SCENES[sceneIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % FEATURE_REEL_SCENES.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="lp-hero-preview-shell">
      <motion.div
        className="lp-window"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4, scale: 1.003 }}
      >
        <div className="lp-window-top">
          <div className="lp-window-dot" />
          <div className="lp-window-dot" />
          <div className="lp-window-dot" />
          <div className="lp-window-label">Live MarketFlow workspace preview</div>
        </div>

        <div className="lp-window-body">
          <aside className="lp-sidebar">
            <div className="lp-brand" style={{ cursor: 'default' }}>
              <div className="lp-brand-mark">
                <img src="/logo192.png" alt="MarketFlow" />
              </div>
              <div className="lp-brand-wordmark">
                <div className="lp-brand-title">Market<span>Flow</span></div>
                <div className="lp-brand-sub">Journal</div>
              </div>
            </div>

            <div className="lp-sidebar-group">
              <div className="lp-sidebar-label">Core</div>
              <div className="lp-sidebar-link active">
                <div className="lp-sidebar-icon"><Icon name="journal" size={14} /></div>
                Dashboard
              </div>
              <div className="lp-sidebar-link">
                <div className="lp-sidebar-icon"><Icon name="journal" size={14} /></div>
                All Trades
              </div>
              <div className="lp-sidebar-link">
                <div className="lp-sidebar-icon"><Icon name="analytics" size={14} /></div>
                Analytics
              </div>
              <div className="lp-sidebar-link">
                <div className="lp-sidebar-icon"><Icon name="psychology" size={14} /></div>
                Psychology
              </div>
            </div>

            <div className="lp-sidebar-group">
              <div className="lp-sidebar-label">Plan unlocks</div>
              <div className="lp-sidebar-link">
                <div className="lp-sidebar-icon"><Icon name="backtest" size={14} /></div>
                Backtest
              </div>
              <div className="lp-sidebar-link">
                <div className="lp-sidebar-icon"><Icon name="stack" size={14} /></div>
                Reports
              </div>
            </div>
          </aside>

          <div className="lp-main">
            <div className="lp-reel-shell">
              <div className="lp-reel-head">
                <div>
                  <div className="lp-reel-overline">{scene.section}</div>
                  <strong>{scene.title}</strong>
                  <p>{scene.desc}</p>
                </div>
                <div className="lp-reel-nav">
                  {FEATURE_REEL_SCENES.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={index === sceneIndex ? 'active' : ''}
                      onClick={() => setSceneIndex(index)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lp-reel-stage">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.985 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="lp-reel-screen"
                  >
                    <FeatureScene scene={scene} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="lp-reel-footer">
                <div className="lp-reel-progress">
                  <span style={{ width: `${((sceneIndex + 1) / FEATURE_REEL_SCENES.length) * 100}%` }} />
                </div>
                <div className="lp-reel-film">
                  {FEATURE_REEL_SCENES.map((item, index) => (
                    <div key={item.id} className={`lp-reel-film-item ${index === sceneIndex ? 'active' : ''}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{item.label}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LandingPage({ onLogin, onSignup, onSignupWithPlan }) {
  const [scrolled, setScrolled] = useState(false);
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp-page">
      <style>{STYLES}</style>

      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="lp-brand-mark">
            <img src="/logo192.png" alt="MarketFlow" />
          </div>
          <div className="lp-brand-wordmark">
            <div className="lp-brand-title">Market<span>Flow</span></div>
            <div className="lp-brand-sub">Trading Journal</div>
          </div>
        </div>

        <div className="lp-nav-links">
          <a href="#workspace" onClick={(event) => { event.preventDefault(); scrollTo('workspace'); }}>Workspace</a>
          <a href="#features" onClick={(event) => { event.preventDefault(); scrollTo('features'); }}>Features</a>
          <a href="#modules" onClick={(event) => { event.preventDefault(); scrollTo('modules'); }}>Modules</a>
          <a href="#pricing" onClick={(event) => { event.preventDefault(); scrollTo('pricing'); }}>Pricing</a>
          <a href="#faq" onClick={(event) => { event.preventDefault(); scrollTo('faq'); }}>FAQ</a>
        </div>

        <div className="lp-nav-cta">
          <button className="lp-btn-ghost" onClick={onLogin}>Log in</button>
          <button className="lp-btn-primary" onClick={onSignup}>Start trial</button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-hero-bg" aria-hidden="true">
          <AnimatedCandleBg />
          <div className="lp-hero-grid" />
          <AmbientPropRibbon />
        </div>
        <div className="lp-hero-inner">
          <div className="lp-hero-copy">
            <Reveal>
              <div className="lp-overline">Only live product modules are shown here</div>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="lp-hero-title">
                MarketFlow Journal for <span>cleaner execution review</span> and real post-trade discipline.
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="lp-hero-sub">
                Built for traders who want one connected review desk: execution ledger, dashboard, calendar, analytics,
                psychology, reports, alerts, and plan-based operational tooling.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <p className="lp-hero-note">
                Activation stays explicit: card-backed access, 14-day trial window, and recurring billing managed from
                the account area. The public copy is kept tied to the modules already live in the journal.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="lp-hero-micro">
                <div className="lp-hero-micro-item">Starter includes core analytics</div>
                <div className="lp-hero-micro-item">Card-backed 14-day activation</div>
                <div className="lp-hero-micro-item">Imports tied to the live journal</div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="lp-hero-actions">
                <button className="lp-btn-primary" onClick={onSignup}>Start your 14-day flow</button>
                <button className="lp-btn-secondary" onClick={() => scrollTo('workspace')}>Explore the workspace</button>
              </div>
            </Reveal>
          </div>

          <HeroPreview />
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Features</div></Reveal>
          <Reveal><h2>A cleaner review stack for actual trading work.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              Every section below is written against what is already accessible in MarketFlow today, so the landing,
              the plan grid, and the product shell stay in sync.
            </p>
          </Reveal>

          <div className="lp-features-grid">
            {FEATURE_CARDS.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 0.05}>
                <div className="lp-feature-card">
                  <div className="lp-feature-top">
                    <div className="lp-icon-chip"><Icon name={feature.icon} /></div>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="workspace" style={{ paddingTop: 24 }}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Workspace</div></Reveal>
          <Reveal><h2>A product shell that reads like one desk.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              The journal pages are meant to work together: dashboard, trade review, calendar, competition, and the
              operational layer all follow the same product logic.
            </p>
          </Reveal>

          <div className="lp-module-grid">
            {MODULE_PILLARS.map((module, index) => (
              <Reveal key={module.title} delay={index * 0.05}>
                <div className="lp-module-card">
                  <div className="lp-module-overline">{module.overline}</div>
                  <h3>{module.title}</h3>
                  <p>{module.desc}</p>
                  <ul className="lp-points">
                    {module.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="modules" style={{ paddingTop: 24 }}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Modules</div></Reveal>
          <Reveal><h2>Starter, Pro, and Elite each unlock a real layer.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              Starter keeps the essentials, Pro opens the deeper review workflow, and Elite adds faster overlays and
              higher-access operational tooling.
            </p>
          </Reveal>

          <div className="lp-showcase-grid">
            <Reveal>
              <div className="lp-showcase-card">
                <div className="lp-mini-head">
                  <strong>Starter analytics</strong>
                  <span>Core</span>
                </div>
                <p>
                  Performance, setups, time of day, day of week, market type, and confluence readouts in the basic analytics page.
                </p>
                <div className="lp-mini-grid">
                  <div className="lp-mini-box">
                    <span>Focus</span>
                    <strong>Read the basics</strong>
                  </div>
                  <div className="lp-mini-box">
                    <span>Use case</span>
                    <strong>Daily review</strong>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="lp-showcase-card">
                <div className="lp-mini-head">
                  <strong>Elite analytics</strong>
                  <span>Boosted</span>
                </div>
                <p>
                  Elite gets boosted overlays to surface timing edge, setup edge, market read, and confluence density faster.
                </p>
                <div className="lp-mini-grid">
                  <div className="lp-mini-box">
                    <span>Boosted timing</span>
                    <strong>Best window</strong>
                  </div>
                  <div className="lp-mini-box">
                    <span>Boosted setup</span>
                    <strong>Edge stack</strong>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lp-section" id="pricing">
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Pricing</div></Reveal>
          <Reveal><h2>Choose the review layer that matches your desk.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              Monthly and annual billing stay aligned with the live Stripe plans. Plan access below matches the current
              product routing and module availability.
            </p>
          </Reveal>

          <div className="lp-pricing-top">
            <div className="lp-billing-toggle">
              {['monthly', 'annual'].map((mode) => (
                <button
                  key={mode}
                  className={billing === mode ? 'active' : ''}
                  onClick={() => setBilling(mode)}
                >
                  {mode === 'monthly' ? 'Monthly' : 'Annual'}
                </button>
              ))}
            </div>
            {billing === 'annual' && <div className="lp-billing-note">Annual billing active</div>}
          </div>

          <div className="lp-price-support">
            <div className="lp-price-rail-item">
              <span>Activation</span>
              <strong>Card-backed before journal access opens</strong>
            </div>
            <div className="lp-price-rail-item">
              <span>Trial</span>
              <strong>14 days before the first paid renewal</strong>
            </div>
            <div className="lp-price-rail-item">
              <span>Management</span>
              <strong>Plan changes and cancellation from the account area</strong>
            </div>
          </div>

          <div className="lp-pricing-grid">
            {PLANS.map((plan, index) => {
              const isAnnual = billing === 'annual';
              const price = isAnnual ? plan.annual : plan.monthly;
              const billed = isAnnual ? plan.annual * 12 : plan.monthly;
              const priceId = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const save = (plan.monthly - plan.annual) * 12;

              return (
                <Reveal key={plan.id} delay={index * 0.06}>
                  <div className={`lp-pricing-card ${plan.popular ? 'popular' : ''}`}>
                    <div className="lp-pricing-head">
                      <div>
                        <h3>{plan.name}</h3>
                        <p>{plan.desc}</p>
                      </div>
                      <div className="lp-plan-badge">{plan.badge}</div>
                    </div>

                    <div className="lp-price">
                      ${price}
                      <small> / month</small>
                    </div>

                    <div className="lp-price-line">
                      {isAnnual ? `Billed $${billed}/yr` : 'Billed monthly'}
                    </div>

                    {isAnnual && save > 0 && <div className="lp-save">save ${save}/yr</div>}

                    <ul className="lp-price-feats">
                      {plan.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>

                    <div className="lp-card-foot">
                      {plan.id === 'starter'
                        ? 'Best for traders who want the core journal and the first analytics layer.'
                        : plan.id === 'pro'
                          ? 'Built for deeper review, psychology, equity, reports, and a fuller analytics stack.'
                          : 'Adds the highest-access desk modules, extra overlays, and broader account operations.'}
                    </div>

                    <button
                      className={plan.popular ? 'lp-btn-primary' : 'lp-btn-plan'}
                      style={{ width: '100%' }}
                      onClick={() => (onSignupWithPlan ? onSignupWithPlan(priceId) : onSignup?.())}
                    >
                      Start {plan.name}
                    </button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lp-section" id="faq" style={{ paddingTop: 24 }}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">FAQ</div></Reveal>
          <Reveal><h2>Common questions before activation.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              Short answers on imports, billing, analytics access, and what the public site is actually promising.
            </p>
          </Reveal>

          <div className="lp-faq-list">
            {FAQS.map((faq, index) => (
              <Reveal key={faq.q} delay={index * 0.04}>
                <div className={`lp-faq-item ${openFaq === index ? 'open' : ''}`}>
                  <div className="lp-faq-q" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    {faq.q}
                    <span className="lp-faq-arrow">+</span>
                  </div>
                  <div className="lp-faq-a">
                    <div className="lp-faq-a-inner">{faq.a}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-inner">
          <Reveal><h2>Open the same journal desk the landing is describing.</h2></Reveal>
          <Reveal delay={0.06}>
            <p>
              MarketFlow is built to keep execution review, discipline, and plan-based tooling inside one product flow
              instead of spreading them across disconnected pages and vague promises.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="lp-cta-actions">
              <button className="lp-btn-primary" onClick={onSignup}>Start your 14-day flow</button>
              <button className="lp-btn-secondary" onClick={onLogin}>Log in</button>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-brand" style={{ cursor: 'default' }}>
                <div className="lp-brand-mark">
                  <img src="/logo192.png" alt="MarketFlow" />
                </div>
                <div className="lp-brand-wordmark">
                  <div className="lp-brand-title">Market<span>Flow</span></div>
                  <div className="lp-brand-sub">Trading Journal</div>
                </div>
              </div>
              <p>
                Structured trading review, clearer daily workflow, and plan-based access kept aligned with the live journal.
              </p>
            </div>

            <div className="lp-footer-col">
              <h4>Product</h4>
              <button onClick={() => scrollTo('workspace')}>Workspace</button>
              <button onClick={() => scrollTo('features')}>Features</button>
              <button onClick={() => scrollTo('modules')}>Modules</button>
              <button onClick={() => scrollTo('pricing')}>Pricing</button>
            </div>

            <div className="lp-footer-col">
              <h4>Support</h4>
              <button onClick={() => setModal('support')}>Support</button>
              <button onClick={() => setModal('billing')}>Billing</button>
              <a href="mailto:marketflowjournal0@gmail.com">Contact</a>
              <button onClick={onLogin}>Log in</button>
              <button onClick={onSignup}>Start trial</button>
            </div>

            <div className="lp-footer-col">
              <h4>Legal</h4>
              <button onClick={() => setModal('changelog')}>Changelog</button>
              <button onClick={() => setModal('roadmap')}>Roadmap</button>
              <button onClick={() => setModal('legal')}>Legal</button>
              <button onClick={() => setModal('privacy')}>Privacy</button>
              <button onClick={() => scrollTo('faq')}>FAQ</button>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p>© 2026 MarketFlow Journal. Prop firm names on this page are examples, not endorsements.</p>
            <div className="lp-social-row">
              <a href="https://twitter.com/marketflowjrl" target="_blank" rel="noopener noreferrer" className="lp-social-btn">X</a>
              <a href="https://discord.gg/Cvh6H8yK8m" target="_blank" rel="noopener noreferrer" className="lp-social-btn">Chat</a>
            </div>
          </div>
        </div>
      </footer>

      {modal && <PageModal page={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

