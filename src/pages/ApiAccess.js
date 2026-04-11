import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { shade } from '../lib/colorAlpha';

const C = {
  bg: 'var(--mf-bg,#030508)', bgCard: 'var(--mf-card,#0C1422)', cyan: 'var(--mf-accent,#06E6FF)', green: 'var(--mf-green,#00FF88)',
  purple: 'var(--mf-purple,#B06EFF)', danger: 'var(--mf-danger,#FF3D57)', gold: 'var(--mf-gold,#FFD700)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)', brd: 'var(--mf-border,#162034)',
};

const Ic = {
  Key: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="3"/><path d="M11 11l3.5 3.5"/><path d="M11 4l1.5-1.5a1 1 0 011.4 0l.6.6a1 1 0 010 1.4L13 6"/></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1"/><path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h10M5 4V2.5A1.5 1.5 0 016.5 1h1A1.5 1.5 0 019 2.5V4"/><path d="M3 4l.7 8.1a1.5 1.5 0 001.5 1.4h3.6a1.5 1.5 0 001.5-1.4L11 4"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>,
  Code: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11L2 8l3-3"/><path d="M11 5l3 3-3 3"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z"/></svg>,
};

const DEFAULT_KEYS = [
  { id: 1, name: 'Production Key', key: 'mf_live_sk_a8f3k29d••••••••••••••••', created: '2026-03-15', lastUsed: '2 hours ago', active: true },
  { id: 2, name: 'Development Key', key: 'mf_test_sk_x9m2p47f••••••••••••••••', created: '2026-03-20', lastUsed: '3 days ago', active: false },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/trades', desc: 'Get all trades' },
  { method: 'GET', path: '/api/v1/trades/:id', desc: 'Get single trade' },
  { method: 'POST', path: '/api/v1/trades', desc: 'Create a trade' },
  { method: 'PUT', path: '/api/v1/trades/:id', desc: 'Update a trade' },
  { method: 'DELETE', path: '/api/v1/trades/:id', desc: 'Delete a trade' },
  { method: 'GET', path: '/api/v1/stats', desc: 'Get trading statistics' },
  { method: 'GET', path: '/api/v1/analytics', desc: 'Get analytics data' },
  { method: 'POST', path: '/api/v1/webhook', desc: 'Receive trade webhook' },
];

export default function ApiAccessPage() {
  const [keys, setKeys] = useState(DEFAULT_KEYS);
  const [copiedId, setCopiedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const handleCopy = (key) => {
    navigator.clipboard.writeText(key.key.replace(/\u2022/g, 'x'));
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id) => {
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    const random = Math.random().toString(36).substring(2, 10);
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      key: 'mf_live_sk_' + random + '\u2022'.repeat(20),
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      active: true,
    };
    setKeys(prev => [...prev, newKey]);
    setNewKeyName('');
    setShowCreate(false);
  };

  const methodColor = (m) => {
    switch (m) {
      case 'GET': return C.cyan;
      case 'POST': return C.green;
      case 'PUT': return C.gold;
      case 'DELETE': return C.danger;
      default: return C.t2;
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,230,255,0.06)', border: '1px solid rgba(6,230,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.cyan }}>
            <Ic.Key />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 800, color: C.t0, margin: 0, letterSpacing: '-0.5px' }}>API Access</h1>
            <p style={{ fontSize: 12, color: C.t2, margin: 0 }}>Manage your API keys and access documentation</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* API Keys */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: '1px solid ' + C.brd, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>API Keys</h3>
            <button onClick={() => setShowCreate(!showCreate)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6,
              border: '1px solid rgba(6,230,255,0.15)', background: 'rgba(6,230,255,0.06)',
              color: C.cyan, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Ic.Plus /> New Key
            </button>
          </div>

          {showCreate && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{
              display: 'flex', gap: 8, marginBottom: 14, padding: 12, borderRadius: 8,
              background: 'rgba(6,230,255,0.04)', border: '1px solid rgba(6,230,255,0.1)',
            }}>
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g., Production)"
                style={{
                  flex: 1, padding: '8px 10px', background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, color: C.t0,
                  fontSize: 12, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button onClick={handleCreate} disabled={!newKeyName.trim()} style={{
                padding: '8px 14px', borderRadius: 6, border: 'none',
                background: newKeyName.trim() ? C.cyan : 'rgba(255,255,255,0.04)',
                color: newKeyName.trim() ? 'var(--mf-bg,#030508)' : C.t3, fontSize: 11, fontWeight: 700,
                cursor: newKeyName.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
              }}>Create</button>
            </motion.div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {keys.map(key => (
              <motion.div
                key={key.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 14, borderRadius: 10,
                  background: key.active ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  opacity: key.active ? 1 : 0.5,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: key.active ? C.green : C.t3 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.t0 }}>{key.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleCopy(key)} style={{
                      padding: '4px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent', color: C.t2, fontSize: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                    }}>
                      {copiedId === key.id ? <Ic.Check /> : <Ic.Copy />}
                      {copiedId === key.id ? 'Copied' : 'Copy'}
                    </button>
                    <button onClick={() => handleDelete(key.id)} style={{
                      padding: '4px 8px', borderRadius: 5, border: '1px solid rgba(255,61,87,0.1)',
                      background: 'transparent', color: C.danger, fontSize: 10, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit',
                    }}>
                      <Ic.Trash />
                    </button>
                  </div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.cyan, marginBottom: 6 }}>{key.key}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 10, color: C.t3 }}>
                  <span>Created: {key.created}</span>
                  <span>Last used: {key.lastUsed}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* API Docs */}
        <div style={{ background: C.bgCard, borderRadius: 16, border: '1px solid ' + C.brd, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ color: C.cyan }}><Ic.Code /></span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.t0 }}>API Endpoints</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {API_ENDPOINTS.map((ep, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    padding: '2px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800,
                    background: shade(methodColor(ep.method),'15'), border: '1px solid ' + shade(methodColor(ep.method),'30'),
                    color: methodColor(ep.method), fontFamily: "'JetBrains Mono',monospace",
                  }}>{ep.method}</span>
                  <span style={{ fontSize: 11, color: C.t1, fontFamily: "'JetBrains Mono',monospace" }}>{ep.path}</span>
                </div>
                <div style={{ fontSize: 10, color: C.t3 }}>{ep.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: 'rgba(6,230,255,0.04)', border: '1px solid rgba(6,230,255,0.1)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.cyan, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Ic.Shield /> Authentication
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: C.t2, lineHeight: 1.6 }}>
              Include your API key in the header:<br/>
              <span style={{ color: C.cyan }}>Authorization: Bearer mf_live_sk_...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

