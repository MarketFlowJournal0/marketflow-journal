import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasRouteAccess, normalizePlan } from '../lib/subscription';

const MARKETFLOW_LOGO = '/logo192.png';
const ADMIN_EMAIL = 'marketflowjournal0@gmail.com';

const Ic = {
  Dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  Trades: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 4h13" />
      <path d="M1.5 8h9" />
      <path d="M1.5 12h5" />
      <circle cx="13" cy="12" r="1.5" />
    </svg>
  ),
  Analytics: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1.5,12 5,7.5 8.5,9.5 13,3.5 14.5,5" />
      <path d="M13 1.5h1.5v1.5" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="2" />
      <path d="M2 6.5h12" />
      <path d="M5 1.75v2.5" />
      <path d="M11 1.75v2.5" />
    </svg>
  ),
  Equity: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1.5 14.5V1.5" />
      <path d="M1.5 14.5h13" />
      <polyline points="3.5,11 6.5,7.5 9.5,9.5 14,5" />
    </svg>
  ),
  Backtest: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8.5" r="5.5" />
      <polyline points="8,5 8,8.5 10.5,10" />
      <path d="M4.5 2C2.8 3.2 1.5 5.2 1.5 8.5" />
      <polyline points="3.5,1 4.5,2 3.5,3.5" />
    </svg>
  ),
  Psychology: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5a4.5 4.5 0 014.5 4.5c0 1.8-1 3.4-2.7 4.3L10 12l.5 1.5H5.5L6 12l.3-1.2A4.5 4.5 0 018 1.5z" />
      <path d="M6.5 10h3" />
    </svg>
  ),
  Chat: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4.5A2.5 2.5 0 015.5 2h5A2.5 2.5 0 0113 4.5v4A2.5 2.5 0 0110.5 11H7l-3 2v-2A2.5 2.5 0 013 8.5z" />
    </svg>
  ),
  Broker: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="3.5" cy="8" r="1.8" />
      <circle cx="12.5" cy="4" r="1.8" />
      <circle cx="12.5" cy="12" r="1.8" />
      <path d="M5.3 7.3L10.7 5" />
      <path d="M5.3 8.7L10.7 11" />
    </svg>
  ),
  Reports: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 1.75h6L12.25 4V13A1.25 1.25 0 0111 14.25H4A1.25 1.25 0 012.75 13V3A1.25 1.25 0 014 1.75z" />
      <path d="M10 1.75V4h2.25" />
      <path d="M5.25 7h5.5" />
      <path d="M5.25 9.5h5.5" />
      <path d="M5.25 12h3.5" />
    </svg>
  ),
  Alerts: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2.25a3.5 3.5 0 00-3.5 3.5v1.4c0 .7-.18 1.38-.52 1.99L2.75 11.5h10.5l-1.23-2.36a4.18 4.18 0 01-.52-1.99v-1.4A3.5 3.5 0 008 2.25z" />
      <path d="M6.4 13.1a1.8 1.8 0 003.2 0" />
    </svg>
  ),
  Api: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.25 4.25L2.5 8l2.75 3.75" />
      <path d="M10.75 4.25L13.5 8l-2.75 3.75" />
      <path d="M8.75 2.5L7.25 13.5" />
    </svg>
  ),
  Admin: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.8 4.5H15l-4 2.7 1.5 4.3L8 10.5 3.5 13l1.5-4.3L1 6h5.2z" />
    </svg>
  ),
  ChevronL: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9,2.5 4.5,7 9,11.5" />
    </svg>
  ),
  ChevronR: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,2.5 9.5,7 5,11.5" />
    </svg>
  ),
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="2" />
      <path d="M7 1.5v1.6M7 10.9v1.6M1.5 7H3.1M10.9 7h1.6M3.1 3.1l1.1 1.1M9.8 9.8l1.1 1.1M10.9 3.1l-1.1 1.1M4.2 9.8l-1.1 1.1" />
    </svg>
  ),
  CreditCard: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="2.5" width="12" height="9" rx="1.5" />
      <path d="M1 6h12" />
    </svg>
  ),
  Support: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.2 10.8H3A1.5 1.5 0 011.5 9.3V7a5.5 5.5 0 1111 0v2.3a1.5 1.5 0 01-1.5 1.5H9.8" />
      <path d="M4.8 12.5h4.4" />
      <path d="M7 12.5v-1.7" />
    </svg>
  ),
  Logout: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5H3.5A1.5 1.5 0 002 4v6a1.5 1.5 0 001.5 1.5H6" />
      <polyline points="9.5,4 12.5,7 9.5,10" />
      <line x1="6" y1="7" x2="12.5" y2="7" />
    </svg>
  ),
};

