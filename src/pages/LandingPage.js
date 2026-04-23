import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

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
    title: 'A more readable journal shell.',
    desc: 'Dashboard, All Trades, Calendar, Competition, and the daily workflow are framed as a clearer operating system instead of a pile of noisy widgets.',
    points: ['Command-center dashboard', 'Execution-ledger review', 'Calendar and daily flow visibility'],
  },
  {
    overline: 'Analytics',
    title: 'Starter, Pro, and Elite each have a role.',
    desc: 'Starter now gets the basic analytics page, Pro keeps the deeper analytics stack, and Elite gets extra overlays to read timing, setup edge, and confluence density faster.',
    points: ['Starter: core performance analytics', 'Pro: deeper review stack', 'Elite: boosted overlays and richer readouts'],
  },
  {
    overline: 'Trust',
    title: 'Marketing claims are kept on a shorter leash.',
    desc: 'The landing no longer leans on fake user counters, fake reviews, fake market tape, or shaky competitor comparisons.',
    points: ['No invented user counts', 'No fake live ticker', 'No unsupported competitor grid'],
  },
];

const FAQS = [
  {
    q: 'Does the landing use fake customer numbers or fake reviews?',
    a: 'No. The landing has been cleaned so it no longer relies on synthetic social proof or invented user statistics.',
  },
  {
    q: 'Why is there no live market ticker on the landing anymore?',
    a: 'Because there is no production-grade real-time market feed wired into the landing right now. It is safer to remove it than to simulate market data.',
  },
  {
    q: 'Can Starter access analytics now?',
    a: 'Yes. Starter now includes the core analytics page. Pro keeps the deeper analytics stack, and Elite gets additional overlays above that.',
  },
  {
    q: 'Are the prop firm names official partnerships?',
    a: 'No. They are shown as examples of well-known prop environments traders care about, not as endorsements or official partnerships.',
  },
  {
    q: 'Is the 14-day activation flow still explicit?',
    a: 'Yes. Card-required activation is still stated clearly, and the landing does not try to hide that flow behind vague trial language.',
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
    subtitle: 'Need help with access or billing?',
    items: [
      'Email: marketflowjournal0@gmail.com',
      'In-app support page after login',
      'Subscription management from the journal account area',
    ],
  },
  legal: {
    title: 'Legal and Privacy',
    subtitle: 'Core policy points',
    items: [
      'Payments are processed via Stripe.',
      'MarketFlow does not need fake numbers to sell the product.',
      'The landing is being tightened to match the real product state.',
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
    padding: 128px 32px 56px;
    overflow: hidden;
  }

  .lp-hero-inner {
    position: relative;
    z-index: 1;
    max-width: 1240px;
    margin: 0 auto;
    text-align: left;
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
    max-width: 920px;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: clamp(46px, 7vw, 88px);
    line-height: 0.95;
    letter-spacing: -0.06em;
    color: var(--lp-text);
  }

  .lp-hero-title span {
    color: #bff3ff;
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

  .lp-hero-preview-shell {
    position: relative;
    margin-top: 42px;
    padding-top: 48px;
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

  .lp-propfirms {
    padding: 28px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)),
      rgba(5, 9, 15, 0.88);
    overflow: hidden;
  }

  .lp-prop-head {
    max-width: 1240px;
    margin: 0 auto 14px;
    padding: 0 32px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 10px;
    align-items: baseline;
  }

  .lp-prop-head strong {
    font-size: 13px;
    color: var(--lp-text);
  }

  .lp-prop-head span {
    font-size: 12px;
    color: var(--lp-text-3);
  }

  .lp-prop-marquee {
    display: flex;
    width: max-content;
    animation: lpPropMove 36s linear infinite;
  }

  .lp-prop-marquee:hover { animation-play-state: paused; }

  @keyframes lpPropMove {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }

  .lp-prop-item {
    margin-right: 12px;
    padding: 12px 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(125, 150, 190, 0.08);
    color: #dce8ff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
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

    .lp-prop-head {
      padding: 0 20px;
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

    .lp-calendar-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .lp-day {
      min-height: 68px;
    }

    .lp-ledger-row {
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
          <button className="lp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="lp-modal-body">
          {content.items.map((item) => (
            <div key={item} className="lp-modal-item">{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroPreview() {
  const bars = [42, 58, 46, 72, 68, 80, 62, 88, 70, 76];
  const propLoop = [...PROP_FIRMS, ...PROP_FIRMS];

  return (
    <>
      <div className="lp-hero-preview-shell">
        <div className="lp-window">
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
              <div className="lp-panel lp-command">
                <div className="lp-command-copy">
                  <span>MarketFlow command center</span>
                  <strong>Daily review, account scope, and execution context.</strong>
                </div>
                <div className="lp-command-pills">
                  <div className="lp-pill">All accounts</div>
                  <div className="lp-pill">London</div>
                  <div className="lp-pill accent">Analytics live</div>
                </div>
              </div>

              <div className="lp-kpi-grid">
                <div className="lp-panel lp-kpi-card">
                  <div className="lp-kpi-label">Net PnL</div>
                  <div className="lp-kpi-value">$8,620</div>
                  <div className="lp-kpi-meta"><span className="lp-positive">9 trading days</span> in scope</div>
                </div>
                <div className="lp-panel lp-kpi-card">
                  <div className="lp-kpi-label">Win rate</div>
                  <div className="lp-kpi-value">68.4%</div>
                  <div className="lp-kpi-meta">Rolling and cumulative views</div>
                </div>
                <div className="lp-panel lp-kpi-card">
                  <div className="lp-kpi-label">Max drawdown</div>
                  <div className="lp-kpi-value">-$920</div>
                  <div className="lp-kpi-meta">Linked to equity and analytics</div>
                </div>
              </div>

              <div className="lp-preview-grid">
                <div className="lp-calendar-panel">
                  <div className="lp-calendar-head">
                    <div className="lp-calendar-title">Calendar review</div>
                    <div className="lp-calendar-meta">Selected month: April</div>
                  </div>
                  <div className="lp-calendar-grid">
                    {[
                      ['Mon 08', '-', 'No flow', 'muted'],
                      ['Tue 09', '+$420', '2 trades', 'win'],
                      ['Wed 10', '+$285', '1 trade', 'win'],
                      ['Thu 11', '-$96', '1 trade', 'loss'],
                      ['Fri 12', '+$560', '3 trades', 'win'],
                      ['Mon 15', '+$380', 'London', 'win'],
                      ['Tue 16', '-', 'No flow', 'muted'],
                      ['Wed 17', '+$140', 'US30', 'win'],
                    ].map(([day, value, caption, state]) => (
                      <div key={day} className={`lp-day ${state}`}>
                        <div className="lp-day-number">{day}</div>
                        <div className="lp-day-value">{value}</div>
                        <div className="lp-day-caption">{caption}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lp-side-stack">
                  <div className="lp-side-card">
                    <div className="lp-mini-head">
                      <strong>Workflow</strong>
                      <span>Today</span>
                    </div>
                    <div className="lp-checklist">
                      <div className="lp-check-item">
                        <div className="lp-check-copy">
                          <div className="lp-check-bullet" />
                          <div>
                            <strong>Pre-session notes</strong>
                            <span>Bias, plan, and invalidation</span>
                          </div>
                        </div>
                        <div className="lp-check-badge">Open</div>
                      </div>
                      <div className="lp-check-item">
                        <div className="lp-check-copy">
                          <div className="lp-check-bullet" />
                          <div>
                            <strong>Import last fills</strong>
                            <span>Execution review desk</span>
                          </div>
                        </div>
                        <div className="lp-check-badge">Ready</div>
                      </div>
                      <div className="lp-check-item">
                        <div className="lp-check-copy">
                          <div className="lp-check-bullet" />
                          <div>
                            <strong>Rank snapshot</strong>
                            <span>Leaderboard refresh every 24h</span>
                          </div>
                        </div>
                        <div className="lp-check-badge">Live</div>
                      </div>
                    </div>
                  </div>

                  <div className="lp-side-card">
                    <div className="lp-mini-head">
                      <strong>Latest execution review</strong>
                      <span>All trades</span>
                    </div>
                    <div className="lp-ledger">
                      {[
                        ['EURUSD', 'London breakout', 'Long', '+$380'],
                        ['BTCUSD', 'NY reclaim', 'Short', '+$650'],
                        ['US30', 'Open drive', 'Long', '+$4,500'],
                      ].map((row) => (
                        <div key={row.join('-')} className="lp-ledger-row">
                          <strong>{row[0]}</strong>
                          <span>{row[1]}</span>
                          <span>{row[2]}</span>
                          <strong className={String(row[3]).startsWith('-') ? 'lp-negative' : 'lp-positive'}>{row[3]}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lp-showcase-grid" style={{ marginTop: 16 }}>
                <div className="lp-showcase-card">
                  <div className="lp-mini-head">
                    <strong>Analytics motion</strong>
                    <span>Hover-ready</span>
                  </div>
                  <div className="lp-chart-bars">
                    {bars.map((bar, index) => (
                      <div key={String(bar) + String(index)} className={`lp-bar ${index === 2 || index === 6 ? 'negative' : ''}`} style={{ height: `${bar}%` }} />
                    ))}
                  </div>
                </div>

                <div className="lp-showcase-card">
                  <div className="lp-mini-head">
                    <strong>Tiered analytics</strong>
                    <span>Starter / Pro / Elite</span>
                  </div>
                  <div className="lp-mini-grid">
                    <div className="lp-mini-box">
                      <span>Starter</span>
                      <strong>Core view</strong>
                    </div>
                    <div className="lp-mini-box">
                      <span>Pro</span>
                      <strong>Deep stack</strong>
                    </div>
                    <div className="lp-mini-box">
                      <span>Elite</span>
                      <strong>Boosted overlays</strong>
                    </div>
                    <div className="lp-mini-box">
                      <span>Data model</span>
                      <strong>Shared stream</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-propfirms">
        <div className="lp-prop-head">
          <strong>Known prop environments traders actually recognize</strong>
          <span>Shown as examples only, not as endorsements or partnerships.</span>
        </div>
        <div className="lp-prop-marquee">
          {propLoop.map((name, index) => (
            <div key={name + String(index)} className="lp-prop-item">{name}</div>
          ))}
        </div>
      </div>
    </>
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
        <AnimatedCandleBg />
        <div className="lp-hero-inner">
          <Reveal>
            <div className="lp-overline">Only live product modules are described here</div>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="lp-hero-title">
              MarketFlow Journal for <span>cleaner execution review</span> and real post-trade discipline.
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="lp-hero-sub">
              MarketFlow is a structured trading journal built around the modules already available in the product today:
              journal review, dashboard, calendar, starter analytics, pro analytics, psychology, equity, backtest
              sessions, reports, alerts, and API access by plan.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="lp-hero-note">
              Card-required activation remains explicit. The landing avoids fake proof points, fake tape, and risky
              competitor comparisons so the site stays aligned with the real journal.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={onSignup}>Start your 14-day flow</button>
              <button className="lp-btn-secondary" onClick={() => scrollTo('workspace')}>Explore the workspace</button>
            </div>
          </Reveal>

          <HeroPreview />
        </div>
      </section>

      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Features</div></Reveal>
          <Reveal><h2>Improve the journal, not the fantasy around it.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              The landing is back to a more classical structure: features, workspace, modules, pricing, FAQ, and a real footer.
              The difference is that the messaging is now tighter and closer to the product state.
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
          <Reveal><h2>Structured sections instead of a landing that feels improvised.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              This keeps the old landing logic of a real site while upgrading the visual language, the background transitions,
              and the product previews.
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
          <Reveal><h2>Starter, Pro, and Elite now read more logically.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              Starter now gets the basic analytics layer. Pro keeps the deeper review stack. Elite gets extra overlays above that instead of only “more data”.
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
          <Reveal><h2>Aligned pricing cards, monthly and annual.</h2></Reveal>
          <Reveal>
            <p className="lp-section-sub">
              The pricing section is back to a more familiar site layout, but now it reflects the real plan structure and annual billing options already wired in the product.
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
          <Reveal><h2>Common questions.</h2></Reveal>

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
          <Reveal><h2>Use the landing as an honest front door to the journal.</h2></Reveal>
          <Reveal delay={0.06}>
            <p>
              The structure is back to something more familiar, the previews are more product-native, and the claims are tighter.
              From here we can keep polishing the site without drifting back into fake signals.
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
                Structured trading review, clearer daily workflow, plan-based access, and a landing page that no longer tries to sell a fantasy.
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
              <a href="mailto:marketflowjournal0@gmail.com">Contact</a>
              <button onClick={onLogin}>Log in</button>
              <button onClick={onSignup}>Start trial</button>
            </div>

            <div className="lp-footer-col">
              <h4>Resources</h4>
              <button onClick={() => setModal('changelog')}>Changelog</button>
              <button onClick={() => setModal('roadmap')}>Roadmap</button>
              <button onClick={() => setModal('legal')}>Legal</button>
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
