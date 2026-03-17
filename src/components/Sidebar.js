import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── COLLE ICI TA CONSTANTE MARKETFLOW_LOGO (inchangée depuis ton fichier original) ───
// const MARKETFLOW_LOGO = "data:image/png;base64,iVBORw0KGgoAAAA...";
// (trop longue pour afficher ici, laisse la tienne telle quelle)

// Si tu veux qu'elle reste, garde la ligne du fichier original.
// TOUT LE RESTE DU FICHIER EST IDENTIQUE SAUF LES 3 BOUTONS CI-DESSOUS.

const C = {
  bg: '#030508', bgCard: '#0C1422',
  cyan: '#06E6FF', teal: '#00F5D4', green: '#00FF88',
  blue: '#4D7CFF', purple: '#B06EFF', pink: '#FF4DC4',
  t0: '#FFFFFF', t1: '#E8EEFF', t2: '#7A90B8', t3: '#334566',
  brd: '#162034', brdHi: '#1E2E48',
  gradCyan: 'linear-gradient(135deg,#06E6FF,#00FF88)',
};

const NAV_SECTIONS = [
  {
    label: 'Trading',
    items: [
      { id: 'dashboard',     label: 'Dashboard',     icon: DashboardIcon   },
      { id: 'all-trades',    label: 'All Trades',    icon: TradesIcon      },
      { id: 'analytics-pro', label: 'Analytics Pro', icon: AnalyticsIcon,  badge: 'PRO', badgeColor: '#06E6FF' },
      { id: 'equity',        label: 'Equity',        icon: EquityIcon      },
      { id: 'backtest',      label: 'Backtest',      icon: BacktestIcon    },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { id: 'psychology',    label: 'Psychology',    icon: PsychologyIcon, badge: 'AI',  badgeColor: '#B06EFF' },
      { id: 'ai-chat',       label: 'AI Chat',       icon: AiChatIcon,     badge: 'NEW', badgeColor: '#FF4DC4' },
    ],
  },
];

/* ── Icons ── */
function DashboardIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" fill={color} opacity="0.9"/><rect x="13" y="3" width="8" height="8" rx="2" fill={color} opacity="0.6"/><rect x="3" y="13" width="8" height="8" rx="2" fill={color} opacity="0.6"/><rect x="13" y="13" width="8" height="8" rx="2" fill={color} opacity="0.4"/></svg>;
}
function TradesIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="16 7 22 7 22 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function AnalyticsIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity="0.4"/><path d="M12 3 A9 9 0 0 1 21 12" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><circle cx="12" cy="12" r="3" fill={color}/><line x1="12" y1="12" x2="17" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function BacktestIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12 A9 9 0 1 0 12 3" stroke={color} strokeWidth="2" strokeLinecap="round"/><polyline points="3 6 3 12 9 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="12" x2="15" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>;
}
function PsychologyIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 3 C5 3 3 6 3 9 C3 12 4 13 4 15 C4 17 6 18 8 18 L8 21 L16 21 L16 18 C18 18 20 17 20 15 C20 13 21 12 21 9 C21 6 19 3 15 3 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/><circle cx="9" cy="10" r="1.5" fill={color}/><circle cx="15" cy="10" r="1.5" fill={color}/><path d="M9 14 Q12 16 15 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
}
function EquityIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/></svg>;
}
function AiChatIcon({ color }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 15 C21 16.1 20.1 17 19 17 L7 17 L3 21 L3 5 C3 3.9 3.9 3 5 3 L19 3 C20.1 3 21 3.9 21 5 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.7"/><circle cx="9" cy="10" r="1" fill={color}/><circle cx="12" cy="10" r="1" fill={color}/><circle cx="15" cy="10" r="1" fill={color}/></svg>;
}
function ChevronIcon({ color, flipped = false, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ transform: flipped ? 'rotate(180deg)' : 'none' }}>
      <polyline points="15 18 9 12 15 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Tooltip (mode collapsed) ── */
function Tooltip({ label, badge, badgeColor, children }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -8, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -6, scale: 0.94 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute', left: 'calc(100% + 14px)', top: '50%', transform: 'translateY(-50%)',
              background: '#0C1422', border: '1px solid #1E2E48', borderRadius: 9,
              padding: '7px 13px', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 8,
              zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          >
            <div style={{
              position: 'absolute', left: -5, top: '50%',
              transform: 'translateY(-50%) rotate(45deg)',
              width: 8, height: 8, background: '#0C1422',
              border: '1px solid #1E2E48', borderRight: 'none', borderTop: 'none',
            }}/>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EEFF' }}>{label}</span>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.8px', padding: '2px 6px',
                borderRadius: 4, color: badgeColor, background: `${badgeColor}18`,
                border: `1px solid ${badgeColor}35`, textTransform: 'uppercase',
              }}>{badge}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   SIDEBAR COMPONENT
   Props: currentPage, setCurrentPage, collapsed, setCollapsed, user, onLogout
   ══════════════════════════════════════════ */