const NAV = (isAdmin, plan) => [
  {
    id: 'trading',
    label: 'Trading',
    description: 'Core review',
    items: [
      { id: 'dashboard', label: 'Dashboard', Icon: Ic.Dashboard },
      { id: 'all-trades', label: 'All Trades', Icon: Ic.Trades },
      { id: 'calendar', label: 'Calendar', Icon: Ic.Calendar },
      { id: 'analytics-pro', label: 'Analytics', Icon: Ic.Analytics },
      { id: 'equity', label: 'Equity', Icon: Ic.Equity },
      { id: 'backtest', label: 'Backtest', Icon: Ic.Backtest },
    ].filter((item) => hasRouteAccess(plan, item.id)),
  },
  {
    id: 'tools',
    label: 'Tools',
    description: 'Execution tools',
    items: [
      { id: 'psychology', label: 'Psychology', Icon: Ic.Psychology },
      { id: 'broker-connect', label: 'Brokers', Icon: Ic.Broker },
      { id: 'ai-chat', label: 'AI Coach', Icon: Ic.Chat },
    ].filter((item) => hasRouteAccess(plan, item.id)),
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Delivery layer',
    items: [
      { id: 'reports', label: 'Reports', Icon: Ic.Reports },
      { id: 'alerts', label: 'Alerts', Icon: Ic.Alerts },
      { id: 'api-access', label: 'API Access', Icon: Ic.Api },
    ].filter((item) => hasRouteAccess(plan, item.id)),
  },
  ...(isAdmin ? [{
    id: 'admin',
    label: 'Admin',
    description: 'Admin access',
    items: [{ id: 'onboarding-stats', label: 'Onboarding', Icon: Ic.Admin }],
  }] : []),
].filter((section) => section.items.length > 0);

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: 'calc(100% + 12px)',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#0C1422',
              border: '1px solid #162034',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 11.5,
              fontWeight: 500,
              color: '#E8EEFF',
              whiteSpace: 'nowrap',
              zIndex: 9999,
              boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
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

