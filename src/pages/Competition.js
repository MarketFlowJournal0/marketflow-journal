import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { shade } from '../lib/colorAlpha';
import {
  buildCompetitionBoard,
  buildMarketFlowRank,
} from '../lib/marketflowCompetition';

const C = {
  accent: 'var(--mf-accent,#06E6FF)',
  green: 'var(--mf-green,#00FF88)',
  blue: 'var(--mf-blue,#4D7CFF)',
  teal: 'var(--mf-teal,#00F5D4)',
  purple: 'var(--mf-purple,#A78BFA)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
};

const ROUTES = {
  dashboard: '/dashboard',
  trades: '/all-trades',
};

const ROUTINE_DAY_PREFIX = 'mf_dashboard_routine_day_v1_';

const PAGE_STYLES = `
  .mf-competition-grid-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.8fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-competition-grid-main {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.82fr);
    gap: 14px;
    margin-bottom: 14px;
  }

  .mf-competition-grid-secondary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 14px;
  }

  @media (max-width: 1160px) {
    .mf-competition-grid-hero,
    .mf-competition-grid-main,
    .mf-competition-grid-secondary {
      grid-template-columns: 1fr;
    }
  }
`;

const Ic = {
  Trophy: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.2 2.1h6.6v1.6A3.3 3.3 0 017.5 7 3.3 3.3 0 014.2 3.7z" />
      <path d="M3.4 2.9H2.2a1.4 1.4 0 000 2.8h1.1" />
      <path d="M11.6 2.9h1.2a1.4 1.4 0 010 2.8h-1.1" />
      <path d="M7.5 7v2.1" />
      <path d="M5.1 13h4.8" />
      <path d="M5.8 9.1h3.4v1.6H5.8z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5h8.2" />
      <path d="M6.8 3.2l3.4 3.3-3.4 3.3" />
    </svg>
  ),
};

function toneColor(tone = 'accent') {
  if (tone === 'green') return C.green;
  if (tone === 'blue') return C.blue;
  if (tone === 'teal') return C.teal;
  if (tone === 'purple') return C.purple;
  if (tone === 'warn') return C.warn;
  if (tone === 'danger') return C.danger;
  if (tone === 'text') return C.text2;
  return C.accent;
}

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
  const absolute = Math.abs(amount).toLocaleString();
  if (signed) {
    if (amount > 0) return `+$${absolute}`;
    if (amount < 0) return `-$${absolute}`;
  }
  return `$${absolute}`;
}

function formatSignedCompact(value = 0) {
  const amount = Number(value) || 0;
  if (amount > 0) return `+$${Math.abs(amount).toLocaleString()}`;
  if (amount < 0) return `-$${Math.abs(amount).toLocaleString()}`;
  return '$0';
}

function clamp(value, min = 0, max = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
}

function getClosedTrades(trades) {
  return [...(trades || [])]
    .filter((trade) => ['TP', 'SL', 'BE'].includes(trade.status))
    .sort((left, right) => new Date(right.open_date || right.date || 0) - new Date(left.open_date || left.date || 0));
}

function percentage(total, predicate) {
  if (!total.length) return 0;
  const count = total.filter(predicate).length;
  return Math.round((count / total.length) * 100);
}

function getCurrentStreak(closedTrades) {
  if (!closedTrades.length) {
    return { count: 0, type: 'flat' };
  }
  const firstValue = Number(closedTrades[0].profit_loss || 0);
  const firstSign = Math.sign(firstValue);
  if (firstSign === 0) return { count: 1, type: 'flat' };
  let count = 0;
  for (const trade of closedTrades) {
    const sign = Math.sign(Number(trade.profit_loss || 0));
    if (sign === firstSign) count += 1;
    else break;
  }
  return { count, type: firstSign > 0 ? 'win' : 'loss' };
}

