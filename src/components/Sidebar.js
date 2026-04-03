import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MARKETFLOW_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA2QAAAMPCAYAAAC62xZRAAEAAElEQVR4nOz9aZgsy3nfif0iIjNr6eWcPvs9d993XOBeXKxcAJKACBDcwUWUKEoaUdLIoj0ay48oS3pk2R8sj6SR5/GMv3nsx56Rx+aIskRJXEQRErGIIAiQIECAWAnc/dyz9VpLZka8/hCZVdV1auuuqq7q7vjdp2/3qSWXyMjIeON93/+raiuXhVOMyHSnr5Sa0ZEcH3rbbN7nH67P8nGQazKu/cdtK1y/k81xv7/L4+8/j8Mc1zzORUSGbnfUe0fFvO//afvXoln09TmNDOsz5bU4yvlP4OiZ5fzmoEQz3VogEAgEAgEgLDgEAoFAYDKCQcbwh+IyrCAehPLhP+9jPsj2Z7GaNOvrc1JXuJb9+s9yuwfZ/0m5v5eRae+lRXtApt1/+f3e7RykTRZ5rx5F33fOjXx/Wg/6LDyTi2SQ1yVwdBxmweQo+9hhxteTOr85KmbZZgftX8EgCwQChyZMJALzJPSv402YEAYCgcBkBIMsEAgEAktJCPkLTEroC4FA4Dhz4g2ysMIaCAQCx5MwyQ6MY1gfUUqF538gEDg2nHiDLBAIzI9pc0ACgVGE/hUYxaJzfAKBQGBWBIMsEAgcmjBhDgQCwzjq8eG0GWMhpDcQODkEgywQCByaYHAF5knoX4FJCcZHIBA4zpx4gyysIAUCgUAgcHIJz/FAIHDcmbtBNq1BdBR1Zkbt4zgZdIOO5ShrUgyqgzWrOj8Hfe+w2zzOLON5LfqYpu0/4+qYHXR7/d9bdPschmFj4qDXp60TOG+CB+54cxzvn0EMq2M3y/nTSWmrg5zTrO7vYduZdv/zqFM4rzpaJ6X/zJuD9k+lVEeASM/74AKBQCAQCAQCgUAgMJgTH7IYCAQCgUBg9hynCJLAySN4uAMnieAhCwQCgUAgEAgEAoEFEQyyQCAQCAQCgUAgEFgQwSALBAKBQCAQCAQCgQURcsgCgUAgEAgcmJAjFlgkR114PBCYJ8FDFggEAoFAIBAIBAILIoJp60T538Nq8kyyQnHYGg/LwLKrTM1//6Nrjo2//vOtU7fo9l9GTlttkWnGl9NeB2/+K8yDnhPHp30mGb+O8/NtWubdf5a9bQ8yD+r/ziz3f5I4yDlNWgdq2HvTctznJwc5vkF1aI/7+R/m+A/TP8v9TB2yWG4ouIYDgUAgEAgEAoHlNzgC8+WgdtFYg2y8hTj4M6NWHgLLw3FfwVj245uWZb8+iz6+Re8/EAgEAoFAoJ+ZG2STMCgsI0yEAoFAIBA4uYTImEAgEBjMQVNuxhpk4zZYesiGxVKGAXu5CYZzYBoW3X8Wvf9AIBAIBAKBfg46PwkeskAgEAgETiFhwTQQmB9hHjya055y0H9+MxP16P07eMYCR8VJv6GP+/EHAoFAIBAInDYOOj+di6jHIPnLwHJy0g2awHxZdP9Z9P4DgdNMuP8CgUDgcNwRWVitX57SlTXd16cd0Kcd8E9bTaZ+pvdkTttmo/c/7vi0Hl3bPEwYRjPvOizTMmxxp3x93PWf1f4nYdqaLceRQePnwfrN4Os67XFM2q7T9vFpL99Juv7HkVkdf3+fm+V2TwvTjInz6ofznj/Me/572ue341i28WsmOWTTEDpJYBShfwQCJ5f+SexB7/dpc5enH1+W64EeOBgHVUELnC7mPf8I85tALws3yAKBQGAUQcH1dHAYD0P/qnq/ly5MeAKBQCBwHJjaIJt2hSmsUAVGMe2EKkzIjjejrt9RXNswPh0th23PXoNsltckXP9AILAowvzldBE8ZIFA4FhwuBylwDIz6Foe9Pr2e8fKv0M/CUxLMMgDgcBRsXCDLAxogVEEUY4AhMn2aeGwxtig704yNoQJ9+kmXP/AKObdP8L8JdDLfCXKAoFAYEqG5ZAFjj/917FUq5v0+g777...";

