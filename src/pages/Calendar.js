import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { shade } from '../lib/colorAlpha';

const C = {
  accent: 'var(--mf-accent,#06E6FF)',
  green: 'var(--mf-green,#00FF88)',
  blue: 'var(--mf-blue,#4D7CFF)',
  teal: 'var(--mf-teal,#00F5D4)',
  warn: 'var(--mf-warn,#FFB31A)',
  danger: 'var(--mf-danger,#FF3D57)',
  text0: 'var(--mf-text-0,#FFFFFF)',
  text1: 'var(--mf-text-1,#E8EEFF)',
  text2: 'var(--mf-text-2,#7A90B8)',
  text3: 'var(--mf-text-3,#334566)',
  border: 'var(--mf-border,#162034)',
  borderHi: 'var(--mf-border-hi,#1E2E48)',
};

const PAGE_STYLES = `
  .mf-calendar-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .mf-calendar-board {
    flex: 1 1 0;
    min-width: 0;
  }

  .mf-calendar-detail {
    width: 340px;
    flex: 0 0 340px;
  }

  .mf-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 8px;
  }

  .mf-calendar-kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (max-width: 1180px) {
    .mf-calendar-layout {
      flex-direction: column;
    }

    .mf-calendar-detail {
      width: 100%;
      flex-basis: auto;
    }
  }

  @media (max-width: 900px) {
    .mf-calendar-kpis {
      grid-template-columns: 1fr;
    }
  }
`;

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

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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