function loadRoutineScore(accountId = 'all') {
  const key = `${ROUTINE_DAY_PREFIX}${accountId || 'all'}`;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || 'null');
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return items.length ? Math.round((items.filter((item) => item.done).length / items.length) * 100) : 0;
  } catch {
    return 0;
  }
}

function buildCompetitionOverview(stats, trades, routineScore = 0) {
  const closedTrades = getClosedTrades(trades);
  const setupCoverage = percentage(closedTrades, (trade) => String(trade.setup || '').trim().length > 0);
  const sessionCoverage = percentage(closedTrades, (trade) => String(trade.session || '').trim().length > 0);
  const noteCoverage = percentage(closedTrades, (trade) => String(trade.notes || '').trim().length > 0);
  const psychologyCoverage = percentage(closedTrades, (trade) => {
    const score = trade.psychology_score ?? trade.psychologyScore;
    return score !== null && score !== undefined && score !== '';
  });

  const hygieneScore = closedTrades.length
    ? Math.round((setupCoverage + sessionCoverage + noteCoverage + psychologyCoverage) / 4)
    : 0;

  const dailySeries = Array.isArray(stats.dailyPnl) ? stats.dailyPnl : [];
  const positiveDays = dailySeries.filter((item) => item.v > 0).length;
  const negativeDays = dailySeries.filter((item) => item.v < 0).length;
  const flatDays = dailySeries.filter((item) => item.v === 0).length;
  const sessionData = Array.isArray(stats.sessionData) ? stats.sessionData : [];
  const pairData = Array.isArray(stats.pairData) ? stats.pairData : [];
  const bestSession = sessionData.length ? [...sessionData].sort((left, right) => right.pnl - left.pnl)[0] : null;
  const topPair = pairData.length ? [...pairData].sort((left, right) => right.pnl - left.pnl)[0] : null;
  const monthPnl = dailySeries.reduce((sum, item) => sum + (Number(item.v) || 0), 0);
  const currentStreak = getCurrentStreak(closedTrades);

  const rank = buildMarketFlowRank(stats, {
    hygieneScore,
    routineScore,
    bestSession,
    topPair,
    positiveDays,
    negativeDays,
    flatDays,
    monthPnl,
    currentStreak,
  });

  return {
    hygieneScore,
    routineScore,
    positiveDays,
    negativeDays,
    flatDays,
    bestSession,
    topPair,
    monthPnl,
    rank,
  };
}

