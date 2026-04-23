import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { shade } from '../lib/colorAlpha';

const C = {
  bg: 'var(--mf-bg,#030508)',
  bgCard: 'var(--mf-card,#0C1422)',
  cyan: 'var(--mf-accent,#06E6FF)',
  green: 'var(--mf-green,#00FF88)',
  purple: 'var(--mf-purple,#B06EFF)',
  blue: 'var(--mf-blue,#4D7CFF)',
  danger: 'var(--mf-danger,#FF3D57)',
  gold: 'var(--mf-gold,#FFD700)',
  t0: 'var(--mf-text-0,#FFFFFF)',
  t1: 'var(--mf-text-1,#E8EEFF)',
  t2: 'var(--mf-text-2,#7A90B8)',
  t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#162034)',
};

const Ic = {
  Download: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v9M4 8l4 4 4-4M3 13h10" /></svg>,
  File: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2.5h5l3 3V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1.5Z" /><path d="M9 2.5V6h3" /></svg>,
  Table: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M2 7h12M6 3v10M10 3v10" /></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z" /></svg>,
  Brain: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5A2.5 2.5 0 0 1 10.5 5v.2A2.4 2.4 0 0 1 12 9.3v.4A2.3 2.3 0 0 1 9.7 12H9" /><path d="M10 3.5A2.5 2.5 0 0 0 5.5 5v.2A2.4 2.4 0 0 0 4 9.3v.4A2.3 2.3 0 0 0 6.3 12H7" /><path d="M8 5.5v5" /><path d="M6.3 7.4 8 8.2l1.7-.8" /></svg>,
  Backup: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5.5A5.5 5.5 0 1 0 8 13.5" /><path d="M13 8v5h-5" /><path d="m13 13-2.2-2.2" /></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5" /><path d="M7 6.2v3.1" /><circle cx="7" cy="4.4" r=".45" fill="currentColor" /></svg>,
};

const REPORT_TYPES = [
  { id: 'summary', name: 'Executive summary', desc: 'Core performance snapshot with P&L, win rate, drawdown, and top segments.', icon: <Ic.File />, tone: C.cyan },
  { id: 'ledger', name: 'Trade ledger', desc: 'CSV-ready export of the filtered trade stream currently visible in the journal.', icon: <Ic.Table />, tone: C.green },
  { id: 'propfirm', name: 'Prop-style review', desc: 'An internal compliance-style summary for your own review. Not an official firm statement.', icon: <Ic.Shield />, tone: C.gold },
  { id: 'psychology', name: 'Psychology review', desc: 'Behavioral summary based on psychology score, notes, and session context.', icon: <Ic.Brain />, tone: C.purple },
];