function toDateKey(value) {
  const date = toValidDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getClosedTrades(trades) {
  return [...(trades || [])]
    .filter((trade) => ['TP', 'SL', 'BE'].includes(trade.status))
    .sort((left, right) => new Date(right.open_date || right.date || 0) - new Date(left.open_date || left.date || 0));
}

function buildCalendarMonth(trades, monthOffset = 0) {
  const closedTrades = getClosedTrades(trades);
  const anchorDate = toValidDate(closedTrades[0]?.open_date || closedTrades[0]?.date) || new Date();
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
    const key = toDateKey(trade.open_date || trade.date);
    if (!key) return;
    const pnl = Number(trade.profit_loss || trade.pnl || 0);
    if (!dayMap[key]) {
      dayMap[key] = {
        key,
        date: toValidDate(trade.open_date || trade.date) || new Date(),
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        breakevens: 0,
        records: [],
        sessions: {},
        pairs: {},
      };
    }
    const summary = dayMap[key];
    const sessionLabel = trade.session || 'Unassigned';
    const pairLabel = trade.symbol || trade.pair || 'Unknown';
    summary.pnl += pnl;
    summary.trades += 1;
    if (pnl > 0) summary.wins += 1;
    else if (pnl < 0) summary.losses += 1;
    else summary.breakevens += 1;
    summary.sessions[sessionLabel] = (summary.sessions[sessionLabel] || 0) + 1;
    summary.pairs[pairLabel] = (summary.pairs[pairLabel] || 0) + pnl;
    summary.records.push({
      id: trade.id,
      symbol: pairLabel,
      direction: trade.direction || 'n/a',
      session: sessionLabel,
      setup: trade.setup || 'Unlabeled',
      pnl,
      notes: trade.notes || '',
    });
  });

  const monthDays = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    const entry = dayMap[key];
    const sessionLeader = entry ? Object.entries(entry.sessions).sort((left, right) => right[1] - left[1])[0] || null : null;
    const pairLeader = entry ? Object.entries(entry.pairs).sort((left, right) => right[1] - left[1])[0] || null : null;
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
      avgTrade: entry?.trades ? Math.round(entry.pnl / entry.trades) : 0,
      sessionLeader: sessionLeader ? { label: sessionLeader[0], count: sessionLeader[1] } : null,
      pairLeader: pairLeader ? { label: pairLeader[0], pnl: pairLeader[1] } : null,
      records: entry?.records || [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const inMonthDays = monthDays.filter((day) => day.inMonth && day.trades > 0);
  const totalPnl = inMonthDays.reduce((sum, day) => sum + day.pnl, 0);
  const tradeCount = inMonthDays.reduce((sum, day) => sum + day.trades, 0);
  const winDays = inMonthDays.filter((day) => day.pnl > 0).length;
  const tradeDays = inMonthDays.length;

  return {
    monthLabel,
    days: monthDays,
    totalPnl,
    tradeCount,
    tradeDays,
    winDays,
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

function MiniCard({ label, value, caption, tone = C.accent }) {
  return (
    <div style={{ padding: '14px 14px 12px', borderRadius: 18, border: `1px solid ${shade(tone, 0.12)}`, background: 'rgba(255,255,255,0.03)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em', color: tone, marginBottom: 5 }}>
        {value}
      </div>
      {caption && (
        <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>
          {caption}
        </div>
      )}
    </div>
  );
}

function GhostButton({ children, onClick, disabled = false }) {
  return (
    <button
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

export default function Calendar() {
  const { trades, accountOptions = [], activeAccount = 'all' } = useTradingContext();
  const [monthOffset, setMonthOffset] = useState(0);
  const calendar = useMemo(() => buildCalendarMonth(trades, monthOffset), [trades, monthOffset]);
  const [selectedKey, setSelectedKey] = useState(null);

  useEffect(() => {
    const available = calendar.days.find((day) => day.key === selectedKey && day.trades > 0);
    if (available) return;
    const fallback = calendar.days.find((day) => day.inMonth && day.trades > 0);
    setSelectedKey(fallback ? fallback.key : null);
  }, [calendar.days, selectedKey]);

  const selectedDay = calendar.days.find((day) => day.key === selectedKey) || null;
  const activeScope = accountOptions.find((account) => account.id === activeAccount)?.label || 'All Accounts';
  const totalWins = calendar.days.reduce((sum, day) => sum + day.wins, 0);
  const monthlyWinRate = calendar.tradeCount ? Math.round((totalWins / calendar.tradeCount) * 100) : 0;

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
            Monthly review for {activeScope}. Click a day to open the breakdown.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GhostButton onClick={() => setMonthOffset((value) => value - 1)}>Prev</GhostButton>
          <GhostButton onClick={() => setMonthOffset((value) => Math.min(0, value + 1))} disabled={!calendar.canGoForward}>Next</GhostButton>
        </div>
      </motion.div>

      {calendar.hasHistory ? (
        <>
          <motion.div {...panelMotion(1)} className="mf-calendar-kpis">
            <MiniCard label="Month P&L" value={formatCurrency(calendar.totalPnl, true)} tone={calendar.totalPnl >= 0 ? C.green : C.danger} caption={calendar.monthLabel} />
            <MiniCard label="Trade days" value={`${calendar.tradeDays}`} tone={C.accent} caption={`${calendar.tradeCount} trades logged`} />
            <MiniCard label="Win rate" value={`${monthlyWinRate}%`} tone={monthlyWinRate >= 50 ? C.green : C.warn} caption={`${totalWins} winning trades`} />
          </motion.div>

          <div className="mf-calendar-layout">
            <Card tone={C.accent} index={2} style={{ padding: '18px 18px 16px' }} className="mf-calendar-board">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.text0 }}>{calendar.monthLabel}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ padding: '5px 9px', borderRadius: 999, background: shade(calendar.totalPnl >= 0 ? C.green : C.danger, 0.12), border: `1px solid ${shade(calendar.totalPnl >= 0 ? C.green : C.danger, 0.18)}`, fontSize: 10, fontWeight: 800, color: calendar.totalPnl >= 0 ? C.green : C.danger }}>
                    {formatCurrency(calendar.totalPnl, true)}
                  </div>
                  <div style={{ padding: '5px 9px', borderRadius: 999, background: shade(C.accent, 0.12), border: `1px solid ${shade(C.accent, 0.18)}`, fontSize: 10, fontWeight: 800, color: C.accent }}>
                    {calendar.tradeCount} trades
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
                  const selected = selectedKey === day.key;

                  return (
                    <button
                      key={day.key}
                      onClick={() => active && setSelectedKey(day.key)}
                      style={{
                        minHeight: 108,
                        borderRadius: 16,
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
                        {active && <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone, boxShadow: `0 0 10px ${shade(tone, 0.44)}` }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.04em', color: active ? tone : C.text3, marginBottom: 4 }}>
                          {active ? formatCurrency(day.pnl, true) : '—'}
                        </div>
                        <div style={{ fontSize: 10.5, color: active ? C.text2 : C.text3 }}>
                          {active ? `${day.trades} trade${day.trades > 1 ? 's' : ''}` : 'No trades'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card tone={C.accent} index={3} style={{ padding: '18px 18px 16px' }} className="mf-calendar-detail">
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>
                Day detail
              </div>

              {selectedDay ? (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text0, marginBottom: 4 }}>{formatLongDate(selectedDay.date)}</div>
                    <div style={{ fontSize: 12, color: C.text2 }}>
                      {selectedDay.trades} trade{selectedDay.trades > 1 ? 's' : ''} / {selectedDay.winRate}% win rate
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                    <MiniCard label="Daily P&L" value={formatCurrency(selectedDay.pnl, true)} tone={selectedDay.pnl >= 0 ? C.green : C.danger} />
                    <MiniCard label="Average trade" value={formatCurrency(selectedDay.avgTrade, true)} tone={selectedDay.avgTrade >= 0 ? C.accent : C.warn} />
                    <MiniCard label="Lead session" value={selectedDay.sessionLeader ? selectedDay.sessionLeader.label : 'n/a'} tone={C.teal} caption={selectedDay.sessionLeader ? `${selectedDay.sessionLeader.count} trade${selectedDay.sessionLeader.count > 1 ? 's' : ''}` : 'No dominant session'} />
                    <MiniCard label="Lead pair" value={selectedDay.pairLeader ? selectedDay.pairLeader.label : 'n/a'} tone={C.blue} caption={selectedDay.pairLeader ? formatCurrency(selectedDay.pairLeader.pnl, true) : 'No pair lead'} />
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {selectedDay.records.slice(0, 5).map((record) => {
                      const pnlTone = record.pnl >= 0 ? C.green : C.danger;
                      return (
                        <div key={record.id} style={{ padding: '10px 11px', borderRadius: 14, border: `1px solid ${shade(pnlTone, 0.14)}`, background: 'rgba(255,255,255,0.025)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: C.text1 }}>{record.symbol}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: pnlTone }}>{formatCurrency(record.pnl, true)}</span>
                          </div>
                          <div style={{ fontSize: 11, color: C.text2, lineHeight: 1.55 }}>
                            {record.direction} / {record.session} / {record.setup}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: C.text2, lineHeight: 1.7 }}>
                  Select a trading day to open the detail.
                </div>
              )}
            </Card>
          </div>
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
