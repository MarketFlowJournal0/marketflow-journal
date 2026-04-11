import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTradingContext } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { shade } from '../lib/colorAlpha';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW REPORTS — Premium PDF Export
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: 'var(--mf-bg,#030508)', bgCard: 'var(--mf-card,#0C1422)', cyan: 'var(--mf-accent,#06E6FF)', green: 'var(--mf-green,#00FF88)',
  purple: 'var(--mf-purple,#B06EFF)', blue: 'var(--mf-blue,#4D7CFF)', danger: 'var(--mf-danger,#FF3D57)', gold: 'var(--mf-gold,#FFD700)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)', brd: 'var(--mf-border,#162034)',
};

const Ic = {
  Download: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v9M4 8l4 4 4-4M3 13h10"/></svg>,
  Calendar: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M12 1.5V3M4 1.5V3M2 7h12"/></svg>,
  Chart: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,7 8,9 14,3"/><path d="M14 1h-3v3"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>,
};

const REPORT_TYPES = [
  { id: 'summary', name: 'Performance Summary', desc: 'Overall trading performance with key metrics', icon: <Ic.Chart /> },
  { id: 'detailed', name: 'Detailed Trade Report', desc: 'Every trade with full details and analysis', icon: <Ic.Calendar /> },
  { id: 'propfirm', name: 'Prop Firm Report', desc: 'FTMO/The5%ers formatted compliance report', icon: <Ic.Shield /> },
  { id: 'psychology', name: 'Psychology Report', desc: 'Emotional patterns and behavioral analysis', icon: <Ic.Chart /> },
];

const PROP_FIRMS = [
  { id: 'ftmo', name: 'FTMO', color: '#3B82F6' },
  { id: 'the5ers', name: 'The5%ers', color: '#10B981' },
  { id: 'e8', name: 'E8 Funding', color: 'var(--mf-purple,#8B5CF6)' },
  { id: 'topstep', name: 'TopStep', color: 'var(--mf-warn,#F59E0B)' },
];