const DATE_RANGES = [
  { id: 'all', label: 'All time' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
];

export default function ReportsPage() {
  const { trades, downloadBackup } = useTradingContext();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [prepared, setPrepared] = useState(false);

  const filteredTrades = useMemo(() => filterTradesByRange(trades, dateRange), [trades, dateRange]);
  const reportStats = useMemo(() => buildReportStats(filteredTrades), [filteredTrades]);
  const currentType = REPORT_TYPES.find((item) => item.id === selectedType) || REPORT_TYPES[0];

  const handlePrepare = useCallback(() => {
    setPrepared(true);
  }, []);

  const handleDownloadHtml = useCallback(() => {
    const html = generateHtmlReport({
      type: currentType,
      dateRange,
      stats: reportStats,
      trades: filteredTrades,
      user,
    });
    downloadFile(html, `marketflow-${selectedType}-report-${stampDate()}.html`, 'text/html;charset=utf-8');
  }, [currentType, dateRange, filteredTrades, reportStats, selectedType, user]);

  const handleDownloadCsv = useCallback(() => {
    const csv = generateTradeCsv(filteredTrades);
    downloadFile(csv, `marketflow-trades-${dateRange}-${stampDate()}.csv`, 'text/csv;charset=utf-8');
  }, [dateRange, filteredTrades]);

  const handleBackup = useCallback(() => {
    downloadBackup({ scope: 'all' });
  }, [downloadBackup]);

  const topPairs = reportStats.topPairs.slice(0, 4);
  const topSetups = reportStats.topSetups.slice(0, 4);

  return (
    <div style={{ padding: '30px 34px 72px', maxWidth: 1380, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div style={panel()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <div>
            <div style={eyebrow(C.cyan)}>
              <Ic.Download />
              Report Desk
            </div>
            <h1 style={{ margin: '16px 0 0', fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.06em', color: C.t0 }}>
              Export the journal as
              <span style={{ color: C.cyan }}> real files</span>, not a placeholder.
            </h1>
            <p style={{ margin: '16px 0 0', maxWidth: 760, fontSize: 14.5, lineHeight: 1.8, color: C.t2 }}>
              This desk builds a print-ready HTML report from the current MarketFlow dataset, exports the filtered ledger as CSV,
              and lets you save a full backup snapshot of the journal. No fake PDF layer, no decorative export button.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <MetricCard label="Trades in scope" value={String(reportStats.totalTrades)} detail="Filtered by the selected report range." tone={C.cyan} />
            <MetricCard label="Net P&L" value={money(reportStats.pnl)} detail="Calculated directly from the filtered trade stream." tone={reportStats.pnl >= 0 ? C.green : C.danger} />
            <MetricCard label="Win rate" value={`${formatPercent(reportStats.winRate)}%`} detail="Uses only closed outcomes in the selected range." tone={C.green} />
            <MetricCard label="Avg psychology" value={reportStats.avgPsychology ? `${reportStats.avgPsychology}/100` : '—'} detail="Based on trades that actually carry a psychology score." tone={C.purple} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 0.9fr)', gap: 18, alignItems: 'start' }}>
        <div style={panel()}>
          <SectionTitle
            title="Report setup"
            subtitle="Choose the export angle and the date scope, then build the files from the live journal state."
            tone={currentType.tone}
          />

          <div style={{ display: 'grid', gap: 10 }}>
            {REPORT_TYPES.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ y: -1 }}
                type="button"
                onClick={() => setSelectedType(type.id)}
                style={{
                  ...optionCard(type.id === selectedType, type.tone),
                  textAlign: 'left',
                  width: '100%',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', color: type.tone, background: shade(type.tone, 0.12), border: `1px solid ${shade(type.tone, 0.18)}` }}>
                  {type.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>{type.name}</div>
                  <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.65, color: C.t2 }}>{type.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DATE_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => setDateRange(range.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${dateRange === range.id ? shade(C.cyan, 0.26) : C.brd}`,
                  background: dateRange === range.id ? shade(C.cyan, 0.08) : 'rgba(255,255,255,0.02)',
                  color: dateRange === range.id ? C.cyan : C.t2,
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <ActionRow
              label="Prepare preview"
              help="Refresh the report preview using the current filter."
              onClick={handlePrepare}
              tone={C.cyan}
            />
            <ActionRow
              label="Download HTML report"
              help="Print-ready and shareable. Best option for an executive report."
              onClick={handleDownloadHtml}
              tone={C.green}
              disabled={!reportStats.totalTrades}
            />
            <ActionRow
              label="Download CSV ledger"
              help="Exports the exact filtered trade list in tabular form."
              onClick={handleDownloadCsv}
              tone={C.blue}
              disabled={!reportStats.totalTrades}
            />
            <ActionRow
              label="Backup full journal"
              help="Downloads the full MarketFlow backup snapshot as JSON."
              onClick={handleBackup}
              tone={C.gold}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={panel()}>
            <SectionTitle
              title="Live report preview"
              subtitle="This preview is built from the same trades currently loaded in the journal."
              tone={currentType.tone}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <PreviewStat label="P&L" value={money(reportStats.pnl)} tone={reportStats.pnl >= 0 ? C.green : C.danger} />
              <PreviewStat label="Expectancy" value={money(reportStats.expectancy)} tone={C.cyan} />
              <PreviewStat label="Max drawdown" value={money(reportStats.maxDrawdown)} tone={C.danger} />
              <PreviewStat label="Profit factor" value={reportStats.profitFactor ? String(reportStats.profitFactor) : '—'} tone={C.gold} />
            </div>

            <div style={{ marginTop: 16, padding: 14, borderRadius: 16, border: `1px solid ${shade(currentType.tone, 0.16)}`, background: shade(currentType.tone, 0.06) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: currentType.tone, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <Ic.Info />
                {currentType.name}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7, color: C.t1 }}>
                {selectedType === 'propfirm'
                  ? 'This export formats your own journal data into a prop-style internal review. It is useful for self-checking rules, but it is not an official document issued by a prop firm.'
                  : selectedType === 'psychology'
                    ? 'This export focuses on psychology score, notes, and contextual review rather than only financial metrics.'
                    : selectedType === 'ledger'
                      ? 'This export prioritizes the trade table itself, so the CSV ledger becomes the main artifact.'
                      : 'This export gives a concise executive summary of the filtered journal state.'}
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {prepared ? filteredTrades.slice(0, 5).map((trade) => (
                <div key={String(trade.id)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 10, alignItems: 'center', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: `1px solid ${shade(C.t3, 0.12)}` }}>
                  <strong style={{ color: C.t0, fontSize: 12.5 }}>{trade.symbol || '—'}</strong>
                  <span style={{ color: C.t2, fontSize: 12 }}>{trade.setup || trade.session || 'No setup'}</span>
                  <span style={{ color: C.t2, fontSize: 12 }}>{trade.direction || '—'}</span>
                  <strong style={{ color: (trade.profit_loss || 0) >= 0 ? C.green : C.danger, fontSize: 12.5 }}>{money(trade.profit_loss || 0)}</strong>
                </div>
              )) : (
                <div style={{ padding: 16, borderRadius: 16, border: `1px dashed ${shade(C.t3, 0.18)}`, color: C.t2, fontSize: 12.5, lineHeight: 1.7 }}>
                  Prepare the preview to refresh the report block from the current journal state.
                </div>
              )}
            </div>
          </div>

          <div style={panel()}>
            <SectionTitle
              title="What stands out"
              subtitle="Fast signal extraction from the current dataset."
              tone={C.purple}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              <InsightList title="Top pairs" items={topPairs} formatter={(item) => `${item.label} · ${money(item.value)}`} />
              <InsightList title="Top setups" items={topSetups} formatter={(item) => `${item.label} · ${money(item.value)}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail, tone }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, border: `1px solid ${shade(tone, 0.16)}`, background: shade(tone, 0.08) }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ marginTop: 12, fontSize: 28, fontWeight: 800, letterSpacing: '-0.05em', color: tone }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: C.t2, lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

function PreviewStat({ label, value, tone }) {
  return (
    <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${shade(tone, 0.14)}`, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{label}</div>
      <div style={{ marginTop: 10, fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: tone }}>{value}</div>
    </div>
  );
}

function InsightList({ title, items, formatter }) {
  return (
    <div style={{ padding: 14, borderRadius: 16, border: `1px solid ${shade(C.t3, 0.14)}`, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.t3 }}>{title}</div>
      <div style={{ marginTop: 12, display: 'grid', gap: 9 }}>
        {items.length ? items.map((item) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: C.t1 }}>
            <span>{item.label}</span>
            <strong style={{ color: item.value >= 0 ? C.green : C.danger }}>{formatter(item)}</strong>
          </div>
        )) : <div style={{ fontSize: 12, color: C.t2 }}>Not enough trades in this range yet.</div>}
      </div>
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

function ActionRow({ label, help, onClick, tone, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
        width: '100%',
        padding: '14px 16px',
        borderRadius: 16,
        border: `1px solid ${disabled ? shade(C.t3, 0.12) : shade(tone, 0.16)}`,
        background: disabled ? 'rgba(255,255,255,0.02)' : shade(tone, 0.08),
        color: disabled ? C.t3 : C.t0,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.6, color: disabled ? C.t3 : C.t2 }}>{help}</div>
      </div>
      <div style={{ color: disabled ? C.t3 : tone }}>
        <Ic.Download />
      </div>
    </button>
  );
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

function optionCard(active, tone) {
  return {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: 12,
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: 18,
    border: `1px solid ${active ? shade(tone, 0.18) : shade(C.t3, 0.12)}`,
    background: active ? shade(tone, 0.08) : 'rgba(255,255,255,0.02)',
    cursor: 'pointer',
  };
}

function filterTradesByRange(trades, range) {
  if (range === 'all') return Array.isArray(trades) ? trades : [];
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const floor = new Date();
  floor.setDate(floor.getDate() - days);
  return (trades || []).filter((trade) => {
    const raw = trade.open_date || trade.date || trade.created_at;
    if (!raw) return false;
    const parsed = new Date(raw);
    return !Number.isNaN(parsed.getTime()) && parsed >= floor;
  });
}

function buildReportStats(trades = []) {
  const safeTrades = Array.isArray(trades) ? trades : [];
  const closed = safeTrades.filter((trade) => Number.isFinite(Number(trade.profit_loss ?? trade.pnl ?? 0)));
  const wins = closed.filter((trade) => Number(trade.profit_loss ?? trade.pnl ?? 0) > 0);
  const losses = closed.filter((trade) => Number(trade.profit_loss ?? trade.pnl ?? 0) < 0);
  const pnl = closed.reduce((sum, trade) => sum + Number(trade.profit_loss ?? trade.pnl ?? 0), 0);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((sum, trade) => sum + Number(trade.profit_loss ?? trade.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((sum, trade) => sum + Number(trade.profit_loss ?? trade.pnl ?? 0), 0) / losses.length) : 0;
  const profitFactor = avgLoss > 0 ? ((avgWin * wins.length) / (avgLoss * losses.length || 1)) : 0;

  let peak = 0;
  let running = 0;
  let maxDrawdown = 0;
  [...closed]
    .sort((a, b) => new Date(a.open_date || a.date || 0) - new Date(b.open_date || b.date || 0))
    .forEach((trade) => {
      running += Number(trade.profit_loss ?? trade.pnl ?? 0);
      peak = Math.max(peak, running);
      maxDrawdown = Math.min(maxDrawdown, running - peak);
    });

  const expectancy = closed.length ? pnl / closed.length : 0;
  const psychValues = closed
    .map((trade) => Number(trade.psychologyScore ?? trade.psychology_score))
    .filter((value) => Number.isFinite(value) && value > 0);
  const avgPsychology = psychValues.length
    ? Math.round(psychValues.reduce((sum, value) => sum + value, 0) / psychValues.length)
    : 0;

  return {
    totalTrades: closed.length,
    pnl,
    winRate,
    avgWin,
    avgLoss,
    profitFactor: profitFactor ? Math.round(profitFactor * 100) / 100 : 0,
    maxDrawdown,
    expectancy,
    avgPsychology,
    topPairs: buildTopList(closed, (trade) => trade.symbol || trade.pair || 'Unknown'),
    topSetups: buildTopList(closed, (trade) => trade.setup || trade.extra?.setup || 'No setup'),
  };
}

function buildTopList(trades, getLabel) {
  const map = new Map();
  trades.forEach((trade) => {
    const label = getLabel(trade);
    const current = map.get(label) || 0;
    map.set(label, current + Number(trade.profit_loss ?? trade.pnl ?? 0));
  });
  return [...map.entries()]
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .map(([label, value]) => ({ label, value }));
}

function generateTradeCsv(trades = []) {
  const header = ['date', 'time', 'symbol', 'direction', 'session', 'setup', 'pnl', 'psychologyScore', 'notes'];
  const rows = trades.map((trade) => ([
    safeCsv(trade.open_date || trade.date || ''),
    safeCsv(trade.time || ''),
    safeCsv(trade.symbol || trade.pair || ''),
    safeCsv(trade.direction || trade.type || ''),
    safeCsv(trade.session || ''),
    safeCsv(trade.setup || ''),
    safeCsv(Number(trade.profit_loss ?? trade.pnl ?? 0)),
    safeCsv(trade.psychologyScore ?? trade.psychology_score ?? ''),
    safeCsv(trade.notes || ''),
  ]).join(','));
  return [header.join(','), ...rows].join('\n');
}

function safeCsv(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function generateHtmlReport({ type, dateRange, stats, trades, user }) {
  const rows = trades.slice(0, 30).map((trade) => `
    <tr>
      <td>${escapeHtml(trade.open_date || trade.date || '—')}</td>
      <td>${escapeHtml(trade.symbol || trade.pair || '—')}</td>
      <td>${escapeHtml(trade.direction || '—')}</td>
      <td>${escapeHtml(trade.setup || trade.session || '—')}</td>
      <td style="color:${Number(trade.profit_loss ?? trade.pnl ?? 0) >= 0 ? '#00FF88' : '#FF3D57'};font-weight:700">${escapeHtml(money(trade.profit_loss ?? trade.pnl ?? 0))}</td>
    </tr>
  `).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MarketFlow Report</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;background:#07111b;color:#e8eeff;margin:0;padding:32px}
      .wrap{max-width:1080px;margin:0 auto}
      .eyebrow{display:inline-block;padding:6px 10px;border-radius:999px;border:1px solid rgba(6,230,255,.18);background:rgba(6,230,255,.08);color:#06e6ff;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
      h1{font-size:42px;letter-spacing:-.06em;margin:16px 0 0}
      p{color:#9db0d1;line-height:1.7}
      .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:24px}
      .card{padding:18px;border-radius:18px;background:#0c1422;border:1px solid rgba(125,150,190,.12)}
      .label{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#60769e}
      .value{font-size:28px;font-weight:800;letter-spacing:-.05em;margin-top:10px}
      table{width:100%;border-collapse:collapse;margin-top:24px;background:#0c1422;border-radius:16px;overflow:hidden}
      th,td{padding:14px;border-bottom:1px solid rgba(125,150,190,.1);text-align:left;font-size:13px}
      th{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7a90b8}
      .note{margin-top:18px;padding:14px 16px;border-radius:16px;background:rgba(6,230,255,.08);border:1px solid rgba(6,230,255,.16)}
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="eyebrow">${escapeHtml(type.name)}</div>
      <h1>MarketFlow report</h1>
      <p>Generated ${escapeHtml(new Date().toLocaleString('en-GB'))} · Scope: ${escapeHtml(dateRange)} · User: ${escapeHtml(user?.email || 'MarketFlow workspace')}</p>
      <div class="grid">
        <div class="card"><div class="label">Trades</div><div class="value">${stats.totalTrades}</div></div>
        <div class="card"><div class="label">Net P&L</div><div class="value">${escapeHtml(money(stats.pnl))}</div></div>
        <div class="card"><div class="label">Win rate</div><div class="value">${formatPercent(stats.winRate)}%</div></div>
        <div class="card"><div class="label">Drawdown</div><div class="value">${escapeHtml(money(stats.maxDrawdown))}</div></div>
      </div>
      <div class="note">
        ${type.id === 'propfirm'
          ? 'This report is formatted for internal prop-style review. It is not an official prop-firm document.'
          : 'This report is generated directly from the current MarketFlow trade stream and can be printed or shared as HTML.'}
      </div>
      <table>
        <thead>
          <tr><th>Date</th><th>Symbol</th><th>Direction</th><th>Setup / Session</th><th>P&L</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5">No trades in scope.</td></tr>'}</tbody>
      </table>
    </div>
  </body>
</html>`;
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
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

function stampDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