function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed, user, onLogout }) {
  const [hovered, setHovered] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const firstName = user?.firstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const initials = firstName.slice(0, 2).toUpperCase();
  const email = user?.email || '';
  const plan = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const isAdmin = email === ADMIN_EMAIL;

  const PLAN = {
    starter: { label: 'Starter', accent: '#00F5D4', description: 'Focused journal access for clean execution review.' },
    pro: { label: 'Pro', accent: '#06E6FF', description: 'Advanced analytics and review tools for serious traders.' },
    elite: { label: 'Elite', accent: '#FFD700', description: 'Full MarketFlow access with AI, alerts, and API tools.' },
    trial: { label: 'Trial', accent: '#FB923C', description: 'Core journal access while the subscription finishes syncing.' },
  };

  const planInfo = PLAN[plan] || PLAN.trial;
  const sidebarWidth = collapsed ? 76 : 276;
  const sections = NAV(isAdmin, plan);
  const unlockedModules = sections.reduce((sum, section) => sum + section.items.length, 0);

  useEffect(() => {
    if (!panelOpen) return;

    const handleOutside = (event) => {
      if (!event.target.closest('.mf-panel') && !event.target.closest('.mf-user-btn')) {
        setPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [panelOpen]);

  const go = useCallback((id) => {
    setCurrentPage(id);
    setPanelOpen(false);
  }, [setCurrentPage]);

  const actionButtonStyle = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 11px',
    borderRadius: 10,
    border: '1px solid rgba(66,86,122,0.32)',
    background: 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
    color: 'rgba(232,238,255,0.72)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.14s ease',
  };

  return (
    <motion.aside
      className="mf-sidebar"
      animate={{ width: sidebarWidth }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
        flexShrink: 0,
        fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
        isolation: 'isolate',
        background: 'linear-gradient(180deg, rgba(7,11,18,0.98) 0%, rgba(4,7,13,0.98) 100%)',
        borderRight: '1px solid rgba(61,78,110,0.26)',
        boxShadow: '24px 0 80px rgba(0,0,0,0.28)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 14% 0%, rgba(6,230,255,0.12), transparent 30%), radial-gradient(circle at 85% 16%, rgba(0,255,136,0.07), transparent 24%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 16%, transparent 80%, rgba(255,255,255,0.015))', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: 'linear-gradient(180deg, rgba(6,230,255,0.42), rgba(0,255,136,0.1), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ padding: collapsed ? '16px 10px 12px' : '18px 16px 14px', borderBottom: '1px solid rgba(61,78,110,0.2)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, cursor: 'pointer', minWidth: 0 }} onClick={() => go('dashboard')}>
            <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(6,230,255,0.18)', background: 'linear-gradient(180deg, rgba(7,14,26,0.96), rgba(11,22,38,0.92))', boxShadow: '0 10px 22px rgba(0,0,0,0.2)' }}>
              <img src={MARKETFLOW_LOGO} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }} style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: '#E8EEFF', lineHeight: 1.05 }}>MarketFlow</div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.62)', marginTop: 4 }}>Trading Journal</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={{ width: 28, height: 28, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(66,86,122,0.3)', cursor: 'pointer', color: 'rgba(122,144,184,0.7)', flexShrink: 0, transition: 'all 0.14s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#E8EEFF';
                e.currentTarget.style.borderColor = 'rgba(6,230,255,0.22)';
                e.currentTarget.style.background = 'rgba(6,230,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(122,144,184,0.7)';
                e.currentTarget.style.borderColor = 'rgba(66,86,122,0.3)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
              }}
            >
              <Ic.ChevronL />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{ position: 'absolute', right: -11, top: 22, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1220', border: '1px solid rgba(66,86,122,0.45)', cursor: 'pointer', color: 'rgba(122,144,184,0.86)', boxShadow: '8px 0 18px rgba(0,0,0,0.22)' }}
          >
            <Ic.ChevronR />
          </button>
        )}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.16 }} style={{ padding: '14px 14px 10px', position: 'relative', zIndex: 2 }}>
            <div style={{ borderRadius: 18, padding: '16px 16px 14px', background: 'linear-gradient(160deg, rgba(12,20,34,0.98), rgba(8,13,23,0.94))', border: '1px solid rgba(66,86,122,0.32)', boxShadow: '0 20px 48px rgba(0,0,0,0.16)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.64)', marginBottom: 6 }}>Workspace</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#E8EEFF', letterSpacing: '-0.04em' }}>Journal Core</div>
                </div>
                <div style={{ padding: '4px 9px', borderRadius: 999, border: `1px solid ${planInfo.accent}30`, background: `${planInfo.accent}14`, color: planInfo.accent, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{planInfo.label}</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(232,238,255,0.68)', lineHeight: 1.65 }}>{planInfo.description}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(66,86,122,0.22)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.58)', marginBottom: 6 }}>Unlocked</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#E8EEFF', letterSpacing: '-0.04em' }}>{unlockedModules}</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(66,86,122,0.22)' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.58)', marginBottom: 6 }}>Profile</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.02em' }}>{firstName}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '10px 8px 12px' : '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'none', position: 'relative', zIndex: 2 }}>
        {sections.map((section, index) => (
          <div key={section.id}>
            {!collapsed ? (
              <div style={{ padding: '0 10px 8px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.62)' }}>{section.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(232,238,255,0.34)', marginTop: 3 }}>{section.description}</div>
              </div>
            ) : index > 0 ? (
              <div style={{ height: 1, margin: '3px 8px 8px', background: 'linear-gradient(90deg, transparent, rgba(66,86,122,0.34), transparent)' }} />
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {section.items.map((item) => {
                const isActive = currentPage === item.id;
                const isHovered = hovered === item.id;
                const Icon = item.Icon;
                const iconColor = isActive ? planInfo.accent : isHovered ? 'rgba(232,238,255,0.86)' : 'rgba(122,144,184,0.78)';

                const button = (
                  <motion.button
                    key={item.id}
                    onClick={() => go(item.id)}
                    onMouseEnter={() => setHovered(item.id)}
                    onMouseLeave={() => setHovered(null)}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: collapsed ? 0 : 12,
                      padding: collapsed ? '9px 0' : '9px 10px',
                      borderRadius: 14,
                      border: `1px solid ${isActive ? `${planInfo.accent}26` : isHovered ? 'rgba(66,86,122,0.36)' : 'transparent'}`,
                      background: isActive ? `linear-gradient(135deg, ${planInfo.accent}18, rgba(255,255,255,0.03))` : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                      color: isActive ? '#E8EEFF' : 'rgba(232,238,255,0.72)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      textAlign: 'left',
                    }}
                  >
                    {isActive && (
                      <motion.div layoutId="sidebar-active" style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 2, borderRadius: 999, background: planInfo.accent, boxShadow: `0 0 14px ${planInfo.accent}70` }} />
                    )}
                    <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, background: isActive ? `${planInfo.accent}12` : isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isActive ? `${planInfo.accent}18` : 'rgba(66,86,122,0.14)'}`, transition: 'all 0.14s ease' }}>
                      <Icon />
                    </div>
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.15 }} style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: 12.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#E8EEFF' : isHovered ? 'rgba(232,238,255,0.86)' : 'rgba(232,238,255,0.68)', letterSpacing: '0.004em', whiteSpace: 'nowrap' }}>{item.label}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );

                return collapsed ? <Tooltip key={item.id} text={item.label}>{button}</Tooltip> : <React.Fragment key={item.id}>{button}</React.Fragment>;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: collapsed ? '10px 8px 12px' : '10px 12px 14px', borderTop: '1px solid rgba(61,78,110,0.2)', position: 'relative', zIndex: 2 }}>
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              className="mf-panel"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: collapsed ? 84 : 12, width: 264, background: 'linear-gradient(160deg, rgba(11,18,32,0.98), rgba(6,10,18,0.98))', border: '1px solid rgba(66,86,122,0.34)', borderRadius: 18, padding: 12, zIndex: 300, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.34)' }}
            >
              <div style={{ padding: '12px 12px 14px', borderRadius: 14, background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(66,86,122,0.2)', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${planInfo.accent}, #00FF88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#030508', boxShadow: `0 10px 24px ${planInfo.accent}24` }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(232,238,255,0.56)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 12, padding: '4px 9px', borderRadius: 999, background: `${planInfo.accent}14`, border: `1px solid ${planInfo.accent}26`, color: planInfo.accent, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{planInfo.label} access</div>
                <div style={{ fontSize: 11.5, color: 'rgba(232,238,255,0.58)', lineHeight: 1.6, marginTop: 10 }}>{planInfo.description}</div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <button onClick={() => go('account-settings')} style={actionButtonStyle}>
                  <Ic.Settings /> Account Settings
                </button>
                <button onClick={() => go('subscription')} style={{ ...actionButtonStyle, justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Ic.CreditCard /> Manage Plan
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: planInfo.accent, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{planInfo.label}</span>
                </button>
                <button onClick={() => go('support')} style={actionButtonStyle}>
                  <Ic.Support /> Support
                </button>
                <button onClick={() => { setPanelOpen(false); onLogout?.(); }} style={{ ...actionButtonStyle, color: '#FF8A8A', border: '1px solid rgba(255,99,99,0.18)', background: 'rgba(255,77,77,0.04)' }}>
                  <Ic.Logout /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="mf-user-btn"
          onClick={() => setPanelOpen((value) => !value)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.99 }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 0' : '10px 11px', borderRadius: 15, border: `1px solid ${panelOpen ? `${planInfo.accent}26` : 'rgba(66,86,122,0.28)'}`, background: panelOpen ? `linear-gradient(135deg, ${planInfo.accent}12, rgba(255,255,255,0.03))` : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${planInfo.accent}, #00FF88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#030508', boxShadow: `0 10px 18px ${planInfo.accent}20` }}>{initials}</div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#E8EEFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: planInfo.accent, textTransform: 'uppercase', marginTop: 4 }}>{planInfo.label}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