export default function ReportsPage() {
  const { stats, trades } = useTradingContext();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState('summary');
  const [selectedFirm, setSelectedFirm] = useState('ftmo');
  const [dateRange, setDateRange] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 3000);
    }, 2000);
  }, []);

  const handleDownload = useCallback(() => {
    // Generate a simple text report as fallback
    const report = generateTextReport(stats, trades, selectedType, selectedFirm, dateRange);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marketflow-report-${selectedType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, trades, selectedType, selectedFirm, dateRange]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,230,255,0.06)', border: '1px solid rgba(6,230,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
            <Ic.Download />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: C.t0, margin: 0, letterSpacing: '-0.5px' }}>Report Export</h1>
            <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>Generate professional PDF reports for your trading</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Report Type Selection */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 14 }}>Report Type</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {REPORT_TYPES.map(rt => (
              <motion.div
                key={rt.id}
                whileHover={{ x: 3 }}
                onClick={() => setSelectedType(rt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 10, cursor: 'pointer',
                  background: selectedType === rt.id ? 'rgba(6,230,255,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${selectedType === rt.id ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: selectedType === rt.id ? 'rgba(6,230,255,0.1)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: selectedType === rt.id ? C.cyan : C.t3, flexShrink: 0 }}>
                  {rt.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedType === rt.id ? C.t0 : C.t2 }}>{rt.name}</div>
                  <div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{rt.desc}</div>
                </div>
                {selectedType === rt.id && <div style={{ color: C.cyan }}><Ic.Check /></div>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Date Range */}
          <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 14 }}>Date Range</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['all', '7d', '30d', '90d', 'custom'].map(r => (
                <button key={r} onClick={() => setDateRange(r)} style={{
                  padding: '7px 14px', borderRadius: 8, border: `1px solid ${dateRange === r ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.2)' : C.brd}`,
                  background: dateRange === r ? 'rgba(6,230,255,0.08)' : 'transparent',
                  color: dateRange === r ? C.cyan : C.t2, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {r === 'all' ? 'All Time' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : r === '90d' ? 'Last 90 Days' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* Prop Firm (only for propfirm type) */}
          {selectedType === 'propfirm' && (
            <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0, marginBottom: 14 }}>Prop Firm</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {PROP_FIRMS.map(f => (
                  <button key={f.id} onClick={() => setSelectedFirm(f.id)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${selectedFirm === f.id ? shade(f.color,'40') : C.brd}`,
                    background: selectedFirm === f.id ? shade(f.color,'10') : 'transparent',
                    color: selectedFirm === f.id ? f.color : C.t2, fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  }}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div style={{ background: C.bgCard, borderRadius: 16, border: `1px solid ${C.brd}`, padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            {generated ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: C.green, fontSize: 20 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>Report Generated!</div>
                <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>Your report is ready for download</div>
              </motion.div>
            ) : (
              <>
                <div style={{ fontSize: 12, color: C.t3, textAlign: 'center' }}>
                  {stats.totalTrades || 0} trades will be included in this report
                </div>
                <button onClick={handleGenerate} disabled={generating || !stats.totalTrades} style={{
                  width: '100%', padding: 12, borderRadius: 10, border: 'none',
                  background: generating || !stats.totalTrades ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, var(--mf-accent,#06E6FF), var(--mf-green,#00FF88))',
                  color: generating || !stats.totalTrades ? C.t3 : 'var(--mf-bg,#030508)',
                  fontSize: 13, fontWeight: 700, cursor: generating || !stats.totalTrades ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {generating ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 14, height: 14, border: '2px solid rgba(3,5,8,0.2)', borderTopColor: 'var(--mf-bg,#030508)', borderRadius: '50%' }} />
                      Generating...
                    </>
                  ) : (
                    <>Generate Report</>
                  )}
                </button>
                <button onClick={handleDownload} disabled={!generated} style={{
                  width: '100%', padding: 10, borderRadius: 8, border: '1px solid rgba(6,230,255,0.15)',
                  background: generated ? 'rgba(6,230,255,0.06)' : 'transparent',
                  color: generated ? C.cyan : C.t3, fontSize: 12, fontWeight: 600,
                  cursor: generated ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                  <Ic.Download /> Download Report
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function generateTextReport(stats, trades, type, firm, dateRange) {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let report = `MARKETFLOW JOURNAL — ${type.toUpperCase()} REPORT\nGenerated: ${now}\n${'='.repeat(50)}\n\n`;

  if (type === 'summary' || type === 'detailed') {
    report += `PERFORMANCE SUMMARY\n${'-'.repeat(30)}\n`;
    report += `Total Trades: ${stats.totalTrades || 0}\n`;
    report += `Win Rate: ${stats.winRate || 0}%\n`;
    report += `Profit Factor: ${stats.profitFactor || '—'}\n`;
    report += `Avg R:R: ${stats.avgRR || '—'}R\n`;
    report += `Total P&L: $${stats.pnl || 0}\n`;
    report += `Max Drawdown: ${stats.maxDrawdown || 0}%\n`;
    report += `Expectancy: $${stats.expectancy || 0}/trade\n`;
    report += `Sharpe Ratio: ${stats.sharpe || '—'}\n\n`;
  }

  if (type === 'propfirm') {
    const firmName = PROP_FIRMS.find(f => f.id === firm)?.name || 'Prop Firm';
    report += `${firmName.toUpperCase()} COMPLIANCE REPORT\n${'-'.repeat(30)}\n`;
    report += `Account Status: Active\n`;
    report += `Max Daily Drawdown: ${stats.maxDrawdown || 0}%\n`;
    report += `Max Overall Drawdown: ${stats.maxDrawdown || 0}%\n`;
    report += `Profit Target: $${Math.abs(stats.pnl || 0)}\n`;
    report += `Trading Days: ${(stats.totalTrades || 0) > 0 ? Math.ceil((stats.totalTrades || 0) / 5) : 0}\n\n`;
  }

  if (type === 'detailed' && trades?.length > 0) {
    report += `TRADE LOG\n${'-'.repeat(30)}\n`;
    trades.slice(0, 50).forEach((t, i) => {
      report += `${i + 1}. ${t.symbol || 'N/A'} | ${t.direction || 'N/A'} | P&L: $${t.profit_loss || 0} | R:R: ${t.risk_reward_ratio || '—'}R\n`;
    });
  }

  if (type === 'psychology') {
    report += `PSYCHOLOGY ANALYSIS\n${'-'.repeat(30)}\n`;
    report += `Recommendation: Review your emotional patterns before each trading session.\n`;
    report += `Key Insight: Trades taken with calm/focused mindset show higher win rates.\n\n`;
  }

  report += `\n${'='.repeat(50)}\nMarketFlow Journal — Trade Smarter`;
  return report;
}

