import React, { useState } from 'react';
import { motion } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW ALERTS — Premium Notifications
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: 'var(--mf-bg,#030508)', bgCard: 'var(--mf-card,#0C1422)', cyan: 'var(--mf-accent,#06E6FF)', green: 'var(--mf-green,#00FF88)',
  purple: 'var(--mf-purple,#B06EFF)', danger: 'var(--mf-danger,#FF3D57)', gold: 'var(--mf-gold,#FFD700)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)', brd: 'var(--mf-border,#162034)',
};

const Ic = {
  Bell: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5.5a5 5 0 00-10 0c0 5-2 6.5-2 6.5h14s-2-1.5-2-6.5z"/><path d="M6.5 13.5a1.5 1.5 0 003 0"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,7 8,9 14,3"/><path d="M14 1h-3v3"/></svg>,
  Target: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z"/></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M1 3l7 5 7-5"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>,
};

const ALERT_CATEGORIES = [
  { id: 'performance', name: 'Performance', icon: <Ic.Chart />, desc: 'Win rate, P&L, and streak alerts' },
  { id: 'risk', name: 'Risk Management', icon: <Ic.Shield />, desc: 'Drawdown limits and position sizing' },
  { id: 'goals', name: 'Goals & Targets', icon: <Ic.Target />, desc: 'Daily, weekly, and monthly targets' },
  { id: 'schedule', name: 'Schedule', icon: <Ic.Clock />, desc: 'Trading session reminders' },
];

const DEFAULT_ALERTS = [
  { id: 'daily_loss', cat: 'risk', name: 'Daily Loss Limit', desc: 'Alert when daily loss exceeds threshold', enabled: true, value: '3%' },
  { id: 'weekly_dd', cat: 'risk', name: 'Weekly Drawdown', desc: 'Alert when weekly drawdown exceeds limit', enabled: true, value: '5%' },
  { id: 'win_rate_drop', cat: 'performance', name: 'Win Rate Drop', desc: 'Alert when win rate drops below threshold', enabled: true, value: '45%' },
  { id: 'streak_loss', cat: 'performance', name: 'Losing Streak', desc: 'Alert after consecutive losses', enabled: true, value: '3' },
  { id: 'profit_target', cat: 'goals', name: 'Profit Target Reached', desc: 'Alert when daily profit target is met', enabled: false, value: '$500' },
  { id: 'trade_count', cat: 'goals', name: 'Trade Count Goal', desc: 'Alert when daily trade count reaches goal', enabled: false, value: '10' },
  { id: 'session_start', cat: 'schedule', name: 'Session Start', desc: 'Reminder before trading session begins', enabled: true, value: 'London' },
  { id: 'overtrading', cat: 'risk', name: 'Overtrading Warning', desc: 'Alert when taking too many trades', enabled: true, value: '8/day' },
];

// ─── Toggle Switch ──────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
      background: on ? C.cyan : 'rgba(255,255,255,0.08)',
      border: `1px solid ${on ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.3)' : 'rgba(255,255,255,0.06)'}`,
      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}>
      <motion.div animate={{ x: on ? 16 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} style={{
        width: 14, height: 14, borderRadius: '50%', background: on ? 'var(--mf-bg,#030508)' : 'rgba(255,255,255,0.3)',
        position: 'absolute', top: 2, left: 2,
      }} />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function AlertsPage() {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [activeCat, setActiveCat] = useState('all');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const filtered = activeCat === 'all' ? alerts : alerts.filter(a => a.cat === activeCat);
  const enabledCount = alerts.filter(a => a.enabled).length;

  const toggleAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,230,255,0.06)', border: '1px solid rgba(6,230,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
            <Ic.Bell />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: C.t0, margin: 0, letterSpacing: '-0.5px' }}>Alerts & Notifications</h1>
            <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>{enabledCount} of {alerts.length} alerts active</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Alerts List */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            <button onClick={() => setActiveCat('all')} style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${activeCat === 'all' ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)' : C.brd}`,
              background: activeCat === 'all' ? 'rgba(6,230,255,0.08)' : 'transparent',
              color: activeCat === 'all' ? C.cyan : C.t2, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>All</button>
            {ALERT_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.id)} style={{
                padding: '6px 12px', borderRadius: 6, border: `1px solid ${activeCat === cat.id ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)' : C.brd}`,
                background: activeCat === cat.id ? 'rgba(6,230,255,0.08)' : 'transparent',
                color: activeCat === cat.id ? C.cyan : C.t2, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ color: activeCat === cat.id ? C.cyan : C.t3 }}>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Alert Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                  borderRadius: 10, background: alert.enabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                  border: `1px solid ${alert.enabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)'}`,
                  opacity: alert.enabled ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.t0, marginBottom: 3 }}>{alert.name}</div>
                  <div style={{ fontSize: 11, color: C.t3 }}>{alert.desc}</div>
                </div>
                <div style={{
                  padding: '3px 8px', borderRadius: 5, background: 'rgba(6,230,255,0.08)',
                  border: '1px solid rgba(6,230,255,0.15)', fontSize: 10, fontWeight: 700,
                  color: C.cyan, fontFamily: "'JetBrains Mono',monospace",
                }}>{alert.value}</div>
                <Toggle on={alert.enabled} onChange={() => toggleAlert(alert.id)} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notification Channels */}
          <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 14 }}>Notification Channels</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.cyan }}><Ic.Mail /></span>
                  <span style={{ fontSize: 12, color: C.t2 }}>Email</span>
                </div>
                <Toggle on={emailNotif} onChange={setEmailNotif} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.purple }}><Ic.Bell /></span>
                  <span style={{ fontSize: 12, color: C.t2 }}>Push</span>
                </div>
                <Toggle on={pushNotif} onChange={setPushNotif} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 14 }}>Alert Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { l: 'Active Alerts', v: enabledCount, c: C.cyan },
                { l: 'Disabled', v: alerts.length - enabledCount, c: C.t3 },
                { l: 'Triggered Today', v: 0, c: C.green },
                { l: 'Triggered This Week', v: 2, c: C.gold },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: C.t3 }}>{s.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.c, fontFamily: "'JetBrains Mono',monospace" }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