const ADMIN_EMAIL = 'marketflowjournal0@gmail.com';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW SIDEBAR v2 — Premium Terminal Design
   ═══════════════════════════════════════════════════════════════ */

/* ── SVG Icons ── */
const Ic = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/>
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2"/>
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2"/>
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/>
    </svg>
  ),
  Trades: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 4h13"/>
      <path d="M1.5 8h9"/>
      <path d="M1.5 12h5"/>
      <circle cx="13" cy="12" r="1.5"/>
    </svg>
  ),
  Analytics: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,12 5,7.5 8.5,9.5 13,3.5 14.5,5"/>
      <path d="M13 1.5h1.5v1.5"/>
    </svg>
  ),
  Equity: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 14.5V1.5"/>
      <path d="M1.5 14.5h13"/>
      <polyline points="3.5,11 6.5,7.5 9.5,9.5 14,5"/>
    </svg>
  ),
  Backtest: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8.5" r="5.5"/>
      <polyline points="8,5 8,8.5 10.5,10"/>
      <path d="M4.5 2C2.8 3.2 1.5 5.2 1.5 8.5"/>
      <polyline points="3.5,1 4.5,2 3.5,3.5"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="3" width="13" height="11.5" rx="1.5"/>
      <path d="M11.5 1.5V3.5M4.5 1.5V3.5"/>
      <path d="M1.5 7h13"/>
      <rect x="5" y="9.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
      <rect x="9" y="9.5" width="2" height="2" rx="0.4" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Psychology: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 1.8-1 3.4-2.7 4.3L10 12l.5 1.5H5.5L6 12l.3-1.2A4.5 4.5 0 018 1.5z"/>
      <path d="M6.5 10h3"/>
    </svg>
  ),
  AI: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4A1.5 1.5 0 014 2.5h8A1.5 1.5 0 0113.5 4v5.5A1.5 1.5 0 0112 11H7L2.5 14V4z"/>
      <path d="M5.5 6.5h5M5.5 8.5h3"/>
    </svg>
  ),
  Broker: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3.5" cy="8" r="1.8"/>
      <circle cx="12.5" cy="4" r="1.8"/>
      <circle cx="12.5" cy="12" r="1.8"/>
      <path d="M5.3 7.3L10.7 5"/>
      <path d="M5.3 8.7L10.7 11"/>
    </svg>
  ),
  Admin: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.8 4.5H15l-4 2.7 1.5 4.3L8 10.5 3.5 13l1.5-4.3L1 6h5.2z"/>
    </svg>
  ),
  ChevronL: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,2.5 4.5,7 9,11.5"/>
    </svg>
  ),
  ChevronR: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,2.5 9.5,7 5,11.5"/>
    </svg>
  ),
  Moon: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M11 9A4.5 4.5 0 015.5 4c0-.55.07-1.05.18-1.55A5.8 5.8 0 1011 9z"/>
    </svg>
  ),
  Sun: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7" cy="7" r="2.3"/>
      <line x1="7" y1="1" x2="7" y2="2.3"/>
      <line x1="7" y1="11.7" x2="7" y2="13"/>
      <line x1="1" y1="7" x2="2.3" y2="7"/>
      <line x1="11.7" y1="7" x2="13" y2="7"/>
      <line x1="2.8" y1="2.8" x2="3.7" y2="3.7"/>
      <line x1="10.3" y1="10.3" x2="11.2" y2="11.2"/>
      <line x1="11.2" y1="2.8" x2="10.3" y2="3.7"/>
      <line x1="3.7" y1="10.3" x2="2.8" y2="11.2"/>
    </svg>
  ),
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2"/>
      <path d="M7 1.5v1.6M7 10.9v1.6M1.5 7H3.1M10.9 7h1.6M3.1 3.1l1.1 1.1M9.8 9.8l1.1 1.1M10.9 3.1l-1.1 1.1M4.2 9.8l-1.1 1.1"/>
    </svg>
  ),
  CreditCard: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2.5" width="12" height="9" rx="1.5"/>
      <path d="M1 6h12"/>
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5H3.5A1.5 1.5 0 002 4v6a1.5 1.5 0 001.5 1.5H6"/>
      <polyline points="9.5,4 12.5,7 9.5,10"/>
      <line x1="6" y1="7" x2="12.5" y2="7"/>
    </svg>
  ),
};