function Sidebar({ currentPage, setCurrentPage, collapsed, setCollapsed, user, onLogout }) {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('mf_theme') || 'dark');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('mf_accent') || '#06E6FF');

  // Infos user
  const firstName   = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const initials    = firstName.slice(0,2).toUpperCase();
  const email       = user?.email || '';
  const plan        = user?.user_metadata?.plan || 'trial';
  const isElite     = plan === 'elite';

  const PLAN_LABELS = {
    starter: { label: 'Starter',       color: '#00F5D4' },
    pro:     { label: 'Pro',           color: '#06E6FF' },
    elite:   { label: 'Elite ✦',       color: '#FFD700' },
    trial:   { label: 'Essai gratuit', color: '#00FF88' },
  };
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.trial;

  const applyTheme = (t) => {
    setTheme(t);
    localStorage.setItem('mf_theme', t);
    const root = document.documentElement;
    root.setAttribute('data-theme', t);
    if (t === 'light') {
      root.style.setProperty('--bg',         '#F2F5FC');
      root.style.setProperty('--bg-sidebar', '#FFFFFF');
      root.style.setProperty('--bg-card',    '#FFFFFF');
      root.style.setProperty('--bg-high',    '#EEF2FB');
      root.style.setProperty('--t0',         '#0A0F1E');
      root.style.setProperty('--t1',         '#1C2B4A');
      root.style.setProperty('--t2',         '#4A5E80');
      root.style.setProperty('--t3',         '#9AAAC8');
      root.style.setProperty('--brd',        '#D8E2F0');
      root.style.setProperty('--brd-hi',     '#BCC8E0');
      root.style.setProperty('--green',      '#00AA55');
      root.style.setProperty('--red',        '#E0243E');
      document.body.style.background = '#F2F5FC';
      document.body.style.color = '#0A0F1E';
    } else {
      root.style.setProperty('--bg',         '#030508');
      root.style.setProperty('--bg-sidebar', '#060D1A');
      root.style.setProperty('--bg-card',    '#0C1422');
      root.style.setProperty('--bg-high',    '#111B2E');
      root.style.setProperty('--t0',         '#FFFFFF');
      root.style.setProperty('--t1',         '#E8EEFF');
      root.style.setProperty('--t2',         '#7A90B8');
      root.style.setProperty('--t3',         '#334566');
      root.style.setProperty('--brd',        '#162034');
      root.style.setProperty('--brd-hi',     '#1E2E48');
      root.style.setProperty('--green',      '#00FF88');
      root.style.setProperty('--red',        '#FF3D57');
      document.body.style.background = '#030508';
      document.body.style.color = '#FFFFFF';
    }
  };

  const applyAccent = (c) => {
    setAccentColor(c);
    localStorage.setItem('mf_accent', c);
    document.documentElement.style.setProperty('--accent', c);
  };

  React.useEffect(() => {
    const savedTheme  = localStorage.getItem('mf_theme')  || 'dark';
    const savedAccent = localStorage.getItem('mf_accent') || '#06E6FF';
    applyTheme(savedTheme);
    applyAccent(savedAccent);
  }, []); // eslint-disable-line

  // ─── HANDLERS DES 3 BOUTONS ─────────────────────────────────────────────────

  // 1. Paramètres du compte → page dédiée
  const handleAccountSettings = () => {
    setSettingsOpen(false);
    setCurrentPage('account-settings');
  };

  // 2. Gérer l'abonnement → page abonnement avec plan actuel en contexte
  const handleManageSubscription = () => {
    setSettingsOpen(false);
    setCurrentPage('subscription');
  };

  // 3. Se déconnecter → logout puis retour landing page (géré par App.js via onLogout)
  const handleLogout = async () => {
    setSettingsOpen(false);
    if (onLogout) await onLogout();
  };

  // ─────────────────────────────────────────────────────────────────────────────

  const W = collapsed ? 72 : 260;

  return (
    <motion.div
      className="mf-sidebar"
      animate={{ width: W }}
      transition={{ duration: 0.30, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'fixed', left: 0, top: 0,
        height: '100vh',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #060D1A 0%, #04080F 60%, #030608 100%)',
        borderRight: '1px solid rgba(6,230,255,0.08)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.5), inset -1px 0 0 rgba(6,230,255,0.06)',
        zIndex: 100, overflow: 'hidden', flexShrink: 0,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      {/* Ambient top glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 240,
        background: 'radial-gradient(ellipse at 50% -10%,rgba(6,230,255,0.09) 0%,transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.022, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(6,230,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(6,230,255,.5) 1px,transparent 1px)',
        backgroundSize: '32px 32px',
      }}/>

      {/* ─── HEADER ─── */}
      <div style={{
        padding: collapsed ? '18px 0' : '18px 18px',
        borderBottom: '1px solid #162034',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 74, position: 'relative',
        transition: 'padding 0.30s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 11, overflow: 'hidden' }}>
          {/* Logo — toujours visible */}
          <div style={{
            width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
            background: 'linear-gradient(135deg,#030C18,#050F1E)',
            border: '1px solid rgba(6,230,255,0.25)',
            boxShadow: '0 0 20px rgba(6,230,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Remplace par : <img src={MARKETFLOW_LOGO} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain', padding:2 }}/> */}
            <span style={{ fontSize: 18 }}>📈</span>
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.20, delay: 0.05 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{
                  fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.4px',
                  background: 'linear-gradient(135deg,#06E6FF,#00FF88)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1,
                }}>MarketFlow</div>
                <div style={{ fontSize: 9.5, color: '#334566', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 2 }}>
                  Trading Journal
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setCollapsed(true)}
              title="Réduire"
              style={{
                width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.04)', border: '1px solid #162034',
                cursor: 'pointer', transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(6,230,255,0.09)'; e.currentTarget.style.borderColor='rgba(6,230,255,0.28)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='#162034'; }}
            >
              <ChevronIcon color="#334566"/>
            </motion.button>
          )}
        </AnimatePresence>

        {collapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.20, delay: 0.10 }}
            onClick={() => setCollapsed(false)}
            title="Agrandir"
            style={{
              position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)',
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0C1422', border: '1px solid #1E2E48',
              cursor: 'pointer', boxShadow: '2px 0 14px rgba(0,0,0,0.55)', zIndex: 10,
              transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(6,230,255,0.14)'; e.currentTarget.style.borderColor='#06E6FF'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#0C1422'; e.currentTarget.style.borderColor='#1E2E48'; }}
          >
            <ChevronIcon color="#7A90B8" size={12} flipped={true}/>
          </motion.button>
        )}
      </div>

      {/* ─── NAV ─── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: collapsed ? '10px 9px' : '10px 11px',
        display: 'flex', flexDirection: 'column', gap: 0,
        transition: 'padding 0.30s ease', scrollbarWidth: 'none',
      }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 9, fontWeight: 700, color: '#334566', letterSpacing: '2px',
                    textTransform: 'uppercase', padding: '10px 12px 6px',
                    overflow: 'hidden', whiteSpace: 'nowrap',
                  }}
                >
                  {section.label}
                </motion.div>
              )}
            </AnimatePresence>

            {collapsed && si > 0 && (
              <div style={{ height: 1, margin: '7px 5px 9px', background: 'linear-gradient(90deg,transparent,#162034,transparent)' }}/>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.items.map(item => {
                const isActive = currentPage === item.id;
                const isHov    = hoveredItem === item.id;
                const Icon     = item.icon;
                const iconColor = isActive ? '#06E6FF' : isHov ? '#E8EEFF' : '#7A90B8';

                const btn = (
                  <motion.button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'space-between',
                      padding: collapsed ? '9px 0' : '8px 11px',
                      borderRadius: 10, border: 'none', cursor: 'pointer',
                      position: 'relative', overflow: 'hidden',
                      background: isActive ? 'rgba(6,230,255,0.10)' : isHov ? 'rgba(6,230,255,0.05)' : 'transparent',
                      transition: 'background .14s ease, padding 0.30s ease',
                    }}
                  >
                    {isActive && (
                      <motion.div layoutId="activeBorder" style={{
                        position: 'absolute', left: 0, top: '18%', bottom: '18%',
                        width: 3, borderRadius: 2,
                        background: 'linear-gradient(135deg,#06E6FF,#00FF88)',
                        boxShadow: '0 0 10px #06E6FF',
                      }}/>
                    )}
                    {isActive && (
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 10, pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at 0% 50%,rgba(6,230,255,0.09) 0%,transparent 65%)',
                      }}/>
                    )}

                    <div style={{
                      display: 'flex', alignItems: 'center',
                      gap: collapsed ? 0 : 11,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      width: collapsed ? '100%' : 'auto', position: 'relative',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? 'rgba(6,230,255,0.13)' : isHov ? 'rgba(6,230,255,0.07)' : 'rgba(255,255,255,0.04)',
                        border: isActive ? '1px solid rgba(6,230,255,0.28)' : '1px solid rgba(255,255,255,0.05)',
                        boxShadow: isActive ? '0 0 12px rgba(6,230,255,0.15)' : 'none',
                        transition: 'all .14s ease',
                      }}>
                        <Icon color={iconColor}/>
                      </div>

                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.17, delay: 0.04 }}
                            style={{
                              fontSize: 13.5, fontWeight: isActive ? 700 : 500,
                              color: isActive ? '#FFFFFF' : isHov ? '#E8EEFF' : '#7A90B8',
                              transition: 'color .14s', letterSpacing: '-0.1px',
                              whiteSpace: 'nowrap', overflow: 'hidden',
                            }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {!collapsed && item.badge && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.14 }}
                          style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: '0.8px',
                            padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                            color: item.badgeColor, background: `${item.badgeColor}18`,
                            border: `1px solid ${item.badgeColor}35`, textTransform: 'uppercase',
                          }}
                        >{item.badge}</motion.span>
                      )}
                    </AnimatePresence>

                    {collapsed && item.badge && (
                      <div style={{
                        position: 'absolute', top: 5, right: 5,
                        width: 6, height: 6, borderRadius: '50%',
                        background: item.badgeColor, boxShadow: `0 0 5px ${item.badgeColor}`,
                      }}/>
                    )}
                  </motion.button>
                );

                return collapsed
                  ? <Tooltip key={item.id} label={item.label} badge={item.badge} badgeColor={item.badgeColor}>{btn}</Tooltip>
                  : <React.Fragment key={item.id}>{btn}</React.Fragment>;
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ height: 1, margin: '0 14px', background: 'linear-gradient(90deg,transparent,#162034,transparent)' }}/>

      {/* ─── USER PROFILE ─── */}
      <div style={{ padding: collapsed ? '11px 9px 15px' : '11px 11px 15px', transition: 'padding 0.30s ease', position: 'relative' }}>
        {collapsed ? (
          <Tooltip label={`${firstName} — ${planInfo.label}`}>
            <div
              style={{ display: 'flex', justifyContent: 'center', padding: '6px 0', cursor: 'pointer' }}
              onClick={() => setSettingsOpen(o => !o)}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#030508',
                boxShadow: `0 0 14px ${accentColor}55`, position: 'relative',
              }}>
                {initials}
                <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#00FF88', border: '1.5px solid #080E19', boxShadow: '0 0 5px #00FF88' }}/>
              </div>
            </div>
          </Tooltip>
        ) : (
          <motion.div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 11px', borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid #162034',
              cursor: 'pointer', transition: 'all .2s',
            }}
            whileHover={{ background: `rgba(6,230,255,0.05)`, borderColor: 'rgba(6,230,255,0.2)' }}
            onClick={() => setSettingsOpen(o => !o)}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, #00FF88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#030508',
              boxShadow: `0 0 14px ${accentColor}44`, position: 'relative',
            }}>
              {initials}
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: '#00FF88', border: '1.5px solid #080E19', boxShadow: '0 0 5px #00FF88' }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
              <div style={{ fontSize: 11, color: planInfo.color, marginTop: 1, fontWeight: 600 }}>{planInfo.label}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#334566' }}/>)}
            </div>
          </motion.div>
        )}

        {/* ─── SETTINGS PANEL ─── */}
        <AnimatePresence>
          {settingsOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setSettingsOpen(false)} />
              <motion.div
                initial={{ opacity: 0, x: -10, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'fixed',
                  bottom: 80, left: W + 12,
                  width: 290,
                  background: '#0C1422',
                  border: '1px solid #1E2E48',
                  borderRadius: 16,
                  zIndex: 200,
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                }}
              >
                {/* Header user */}
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #162034', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accentColor}, #00FF88)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800, color: '#030508', flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</div>
                      <div style={{ fontSize: 11, color: '#7A90B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
                    </div>
                    <div style={{
                      marginLeft: 'auto',
                      background: planInfo.color + '22',
                      border: `1px solid ${planInfo.color}44`,
                      color: planInfo.color,
                      fontSize: 10, fontWeight: 700,
                      padding: '3px 8px', borderRadius: 100, whiteSpace: 'nowrap',
                    }}>
                      {planInfo.label}
                    </div>
                  </div>
                </div>

                {/* Thème */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #162034' }}>
                  <div style={{ fontSize: 11, color: '#334566', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Thème</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['dark', 'light'].map(t => (
                      <button key={t} onClick={() => applyTheme(t)} style={{
                        flex: 1, padding: '8px', borderRadius: 8,
                        border: `1px solid ${theme === t ? accentColor : '#162034'}`,
                        background: theme === t ? accentColor + '22' : 'rgba(255,255,255,0.03)',
                        color: theme === t ? accentColor : '#7A90B8',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>
                        {t === 'dark' ? '🌙 Sombre' : '☀️ Clair'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Couleur accent */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #162034', opacity: isElite ? 1 : 0.45 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#334566', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Couleur d'accent</div>
                    {!isElite && (
                      <div style={{ fontSize: 10, color: '#FFD700', fontWeight: 600, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', padding: '2px 7px', borderRadius: 100 }}>
                        Elite ✦
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: accentColor, boxShadow: `0 0 12px ${accentColor}88`,
                      flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)',
                    }} />
                    <label style={{ flex: 1, cursor: isElite ? 'pointer' : 'not-allowed', position: 'relative' }}>
                      <div style={{
                        padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid #1E2E48', borderRadius: 8, fontSize: 12, color: '#7A90B8',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      }}>
                        <span style={{ fontFamily: 'monospace', color: accentColor, fontWeight: 700 }}>{accentColor.toUpperCase()}</span>
                        <span>🎨</span>
                      </div>
                      <input
                        type="color" value={accentColor} disabled={!isElite}
                        onChange={e => isElite && applyAccent(e.target.value)}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: isElite ? 'auto' : 'none' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {['#06E6FF','#00F5D4','#00FF88','#B06EFF','#FF4DC4','#FFD700','#FF8C42','#4D7CFF'].map(c => (
                      <button key={c} disabled={!isElite} onClick={() => isElite && applyAccent(c)} style={{
                        width: 22, height: 22, borderRadius: '50%', background: c, padding: 0,
                        border: accentColor === c ? '2px solid #fff' : '2px solid transparent',
                        cursor: isElite ? 'pointer' : 'not-allowed',
                        boxShadow: accentColor === c ? `0 0 8px ${c}` : 'none',
                        transition: 'all 0.15s',
                      }} />
                    ))}
                  </div>
                </div>

                {/* ─── ACTIONS — 3 boutons connectés ─── */}
                <div style={{ padding: '8px 10px' }}>

                  {/* 1. Paramètres du compte */}
                  <button
                    onClick={handleAccountSettings}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'none', border: 'none',
                      color: '#7A90B8', fontSize: 13, cursor: 'pointer',
                      borderRadius: 8, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(6,230,255,0.07)'; e.currentTarget.style.color='#E8EEFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#7A90B8'; }}
                  >
                    <span style={{ fontSize: 16 }}>⚙️</span>
                    <span>Paramètres du compte</span>
                  </button>

                  {/* 2. Gérer l'abonnement → page subscription avec plan actuel */}
                  <button
                    onClick={handleManageSubscription}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'none', border: 'none',
                      color: '#7A90B8', fontSize: 13, cursor: 'pointer',
                      borderRadius: 8, textAlign: 'left',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      transition: 'background 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(6,230,255,0.07)'; e.currentTarget.style.color='#E8EEFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#7A90B8'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>💳</span>
                      <span>Gérer l'abonnement</span>
                    </div>
                    {/* Badge plan actuel */}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
                      background: planInfo.color + '22',
                      border: `1px solid ${planInfo.color}44`,
                      color: planInfo.color,
                    }}>
                      {planInfo.label}
                    </span>
                  </button>

                  {/* Séparateur */}
                  <div style={{ height: 1, margin: '6px 4px', background: 'linear-gradient(90deg,transparent,#162034,transparent)' }}/>

                  {/* 3. Se déconnecter → logout + retour landing */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'none', border: 'none',
                      color: '#FF4D6A', fontSize: 13, cursor: 'pointer',
                      borderRadius: 8, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,61,106,0.09)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='none'; }}
                  >
                    <span style={{ fontSize: 16 }}>🚪</span>
                    <span>Se déconnecter</span>
                  </button>

                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default Sidebar;