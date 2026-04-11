import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { shade } from '../lib/colorAlpha';

const C = {
  bg: 'var(--mf-bg,#030508)', bgCard: 'var(--mf-card,#0C1422)', bgHigh: 'var(--mf-high,#111B2E)',
  cyan: 'var(--mf-accent,#06E6FF)', green: 'var(--mf-green,#00FF88)', purple: 'var(--mf-purple,#A78BFA)',
  blue: 'var(--mf-blue,#4D7CFF)', danger: 'var(--mf-danger,#FF3D57)', warn: 'var(--mf-warn,#FFB31A)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#162034)',
};

const BROKERS = [
  {
    id: 'mt4', name: 'MetaTrader 4', short: 'MT4', icon: '📊', color: 'var(--mf-accent,#06E6FF)',
    desc: 'Real-time sync via Expert Advisor. Trades sync automatically as they close.',
    features: ['Real-time sync', 'All trade fields', 'Auto retry', 'Multi-account'],
    setup: [
      'Click "Connect" to create your account',
      'Copy the generated API token',
      'Download the MarketFlow EA (.ex4 file)',
      'Place the EA in MT4: File → Open Data Folder → MQL4 → Experts',
      'Open MT4 Navigator → Expert Advisors → drag MarketFlowJournal onto any chart',
      'Paste your API token in the EA settings (Inputs tab)',
      'Enable "Allow WebRequest" in MT4 Tools → Options → Expert Advisors',
      'Add URL: https://app.marketflowjournal.com/api/mt-sync',
      'Click OK — trades will sync automatically',
    ],
  },
  {
    id: 'mt5', name: 'MetaTrader 5', short: 'MT5', icon: '📈', color: 'var(--mf-green,#00FF88)',
    desc: 'Full MT5 support with advanced position tracking and hedging detection.',
    features: ['Real-time sync', 'Hedge mode support', 'Position tracking', 'Netting support'],
    setup: [
      'Click "Connect" to create your MT5 account',
      'Copy the generated API token',
      'Download the MarketFlow EA (.mq5 file)',
      'Open MT5: File → Open Data Folder → MQL5 → Experts',
      'Copy the .mq5 file into the Experts folder',
      'Compile: double-click the file in Navigator → Compile',
      'Drag MarketFlowJournal onto any chart',
      'Enable "Allow WebRequest" in Tools → Options → Expert Advisors',
      'Add URL: https://app.marketflowjournal.com/api/mt-sync',
      'Paste your API token in EA Inputs',
      'Click OK — sync starts immediately',
    ],
  },
  {
    id: 'ctrader', name: 'cTrader', short: 'cT', icon: '⚡', color: 'var(--mf-purple,#A78BFA)',
    desc: 'cTrader sync via cBot or manual CSV export. Coming soon: API integration.',
    features: ['CSV import', 'cBot (coming soon)', 'Full history', 'Multi-account'],
    setup: [
      'For now, use our universal CSV importer',
      'In cTrader: History tab → right-click → Export to CSV',
      'Go to All Trades → Import → drag your CSV file',
      'Our auto-detect will map columns automatically',
      'cBot auto-sync coming in the next update',
    ],
    status: 'csv',
  },
  {
    id: 'tradingview', name: 'TradingView', short: 'TV', icon: '📉', color: 'var(--mf-blue,#4D7CFF)',
    desc: 'Import TradingView broker trades via CSV or webhook alerts.',
    features: ['CSV import', 'Webhook alerts', 'Paper trading', 'All brokers'],
    setup: [
      'TradingView broker trades can be exported as CSV',
      'Go to TradingView → Trading Panel → Account → Export',
      'Import the CSV via All Trades → Import',
      'Or set up a webhook alert for real-time sync (coming soon)',
    ],
    status: 'csv',
  },
  {
    id: 'ibkr', name: 'Interactive Brokers', short: 'IBKR', icon: '🏦', color: 'var(--mf-warn,#FFB31A)',
    desc: 'IBKR activity statement import. Full trade history with commissions.',
    features: ['CSV import', 'Commission tracking', 'Multi-currency', 'Full history'],
    setup: [
      'Log into IBKR Account Management',
      'Go to Performance & Reports → Statements',
      'Create a new Activity Statement',
      'Select the date range you want to import',
      'Format: CSV (Flex Query)',
      'Download and import via All Trades → Import',
    ],
    status: 'csv',
  },
  {
    id: 'webhook', name: 'Webhook / API', short: 'API', icon: '🔗', color: 'var(--mf-pink,#FB7185)',
    desc: 'Send trades from any platform via HTTP POST. Universal compatibility.',
    features: ['Any platform', 'Real-time', 'REST API', 'Custom fields'],
    setup: [
      'Create a webhook connection below',
      'Copy your unique webhook URL',
      'Configure your platform to POST trades to this URL',
      'Required fields: ticket, symbol, direction, volume, open_price, close_price, profit',
      'Optional: commission, swap, sl, tp, comment, custom fields',
      'See our API docs for full specification',
    ],
    status: 'webhook',
  },
];

