import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';
import {
  buildCompetitionBoard,
  buildMarketFlowRank,
  getCompetitionDayStamp,
} from '../lib/marketflowCompetition';
import { getDevelopmentScoreSnapshot } from '../lib/developmentScore';

const C = {
  accent: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  blue: 'var(--mf-blue,#4D7CFF)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  purple: 'var(--mf-purple,#A78BFA)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#8DA1C4)',
  text3: 'var(--mf-text-3,#425575)',
  border: 'var(--mf-border,#142033)',
  card: 'rgba(8,13,24,0.74)',
};

function num(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function money(value = 0, signed = false) {
  const amount = num(value);
  const prefix = signed && amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${prefix}$${Math.abs(amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(value = 0) {
  return `${num(value).toFixed(1)}%`;
}

function toneColor(tone) {
  return {
    accent: C.accent,
    green: C.green,
    blue: C.blue,
    warn: C.warn,
    danger: C.danger,
    purple: C.purple,
    teal: C.green,
  }[tone] || C.text1;
}

function getTradeDate(trade) {
  const source = trade?.date || trade?.close_time || trade?.closed_at || trade?.open_time || trade?.created_at;
  if (!source) return null;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function getPnl(trade) {
  return num(trade?.profit_loss ?? trade?.pnl ?? trade?.profit ?? trade?.result ?? 0);
}

function buildCompetitionContext(trades = [], developmentSnapshot = {}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const dayMap = new Map();
  const sessionMap = new Map();
  const pairMap = new Map();
  let logged = 0;

  trades.forEach((trade) => {
    const pnl = getPnl(trade);
    const dateKey = getTradeDate(trade);
    if (dateKey) {
      const day = dayMap.get(dateKey) || { pnl: 0, count: 0 };
      day.pnl += pnl;
      day.count += 1;
      dayMap.set(dateKey, day);
    }

    const session = trade?.session || 'Unspecified';
    const sessionItem = sessionMap.get(session) || { s: session, pnl: 0, count: 0 };
    sessionItem.pnl += pnl;
    sessionItem.count += 1;
    sessionMap.set(session, sessionItem);

    const pair = trade?.symbol || trade?.pair || 'Unknown';
    const pairItem = pairMap.get(pair) || { p: pair, pnl: 0, count: 0 };
    pairItem.pnl += pnl;
    pairItem.count += 1;
    pairMap.set(pair, pairItem);

    if (trade?.notes || trade?.tags || trade?.strategy || trade?.setup || trade?.screenshots?.length) logged += 1;
  });

  const days = [...dayMap.entries()].sort(([left], [right]) => left.localeCompare(right));
  const monthDays = days.filter(([date]) => date.startsWith(currentMonth));
  const monthPnl = monthDays.reduce((sum, [, day]) => sum + day.pnl, 0);
  const positiveDays = monthDays.filter(([, day]) => day.pnl > 0).length;
  const negativeDays = monthDays.filter(([, day]) => day.pnl < 0).length;
  const flatDays = monthDays.filter(([, day]) => day.pnl === 0).length;
  const bestSession = [...sessionMap.values()].sort((left, right) => right.pnl - left.pnl)[0] || null;
  const topPair = [...pairMap.values()].sort((left, right) => right.pnl - left.pnl)[0] || null;

  let currentStreak = { type: 'flat', count: 0 };
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index][1];
    const type = day.pnl > 0 ? 'win' : day.pnl < 0 ? 'loss' : 'flat';
    if (!currentStreak.count) currentStreak = { type, count: 1 };
    else if (currentStreak.type === type) currentStreak.count += 1;
    else break;
  }

  const hygieneScore = trades.length ? Math.round((logged / trades.length) * 100) : 0;

  return {
    monthPnl,
    positiveDays,
    negativeDays,
    flatDays,
    bestSession,
    topPair,
    currentStreak,
    hygieneScore,
    routineScore: num(developmentSnapshot.weeklyAverage ?? developmentSnapshot.score),
    developmentScore: num(developmentSnapshot.score),
  };
}

function Card({ children, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      style={{
        border: `1px solid ${shade(C.border, 0.82)}`,
        background: `linear-gradient(180deg, ${shade(C.card, 0.96)}, ${shade('#050914', 0.92)})`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
        borderRadius: 24,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

function MiniStat({ label, value, tone = C.text1, caption }) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 950, letterSpacing: '-0.05em', color: tone }}>
        {value}
      </div>
      {caption ? <div style={{ marginTop: 6, fontSize: 12, color: C.text2 }}>{caption}</div> : null}
    </Card>
  );
}

function FactorBar({ factor }) {
  const color = toneColor(factor.tone);
  return (
    <div style={{ display: 'grid', gap: 7 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: C.text1, fontSize: 12, fontWeight: 800 }}>{factor.label}</span>
        <span style={{ color, fontSize: 12, fontWeight: 900 }}>{factor.value}/100</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(100, factor.value))}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(color, 0.55)}, ${color})` }}
        />
      </div>
    </div>
  );
}

function Competition() {
  const { user } = useAuth();
  const { trades, stats, activeAccount, accountOptions, setActiveAccount } = useTradingContext();
  const [remoteBoard, setRemoteBoard] = useState([]);
  const [remoteStatus, setRemoteStatus] = useState('idle');

  const developmentSnapshot = useMemo(
    () => getDevelopmentScoreSnapshot(user?.id || user?.email || 'guest', activeAccount),
    [activeAccount, user?.email, user?.id],
  );

  const context = useMemo(
    () => buildCompetitionContext(trades, developmentSnapshot),
    [developmentSnapshot, trades],
  );

  const rank = useMemo(
    () => buildMarketFlowRank(stats, context),
    [context, stats],
  );

  const displayName = user?.fullName || user?.email?.split('@')[0] || 'MarketFlow Trader';
  const localBoard = useMemo(
    () => buildCompetitionBoard(rank, displayName, getCompetitionDayStamp()),
    [displayName, rank],
  );

  useEffect(() => {
    let mounted = true;
    setRemoteStatus('loading');
    fetch('/api/leaderboard')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Leaderboard unavailable')))
      .then((payload) => {
        if (!mounted) return;
        const rows = Array.isArray(payload?.rows) ? payload.rows : [];
        setRemoteBoard(rows);
        setRemoteStatus(rows.length ? 'live' : 'fallback');
      })
      .catch(() => {
        if (!mounted) return;
        setRemoteBoard([]);
        setRemoteStatus('fallback');
      });
    return () => { mounted = false; };
  }, []);

  const board = remoteBoard.length
    ? remoteBoard.map((row, index) => ({
      id: row.id || row.user_id || `remote-${index}`,
      name: row.display_name || `Desk ${index + 1}`,
      position: row.position || index + 1,
      score: row.score || 0,
      percentile: row.percentile || Math.max(1, 99 - index),
      delta: row.weekly_delta || 0,
      isUser: row.user_id && user?.id ? row.user_id === user.id : false,
    }))
    : localBoard;

  return (
    <main style={{ minHeight: '100vh', padding: '28px clamp(18px, 3vw, 42px) 42px', color: C.text1 }}>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 20% 15%, rgba(20,201,229,0.12), transparent 30%), radial-gradient(circle at 78% 4%, rgba(0,210,184,0.08), transparent 28%), linear-gradient(135deg, #030711 0%, #07101c 52%, #02050c 100%)',
          zIndex: -2,
        }}
      />

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)', gap: 18, alignItems: 'stretch' }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: C.accent, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Competition
              </div>
              <h1 style={{ margin: '8px 0 8px', fontSize: 'clamp(32px, 5vw, 58px)', lineHeight: 0.95, letterSpacing: '-0.07em', color: C.text0 }}>
                MarketFlow Rank
              </h1>
              <p style={{ maxWidth: 680, margin: 0, color: C.text2, fontSize: 14, lineHeight: 1.7 }}>
                Score built from real journal data, risk quality, execution consistency, and your development workspace.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={activeAccount}
                onChange={(event) => setActiveAccount(event.target.value)}
                style={{
                  border: `1px solid ${shade(C.border, 0.95)}`,
                  background: 'rgba(255,255,255,0.035)',
                  color: C.text1,
                  borderRadius: 999,
                  padding: '10px 14px',
                  fontWeight: 800,
                  outline: 'none',
                }}
              >
                {(accountOptions || []).map((account) => (
                  <option key={account.id} value={account.id}>{account.label}</option>
                ))}
              </select>
              <span style={{ border: `1px solid ${shade(C.accent, 0.2)}`, background: shade(C.accent, 0.08), color: C.accent, borderRadius: 999, padding: '10px 13px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {remoteStatus === 'live' ? 'Daily snapshot' : remoteStatus === 'loading' ? 'Syncing' : 'Local live rank'}
              </span>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24, display: 'grid', alignContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 11, color: C.text3, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Current tier
              </div>
              <div style={{ marginTop: 7, fontSize: 32, fontWeight: 950, letterSpacing: '-0.05em', color: toneColor(rank.tone) }}>
                {rank.label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 52, lineHeight: 0.9, fontWeight: 950, letterSpacing: '-0.08em', color: C.text0 }}>
                {rank.score}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: C.text2 }}>#{rank.position.toLocaleString()} / {rank.fieldSize.toLocaleString()}</div>
            </div>
          </div>
          <div style={{ marginTop: 18, height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.055)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rank.progress}%` }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(toneColor(rank.tone), 0.4)}, ${toneColor(rank.tone)})` }}
            />
          </div>
          <div style={{ marginTop: 10, color: C.text2, fontSize: 12 }}>{rank.focus}</div>
        </Card>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginTop: 16 }}>
        <MiniStat label="Monthly P&L" value={money(context.monthPnl, true)} tone={context.monthPnl >= 0 ? C.green : C.danger} caption="From All Trades" />
        <MiniStat label="Win rate" value={pct(stats.winRate)} tone={C.blue} caption={`${stats.wins || 0}W / ${stats.losses || 0}L`} />
        <MiniStat label="Development" value={`${developmentSnapshot.score || 0}/100`} tone={C.accent} caption={`${developmentSnapshot.streak || 0} day streak`} />
        <MiniStat label="Drawdown" value={pct(Math.abs(stats.maxDrawdown || 0))} tone={C.warn} caption="Rank risk pressure" />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(320px, 0.85fr)', gap: 16, marginTop: 16 }}>
        <Card style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.text3, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Leaderboard
              </div>
              <h2 style={{ margin: '5px 0 0', fontSize: 22, color: C.text0, letterSpacing: '-0.04em' }}>
                Daily MarketFlow field
              </h2>
            </div>
            <div style={{ color: C.text2, fontSize: 12 }}>Refresh: every 24h</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {board.map((row) => {
              const tone = row.isUser ? C.accent : C.text2;
              return (
                <motion.div
                  key={row.id}
                  layout
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px minmax(0, 1fr) 90px 90px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '13px 14px',
                    borderRadius: 17,
                    border: `1px solid ${row.isUser ? shade(C.accent, 0.28) : shade(C.border, 0.74)}`,
                    background: row.isUser ? shade(C.accent, 0.075) : 'rgba(255,255,255,0.026)',
                  }}
                >
                  <div style={{ color: tone, fontWeight: 950, fontSize: 14 }}>#{row.position}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: row.isUser ? C.text0 : C.text1, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.name}
                    </div>
                    <div style={{ marginTop: 4, color: C.text3, fontSize: 11 }}>{row.percentile}% percentile</div>
                  </div>
                  <div style={{ color: C.text0, fontWeight: 950, textAlign: 'right' }}>{row.score}</div>
                  <div style={{ color: row.delta >= 0 ? C.green : C.danger, fontWeight: 850, textAlign: 'right', fontSize: 12 }}>
                    {row.delta >= 0 ? '+' : ''}{row.delta || 0}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding: 22 }}>
          <div style={{ fontSize: 10, color: C.text3, fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Score engine
          </div>
          <h2 style={{ margin: '5px 0 16px', fontSize: 22, color: C.text0, letterSpacing: '-0.04em' }}>
            What moves your rank
          </h2>

          <div style={{ display: 'grid', gap: 14 }}>
            {(rank.factors || []).map((factor) => <FactorBar key={factor.label} factor={factor} />)}
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <div style={{ padding: 13, borderRadius: 16, border: `1px solid ${shade(C.green, 0.18)}`, background: shade(C.green, 0.055) }}>
              <div style={{ color: C.green, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Strongest factor</div>
              <div style={{ marginTop: 4, color: C.text1, fontSize: 13 }}>{rank.strongestFactor?.label || 'n/a'}: {rank.strongestFactor?.description || 'Waiting for data.'}</div>
            </div>
            <div style={{ padding: 13, borderRadius: 16, border: `1px solid ${shade(C.warn, 0.18)}`, background: shade(C.warn, 0.045) }}>
              <div style={{ color: C.warn, fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Priority</div>
              <div style={{ marginTop: 4, color: C.text1, fontSize: 13 }}>{rank.weakestFactor?.label || 'Process'}: {rank.weakestFactor?.description || rank.focus}</div>
            </div>
          </div>
        </Card>
      </section>

      <style>{`
        @media (max-width: 1100px) {
          main section {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          main {
            padding: 18px 14px 32px !important;
          }
          main section:nth-of-type(2) {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}

export default Competition;
