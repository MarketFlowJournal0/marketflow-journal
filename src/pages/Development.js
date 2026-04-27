import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  DEVELOPMENT_TASKS,
  computeEntryScore,
  createDevelopmentEntry,
  getDevelopmentScoreSnapshot,
  saveDevelopmentEntry,
} from '../lib/developmentScore';
import {
  CHART_AXIS_SMALL,
  CHART_GRID,
  chartActiveDot,
  chartCursor,
  chartTooltipStyle,
} from '../lib/marketflowCharts';

const C = {
  accent: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  blue: 'var(--mf-blue,#4D7CFF)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  purple: 'var(--mf-purple,#A78BFA)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#142033)',
  borderHi: 'var(--mf-border-hi,#1F2F47)',
};

const ROUTES = {
  dashboard: '/dashboard',
  trades: '/all-trades',
  analytics: '/analytics-pro',
  psychology: '/psychology',
  backtest: '/backtest',
};

const PAGE_STYLES = `
  .mf-dev-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(340px, 0.82fr);
    gap: 14px;
    align-items: start;
  }

  .mf-dev-secondary-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
    margin-top: 14px;
  }

  @media (max-width: 1180px) {
    .mf-dev-grid,
    .mf-dev-secondary-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const Ic = {
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.4 6.8 5.1 9.3 10.6 3.7" />
    </svg>
  ),
  Arrow: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5h8.2" />
      <path d="M6.9 3.2l3.3 3.3-3.3 3.3" />
    </svg>
  ),
  Target: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="7.5" r="5.8" />
      <circle cx="7.5" cy="7.5" r="2.7" />
      <path d="M7.5 1.7v2" />
      <path d="M7.5 11.3v2" />
      <path d="M1.7 7.5h2" />
      <path d="M11.3 7.5h2" />
    </svg>
  ),
  Shield: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.8 12 3.5v3.2c0 2.8-1.65 5.1-4.5 6.5C4.65 11.8 3 9.5 3 6.7V3.5z" />
      <path d="M5.7 7.4 7 8.7l2.4-2.8" />
    </svg>
  ),
};

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.42,
      delay: index * 0.05,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function formatCurrency(value = 0, signed = false) {
  const amount = Number(value) || 0;
  const formatted = Math.abs(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (signed) {
    if (amount > 0) return `+$${formatted}`;
    if (amount < 0) return `-$${formatted}`;
  }
  return `$${formatted}`;
}

function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getTradePnl(trade = {}) {
  return Number(trade.profit_loss ?? trade.pnl ?? trade.profit ?? 0) || 0;
}

function Card({ children, tone = C.accent, style, index = 0 }) {
  return (
    <motion.section
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.14)}`,
        background: 'linear-gradient(180deg, rgba(10,16,27,0.92), rgba(7,11,19,0.96))',
        boxShadow: '0 22px 70px rgba(0,0,0,0.27)',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.11)} 0%, transparent 44%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionHeader({ eyebrow, title, action, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {icon ? (
            <div style={{ width: 28, height: 28, borderRadius: 10, display: 'grid', placeItems: 'center', color: C.text1, background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {icon}
            </div>
          ) : null}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
            {eyebrow}
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.055em', color: C.text0 }}>
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}

function GhostButton({ children, onClick, icon, tone = C.text1 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${shade(tone, 0.14)}`,
        background: 'rgba(255,255,255,0.032)',
        color: tone,
        borderRadius: 12,
        padding: '9px 12px',
        fontSize: 12,
        fontWeight: 800,
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
      {icon}
    </button>
  );
}

function MiniMetric({ label, value, caption, tone = C.text1 }) {
  return (
    <div style={{ padding: '13px 14px 12px', borderRadius: 17, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 21, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.045em', color: tone }}>
        {value}
      </div>
      {caption ? (
        <div style={{ marginTop: 6, fontSize: 11.5, color: C.text2, lineHeight: 1.5 }}>
          {caption}
        </div>
      ) : null}
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          resize: 'vertical',
          borderRadius: 16,
          border: `1px solid ${shade(C.borderHi, 0.8)}`,
          background: 'rgba(3,7,13,0.78)',
          color: C.text1,
          padding: '12px 13px',
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: 1.6,
          outline: 'none',
        }}
      />
    </label>
  );
}

export default function Development() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trades = [], allTrades = [], stats = {}, accountOptions = [], activeAccount = 'all' } = useTradingContext();
  const userId = user?.id || user?.email || 'guest';
  const [snapshot, setSnapshot] = useState(() => getDevelopmentScoreSnapshot(userId, activeAccount));
  const today = snapshot.today || createDevelopmentEntry(snapshot.todayKey);

  useEffect(() => {
    setSnapshot(getDevelopmentScoreSnapshot(userId, activeAccount));
  }, [activeAccount, userId]);

  const todayTrades = useMemo(() => {
    const todayKey = snapshot.todayKey;
    return (trades || []).filter((trade) => toDateKey(trade.open_date || trade.date || trade.open_time || trade.created_at) === todayKey);
  }, [snapshot.todayKey, trades]);

  const recentChart = useMemo(() => snapshot.recent.map((entry) => ({
    day: entry.dateKey.slice(5),
    score: computeEntryScore(entry),
    discipline: Number(entry.disciplineRating || 0) * 10,
  })), [snapshot.recent]);

  const todayPnl = todayTrades.reduce((sum, trade) => sum + getTradePnl(trade), 0);
  const completedTasks = DEVELOPMENT_TASKS.filter((task) => today.tasks?.[task.id]).length;
  const activeAccountLabel = accountOptions.find((account) => account.id === activeAccount)?.label || 'All Accounts';
  const disciplineTone = snapshot.score >= 78 ? C.green : snapshot.score >= 58 ? C.warn : C.danger;

  const updateToday = (patch) => {
    const next = {
      ...today,
      ...patch,
      tasks: patch.tasks || today.tasks,
    };
    setSnapshot(saveDevelopmentEntry(userId, activeAccount, next));
  };

  const toggleTask = (taskId) => {
    updateToday({
      tasks: {
        ...today.tasks,
        [taskId]: !today.tasks?.[taskId],
      },
    });
  };

  return (
    <div style={{ padding: '30px 30px 56px', color: C.text1, width: '100%', boxSizing: 'border-box' }}>
      <style>{PAGE_STYLES}</style>

      <motion.div {...panelMotion(0)} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 11px', borderRadius: 999, border: `1px solid ${shade(C.accent, 0.14)}`, background: shade(C.accent, 0.06), color: C.accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            <Ic.Target />
            Development workspace
          </div>
          <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1.02, letterSpacing: '-0.075em', color: C.text0 }}>
            Discipline, regularity, and execution process.
          </h1>
          <p style={{ margin: '14px 0 0', maxWidth: 760, fontSize: 14.5, lineHeight: 1.75, color: C.text2 }}>
            This is the daily process desk. It feeds the MFJ score together with All Trades, so the rank rewards clean execution and consistency, not only profit.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <GhostButton onClick={() => navigate(ROUTES.dashboard)}>Dashboard</GhostButton>
          <GhostButton onClick={() => navigate(ROUTES.trades)} icon={<Ic.Arrow />}>All Trades</GhostButton>
        </div>
      </motion.div>

      <div className="mf-dev-grid">
        <Card tone={disciplineTone} index={1} style={{ padding: 22 }}>
          <SectionHeader
            eyebrow="Daily command"
            title="Today's execution checklist"
            icon={<Ic.Shield />}
            action={<MiniMetric label="MFJ process" value={`${snapshot.score}/100`} tone={disciplineTone} caption={`${snapshot.streak} day streak`} />}
          />

          <div style={{ display: 'grid', gap: 9, marginBottom: 18 }}>
            {DEVELOPMENT_TASKS.map((task) => {
              const done = Boolean(today.tasks?.[task.id]);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px minmax(0, 1fr) auto',
                    gap: 12,
                    alignItems: 'center',
                    width: '100%',
                    padding: '12px 13px',
                    borderRadius: 16,
                    border: `1px solid ${done ? shade(C.green, 0.22) : shade(C.borderHi, 0.8)}`,
                    background: done ? shade(C.green, 0.08) : 'rgba(255,255,255,0.025)',
                    color: C.text1,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ width: 24, height: 24, borderRadius: 8, display: 'grid', placeItems: 'center', border: `1px solid ${done ? shade(C.green, 0.44) : shade(C.text3, 0.4)}`, color: done ? C.green : C.text3, background: done ? shade(C.green, 0.12) : 'rgba(255,255,255,0.02)' }}>
                    {done ? <Ic.Check /> : null}
                  </span>
                  <span>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: done ? C.text0 : C.text1 }}>{task.label}</span>
                    <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: C.text3 }}>{task.category}</span>
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: done ? C.green : C.text3 }}>{task.weight} pts</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <TextArea
              label="Session focus"
              value={today.focus}
              onChange={(value) => updateToday({ focus: value })}
              placeholder="What must be true before you trade?"
            />
            <TextArea
              label="Risk plan"
              value={today.riskPlan}
              onChange={(value) => updateToday({ riskPlan: value })}
              placeholder="Risk per trade, max loss, invalidation."
            />
            <TextArea
              label="Post-session review"
              value={today.review}
              onChange={(value) => updateToday({ review: value })}
              placeholder="What happened? What did the data show?"
            />
            <TextArea
              label="One improvement"
              value={today.improvement}
              onChange={(value) => updateToday({ improvement: value })}
              placeholder="One behavior to improve tomorrow."
            />
          </div>
        </Card>

        <div style={{ display: 'grid', gap: 14 }}>
          <Card tone={C.accent} index={2} style={{ padding: 20 }}>
            <SectionHeader eyebrow="Today" title="Process pulse" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <MiniMetric label="Checklist" value={`${completedTasks}/${DEVELOPMENT_TASKS.length}`} tone={C.text1} />
              <MiniMetric label="Today P&L" value={formatCurrency(todayPnl, true)} tone={todayPnl >= 0 ? C.green : C.danger} />
              <MiniMetric label="Trades today" value={String(todayTrades.length)} tone={C.accent} caption={activeAccountLabel} />
              <MiniMetric label="Weekly avg" value={`${snapshot.weeklyAverage}/100`} tone={snapshot.weeklyAverage >= 70 ? C.green : C.warn} />
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>Discipline rating</span>
                <input type="range" min="1" max="10" value={today.disciplineRating} onChange={(event) => updateToday({ disciplineRating: Number(event.target.value) })} />
              </label>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>Sleep quality</span>
                <input type="range" min="1" max="10" value={today.sleepQuality} onChange={(event) => updateToday({ sleepQuality: Number(event.target.value) })} />
              </label>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>Mental state</span>
                <select
                  value={today.mentalState}
                  onChange={(event) => updateToday({ mentalState: event.target.value })}
                  style={{
                    borderRadius: 13,
                    border: `1px solid ${shade(C.borderHi, 0.8)}`,
                    background: 'rgba(3,7,13,0.78)',
                    color: C.text1,
                    padding: '11px 12px',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="steady">Steady</option>
                  <option value="sharp">Sharp</option>
                  <option value="tired">Tired</option>
                  <option value="emotional">Emotional</option>
                  <option value="overconfident">Overconfident</option>
                </select>
              </label>
            </div>
          </Card>

          <Card tone={C.blue} index={3} style={{ padding: 20 }}>
            <SectionHeader eyebrow="Connected data" title="All Trades source" />
            <div style={{ fontSize: 13, lineHeight: 1.7, color: C.text2, marginBottom: 14 }}>
              Development score uses your process. Performance context comes from the central All Trades stream.
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <MiniMetric label="Total trades" value={String(allTrades.length)} tone={C.text1} />
              <MiniMetric label="Scoped P&L" value={formatCurrency(stats.pnl || 0, true)} tone={(stats.pnl || 0) >= 0 ? C.green : C.danger} />
              <MiniMetric label="Win rate" value={`${Number(stats.winRate || 0).toFixed(1)}%`} tone={(stats.winRate || 0) >= 50 ? C.green : C.warn} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mf-dev-secondary-grid">
        <Card tone={C.green} index={4} style={{ padding: 20 }}>
          <SectionHeader eyebrow="Regularity" title="14-day process curve" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentChart}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="day" {...CHART_AXIS_SMALL} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}`} {...CHART_AXIS_SMALL} />
                <Tooltip cursor={chartCursor(C.green)} content={({ active, payload = [], label }) => {
                  if (!active || !payload.length) return null;
                  return (
                    <div style={{ ...chartTooltipStyle(C.green), padding: '12px 13px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 12, color: C.green, fontWeight: 900 }}>Score {payload[0]?.value}/100</div>
                    </div>
                  );
                }} />
                <Line type="monotone" dataKey="score" stroke={C.green} strokeWidth={2.4} dot={false} activeDot={chartActiveDot(C.green)} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card tone={C.purple} index={5} style={{ padding: 20 }}>
          <SectionHeader eyebrow="Discipline" title="Daily discipline map" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentChart}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="day" {...CHART_AXIS_SMALL} />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}`} {...CHART_AXIS_SMALL} />
                <Tooltip cursor={chartCursor(C.purple)} content={({ active, payload = [], label }) => {
                  if (!active || !payload.length) return null;
                  return (
                    <div style={{ ...chartTooltipStyle(C.purple), padding: '12px 13px' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 8 }}>{label}</div>
                      <div style={{ fontSize: 12, color: C.purple, fontWeight: 900 }}>Discipline {payload[0]?.value}/100</div>
                    </div>
                  );
                }} />
                <Bar dataKey="discipline" fill={shade(C.purple, 0.72)} radius={[10, 10, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card tone={C.text1} index={6} style={{ padding: 18, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.text0, marginBottom: 5 }}>Next action</div>
            <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.6 }}>
              Keep this desk open before and after the session. All Trades remains the source of truth; this page adds the process layer that improves the MFJ score.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GhostButton onClick={() => navigate(ROUTES.psychology)}>Psychology</GhostButton>
            <GhostButton onClick={() => navigate(ROUTES.analytics)}>Analytics</GhostButton>
            <GhostButton onClick={() => navigate(ROUTES.backtest)}>Backtest</GhostButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
