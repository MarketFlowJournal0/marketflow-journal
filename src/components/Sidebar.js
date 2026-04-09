import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasRouteAccess, normalizePlan } from '../lib/subscription';

const MARKETFLOW_LOGO = "/logo192.png";

const ADMIN_EMAIL = 'marketflowjournal0@gmail.com';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW SIDEBAR v3 — Living Gradient
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
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="2"/>
      <path d="M2 6.5h12"/>
      <path d="M5 1.75v2.5"/>
      <path d="M11 1.75v2.5"/>
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
  Psychology: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 1.8-1 3.4-2.7 4.3L10 12l.5 1.5H5.5L6 12l.3-1.2A4.5 4.5 0 018 1.5z"/>
      <path d="M6.5 10h3"/>
    </svg>
  ),
  Chat: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5A2.5 2.5 0 015.5 2h5A2.5 2.5 0 0113 4.5v4A2.5 2.5 0 0110.5 11H7l-3 2v-2A2.5 2.5 0 013 8.5z"/>
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
const NAV = (isAdmin, plan) => [
  {
    id: 'trading',
    label: 'Trading',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: Ic.Dashboard },
      { id: 'all-trades', label: 'All Trades', Icon: Ic.Trades },
      { id: 'calendar', label: 'Calendar', Icon: Ic.Calendar },
      { id: 'analytics-pro', label: 'Analytics', Icon: Ic.Analytics },
      { id: 'equity', label: 'Equity', Icon: Ic.Equity },
      { id: 'backtest', label: 'Backtest', Icon: Ic.Backtest },
    ].filter(item => hasRouteAccess(plan, item.id)),
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [
      { id: 'psychology', label: 'Psychology', Icon: Ic.Psychology },
      { id: 'broker-connect', label: 'Brokers', Icon: Ic.Broker },
      { id: 'ai-chat', label: 'AI Coach', Icon: Ic.Chat },
    ].filter(item => hasRouteAccess(plan, item.id)),
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'reports', label: 'Reports', Icon: Ic.Analytics },
      { id: 'alerts', label: 'Alerts', Icon: Ic.Admin },
      { id: 'api-access', label: 'API Access', Icon: Ic.Broker },
    ].filter(item => hasRouteAccess(plan, item.id)),
  },
  ...(isAdmin ? [{
    id: 'admin',
    label: 'Admin',
    items: [{ id: 'onboarding-stats', label: 'Onboarding', Icon: Ic.Admin }],
  }] : []),
].filter(section => section.items.length > 0);

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
  const [tick, setTick] = useState(0);

  const firstName = user?.firstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const initials  = firstName.slice(0, 2).toUpperCase();
  const email     = user?.email || '';
  const plan      = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const isElite   = plan === 'elite';
  const isAdmin   = email === ADMIN_EMAIL;

  const PLAN = {
    starter: { l: 'Starter', c: '#00F5D4' },
    pro:     { l: 'Pro',     c: '#06E6FF' },
    elite:   { l: 'Elite',   c: '#FFD700' },
    trial:   { l: 'Trial',   c: '#FB923C' },
  };
  const pi = PLAN[plan] || PLAN.trial;

  const W = collapsed ? 72 : 260;

  /* Animated gradient tick */
  useEffect(() => {
    let frame;
    const loop = () => { setTick(t => t + 1); frame = requestAnimationFrame(loop); };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Dynamic gradient computation */
  const gradAngle = (tick * 0.3) % 360;
  const gradHue1 = (tick * 0.15) % 180;
  const gradHue2 = (gradHue1 + 120) % 360;

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

  const sections = NAV(isAdmin, plan);

  return (
    <motion.div
      className="mf-sidebar"
      animate={{ width: W }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', left: 0, top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflow: 'hidden', flexShrink: 0,
        fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
        isolation: 'isolate',
      }}
    >
      {/* ═══ LIVING GRADIENT BACKGROUND ═══ */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(${gradAngle}deg,
            rgba(6,230,255,0.08) 0%,
            rgba(0,255,136,0.05) 25%,
            rgba(6,230,255,0.03) 50%,
            rgba(0,255,136,0.06) 75%,
            rgba(6,230,255,0.08) 100%
          )
        `,
        transition: 'background 0.5s linear',
        zIndex: 0,
      }}/>

      {/* Deep base layer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #050A14 0%, #030610 50%, #020408 100%)',
        zIndex: -1,
      }}/>

      {/* Animated mesh orbs */}
      <div style={{
        position: 'absolute',
        top: `${20 + Math.sin(tick * 0.008) * 15}%`,
        left: `${10 + Math.cos(tick * 0.006) * 10}%`,
        width: 180, height: 180,
        background: 'radial-gradient(circle, rgba(6,230,255,0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'top 2s ease, left 2s ease',
      }}/>
      <div style={{
        position: 'absolute',
        bottom: `${15 + Math.cos(tick * 0.007) * 12}%`,
        right: `${5 + Math.sin(tick * 0.005) * 8}%`,
        width: 150, height: 150,
        background: 'radial-gradient(circle, rgba(0,255,136,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'bottom 2s ease, right 2s ease',
      }}/>

      {/* Scan line effect */}
      <div style={{
        position: 'absolute',
        top: `${(tick * 0.05) % 200 - 10}%`,
        left: 0, right: 0,
        height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.04), transparent)',
        pointerEvents: 'none',
        zIndex: 1,
      }}/>

      {/* Left edge — signature blade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 1, height: '100%',
        background: `linear-gradient(180deg, 
          rgba(6,230,255,${0.3 + Math.sin(tick * 0.02) * 0.15}) 0%, 
          rgba(0,255,136,${0.15 + Math.cos(tick * 0.015) * 0.08}) 40%, 
          transparent 100%)`,
        zIndex: 10, pointerEvents: 'none',
      }}/>

      {/* Right edge subtle */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 1,
        background: `linear-gradient(180deg, 
          rgba(255,255,255,${0.03 + Math.sin(tick * 0.01) * 0.01}) 0%, 
          transparent 100%)`,
        pointerEvents: 'none',
      }}/>

      {/* ── Header ── */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: collapsed ? '0' : '0 16px',
        justifyContent: collapsed ? 'center' : 'space-between',
        borderBottom: '1px solid rgba(6,230,255,0.08)',
        position: 'relative', flexShrink: 0,
        zIndex: 2,
      }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => go('dashboard')}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
            border: '1px solid rgba(6,230,255,0.2)',
            boxShadow: `0 0 ${16 + Math.sin(tick * 0.03) * 8}px rgba(6,230,255,0.1)`,
            transition: 'box-shadow 1s ease',
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
                  background: `linear-gradient(${gradAngle}deg, #06E6FF 0%, #00FF88 50%, #06E6FF 100%)`,
                  backgroundSize: '200% 100%',
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
        position: 'relative', zIndex: 2,
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
                    textTransform: 'uppercase',
                    color: `rgba(6,230,255,${0.2 + Math.sin(tick * 0.01 + si) * 0.08})`,
                    padding: '0 10px 5px', overflow: 'hidden', whiteSpace: 'nowrap',
                  }}
                >
                  {sec.label}
                </motion.div>
              )}
            </AnimatePresence>
            {collapsed && si > 0 && (
              <div style={{ height: 1, margin: '5px 4px 7px', background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.06), transparent)' }}/>
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
                      background: act
                        ? 'linear-gradient(90deg, rgba(6,230,255,0.1), rgba(0,255,136,0.04))'
                        : h
                          ? 'rgba(255,255,255,0.025)'
                          : 'transparent',
                      transition: 'background 0.15s ease, padding 0.32s ease',
                    }}
                  >
                    {/* Active indicator with glow */}
                    {act && (
                      <motion.div
                        layoutId="active"
                        style={{
                          position: 'absolute', left: 0, top: '15%', bottom: '15%',
                          width: 2, borderRadius: 1,
                          background: 'linear-gradient(180deg, #06E6FF, #00FF88)',
                          boxShadow: '0 0 12px rgba(6,230,255,0.4)',
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
                        background: act
                          ? 'rgba(6,230,255,0.1)'
                          : h
                            ? 'rgba(6,230,255,0.04)'
                            : 'transparent',
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
                              color: act ? 'rgba(255,255,255,0.9)' : h ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.38)',
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
        borderTop: '1px solid rgba(6,230,255,0.06)',
        position: 'relative', flexShrink: 0,
        zIndex: 2,
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
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 10px)',
                left: collapsed ? 80 : 10,
                width: collapsed ? 240 : 260,
                background: 'linear-gradient(160deg, #0C1830 0%, #080F1E 50%, #060C18 100%)',
                border: '1px solid rgba(6,230,255,0.1)',
                borderRadius: 14,
                padding: 0,
                zIndex: 300,
                overflow: 'hidden',
                boxShadow: '0 -12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(6,230,255,0.04), inset 0 1px 0 rgba(6,230,255,0.06)',
              }}
            >
              {/* User header */}
              <div style={{
                padding: '16px 16px 14px',
                background: 'linear-gradient(135deg, rgba(6,230,255,0.08) 0%, rgba(0,255,136,0.04) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.3), rgba(0,255,136,0.2), transparent)',
                }}/>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                    background: `linear-gradient(135deg, ${accent}, #00FF88)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#030508',
                    boxShadow: `0 2px 12px ${accent}44`,
                  }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      marginBottom: 3,
                    }}>{firstName}</div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', borderRadius: 5,
                      background: pi.c + '15', border: `1px solid ${pi.c}30`,
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      color: pi.c, textTransform: 'uppercase',
                    }}>{pi.l} Plan</div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '12px 12px 8px' }}>
                {/* Theme */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', marginBottom: 6,
                  background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.03)',
                }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Theme</span>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: 2.5, gap: 2 }}>
                    {['dark', 'light'].map(t => (
                      <button
                        key={t}
                        onClick={() => applyTheme(t)}
                        style={{
                          width: 28, height: 24, borderRadius: 5,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: theme === t ? 'rgba(6,230,255,0.12)' : 'transparent',
                          border: theme === t ? '1px solid rgba(6,230,255,0.2)' : '1px solid transparent',
                          cursor: 'pointer',
                          color: theme === t ? '#06E6FF' : 'rgba(255,255,255,0.25)',
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
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', marginBottom: 6,
                    background: 'rgba(255,255,255,0.02)', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>Accent</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['#06E6FF', '#00FF88', '#A78BFA', '#FB923C', '#F472B6', '#FACC15'].map(c => (
                        <button
                          key={c}
                          onClick={() => applyAccent(c)}
                          style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: c, border: accent === c ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent',
                            cursor: 'pointer', transition: 'all 0.14s ease',
                            boxShadow: accent === c ? `0 0 8px ${c}66` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div style={{
                height: 1, margin: '0 12px',
                background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.1), transparent)',
              }}/>

              {/* Actions */}
              <div style={{ padding: '6px 8px 8px' }}>
                <button
                  onClick={() => go('account-settings')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,230,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <Ic.Settings /> Account Settings
                </button>
                <button
                  onClick={() => go('subscription')}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'rgba(255,255,255,0.02)', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                    marginBottom: 2,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,230,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Ic.CreditCard /> Manage Plan
                  </div>
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em',
                    padding: '3px 7px', borderRadius: 5,
                    background: pi.c + '15', border: `1px solid ${pi.c}25`,
                    color: pi.c, textTransform: 'uppercase',
                  }}>{pi.l}</span>
                </button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.03)', margin: '4px 0' }}/>
                <button
                  onClick={() => { setPanel(false); onLogout?.(); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px', borderRadius: 8, border: 'none',
                    background: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 500,
                    fontFamily: 'inherit', transition: 'all 0.13s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,70,70,0.06)'; e.currentTarget.style.color = '#FF6B6B'; }}
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
          whileHover={{ background: 'rgba(6,230,255,0.04)' }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 9,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '6px 0' : '7px 9px',
            borderRadius: 9, border: '1px solid rgba(6,230,255,0.08)',
            background: 'rgba(6,230,255,0.02)',
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