/* ── Nav structure ── */
const NAV = (isAdmin) => [
  {
    id: 'trading',
    label: 'Trading',
    items: [
      { id: 'dashboard',     label: 'Dashboard',  Icon: Ic.Dashboard  },
      { id: 'all-trades',    label: 'All Trades', Icon: Ic.Trades     },
      { id: 'analytics-pro', label: 'Analytics',  Icon: Ic.Analytics  },
      { id: 'equity',        label: 'Equity',     Icon: Ic.Equity     },
      { id: 'backtest',      label: 'Backtest',   Icon: Ic.Backtest   },
      { id: 'calendar',      label: 'Calendar',   Icon: Ic.Calendar   },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      { id: 'psychology', label: 'Psychology', Icon: Ic.Psychology },
      { id: 'ai-chat',    label: 'AI Coach',   Icon: Ic.AI         },
    ],
  },
  {
    id: 'connections',
    label: 'Connections',
    items: [
      { id: 'broker-connect', label: 'Brokers', Icon: Ic.Broker },
    ],
  },
  ...(isAdmin ? [{
    id: 'admin',
    label: 'Admin',
    items: [{ id: 'onboarding-stats', label: 'Onboarding', Icon: Ic.Admin }],
  }] : []),
];

/* ── Tooltip ── */
function Tooltip({ text, children }) {
  const [v, setV] = useState(false);
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setV(true)}
      onMouseLeave={() => setV(false)}
    >
      {children}
      <AnimatePresence>
        {v && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', left: 'calc(100% + 12px)', top: '50%',
              transform: 'translateY(-50%)',
              background: '#0C1422', border: '1px solid #162034',
              borderRadius: 7, padding: '5px 10px',
              fontSize: 11.5, fontWeight: 500, color: '#E8EEFF',
              whiteSpace: 'nowrap', zIndex: 9999,
              boxShadow: '0 6px 24px rgba(0,0,0,0.6)',
              pointerEvents: 'none',
            }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed, user, onLogout }) {
  const [hov, setHov] = useState(null);
  const [panel, setPanel] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mf_theme') || 'dark');
  const [accent, setAccent] = useState(() => localStorage.getItem('mf_accent') || '#06E6FF');
  const panelRef = useRef(null);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const initials  = firstName.slice(0, 2).toUpperCase();
  const email     = user?.email || '';
  const plan      = user?.user_metadata?.plan || 'trial';
  const isElite   = plan === 'elite';
  const isAdmin   = email === ADMIN_EMAIL;

  const PLAN = {
    starter: { l: 'Starter', c: '#7A90B8' },
    pro:     { l: 'Pro',     c: '#06E6FF' },
    elite:   { l: 'Elite',   c: '#00FF88' },
    trial:   { l: 'Trial',   c: '#FB923C' },
  };
  const pi = PLAN[plan] || PLAN.trial;

  const W = collapsed ? 72 : 260;

  /* Close panel outside click */
  useEffect(() => {
    if (!panel) return;
    const h = (e) => {
      if (!e.target.closest('.mf-panel') && !e.target.closest('.mf-user-btn')) setPanel(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [panel]);

  /* Theme / Accent apply */
  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('mf_theme', t);
    const r = document.documentElement;
    r.setAttribute('data-theme', t);
    if (t === 'light') {
      r.style.setProperty('--bg', '#F2F5FC');
      r.style.setProperty('--bg-sidebar', '#FFFFFF');
      r.style.setProperty('--bg-card', '#FFFFFF');
      r.style.setProperty('--bg-high', '#EEF2FB');
      r.style.setProperty('--t0', '#0A0F1E');
      r.style.setProperty('--t1', '#1C2B4A');
      r.style.setProperty('--t2', '#4A5E80');
      r.style.setProperty('--t3', '#9AAAC8');
      r.style.setProperty('--brd', '#D8E2F0');
      r.style.setProperty('--brd-hi', '#BCC8E0');
      r.style.setProperty('--green', '#00AA55');
      r.style.setProperty('--red', '#E0243E');
      document.body.style.background = '#F2F5FC';
      document.body.style.color = '#0A0F1E';
    } else {
      r.style.setProperty('--bg', '#030508');
      r.style.setProperty('--bg-sidebar', '#060D1A');
      r.style.setProperty('--bg-card', '#0C1422');
      r.style.setProperty('--bg-high', '#111B2E');
      r.style.setProperty('--t0', '#FFFFFF');
      r.style.setProperty('--t1', '#E8EEFF');
      r.style.setProperty('--t2', '#7A90B8');
      r.style.setProperty('--t3', '#334566');
      r.style.setProperty('--brd', '#162034');
      r.style.setProperty('--brd-hi', '#1E2E48');
      r.style.setProperty('--green', '#00FF88');
      r.style.setProperty('--red', '#FF3D57');
      document.body.style.background = '#030508';
      document.body.style.color = '#FFFFFF';
    }
  };

  const applyAccent = (c) => {
    setAccent(c);
    localStorage.setItem('mf_accent', c);
    document.documentElement.style.setProperty('--accent', c);
  };

  useEffect(() => {
    applyTheme(localStorage.getItem('mf_theme') || 'dark');
    applyAccent(localStorage.getItem('mf_accent') || '#06E6FF');
  }, []); // eslint-disable-line

  const go = useCallback((id) => {
    setCurrentPage(id);
    setPanel(false);
  }, [setCurrentPage]);

  const sections = NAV(isAdmin);

  return (
    <motion.div
      className="mf-sidebar"
      animate={{ width: W }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', left: 0, top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #050A14 0%, #030610 40%, #020408 100%)',
        zIndex: 100, overflow: 'hidden', flexShrink: 0,
        fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
        isolation: 'isolate',
      }}
    >
      {/* Signature left light blade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 1, height: '100%',
        background: 'linear-gradient(180deg, rgba(6,230,255,0.5) 0%, rgba(6,230,255,0.12) 30%, rgba(0,255,136,0.06) 60%, transparent 100%)',
        zIndex: 10, pointerEvents: 'none',
      }}/>

      {/* Ambient top glow */}
      <div style={{
        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
        width: 160, height: 100,
        background: 'radial-gradient(ellipse, rgba(6,230,255,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>

      {/* ── Header ── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0' : '0 16px',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        position: 'relative', flexShrink: 0,
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => go('dashboard')}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
            border: '1px solid rgba(6,230,255,0.15)',
            boxShadow: '0 0 16px rgba(6,230,255,0.08)',
          }}>
            <img src={MARKETFLOW_LOGO} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }}/>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #06E6FF 0%, #00FF88 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  lineHeight: 1.1,
                }}>MarketFlow</div>
                <div style={{
                  fontSize: 8.5, fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.12)',
                  marginTop: 2, lineHeight: 1,
                }}>Journal</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse / Expand */}
        {!collapsed ? (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setCollapsed(true)}
            style={{
              width: 24, height: 24, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer', color: '#334566', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,230,255,0.08)'; e.currentTarget.style.color = '#06E6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#334566'; }}
          >
            <Ic.ChevronL />
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            onClick={() => setCollapsed(false)}
            style={{
              position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)',
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0C1422', border: '1px solid #162034',
              cursor: 'pointer', color: '#7A90B8', zIndex: 10,
              boxShadow: '2px 0 12px rgba(0,0,0,0.5)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#06E6FF'; e.currentTarget.style.color = '#06E6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#162034'; e.currentTarget.style.color = '#7A90B8'; }}
          >
            <Ic.ChevronR />
          </motion.button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '8px 8px' : '8px 10px',
        display: 'flex', flexDirection: 'column', gap: 14,
        scrollbarWidth: 'none',
      }}>
        {sections.map((sec, si) => (
          <div key={sec.id}>
            {/* Section label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.13)',
                    padding: '0 10px 5px', overflow: 'hidden', whiteSpace: 'nowrap',
                  }}
                >
                  {sec.label}
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed && si > 0 && (
              <div style={{ height: 1, margin: '5px 4px 7px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)' }}/>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {sec.items.map(item => {
                const act = currentPage === item.id;
                const h = hov === item.id;
                const Icon = item.Icon;
                const ic = act ? '#06E6FF' : h ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)';

                const btn = (
                  <motion.button
                    key={item.id}
                    onClick={() => go(item.id)}
                    onMouseEnter={() => setHov(item.id)}
                    onMouseLeave={() => setHov(null)}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '8px 0' : '7px 10px',
                      borderRadius: 7, border: 'none', cursor: 'pointer',
                      position: 'relative', overflow: 'hidden',
                      background: act ? 'rgba(6,230,255,0.06)' : h ? 'rgba(255,255,255,0.025)' : 'transparent',
                      transition: 'background 0.15s ease, padding 0.32s ease',
                    }}
                  >
                    {/* Active indicator */}
                    {act && (
                      <motion.div
                        layoutId="active"
                        style={{
                          position: 'absolute', left: 0, top: '22%', bottom: '22%',
                          width: 2, borderRadius: 1,
                          background: 'linear-gradient(180deg, #06E6FF, #00FF88)',
                          boxShadow: '0 0 8px rgba(6,230,255,0.3)',
                        }}
                      />
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      width: collapsed ? '100%' : 'auto',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: ic,
                        background: act ? 'rgba(6,230,255,0.08)' : h ? 'rgba(255,255,255,0.03)' : 'transparent',
                        border: act ? '1px solid rgba(6,230,255,0.15)' : '1px solid transparent',
                        transition: 'all 0.15s ease',
                      }}>
                        <Icon />
                      </div>
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15, delay: 0.03 }}
                            style={{
                              fontSize: 12.5, fontWeight: act ? 600 : 400,
                              color: act ? 'rgba(255,255,255,0.88)' : h ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
                              letterSpacing: '0.005em',
                              whiteSpace: 'nowrap', overflow: 'hidden',
                              transition: 'color 0.15s ease',
                            }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                );

                return collapsed
                  ? <Tooltip key={item.id} text={item.label}>{btn}</Tooltip>
                  : <React.Fragment key={item.id}>{btn}</React.Fragment>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: collapsed ? '8px' : '8px 10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        position: 'relative', flexShrink: 0,
      }}>
        {/* Settings panel */}
        <AnimatePresence>
          {panel && (
            <motion.div
              ref={panelRef}
              className="mf-panel"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: collapsed ? 80 : 10,
                width: collapsed ? 220 : 240,
                background: '#060C18',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 14,
                zIndex: 300,
                boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{
                fontSize: 8.5, fontWeight: 700, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.15)',
                marginBottom: 12, paddingBottom: 8,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>Preferences</div>

              {/* Theme */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>Theme</span>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 5, padding: 2, gap: 2 }}>
                  {['dark', 'light'].map(t => (
                    <button
                      key={t}
                      onClick={() => applyTheme(t)}
                      style={{
                        width: 26, height: 22, borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: theme === t ? 'rgba(255,255,255,0.06)' : 'transparent',
                        border: 'none', cursor: 'pointer',
                        color: theme === t ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      {t === 'dark' ? <Ic.Moon /> : <Ic.Sun />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent — Elite only */}
              {isElite && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>Accent</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#06E6FF', '#00FF88', '#A78BFA', '#FB923C', '#F472B6', '#FACC15'].map(c => (
                      <button
                        key={c}
                        onClick={() => applyAccent(c)}
                        style={{
                          width: 15, height: 15, borderRadius: '50%',
                          background: c, border: accent === c ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid transparent',
                          cursor: 'pointer', transition: 'all 0.14s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '10px 0' }}/>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <button
                  onClick={() => go('account-settings')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 7px', borderRadius: 6, border: 'none',
                    background: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 11.5,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                >
                  <Ic.Settings /> Account Settings
                </button>
                <button
                  onClick={() => go('subscription')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 7px', borderRadius: 6, border: 'none',
                    background: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 11.5,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ic.CreditCard /> Manage Plan
                  </div>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                    padding: '2px 5px', borderRadius: 3,
                    background: pi.c + '18', color: pi.c,
                  }}>{pi.l}</span>
                </button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 0' }}/>
                <button
                  onClick={() => { setPanel(false); onLogout?.(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 7px', borderRadius: 6, border: 'none',
                    background: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 11.5,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,70,70,0.05)'; e.currentTarget.style.color = '#FF6B6B'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                >
                  <Ic.Logout /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User button */}
        <motion.button
          className="mf-user-btn"
          onClick={() => setPanel(p => !p)}
          whileHover={{ background: 'rgba(255,255,255,0.025)' }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 9,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '6px 0' : '7px 9px',
            borderRadius: 9, border: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(255,255,255,0.015)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}, #00FF88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9.5, fontWeight: 700, color: '#030508',
            boxShadow: `0 0 10px ${accent}33`,
          }}>
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{ flex: 1, minWidth: 0, textAlign: 'left' }}
              >
                <div style={{
                  fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: 1, marginBottom: 3,
                }}>{firstName}</div>
                <div style={{
                  fontSize: 8.5, fontWeight: 600, letterSpacing: '0.08em',
                  color: pi.c, lineHeight: 1,
                }}>{pi.l}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default Sidebar;
