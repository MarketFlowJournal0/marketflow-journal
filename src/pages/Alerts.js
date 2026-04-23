import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { shade } from '../lib/colorAlpha';

const C = {
  bgCard: 'var(--mf-card,#0C1422)',
  cyan: 'var(--mf-accent,#06E6FF)',
  green: 'var(--mf-green,#00FF88)',
  purple: 'var(--mf-purple,#B06EFF)',
  danger: 'var(--mf-danger,#FF3D57)',
  gold: 'var(--mf-gold,#FFD700)',
  blue: 'var(--mf-blue,#4D7CFF)',
  t0: 'var(--mf-text-0,#FFFFFF)',
  t1: 'var(--mf-text-1,#E8EEFF)',
  t2: 'var(--mf-text-2,#7A90B8)',
  t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#162034)',
};

const Ic = {
  Bell: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5.5a5 5 0 00-10 0c0 5-2 6.5-2 6.5h14s-2-1.5-2-6.5z" /><path d="M6.5 13.5a1.5 1.5 0 003 0" /></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><path d="m2 4 6 4 6-4" /></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3" /></svg>,
  Target: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2.5" /><circle cx="8" cy="8" r=".8" fill="currentColor" /></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z" /></svg>,
  Clock: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5.5" /><path d="M8 5v3l2 1" /></svg>,
  Brain: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5A2.5 2.5 0 0 1 10.5 5v.2A2.4 2.4 0 0 1 12 9.3v.4A2.3 2.3 0 0 1 9.7 12H9" /><path d="M10 3.5A2.5 2.5 0 0 0 5.5 5v.2A2.4 2.4 0 0 0 4 9.3v.4A2.3 2.3 0 0 0 6.3 12H7" /><path d="M8 5.5v5" /></svg>,
};

const DEFAULT_CHANNELS = {
  inApp: true,
  email: false,
  push: false,
};

const DEFAULT_ALERTS = [
  { id: 'daily-loss', name: 'Daily loss cap', type: 'money', value: '300', category: 'risk', enabled: true, desc: 'Flags if today closes below the allowed daily loss.' },
  { id: 'weekly-drawdown', name: '7-day drawdown', type: 'money', value: '900', category: 'risk', enabled: true, desc: 'Checks the net result of the last seven days.' },
  { id: 'win-rate-floor', name: 'Win rate floor', type: 'percent', value: '45', category: 'performance', enabled: true, desc: 'Turns on when the current scoped win rate falls below the floor.' },
  { id: 'losing-streak', name: 'Losing streak', type: 'count', value: '3', category: 'performance', enabled: true, desc: 'Flags consecutive losses so you can pause before forcing trades.' },
  { id: 'profit-target', name: 'Daily profit target', type: 'money', value: '500', category: 'goals', enabled: false, desc: 'Marks the day once the session target is reached.' },
  { id: 'trade-count', name: 'Trade count cap', type: 'count', value: '8', category: 'risk', enabled: false, desc: 'Useful to spot overtrading before the quality slips.' },
  { id: 'psychology-floor', name: 'Psychology floor', type: 'score', value: '60', category: 'behavior', enabled: false, desc: 'Uses the average psychology score of the most recent scored trades.' },
];

