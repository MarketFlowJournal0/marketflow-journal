import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hasRouteAccess, normalizePlan } from '../lib/subscription';
import {
  JOURNAL_THEME_KEY,
  JOURNAL_THEME_CUSTOM_KEY,
  JOURNAL_THEME_CUSTOM_VALUE,
  DEFAULT_JOURNAL_THEME_VALUE,
  DEFAULT_JOURNAL_CUSTOM_ACCENT,
  normalizeHexColor,
  getJournalTheme,
  applyJournalTheme,
} from '../lib/journalTheme';

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
    items: [
      { id: 'psychology', label: 'Psychology', Icon: Ic.Psychology },
      { id: 'broker-connect', label: 'Brokers', Icon: Ic.Broker },
      { id: 'ai-chat', label: 'AI Coach', Icon: Ic.Chat },
    ].filter((item) => hasRouteAccess(plan, item.id)),
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { id: 'reports', label: 'Reports', Icon: Ic.Reports },
      { id: 'alerts', label: 'Alerts', Icon: Ic.Alerts },
      { id: 'api-access', label: 'API Access', Icon: Ic.Api },
    ].filter((item) => hasRouteAccess(plan, item.id)),
  },
  ...(isAdmin ? [{
    id: 'admin',
    label: 'Admin',
    items: [{ id: 'onboarding-stats', label: 'Onboarding', Icon: Ic.Admin }],
  }] : []),
].filter((section) => section.items.length > 0);

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((part) => part + part).join('')
    : normalized;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPlanInfo(plan) {
  if (plan === 'elite') {
    return {
      label: 'Elite',
      description: 'Full journal suite with live accent control and premium personalization.',
    };
  }

  if (plan === 'pro') {
    return {
      label: 'Pro',
      description: 'Advanced analytics and premium interface presets across the journal.',
    };
  }

  if (plan === 'starter') {
    return {
      label: 'Starter',
      description: 'Focused journal access for disciplined execution review.',
    };
  }

  return {
    label: 'Trial',
    description: 'Core journal access while activation finishes syncing.',
  };
}

