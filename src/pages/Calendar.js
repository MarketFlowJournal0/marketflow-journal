import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';

const C = {
  accent: 'var(--mf-accent,#06E6FF)',
  green: 'var(--mf-green,#00FF88)',
  blue: 'var(--mf-blue,#4D7CFF)',
  teal: 'var(--mf-teal,#00F5D4)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  purple: 'var(--mf-purple,#A78BFA)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
  borderHi: 'var(--mf-border-hi,#1E2E48)',
};

const PAGE_STYLES = `
  .mf-calendar-overview {
    display: grid;
    grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.82fr);
    gap: 16px;
    margin-bottom: 18px;
    align-items: start;
  }

  .mf-calendar-kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .mf-calendar-week-rail {
    display: grid;
    gap: 10px;
  }

  .mf-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .mf-calendar-modal-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    gap: 16px;
  }

  .mf-calendar-modal-stats {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  .mf-calendar-modal-ledger {
    display: grid;
    gap: 10px;
    max-height: 420px;
    overflow: auto;
    padding-right: 4px;
  }

  @media (max-width: 1240px) {
    .mf-calendar-overview,
    .mf-calendar-modal-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 960px) {
    .mf-calendar-kpis,
    .mf-calendar-modal-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .mf-calendar-kpis,
    .mf-calendar-modal-stats {
      grid-template-columns: 1fr;
    }
  }
`;

function panelMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      delay: index * 0.04,
      ease: [0.16, 1, 0.3, 1],
    },
  };
}

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateKey(value) {
  const date = toValidDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTradeDateValue(trade = {}) {
  const rawDate = trade.open_date || trade.date || '';
  if (!rawDate) return null;

  if (trade.time && /^\d{1,2}:\d{2}/.test(String(trade.time).trim())) {
    const composed = `${rawDate.split('T')[0]}T${String(trade.time).trim()}`;
    const composedDate = new Date(composed);
    if (!Number.isNaN(composedDate.getTime())) return composedDate;
  }

  const direct = new Date(rawDate);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function getTradePnl(trade = {}) {
  return Number(trade.profit_loss ?? trade.pnl ?? 0) || 0;
}

function getTradeRr(trade = {}) {
  const numeric = Number(trade.metrics?.rrReel ?? trade.rr ?? 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function getClosedTrades(trades) {
  return [...(trades || [])]
    .filter((trade) => ['TP', 'SL', 'BE'].includes(trade.status))
    .sort((left, right) => new Date(right.open_date || right.date || 0) - new Date(left.open_date || left.date || 0));
}

function formatCurrency(value = 0, signed = false, digits = 0) {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (signed) {
    if (amount > 0) return `+$${absolute}`;
    if (amount < 0) return `-$${absolute}`;
  }
  return `$${absolute}`;
}

function formatPercent(value = 0) {
  const numeric = Number(value) || 0;
  return `${numeric.toFixed(0)}%`;
}

function formatRr(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return '--';
  return `1:${numeric.toFixed(2)}`;
}

function formatLongDate(value) {
  const date = toValidDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildBreakdown(records = [], getKey) {
  const bucket = new Map();
  records.forEach((record) => {
    const key = getKey(record);
    if (!key) return;
    const current = bucket.get(key) || { label: key, trades: 0, pnl: 0, wins: 0 };
    current.trades += 1;
    current.pnl += record.pnl;
    if (record.pnl > 0) current.wins += 1;
    bucket.set(key, current);
  });

  return [...bucket.values()]
    .map((row) => ({
      ...row,
      pnl: Number(row.pnl.toFixed(2)),
      winRate: row.trades ? Math.round((row.wins / row.trades) * 100) : 0,
    }))
    .sort((left, right) => right.pnl - left.pnl);
}

function buildCalendarMonth(trades, monthOffset = 0) {
  const closedTrades = getClosedTrades(trades);
  const anchorDate = getTradeDateValue(closedTrades[0]) || new Date();
  const monthDate = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + monthOffset, 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthLabel = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const dayMap = {};
  closedTrades.forEach((trade) => {
    const tradeDate = getTradeDateValue(trade);
    const key = toDateKey(tradeDate);
    if (!key) return;

    if (!dayMap[key]) {
      dayMap[key] = {
        key,
        date: tradeDate || new Date(),
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        records: [],
      };
    }

    const summary = dayMap[key];
    const pnl = getTradePnl(trade);
    summary.pnl += pnl;
    summary.trades += 1;
    if (pnl > 0) summary.wins += 1;
    else if (pnl < 0) summary.losses += 1;
    else summary.breakevens += 1;
    summary.records.push({
      id: trade.id,
      symbol: trade.symbol || trade.pair || 'Unknown',
      direction: trade.direction || trade.type || 'Long',
      session: trade.session || 'Other',
      setup: String(trade.setup || '').trim() || 'Unlabeled',
      pnl,
      rr: getTradeRr(trade),
      status: trade.status || 'Closed',
      bias: trade.bias || 'Neutral',
      time: trade.time || (tradeDate ? tradeDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--'),
      marketType: trade.marketType || trade.market_type || 'Market',
      notes: trade.notes || '',
    });
  });

  const monthDays = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    const entry = dayMap[key];
    const records = entry?.records || [];
    const pairBreakdown = buildBreakdown(records, (record) => record.symbol);
    const sessionBreakdown = buildBreakdown(records, (record) => record.session);
    const setupBreakdown = buildBreakdown(records, (record) => record.setup);
    const bestTrade = records.length ? [...records].sort((left, right) => right.pnl - left.pnl)[0] : null;
    const worstTrade = records.length ? [...records].sort((left, right) => left.pnl - right.pnl)[0] : null;
    const avgTrade = entry?.trades ? entry.pnl / entry.trades : 0;
    const rrValues = records.map((record) => record.rr).filter((value) => value != null);
    const avgRr = rrValues.length ? rrValues.reduce((sum, value) => sum + value, 0) / rrValues.length : null;

    monthDays.push({
      key,
      date: new Date(cursor),
      day: cursor.getDate(),
      inMonth: cursor.getMonth() === month,
      isToday: toDateKey(cursor) === toDateKey(new Date()),
      pnl: entry?.pnl || 0,
      trades: entry?.trades || 0,
      wins: entry?.wins || 0,
      losses: entry?.losses || 0,
      breakevens: entry?.breakevens || 0,
      winRate: entry?.trades ? Math.round((entry.wins / entry.trades) * 100) : 0,
      avgTrade: Number(avgTrade.toFixed(2)),
      avgRr,
      pairBreakdown,
      sessionBreakdown,
      setupBreakdown,
      bestTrade,
      worstTrade,
      records,
      leadPair: pairBreakdown[0] || null,
      leadSession: sessionBreakdown[0] || null,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const inMonthDays = monthDays.filter((day) => day.inMonth && day.trades > 0);
  const totalPnl = inMonthDays.reduce((sum, day) => sum + day.pnl, 0);
  const tradeCount = inMonthDays.reduce((sum, day) => sum + day.trades, 0);
  const winDays = inMonthDays.filter((day) => day.pnl > 0).length;
  const tradeDays = inMonthDays.length;
  const bestDay = inMonthDays.length ? [...inMonthDays].sort((left, right) => right.pnl - left.pnl)[0] : null;
  const worstDay = inMonthDays.length ? [...inMonthDays].sort((left, right) => left.pnl - right.pnl)[0] : null;

  const weeklySummaries = [];
  for (let index = 0; index < monthDays.length; index += 7) {
    const chunk = monthDays.slice(index, index + 7).filter((day) => day.inMonth);
    if (!chunk.length) continue;
    const active = chunk.filter((day) => day.trades > 0);
    weeklySummaries.push({
      id: `week-${weeklySummaries.length + 1}`,
      label: `Week ${weeklySummaries.length + 1}`,
      pnl: active.reduce((sum, day) => sum + day.pnl, 0),
      trades: active.reduce((sum, day) => sum + day.trades, 0),
      activeDays: active.length,
    });
  }

  return {
    monthLabel,
    days: monthDays,
    weeklySummaries,
    totalPnl,
    tradeCount,
    tradeDays,
    winDays,
    bestDay,
    worstDay,
    hasHistory: inMonthDays.length > 0,
    canGoForward: monthOffset < 0,
  };
}

function Card({ children, tone = C.accent, style, index = 0, className = '' }) {
  return (
    <motion.section
      className={className}
      {...panelMotion(index)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 24,
        border: `1px solid ${shade(tone, 0.16)}`,
        background: 'linear-gradient(180deg, rgba(10,17,28,0.92), rgba(8,13,24,0.96))',
        boxShadow: '0 20px 58px rgba(0,0,0,0.22)',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at top right, ${shade(tone, 0.11)} 0%, transparent 42%)` }} />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.section>
  );
}

function MiniCard({ label, value, caption, tone = C.accent }) {
  return (
    <div style={{ padding: '14px 14px 12px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: 5 }}>
        {value}
      </div>
      {caption ? <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>{caption}</div> : null}
    </div>
  );
}

function GhostButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 12,
        border: `1px solid ${disabled ? shade(C.border, 0.8) : C.border}`,
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.03)',
        color: disabled ? C.text3 : C.text1,
        padding: '9px 12px',
        fontSize: 11,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

function BreakdownRow({ row, tone, maxValue }) {
  const width = maxValue > 0 ? `${Math.max(12, Math.abs((row.pnl / maxValue) * 100))}%` : '12%';
  const displayTone = row.pnl >= 0 ? tone : C.danger;
  return (
    <div style={{ padding: '10px 11px', borderRadius: 14, border: `1px solid ${shade(displayTone, 0.12)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: C.text1 }}>{row.label}</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: displayTone }}>{formatCurrency(row.pnl, true)}</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ width, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${shade(displayTone, 0.45)}, ${displayTone})` }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 10.5, color: C.text2 }}>
        <span>{row.trades} trades</span>
        <span>{formatPercent(row.winRate)}</span>
      </div>
    </div>
  );
}

function TradeLedgerRow({ trade }) {
  const tone = trade.pnl >= 0 ? C.green : C.danger;
  return (
    <div style={{ padding: '12px 12px 11px', borderRadius: 16, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: C.text1 }}>{trade.symbol}</span>
          <span style={{ fontSize: 10, color: C.text3 }}>{trade.time}</span>
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 800, color: tone }}>{formatCurrency(trade.pnl, true)}</span>
      </div>
      <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.6, marginBottom: trade.notes ? 6 : 0 }}>
        {trade.direction} / {trade.session} / {trade.setup} / {trade.marketType} / {formatRr(trade.rr)}
      </div>
      {trade.notes ? (
        <div style={{ fontSize: 10.5, color: C.text3, lineHeight: 1.6 }}>
          {trade.notes}
        </div>
      ) : null}
    </div>
  );
}

function DayReviewModal({ day, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const pairMax = Math.max(...(day?.pairBreakdown || []).map((row) => Math.abs(row.pnl)), 0);
  const sessionMax = Math.max(...(day?.sessionBreakdown || []).map((row) => Math.abs(row.pnl)), 0);
  const setupMax = Math.max(...(day?.setupBreakdown || []).map((row) => Math.abs(row.pnl)), 0);

  return (
    <AnimatePresence>
      {day ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2,5,10,0.72)',
              backdropFilter: 'blur(10px)',
              zIndex: 1200,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.985 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              inset: '4vh 3vw',
              zIndex: 1201,
              overflow: 'auto',
            }}
          >
            <Card tone={day.pnl >= 0 ? C.green : C.danger} style={{ padding: '20px 20px 18px', minHeight: '92vh' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: day.pnl >= 0 ? C.green : C.danger, marginBottom: 8 }}>
                    Day review
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.05em', color: C.text0, marginBottom: 8 }}>
                    {formatLongDate(day.date)}
                  </div>
                  <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.65 }}>
                    {day.trades} trades / {formatPercent(day.winRate)} win rate / {day.leadSession ? `${day.leadSession.label} lead session` : 'No dominant session'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <GhostButton onClick={onPrev} disabled={!hasPrev}>Prev day</GhostButton>
                  <GhostButton onClick={onNext} disabled={!hasNext}>Next day</GhostButton>
                  <GhostButton onClick={onClose}>Close</GhostButton>
                </div>
              </div>

              <div className="mf-calendar-modal-stats">
                <MiniCard label="Daily P&L" value={formatCurrency(day.pnl, true)} tone={day.pnl >= 0 ? C.green : C.danger} />
                <MiniCard label="Trades" value={`${day.trades}`} tone={C.accent} caption={`${day.wins} wins / ${day.losses} losses / ${day.breakevens} breakeven`} />
                <MiniCard label="Average trade" value={formatCurrency(day.avgTrade, true)} tone={day.avgTrade >= 0 ? C.teal : C.warn} />
                <MiniCard label="Average R:R" value={formatRr(day.avgRr)} tone={C.blue} caption="Realized average" />
                <MiniCard label="Best trade" value={day.bestTrade ? formatCurrency(day.bestTrade.pnl, true) : '$0'} tone={C.green} caption={day.bestTrade ? day.bestTrade.symbol : 'No best trade'} />
                <MiniCard label="Worst trade" value={day.worstTrade ? formatCurrency(day.worstTrade.pnl, true) : '$0'} tone={C.danger} caption={day.worstTrade ? day.worstTrade.symbol : 'No worst trade'} />
              </div>

              <div className="mf-calendar-modal-grid">
                <div style={{ display: 'grid', gap: 16 }}>
                  <Card tone={C.teal} style={{ padding: '16px 16px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 12 }}>
                      Session breakdown
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {day.sessionBreakdown.length ? day.sessionBreakdown.map((row) => (
                        <BreakdownRow key={row.label} row={row} tone={C.teal} maxValue={sessionMax} />
                      )) : (
                        <div style={{ fontSize: 12, color: C.text2 }}>No session data.</div>
                      )}
                    </div>
                  </Card>

                  <Card tone={C.blue} style={{ padding: '16px 16px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 12 }}>
                      Pair breakdown
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {day.pairBreakdown.length ? day.pairBreakdown.map((row) => (
                        <BreakdownRow key={row.label} row={row} tone={C.blue} maxValue={pairMax} />
                      )) : (
                        <div style={{ fontSize: 12, color: C.text2 }}>No pair data.</div>
                      )}
                    </div>
                  </Card>

                  <Card tone={C.purple} style={{ padding: '16px 16px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3, marginBottom: 12 }}>
                      Setup breakdown
                    </div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {day.setupBreakdown.length ? day.setupBreakdown.map((row) => (
                        <BreakdownRow key={row.label} row={row} tone={C.purple} maxValue={setupMax} />
                      )) : (
                        <div style={{ fontSize: 12, color: C.text2 }}>No setup data.</div>
                      )}
                    </div>
                  </Card>
                </div>

                <Card tone={C.accent} style={{ padding: '16px 16px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.text3 }}>
                      Daily ledger
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: C.accent }}>
                      {day.records.length} executions
                    </div>
                  </div>
                  <div className="mf-calendar-modal-ledger">
                    {day.records.map((trade) => (
                      <TradeLedgerRow key={trade.id} trade={trade} />
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default function Calendar() {
  const { trades, accountOptions = [], activeAccount = 'all' } = useTradingContext();
  const [monthOffset, setMonthOffset] = useState(0);
  const [openDayKey, setOpenDayKey] = useState('');

  const calendar = useMemo(() => buildCalendarMonth(trades, monthOffset), [trades, monthOffset]);
  const activeScope = accountOptions.find((account) => account.id === activeAccount)?.label || 'All Accounts';
  const totalWins = calendar.days.reduce((sum, day) => sum + day.wins, 0);
  const monthlyWinRate = calendar.tradeCount ? Math.round((totalWins / calendar.tradeCount) * 100) : 0;
  const activeDays = calendar.days.filter((day) => day.inMonth && day.trades > 0);
  const openDay = activeDays.find((day) => day.key === openDayKey) || null;
  const openDayIndex = openDay ? activeDays.findIndex((day) => day.key === openDay.key) : -1;

  return (
    <div style={{ padding: '30px 30px 54px', width: '100%', boxSizing: 'border-box', color: C.text1 }}>
      <style>{PAGE_STYLES}</style>

      <motion.div
        {...panelMotion(0)}
        style={{
          marginBottom: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: shade(C.accent, 0.85), marginBottom: 8 }}>
            Calendar
          </div>
          <h1 style={{ margin: 0, fontSize: 31, lineHeight: 1, letterSpacing: '-0.05em', color: C.text0 }}>
            Trading calendar
          </h1>
          <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.6, maxWidth: 560, marginTop: 10 }}>
            Monthly review for {activeScope}. Click any trading day to open the complete day review.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GhostButton onClick={() => setMonthOffset((value) => value - 1)}>Prev</GhostButton>
          <GhostButton onClick={() => setMonthOffset((value) => Math.min(0, value + 1))} disabled={!calendar.canGoForward}>Next</GhostButton>
        </div>
      </motion.div>

      {calendar.hasHistory ? (
        <>
          <div className="mf-calendar-overview">
            <motion.div {...panelMotion(1)} className="mf-calendar-kpis">
              <MiniCard label="Month P&L" value={formatCurrency(calendar.totalPnl, true)} tone={calendar.totalPnl >= 0 ? C.green : C.danger} caption={calendar.monthLabel} />
              <MiniCard label="Trade days" value={`${calendar.tradeDays}`} tone={C.accent} caption={`${calendar.tradeCount} trades logged`} />
              <MiniCard label="Win rate" value={formatPercent(monthlyWinRate)} tone={monthlyWinRate >= 50 ? C.green : C.warn} caption={`${totalWins} winning trades`} />
            </motion.div>

            <motion.div {...panelMotion(2)} className="mf-calendar-week-rail">
              {calendar.weeklySummaries.map((week) => {
                const tone = week.pnl >= 0 ? C.green : week.pnl < 0 ? C.danger : C.text2;
                return (
                  <div key={week.id} style={{ padding: '13px 14px 12px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>
                      {week.label}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 900, color: tone, letterSpacing: '-0.04em', marginBottom: 4 }}>
                      {formatCurrency(week.pnl, true)}
                    </div>
                    <div style={{ fontSize: 11, color: C.text2 }}>
                      {week.trades} trades / {week.activeDays} active day{week.activeDays > 1 ? 's' : ''}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>

          <Card tone={C.accent} index={3} style={{ padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text0, marginBottom: 6 }}>{calendar.monthLabel}</div>
                <div style={{ fontSize: 11.5, color: C.text2 }}>
                  Best day {calendar.bestDay ? `${formatCurrency(calendar.bestDay.pnl, true)} on ${formatLongDate(calendar.bestDay.date)}` : 'n/a'} / Worst day {calendar.worstDay ? `${formatCurrency(calendar.worstDay.pnl, true)} on ${formatLongDate(calendar.worstDay.date)}` : 'n/a'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '5px 9px', borderRadius: 999, background: shade(calendar.totalPnl >= 0 ? C.green : C.danger, 0.12), border: `1px solid ${shade(calendar.totalPnl >= 0 ? C.green : C.danger, 0.18)}`, fontSize: 10, fontWeight: 800, color: calendar.totalPnl >= 0 ? C.green : C.danger }}>
                  {formatCurrency(calendar.totalPnl, true)}
                </div>
                <div style={{ padding: '5px 9px', borderRadius: 999, background: shade(C.accent, 0.12), border: `1px solid ${shade(C.accent, 0.18)}`, fontSize: 10, fontWeight: 800, color: C.accent }}>
                  {calendar.tradeCount} trades
                </div>
                <div style={{ padding: '5px 9px', borderRadius: 999, background: shade(C.warn, 0.12), border: `1px solid ${shade(C.warn, 0.18)}`, fontSize: 10, fontWeight: 800, color: C.warn }}>
                  {calendar.tradeDays} active days
                </div>
              </div>
            </div>

            <div className="mf-calendar-grid" style={{ marginBottom: 8 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={{ padding: '0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3 }}>
                  {day}
                </div>
              ))}
            </div>

            <div className="mf-calendar-grid">
              {calendar.days.map((day) => {
                const tone = day.pnl > 0 ? C.green : day.pnl < 0 ? C.danger : C.accent;
                const active = day.trades > 0;
                const selected = openDayKey === day.key;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => active && setOpenDayKey(day.key)}
                    style={{
                      minHeight: 112,
                      borderRadius: 18,
                      padding: '11px 11px 10px',
                      border: `1px solid ${selected ? shade(C.accent, 0.38) : active ? shade(tone, 0.18) : shade(C.borderHi, 0.82)}`,
                      background: active ? `linear-gradient(180deg, ${shade(tone, 0.14)} 0%, ${shade(tone, 0.04)} 100%)` : 'rgba(255,255,255,0.02)',
                      boxShadow: selected ? `0 0 0 1px ${shade(C.accent, 0.16)}` : 'none',
                      opacity: day.inMonth ? 1 : 0.28,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 8,
                      cursor: active ? 'pointer' : 'default',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: day.isToday ? C.accent : C.text0 }}>{day.day}</span>
                      {active ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone, boxShadow: `0 0 10px ${shade(tone, 0.44)}` }} /> : null}
                    </div>

                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', color: active ? tone : C.text3, marginBottom: 4 }}>
                        {active ? formatCurrency(day.pnl, true) : '--'}
                      </div>
                      <div style={{ fontSize: 10.5, color: active ? C.text2 : C.text3, marginBottom: active && day.leadPair ? 4 : 0 }}>
                        {active ? `${day.trades} trade${day.trades > 1 ? 's' : ''}` : 'No trades'}
                      </div>
                      {active && day.leadPair ? (
                        <div style={{ fontSize: 10, color: C.text3 }}>
                          {day.leadPair.label}
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <DayReviewModal
            day={openDay}
            onClose={() => setOpenDayKey('')}
            onPrev={() => setOpenDayKey(activeDays[Math.max(0, openDayIndex - 1)]?.key || '')}
            onNext={() => setOpenDayKey(activeDays[Math.min(activeDays.length - 1, openDayIndex + 1)]?.key || '')}
            hasPrev={openDayIndex > 0}
            hasNext={openDayIndex >= 0 && openDayIndex < activeDays.length - 1}
          />
        </>
      ) : (
        <Card tone={C.accent} index={1} style={{ padding: '26px 24px' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.text0, marginBottom: 8 }}>
            No trading calendar yet
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.7 }}>
            Import trades in All Trades to unlock the monthly view and the day-by-day review.
          </div>
        </Card>
      )}
    </div>
  );
}