export default function AlertsPage() {
  const { trades, stats } = useTradingContext();
  const { user } = useAuth();
  const storageKey = `mf_alerts_v2_${user?.id || 'guest'}`;
  const channelsKey = `mf_alert_channels_v2_${user?.id || 'guest'}`;

  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [channels, setChannels] = useState(DEFAULT_CHANNELS);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    try {
      const rawRules = window.localStorage.getItem(storageKey);
      const rawChannels = window.localStorage.getItem(channelsKey);
      if (rawRules) setAlerts(JSON.parse(rawRules));
      if (rawChannels) setChannels(JSON.parse(rawChannels));
    } catch {
      setAlerts(DEFAULT_ALERTS);
      setChannels(DEFAULT_CHANNELS);
    }
  }, [channelsKey, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(alerts));
  }, [alerts, storageKey]);

  useEffect(() => {
    window.localStorage.setItem(channelsKey, JSON.stringify(channels));
  }, [channels, channelsKey]);

  const evaluated = useMemo(() => evaluateAlerts(alerts, trades, stats), [alerts, trades, stats]);
  const categories = useMemo(() => {
    const keys = Array.from(new Set(alerts.map((alert) => alert.category)));
    return ['all', ...keys];
  }, [alerts]);

  const visibleAlerts = activeCategory === 'all'
    ? evaluated
    : evaluated.filter((item) => item.category === activeCategory);

  const triggered = evaluated.filter((item) => item.triggered);
  const enabledCount = evaluated.filter((item) => item.enabled).length;

  return (
    <div style={{ padding: '30px 34px 72px', maxWidth: 1380, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div style={panel()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <div>
            <div style={eyebrow(C.cyan)}>
              <Ic.Bell />
              Alert Rules
            </div>
            <h1 style={{ margin: '16px 0 0', fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.06em', color: C.t0 }}>
              Keep the journal
              <span style={{ color: C.cyan }}> watching your process</span>.
            </h1>
            <p style={{ margin: '16px 0 0', maxWidth: 760, fontSize: 14.5, lineHeight: 1.8, color: C.t2 }}>
              These rules read the same MarketFlow trade stream you review elsewhere in the journal. Thresholds, channels,
              and switches are saved in this workspace so the alert desk stays useful between sessions.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <MetricCard label="Rules enabled" value={`${enabledCount}/${alerts.length}`} tone={C.cyan} detail="Only enabled rules are evaluated." />
            <MetricCard label="Triggered now" value={String(triggered.length)} tone={triggered.length ? C.danger : C.green} detail="Live checks against the current journal scope." />
            <MetricCard label="Today P&L" value={money(sumDayTrades(trades, 0))} tone={sumDayTrades(trades, 0) >= 0 ? C.green : C.danger} detail="Used by daily loss and target rules." />
            <MetricCard label="Current streak" value={String(currentLosingStreak(trades))} tone={C.gold} detail="Consecutive losses from the latest trades." />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.88fr)', gap: 18, alignItems: 'start' }}>
        <div style={panel()}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${activeCategory === category ? shade(C.cyan, 0.26) : C.brd}`,
                  background: activeCategory === category ? shade(C.cyan, 0.08) : 'rgba(255,255,255,0.02)',
                  color: activeCategory === category ? C.cyan : C.t2,
                  fontSize: 11.5,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {category === 'all' ? 'All rules' : category}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {visibleAlerts.map((alert) => (
              <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
                padding: 16,
                borderRadius: 18,
                border: `1px solid ${alert.triggered ? shade(C.danger, 0.18) : shade(C.t3, 0.12)}`,
                background: alert.triggered ? shade(C.danger, 0.08) : 'rgba(255,255,255,0.02)',
                opacity: alert.enabled ? 1 : 0.56,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>{alert.name}</div>
                      <div style={badge(alert.triggered ? C.danger : alert.enabled ? C.green : C.t3)}>
                        {alert.triggered ? 'Triggered' : alert.enabled ? 'Watching' : 'Paused'}
                      </div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.7, color: C.t2 }}>{alert.desc}</div>
                    <div style={{ marginTop: 10, fontSize: 12, color: alert.triggered ? C.danger : C.t3 }}>
                      {alert.feedback}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
                    <label style={{ fontSize: 11, color: C.t3 }}>Threshold</label>
                    <input
                      value={alert.value}
                      onChange={(event) => setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, value: event.target.value } : item))}
                      style={inputStyle()}
                    />
                    <Toggle
                      on={alert.enabled}
                      onChange={(next) => setAlerts((current) => current.map((item) => item.id === alert.id ? { ...item, enabled: next } : item))}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={panel()}>
            <SectionTitle title="Notification channels" subtitle="Channels stay simple for now, but the rules behind them are already wired to live journal data." tone={C.cyan} />
            <div style={{ display: 'grid', gap: 10 }}>
              <ChannelRow icon={<Ic.Bell />} label="In-app" value={channels.inApp} onChange={(next) => setChannels((current) => ({ ...current, inApp: next }))} tone={C.cyan} />
              <ChannelRow icon={<Ic.Mail />} label="Email" value={channels.email} onChange={(next) => setChannels((current) => ({ ...current, email: next }))} tone={C.green} />
              <ChannelRow icon={<Ic.Target />} label="Push" value={channels.push} onChange={(next) => setChannels((current) => ({ ...current, push: next }))} tone={C.purple} />
            </div>
          </div>

          <div style={panel()}>
            <SectionTitle title="Triggered rules" subtitle="Only the rules that currently fire against the journal are listed here." tone={C.gold} />
            <div style={{ display: 'grid', gap: 10 }}>
              {triggered.length ? triggered.map((alert) => (
                <div key={alert.id} style={{ padding: '13px 14px', borderRadius: 16, border: `1px solid ${shade(C.danger, 0.18)}`, background: shade(C.danger, 0.08) }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t0 }}>{alert.name}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: C.t2, lineHeight: 1.65 }}>{alert.feedback}</div>
                </div>
              )) : (
                <div style={{ padding: 16, borderRadius: 16, border: `1px dashed ${shade(C.green, 0.18)}`, color: C.t2, lineHeight: 1.7, fontSize: 12.5 }}>
                  Nothing is firing right now. That usually means the current scope is staying inside your limits.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function evaluateAlerts(alerts, trades, stats) {
  const todayPnl = sumDayTrades(trades, 0);
  const weekPnl = sumLastDays(trades, 7);
  const todayCount = countDayTrades(trades, 0);
  const lossStreak = currentLosingStreak(trades);
  const recentPsych = averagePsychology(trades);

  return alerts.map((alert) => {
    const threshold = Number(alert.value || 0);
    let triggered = false;
    let feedback = 'Rule is waiting for more movement in the current journal scope.';

    if (alert.id === 'daily-loss') {
      triggered = todayPnl <= -Math.abs(threshold);
      feedback = `Today: ${money(todayPnl)} · cap: ${money(-Math.abs(threshold))}`;
    } else if (alert.id === 'weekly-drawdown') {
      triggered = weekPnl <= -Math.abs(threshold);
      feedback = `Last 7 days: ${money(weekPnl)} · limit: ${money(-Math.abs(threshold))}`;
    } else if (alert.id === 'win-rate-floor') {
      triggered = Number(stats.winRate || 0) < threshold;
      feedback = `Current scope win rate: ${formatPercent(stats.winRate)}% · floor: ${threshold}%`;
    } else if (alert.id === 'losing-streak') {
      triggered = lossStreak >= threshold && threshold > 0;
      feedback = `Current losing streak: ${lossStreak} · alert after: ${threshold}`;
    } else if (alert.id === 'profit-target') {
      triggered = todayPnl >= threshold && threshold > 0;
      feedback = `Today: ${money(todayPnl)} · target: ${money(threshold)}`;
    } else if (alert.id === 'trade-count') {
      triggered = todayCount >= threshold && threshold > 0;
      feedback = `Trades today: ${todayCount} · cap: ${threshold}`;
    } else if (alert.id === 'psychology-floor') {
      triggered = recentPsych > 0 && recentPsych < threshold;
      feedback = `Recent psychology average: ${recentPsych || '—'} · floor: ${threshold}`;
    }

    return {
      ...alert,
      triggered: alert.enabled ? triggered : false,
      feedback,
    };
  });
}

function sumDayTrades(trades, offsetDays) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - offsetDays);
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  return (trades || []).reduce((sum, trade) => {
    const parsed = new Date(trade.open_date || trade.date || trade.created_at || 0);
    if (Number.isNaN(parsed.getTime()) || parsed < base || parsed >= next) return sum;
    return sum + Number(trade.profit_loss ?? trade.pnl ?? 0);
  }, 0);
}

function countDayTrades(trades, offsetDays) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() - offsetDays);
  const next = new Date(base);
  next.setDate(next.getDate() + 1);
  return (trades || []).filter((trade) => {
    const parsed = new Date(trade.open_date || trade.date || trade.created_at || 0);
    return !Number.isNaN(parsed.getTime()) && parsed >= base && parsed < next;
  }).length;
}

function sumLastDays(trades, days) {
  const floor = new Date();
  floor.setDate(floor.getDate() - days);
  return (trades || []).reduce((sum, trade) => {
    const parsed = new Date(trade.open_date || trade.date || trade.created_at || 0);
    if (Number.isNaN(parsed.getTime()) || parsed < floor) return sum;
    return sum + Number(trade.profit_loss ?? trade.pnl ?? 0);
  }, 0);
}

function currentLosingStreak(trades) {
  const sorted = [...(trades || [])].sort((a, b) => new Date(b.open_date || b.date || 0) - new Date(a.open_date || a.date || 0));
  let streak = 0;
  for (const trade of sorted) {
    const pnl = Number(trade.profit_loss ?? trade.pnl ?? 0);
    if (pnl < 0) streak += 1;
    else break;
  }
  return streak;
}

function averagePsychology(trades) {
  const values = (trades || [])
    .map((trade) => Number(trade.psychologyScore ?? trade.psychology_score))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 8);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        border: `1px solid ${on ? shade(C.cyan, 0.22) : shade(C.t3, 0.18)}`,
        background: on ? shade(C.cyan, 0.1) : 'rgba(255,255,255,0.04)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <motion.span
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: on ? C.cyan : 'rgba(255,255,255,0.4)',
        }}
      />
    </button>
  );
}

function ChannelRow({ icon, label, value, onChange, tone }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', color: tone, background: shade(tone, 0.1), border: `1px solid ${shade(tone, 0.16)}` }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>{label}</div>
          <div style={{ marginTop: 4, fontSize: 11.5, color: C.t2 }}>{value ? 'Enabled in this workspace' : 'Disabled in this workspace'}</div>
        </div>
      </div>
      <Toggle on={value} onChange={onChange} />
    </div>
  );
}

function MetricCard({ label, value, tone, detail }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, border: `1px solid ${shade(tone, 0.16)}`, background: shade(tone, 0.08) }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em', color: tone }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle, tone }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ width: 36, height: 4, borderRadius: 999, background: `linear-gradient(90deg, ${tone}, ${shade(tone, 0.3)})`, marginBottom: 12 }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: C.t0 }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.7, color: C.t2 }}>{subtitle}</div>
    </div>
  );
}

function badge(tone) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 9px',
    borderRadius: 999,
    border: `1px solid ${shade(tone, 0.18)}`,
    background: shade(tone, 0.08),
    color: tone,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  };
}

function panel() {
  return {
    padding: 24,
    borderRadius: 24,
    border: `1px solid ${C.brd}`,
    background: 'linear-gradient(180deg, rgba(12,20,34,0.96), rgba(8,13,22,0.96))',
    boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
  };
}

function eyebrow(tone) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 12px',
    borderRadius: 999,
    border: `1px solid ${shade(tone, 0.18)}`,
    background: shade(tone, 0.08),
    color: tone,
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  };
}

function inputStyle() {
  return {
    width: 110,
    padding: '9px 10px',
    borderRadius: 10,
    border: `1px solid ${shade(C.t3, 0.18)}`,
    background: 'rgba(255,255,255,0.03)',
    color: C.t0,
    fontSize: 12,
    outline: 'none',
    fontFamily: 'inherit',
    textAlign: 'right',
  };
}

function money(value) {
  const amount = Number(value || 0);
  const abs = Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `${amount >= 0 ? '+' : '-'}$${abs}`;
}

function formatPercent(value) {
  const amount = Number(value || 0);
  return amount.toFixed(amount % 1 === 0 ? 0 : 1);
}