function generateToken() {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timeAgo(date) {
  if (!date) return 'Never';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function BrokerConnect() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [form, setForm] = useState({ broker_type: 'mt4', account_number: '', account_name: '', server_name: '' });
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('broker_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setAccounts(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.account_number.trim()) { toast.error('Account number required'); return; }
    const token = generateToken();
    const { data, error } = await supabase
      .from('broker_accounts')
      .insert({ user_id: user.id, broker_type: form.broker_type, account_number: form.account_number.trim(), account_name: form.account_name.trim(), server_name: form.server_name.trim(), api_token: token, status: 'disconnected' })
      .select().single();
    if (error) toast.error(error.message);
    else { toast.success('Account added — copy your token to connect'); setForm({ broker_type: 'mt4', account_number: '', account_name: '', server_name: '' }); setShowForm(false); fetchAccounts(); }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    const { error } = await supabase.from('broker_accounts').delete().eq('id', id);
    if (error) toast.error(error.message); else toast.success('Account removed');
    fetchAccounts(); setDeletingId(null);
  }

  async function handleSync(id) {
    setSyncingId(id);
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    try {
      const res = await fetch('/api/mt-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_token: acc.api_token, trades: [] }) });
      const data = await res.json();
      if (res.ok) { toast.success(`${data.inserted || 0} new trades synced`); await supabase.from('broker_accounts').update({ last_sync_at: new Date().toISOString(), status: 'connected' }).eq('id', id); fetchAccounts(); }
      else toast.error(data.error || 'Sync failed');
    } catch (err) { toast.error('Connection failed — check your EA settings'); }
    setSyncingId(null);
  }

  function copyToken(token) {
    navigator.clipboard.writeText(token); setCopiedToken(token); setTimeout(() => setCopiedToken(null), 2000); toast.success('Token copied to clipboard');
  }

  function openSetup(broker) { setSelectedBroker(broker); setShowSetup(true); }

  const filteredAccounts = activeTab === 'all' ? accounts : accounts.filter(a => a.broker_type === activeTab);
  const connectedCount = accounts.filter(a => a.status === 'connected').length;
  const totalSynced = accounts.reduce((sum, a) => sum + (a.total_trades_synced || 0), 0);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.t0, margin: 0, letterSpacing: '-0.5px' }}>
              Broker <span style={{ background: 'linear-gradient(135deg,var(--mf-accent,#06E6FF),var(--mf-green,#00FF88))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connections</span>
            </h1>
            <p style={{ fontSize: 14, color: C.t2, margin: '8px 0 0', maxWidth: 500 }}>Connect your trading accounts for automatic trade synchronization. Supports MT4, MT5, cTrader, TradingView, and any platform via webhook.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '11px 22px', background: 'linear-gradient(135deg, var(--mf-accent,#06E6FF), var(--mf-green,#00FF88))', color: 'var(--mf-bg,#030508)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 20px rgba(var(--mf-accent-rgb, 6, 230, 255),0.25)' }}>{showForm ? 'Cancel' : '+ Connect Broker'}</button>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
          {[{ l: 'Connected', v: connectedCount, c: C.green, icon: '●' }, { l: 'Total Accounts', v: accounts.length, c: C.cyan, icon: '◉' }, { l: 'Trades Synced', v: totalSynced.toLocaleString(), c: C.purple, icon: '◆' }].map((s, i) => (
            <div key={i} style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.brd}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, color: s.c }}>{s.icon}</span>
              <div><div style={{ fontSize: 18, fontWeight: 800, color: s.c, fontFamily: 'monospace' }}>{s.v}</div><div style={{ fontSize: 9, color: C.t3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</div></div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ background: 'linear-gradient(160deg, #0C1830, #080F1E)', border: '1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.15)', borderRadius: 16, padding: 28, marginBottom: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 20 }}>Connect New Account</h3>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform</label><select value={form.broker_type} onChange={e => setForm(f => ({ ...f, broker_type: e.target.value }))} style={{ width: '100%', padding: '11px 14px', background: '#060D1A', color: C.t0, border: '1px solid var(--mf-border,#162034)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>{BROKERS.filter(b => b.status !== 'csv' && b.status !== 'webhook').map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}</select></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Number</label><input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="e.g. 50123456" style={{ width: '100%', padding: '11px 14px', background: '#060D1A', color: C.t0, border: '1px solid var(--mf-border,#162034)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} /></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Label</label><input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="e.g. FTMO Challenge #1" style={{ width: '100%', padding: '11px 14px', background: '#060D1A', color: C.t0, border: '1px solid var(--mf-border,#162034)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} /></div>
                <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: C.t2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Server</label><input value={form.server_name} onChange={e => setForm(f => ({ ...f, server_name: e.target.value }))} placeholder="e.g. ICMarkets-Live07" style={{ width: '100%', padding: '11px 14px', background: '#060D1A', color: C.t0, border: '1px solid var(--mf-border,#162034)', borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} /></div>
              </div>
              <button type="submit" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, var(--mf-accent,#06E6FF), var(--mf-green,#00FF88))', color: 'var(--mf-bg,#030508)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Generate API Token →</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[{ id: 'all', l: 'All' }, ...BROKERS.filter(b => accounts.some(a => a.broker_type === b.id)).map(b => ({ id: b.id, l: b.short }))].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${activeTab === tab.id ? C.cyan : C.brd}`, background: activeTab === tab.id ? 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)' : 'transparent', color: activeTab === tab.id ? C.cyan : C.t3, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{tab.l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.t3 }}>Loading connections...</div>
      ) : filteredAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'rgba(255,255,255,0.02)', border: `1px dashed ${C.brd}`, borderRadius: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔌</div>
          <p style={{ color: C.t2, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No connections yet</p>
          <p style={{ color: C.t3, fontSize: 13 }}>Click "Connect Broker" to link your first trading account</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredAccounts.map(acc => {
            const broker = BROKERS.find(b => b.id === acc.broker_type) || BROKERS[0];
            return (
              <motion.div key={acc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(160deg, rgba(12,20,34,0.95), rgba(8,14,26,0.98))', border: `1px solid ${acc.status === 'connected' ? shade(broker.color,'30') : C.brd}`, borderRadius: 16, padding: 24, position: 'relative', overflow: 'hidden' }}>
                {acc.status === 'connected' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${shade(broker.color,'60')}, transparent)` }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 22 }}>{broker.icon}</span>
                      <div><div style={{ fontSize: 16, fontWeight: 700, color: C.t0 }}>{acc.account_name || acc.account_number}</div><div style={{ fontSize: 11, color: C.t3, marginTop: 2 }}>{broker.name} · {acc.server_name || 'Default Server'}</div></div>
                      <span style={{ padding: '4px 10px', borderRadius: 6, background: acc.status === 'connected' ? 'rgba(var(--mf-green-rgb, 0, 255, 136),0.1)' : 'rgba(255,255,255,0.04)', color: acc.status === 'connected' ? C.green : C.t3, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, border: `1px solid ${acc.status === 'connected' ? 'rgba(var(--mf-green-rgb, 0, 255, 136),0.2)' : C.brd}` }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: acc.status === 'connected' ? C.green : C.t3, boxShadow: acc.status === 'connected' ? `0 0 6px ${C.green}` : 'none' }} />{acc.status === 'connected' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <code style={{ background: '#060D1A', padding: '7px 12px', borderRadius: 8, fontSize: 11.5, color: broker.color, fontFamily: 'monospace', border: `1px solid ${C.brd}` }}>{acc.api_token}</code>
                      <button onClick={() => copyToken(acc.api_token)} style={{ padding: '7px 12px', background: 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)', color: C.cyan, border: '1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.15)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>{copiedToken === acc.api_token ? '✓ Copied' : 'Copy'}</button>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: C.t3 }}>Last sync: <span style={{ color: C.t2 }}>{timeAgo(acc.last_sync_at)}</span></span>
                      <span style={{ fontSize: 10, color: C.t3 }}>Trades: <span style={{ color: C.t2, fontWeight: 600 }}>{acc.total_trades_synced || 0}</span></span>
                      <span style={{ fontSize: 10, color: C.t3 }}>Created: <span style={{ color: C.t2 }}>{new Date(acc.created_at).toLocaleDateString()}</span></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {acc.broker_type.startsWith('mt') && <button onClick={() => handleSync(acc.id)} disabled={syncingId === acc.id} style={{ padding: '8px 16px', background: 'rgba(var(--mf-accent-rgb, 6, 230, 255),0.08)', color: C.cyan, border: '1px solid rgba(var(--mf-accent-rgb, 6, 230, 255),0.15)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>{syncingId === acc.id ? 'Syncing...' : 'Sync Now'}</button>}
                    <button onClick={() => openSetup(broker)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.04)', color: C.t2, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Setup Guide</button>
                    <button onClick={() => handleDelete(acc.id)} disabled={deletingId === acc.id} style={{ padding: '8px 14px', background: 'rgba(255,70,70,0.06)', color: C.danger, border: '1px solid rgba(255,70,70,0.1)', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>{deletingId === acc.id ? '...' : 'Remove'}</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 48 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: C.t0, marginBottom: 6 }}>Supported Platforms</h3>
        <p style={{ fontSize: 13, color: C.t3, marginBottom: 20 }}>Connect any trading platform — real-time sync or CSV import</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {BROKERS.map(broker => (
            <motion.div key={broker.id} whileHover={{ y: -2 }} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.brd}`, borderRadius: 14, padding: 22, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => openSetup(broker)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}><span style={{ fontSize: 28 }}>{broker.icon}</span><div><div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>{broker.name}</div><div style={{ fontSize: 10, color: broker.color, fontWeight: 600 }}>{broker.status === 'csv' ? 'CSV Import' : broker.status === 'webhook' ? 'API / Webhook' : 'Real-time Sync'}</div></div></div>
              <p style={{ fontSize: 12, color: C.t2, lineHeight: 1.6, marginBottom: 12 }}>{broker.desc}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{broker.features.map((f, i) => (<span key={i} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600, background: `${shade(broker.color,'10')}`, color: broker.color, border: `1px solid ${shade(broker.color,'20')}` }}>{f}</span>))}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSetup && selectedBroker && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSetup(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ width: 560, maxHeight: '85vh', overflow: 'auto', background: 'linear-gradient(160deg, #0C1830, #080F1E)', border: `1px solid ${shade(selectedBroker.color,'25')}`, borderRadius: 20, boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${shade(selectedBroker.color,'15')}` }}>
              <div style={{ padding: '28px 28px 20px', borderBottom: `1px solid ${C.brd}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}><span style={{ fontSize: 36 }}>{selectedBroker.icon}</span><div><h3 style={{ fontSize: 20, fontWeight: 800, color: C.t0, margin: 0 }}>{selectedBroker.name} Setup</h3><p style={{ fontSize: 12, color: C.t2, margin: '4px 0 0' }}>{selectedBroker.desc}</p></div></div></div>
              <div style={{ padding: '24px 28px' }}>{selectedBroker.setup.map((step, i) => (<div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18 }}><div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `${shade(selectedBroker.color,'15')}`, border: `1px solid ${shade(selectedBroker.color,'30')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: selectedBroker.color }}>{i + 1}</div><p style={{ fontSize: 13, color: C.t1, lineHeight: 1.65, margin: 0, paddingTop: 3 }}>{step}</p></div>))}</div>
              <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${C.brd}` }}><button onClick={() => setShowSetup(false)} style={{ width: '100%', padding: '11px', borderRadius: 10, border: `1px solid ${shade(selectedBroker.color,'30')}`, background: `${shade(selectedBroker.color,'08')}`, color: selectedBroker.color, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Got it</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