function SidebarAmbientCanvas({ accent, secondary }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    if (!ctx || !parent) return undefined;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const particles = [];
    const lines = [];

    const initScene = () => {
      particles.length = 0;
      lines.length = 0;

      const particleCount = Math.max(14, Math.round(width / 9));
      const lineCount = Math.max(4, Math.round(width / 46));

      for (let index = 0; index < particleCount; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: Math.random() * 1.4 + 0.45,
          alpha: Math.random() * 0.28 + 0.05,
          tint: Math.random() > 0.5 ? accent : secondary,
        });
      }

      for (let index = 0; index < lineCount; index += 1) {
        const points = [];
        let pointX = Math.random() * width;
        let pointY = Math.random() * height;

        for (let step = 0; step < 7; step += 1) {
          points.push({
            x: pointX,
            y: pointY,
            sway: Math.random() * Math.PI * 2,
          });
          pointX += 18 + Math.random() * 42;
          pointY += (Math.random() - 0.5) * 44;
        }

        lines.push({
          points,
          speed: Math.random() * 0.16 + 0.05,
          alpha: Math.random() * 0.06 + 0.018,
          tint: index % 2 === 0 ? accent : secondary,
        });
      }
    };

    const resize = () => {
      const bounds = parent.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initScene();
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, width, height);

      const topGlow = ctx.createRadialGradient(width * 0.18, height * 0.08, 0, width * 0.18, height * 0.08, width * 0.75);
      topGlow.addColorStop(0, withAlpha(accent, 0.12));
      topGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const lowerGlow = ctx.createRadialGradient(width * 0.82, height * 0.82, 0, width * 0.82, height * 0.82, width * 0.6);
      lowerGlow.addColorStop(0, withAlpha(secondary, 0.08));
      lowerGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = lowerGlow;
      ctx.fillRect(0, 0, width, height);

      lines.forEach((line, index) => {
        ctx.beginPath();
        line.points.forEach((point, pointIndex) => {
          const pointX = (point.x + time * line.speed * 0.02 + index * 16) % (width + 110) - 55;
          const pointY = point.y + Math.sin(time * 0.001 + point.sway + pointIndex * 0.35) * 5.5;

          if (pointIndex === 0) ctx.moveTo(pointX, pointY);
          else ctx.lineTo(pointX, pointY);
        });
        ctx.strokeStyle = withAlpha(line.tint, line.alpha);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(particle.tint, particle.alpha);
        ctx.fill();
      });

      for (let first = 0; first < particles.length; first += 1) {
        for (let second = first + 1; second < particles.length; second += 1) {
          const deltaX = particles[first].x - particles[second].x;
          const deltaY = particles[first].y - particles[second].y;
          const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

          if (distance < 78) {
            ctx.beginPath();
            ctx.moveTo(particles[first].x, particles[first].y);
            ctx.lineTo(particles[second].x, particles[second].y);
            ctx.strokeStyle = withAlpha(
              first % 2 === 0 ? accent : secondary,
              0.035 * (1 - (distance / 78)),
            );
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    animationFrame = window.requestAnimationFrame(draw);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    let observer;
    if (window.ResizeObserver) {
      observer = new ResizeObserver(() => resize());
      observer.observe(parent);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [accent, secondary]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.95,
      }}
    />
  );
}

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
  const [toneChoice] = useState(() => localStorage.getItem(JOURNAL_THEME_KEY) || DEFAULT_JOURNAL_THEME_VALUE);
  const [customAccent] = useState(() => normalizeHexColor(localStorage.getItem(JOURNAL_THEME_CUSTOM_KEY)) || DEFAULT_JOURNAL_CUSTOM_ACCENT);

  const firstName = user?.firstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const initials = firstName.slice(0, 2).toUpperCase();
  const email = user?.email || '';
  const plan = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const isAdmin = email === ADMIN_EMAIL;
  const activeTheme = getJournalTheme(plan, toneChoice, customAccent);
  const planInfo = {
    ...getPlanInfo(plan),
    accent: activeTheme.accent,
    secondary: activeTheme.secondary,
  };
  const sidebarWidth = collapsed ? 72 : 260;
  const sections = NAV(isAdmin, plan);

  useEffect(() => {
    const normalizedChoice = toneChoice === JOURNAL_THEME_CUSTOM_VALUE
      ? JOURNAL_THEME_CUSTOM_VALUE
      : (normalizeHexColor(toneChoice) || DEFAULT_JOURNAL_THEME_VALUE);
    const normalizedCustom = normalizeHexColor(customAccent) || DEFAULT_JOURNAL_CUSTOM_ACCENT;
    localStorage.setItem(JOURNAL_THEME_KEY, normalizedChoice);
    localStorage.setItem(JOURNAL_THEME_CUSTOM_KEY, normalizedCustom);
    applyJournalTheme(getJournalTheme(plan, normalizedChoice, normalizedCustom));
  }, [plan, toneChoice, customAccent]);

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
    borderRadius: 11,
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.025)',
    cursor: 'pointer',
    color: 'rgba(232,238,255,0.72)',
    fontSize: 12,
    fontWeight: 500,
    fontFamily: 'inherit',
    transition: 'all 0.16s ease',
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
        overflow: 'visible',
        flexShrink: 0,
        fontFamily: "'Inter', 'DM Sans', -apple-system, sans-serif",
        isolation: 'isolate',
        background: 'linear-gradient(180deg, rgba(3,5,8,0.98) 0%, rgba(4,7,13,0.98) 100%)',
        borderRight: '1px solid rgba(255,255,255,0.04)',
        boxShadow: '24px 0 80px rgba(0,0,0,0.32)',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;700;800&display=swap');

        @keyframes mf-sidebar-float-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(10px, 16px, 0) scale(1.04); }
        }

        @keyframes mf-sidebar-float-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-8px, -14px, 0) scale(1.06); }
        }

        @keyframes mf-sidebar-sheen {
          0% { transform: translateY(-120%); opacity: 0; }
          22% { opacity: 1; }
          100% { transform: translateY(120%); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%, transparent 78%, rgba(255,255,255,0.02))', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.02), transparent 30%, transparent 70%, rgba(255,255,255,0.015))', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 1, background: `linear-gradient(180deg, ${withAlpha(planInfo.accent, 0.6)}, ${withAlpha(planInfo.secondary, 0.2)}, transparent 72%)`, pointerEvents: 'none' }} />
      <SidebarAmbientCanvas accent={planInfo.accent} secondary={planInfo.secondary} />
      <div style={{ position: 'absolute', top: -72, left: -42, width: collapsed ? 140 : 220, height: collapsed ? 140 : 220, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(planInfo.accent, 0.18)} 0%, transparent 68%)`, filter: 'blur(14px)', pointerEvents: 'none', animation: 'mf-sidebar-float-a 11s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', right: collapsed ? -58 : -76, bottom: collapsed ? 54 : 34, width: collapsed ? 120 : 190, height: collapsed ? 120 : 190, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(planInfo.secondary, 0.12)} 0%, transparent 70%)`, filter: 'blur(18px)', pointerEvents: 'none', animation: 'mf-sidebar-float-b 13s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 0%, transparent 24%, ${withAlpha(planInfo.accent, 0.03)} 42%, transparent 70%)`, pointerEvents: 'none', animation: 'mf-sidebar-sheen 12s linear infinite' }} />

      <div style={{ padding: collapsed ? '16px 10px 14px' : '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 12, cursor: 'pointer', minWidth: 0 }} onClick={() => go('dashboard')}>
            <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', flexShrink: 0, border: `1px solid ${withAlpha(planInfo.accent, 0.2)}`, background: 'linear-gradient(180deg, rgba(7,14,26,0.96), rgba(11,22,38,0.92))', boxShadow: `0 10px 26px ${withAlpha(planInfo.accent, 0.16)}` }}>
              <img src={MARKETFLOW_LOGO} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 3 }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.16 }} style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, color: '#FFFFFF' }}>
                    Market
                    <span style={{ display: 'inline-block', background: `linear-gradient(90deg, ${planInfo.accent}, ${planInfo.secondary}, ${planInfo.accent})`, backgroundSize: '200% 100%', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' }}>
                      Flow
                    </span>
                  </div>
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
                e.currentTarget.style.borderColor = withAlpha(planInfo.accent, 0.28);
                e.currentTarget.style.background = withAlpha(planInfo.accent, 0.08);
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
        {!collapsed && (
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: planInfo.accent, boxShadow: `0 0 14px ${withAlpha(planInfo.accent, 0.75)}` }} />
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.6)' }}>
                Navigation
              </span>
            </div>
            <div style={{ padding: '5px 10px', borderRadius: 999, background: withAlpha(planInfo.accent, 0.1), border: `1px solid ${withAlpha(planInfo.accent, 0.18)}`, color: planInfo.accent, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {planInfo.label}
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: collapsed ? '10px 8px 12px' : '8px 12px 14px', display: 'flex', flexDirection: 'column', gap: 16, scrollbarWidth: 'none', position: 'relative', zIndex: 2 }}>
        {sections.map((section, index) => (
          <div key={section.id}>
            {!collapsed ? (
              <div style={{ padding: '0 10px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 1, background: `linear-gradient(90deg, ${withAlpha(planInfo.accent, 0.42)}, transparent)` }} />
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(122,144,184,0.62)' }}>{section.label}</div>
                </div>
              </div>
            ) : index > 0 ? (
              <div style={{ height: 1, margin: '4px 8px 10px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
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
                      border: `1px solid ${isActive ? withAlpha(planInfo.accent, 0.18) : isHovered ? 'rgba(255,255,255,0.06)' : 'transparent'}`,
                      background: isActive ? `linear-gradient(135deg, ${withAlpha(planInfo.accent, 0.16)}, ${withAlpha(planInfo.secondary, 0.06)})` : isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                      color: isActive ? '#E8EEFF' : 'rgba(232,238,255,0.72)',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      textAlign: 'left',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    {isActive && (
                      <motion.div layoutId="sidebar-active" style={{ position: 'absolute', left: 0, top: 9, bottom: 9, width: 2, borderRadius: 999, background: `linear-gradient(180deg, ${planInfo.accent}, ${planInfo.secondary})`, boxShadow: `0 0 14px ${withAlpha(planInfo.accent, 0.5)}` }} />
                    )}
                    <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, background: isActive ? withAlpha(planInfo.accent, 0.12) : isHovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)', border: `1px solid ${isActive ? withAlpha(planInfo.accent, 0.18) : 'rgba(255,255,255,0.04)'}`, boxShadow: isActive ? `0 10px 22px ${withAlpha(planInfo.accent, 0.14)}` : 'none', transition: 'all 0.14s ease' }}>
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

      <div style={{ padding: collapsed ? '10px 8px 12px' : '10px 12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 4 }}>
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              className="mf-panel"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'absolute', bottom: 'calc(100% + 12px)', left: collapsed ? 84 : (sidebarWidth - 28), width: 320, background: 'linear-gradient(160deg, rgba(8,12,20,0.98), rgba(5,8,14,0.98))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 12, zIndex: 320, overflow: 'hidden', backdropFilter: 'blur(18px)', boxShadow: '0 34px 90px rgba(0,0,0,0.48)' }}
            >
              <div style={{ position: 'absolute', left: collapsed ? -14 : 14, bottom: 26, width: 24, height: 24, borderRadius: 8, background: 'linear-gradient(145deg, rgba(8,12,20,0.98), rgba(5,8,14,0.98))', borderLeft: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', transform: 'rotate(45deg)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 0%, ${withAlpha(planInfo.accent, 0.14)}, transparent 34%), radial-gradient(circle at 88% 18%, ${withAlpha(planInfo.secondary, 0.08)}, transparent 26%)`, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', padding: '12px 12px 14px', borderRadius: 14, background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: `linear-gradient(135deg, ${planInfo.accent}, ${planInfo.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#030508', boxShadow: `0 12px 28px ${withAlpha(planInfo.accent, 0.24)}` }}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                    <div style={{ fontSize: 11, color: 'rgba(232,238,255,0.56)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: 12, padding: '4px 9px', borderRadius: 999, background: withAlpha(planInfo.accent, 0.12), border: `1px solid ${withAlpha(planInfo.accent, 0.22)}`, color: planInfo.accent, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{planInfo.label} access</div>
                <div style={{ fontSize: 11.5, color: 'rgba(232,238,255,0.58)', lineHeight: 1.6, marginTop: 10 }}>{planInfo.description}</div>
              </div>

              <div style={{ display: 'grid', gap: 8, position: 'relative' }}>
                <button onClick={() => go('account-settings')} style={actionButtonStyle}>
                  <Ic.Settings /> Account & Theme
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
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '8px 0' : '10px 11px', borderRadius: 15, border: `1px solid ${panelOpen ? withAlpha(planInfo.accent, 0.22) : 'rgba(255,255,255,0.06)'}`, background: panelOpen ? `linear-gradient(135deg, ${withAlpha(planInfo.accent, 0.12)}, ${withAlpha(planInfo.secondary, 0.03)})` : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.15s ease' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 12, flexShrink: 0, background: `linear-gradient(135deg, ${planInfo.accent}, ${planInfo.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#030508', boxShadow: `0 10px 20px ${withAlpha(planInfo.accent, 0.2)}` }}>{initials}</div>
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