function SectionCard({ children, tone = C.accent, style, index = 0 }) {
  return (
    <motion.section
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,17,28,0.9), rgba(8,13,24,0.94))',
        boxShadow: '0 18px 52px rgba(0,0,0,0.24)',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.12)} 0%, transparent 42%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function SectionTitle({ eyebrow, title, tone = C.accent, icon, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          {icon && (
            <div style={{ width: 28, height: 28, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: shade(tone, 0.12), color: tone, border: `1px solid ${shade(tone, 0.2)}` }}>
              {icon}
            </div>
          )}
          {eyebrow && (
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
              {eyebrow}
            </div>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.05em', color: C.text0 }}>
          {title}
        </div>
      </div>
      {action}
    </div>
  );
}

function GhostButton({ children, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${shade(C.accent, 0.16)}`,
        background: shade(C.accent, 0.06),
        color: C.text1,
        borderRadius: 12,
        padding: '9px 13px',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.16s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function MiniMetric({ label, value, tone = C.text1, caption }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${shade(tone, 0.12)}` }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 900, color: tone, lineHeight: 1.05, marginBottom: caption ? 6 : 0 }}>
        {value}
      </div>
      {caption && (
        <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ label, current, tone, description }) {
  const progress = clamp(current);
  const color = progress >= 88 ? C.green : progress >= 60 ? tone : C.warn;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.text1 }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'monospace' }}>
          {progress}%
        </span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 6 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(color, 0.58)}, ${color})` }} />
      </div>
      <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.5 }}>
        {description}
      </div>
    </div>
  );
}

export default function Competition() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctx = useTradingContext();
  const stats = ctx?.stats || {};
  const trades = ctx?.trades || [];
  const activeAccount = ctx?.activeAccount || 'all';
  const accountOptions = ctx?.accountOptions || [{ id: 'all', label: 'All Accounts', count: 0, pnl: 0 }];
  const activeOption = accountOptions.find((option) => option.id === activeAccount) || accountOptions[0];
  const routineScore = loadRoutineScore(activeAccount);
  const overview = useMemo(() => buildCompetitionOverview(stats, trades, routineScore), [stats, trades, routineScore]);
  const rank = overview.rank;
  const rankTone = toneColor(rank.tone);
  const displayName = user?.fullName || user?.name || user?.email?.split('@')[0] || 'You';
  const board = useMemo(() => buildCompetitionBoard(rank, displayName), [displayName, rank]);

  return (
    <div style={{ padding: '30px 30px 54px', position: 'relative' }}>
      <style>{PAGE_STYLES}</style>

      <div className="mf-competition-grid-hero">
        <SectionCard tone={rankTone} index={0} style={{ padding: '22px 22px 20px' }}>
          <SectionTitle
            eyebrow="Competition"
            title="MarketFlow Leaderboard"
            tone={rankTone}
            icon={<Ic.Trophy />}
            action={<GhostButton onClick={() => navigate(ROUTES.dashboard)}>Back to Dashboard</GhostButton>}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '132px minmax(0, 1fr)', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: '50%',
                background: `conic-gradient(${rankTone} ${rank.normalized * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                padding: 12,
                boxSizing: 'border-box',
                boxShadow: `0 18px 46px ${shade(rankTone, 0.18)}`,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), rgba(7, 12, 22, 0.96) 62%)',
                  border: `1px solid ${shade(rankTone, 0.18)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
                  {rank.score}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  Score
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'inline-flex', padding: '6px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', background: shade(rankTone, 0.12), border: `1px solid ${shade(rankTone, 0.22)}`, color: rankTone, marginBottom: 12 }}>
                {rank.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.05em', color: C.text0, marginBottom: 8 }}>
                #{rank.position.toLocaleString()} in the live MF field
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: C.text2, marginBottom: 12 }}>
                {rank.focus}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <MiniMetric label="Top percentile" value={`${rank.percentile}%`} tone={rankTone} />
                <MiniMetric label="Weekly delta" value={`${rank.weeklyDelta >= 0 ? '+' : ''}${rank.weeklyDelta}`} tone={rank.weeklyDelta >= 0 ? C.green : C.danger} />
                <MiniMetric label="Next tier" value={rank.nextGap > 0 ? `${rank.nextGap} pts` : 'Unlocked'} tone={rankTone} caption={rank.nextGap > 0 ? rank.nextLabel : 'Apex'} />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard tone={C.accent} index={1} style={{ padding: '20px 20px 18px' }}>
          <SectionTitle eyebrow="Scope" title={activeOption?.label || 'All Accounts'} tone={C.accent} />
          <div style={{ display: 'grid', gap: 10 }}>
            <MiniMetric label="Scope P&L" value={formatSignedCompact(stats.pnl)} tone={(stats.pnl || 0) >= 0 ? C.green : C.danger} />
            <MiniMetric label="Scope trades" value={`${stats.totalTrades || 0}`} tone={C.accent} />
            <MiniMetric label="Routine score" value={`${overview.routineScore}%`} tone={overview.routineScore >= 70 ? C.green : C.warn} caption="Loaded from the daily dashboard routine." />
            <MiniMetric label="Best context" value={overview.bestSession ? overview.bestSession.s : 'Waiting'} tone={C.teal} caption={overview.bestSession ? formatCurrency(overview.bestSession.pnl, true) : 'No session edge yet'} />
          </div>
        </SectionCard>
      </div>

      <div className="mf-competition-grid-main">
        <SectionCard tone={rankTone} index={2} style={{ padding: '20px 20px 18px' }}>
          <SectionTitle eyebrow="Leaderboard" title="Field position" tone={rankTone} icon={<Ic.Trophy />} action={<GhostButton onClick={() => navigate(ROUTES.trades)} icon={<Ic.ArrowRight />}>Open All Trades</GhostButton>} />

          <div style={{ display: 'grid', gap: 8 }}>
            {board.map((row) => {
              const rowTone = row.isUser ? rankTone : C.text2;
              return (
                <div key={row.id} style={{ padding: '12px 13px', borderRadius: 16, border: `1px solid ${shade(rowTone, row.isUser ? 0.22 : 0.12)}`, background: row.isUser ? shade(rankTone, 0.1) : 'rgba(255,255,255,0.025)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr) 90px 80px', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: rowTone }}>#{row.position}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: row.isUser ? C.text0 : C.text1 }}>{row.name}</div>
                      <div style={{ fontSize: 10.5, color: row.isUser ? C.text2 : C.text3 }}>Top {row.percentile}%</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: rowTone, textAlign: 'right' }}>{row.score}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: row.delta >= 0 ? C.green : C.danger, textAlign: 'right' }}>
                      {row.delta >= 0 ? '+' : ''}{row.delta}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard tone={rankTone} index={3} style={{ padding: '20px 20px 18px' }}>
          <SectionTitle eyebrow="Score model" title="MF score breakdown" tone={rankTone} />
          <div style={{ display: 'grid', gap: 12 }}>
            {rank.factors.map((factor) => (
              <ProgressRow key={factor.label} label={factor.label} current={factor.value} tone={toneColor(factor.tone)} description={factor.description} />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mf-competition-grid-secondary">
        <SectionCard tone={C.accent} index={4} style={{ padding: '20px 20px 18px' }}>
          <SectionTitle eyebrow="Promotion path" title="What moves the rank now" tone={C.accent} />
          <div style={{ display: 'grid', gap: 10 }}>
            <MiniMetric label="Current weakest factor" value={rank.weakestFactor.label} tone={toneColor(rank.weakestFactor.tone)} caption={rank.weakestFactor.description} />
            <MiniMetric label="Current strongest factor" value={rank.strongestFactor.label} tone={toneColor(rank.strongestFactor.tone)} caption={rank.strongestFactor.description} />
            <MiniMetric label="Month P&L" value={formatCurrency(overview.monthPnl, true)} tone={overview.monthPnl >= 0 ? C.green : C.danger} />
            <MiniMetric label="Session edge" value={overview.bestSession ? overview.bestSession.s : 'n/a'} tone={C.teal} caption={overview.bestSession ? formatCurrency(overview.bestSession.pnl, true) : 'No session edge yet'} />
          </div>
        </SectionCard>

        <SectionCard tone={C.purple} index={5} style={{ padding: '20px 20px 18px' }}>
          <SectionTitle eyebrow="Desk profile" title="Current competitive profile" tone={C.purple} />
          <div style={{ display: 'grid', gap: 10 }}>
            <MiniMetric label="Top pair" value={overview.topPair ? overview.topPair.p : 'n/a'} tone={C.green} caption={overview.topPair ? formatCurrency(overview.topPair.pnl, true) : 'No pair edge yet'} />
            <MiniMetric label="Discipline" value={`${overview.hygieneScore}%`} tone={overview.hygieneScore >= 75 ? C.green : overview.hygieneScore >= 55 ? C.warn : C.danger} />
            <MiniMetric label="Trading days" value={`${overview.positiveDays + overview.negativeDays + overview.flatDays}`} tone={C.blue} caption={`${overview.positiveDays} green / ${overview.negativeDays} red`} />
            <MiniMetric label="Account scope" value={activeOption?.label || 'All Accounts'} tone={C.accent} caption={`${activeOption?.count || 0} trade${(activeOption?.count || 0) > 1 ? 's' : ''}`} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
