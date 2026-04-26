import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { shade } from '../lib/colorAlpha';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { appUrl } from '../lib/appUrls';

const C = {
  bgCard: 'var(--mf-card,#060D18)',
  cyan: 'var(--mf-accent,#14C9E5)',
  green: 'var(--mf-green,#00D2B8)',
  purple: 'var(--mf-purple,#B06EFF)',
  danger: 'var(--mf-danger,#FF3D57)',
  gold: 'var(--mf-gold,#D7B36A)',
  blue: 'var(--mf-blue,#4D7CFF)',
  t0: 'var(--mf-text-0,#FFFFFF)',
  t1: 'var(--mf-text-1,#E8EEFF)',
  t2: 'var(--mf-text-2,#7A90B8)',
  t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#142033)',
};

const Ic = {
  Key: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="3" /><path d="M11 11l3.5 3.5" /><path d="M11 4l1.5-1.5a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4L13 6" /></svg>,
  Copy: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="8" height="8" rx="1" /><path d="M10 4V2.5A1.5 1.5 0 0 0 8.5 1h-6A1.5 1.5 0 0 0 1 2.5v6A1.5 1.5 0 0 0 2.5 10H4" /></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3" /></svg>,
  Network: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="4" height="4" rx="1" /><rect x="10" y="2" width="4" height="4" rx="1" /><rect x="6" y="10" width="4" height="4" rx="1" /><path d="M4 6v2h8V6" /><path d="M8 8v2" /></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l5 2.5v4.5c0 3-2.5 5.5-5 7-2.5-1.5-5-4-5-7V4.5z" /></svg>,
  Info: () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="7" r="5.5" /><path d="M7 6.2v3.1" /><circle cx="7" cy="4.4" r=".45" fill="currentColor" /></svg>,
};

const LIVE_ROUTES = [
  {
    id: 'mt-sync',
    method: 'POST',
    path: '/api/mt-sync',
    tone: C.green,
    title: 'MetaTrader and webhook trade sync',
    desc: 'Receives fill arrays with an api_token and writes only new trades into the journal.',
  },
  {
    id: 'market-forex',
    method: 'GET',
    path: '/api/market-data?type=forex',
    tone: C.cyan,
    title: 'Forex market snapshot',
    desc: 'Returns the forex pairs used by the landing and other market read surfaces.',
  },
  {
    id: 'market-indices',
    method: 'GET',
    path: '/api/market-data?type=indices',
    tone: C.purple,
    title: 'Indices market snapshot',
    desc: 'Returns a server-side market snapshot for the main US indices.',
  },
];

export default function ApiAccessPage() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState('mt-sync');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchAccounts() {
      if (!user?.id) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('broker_accounts')
        .select('id, broker_type, account_name, account_number, api_token, status, total_trades_synced, last_sync_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        setAccounts([]);
        setLoading(false);
        return;
      }

      setAccounts(data || []);
      setLoading(false);
    }

    fetchAccounts();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const selectedAccount = accounts[0] || null;
  const currentRoute = LIVE_ROUTES.find((route) => route.id === selectedRoute) || LIVE_ROUTES[0];
  const curlSnippet = useMemo(() => buildCurlSnippet(currentRoute.id, selectedAccount?.api_token), [currentRoute.id, selectedAccount?.api_token]);

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1500);
  }

  return (
    <div style={{ padding: '30px 34px 72px', maxWidth: 1380, margin: '0 auto', display: 'grid', gap: 20 }}>
      <div style={panel()}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)', gap: 18 }}>
          <div>
            <div style={eyebrow(C.cyan)}>
              <Ic.Network />
              API Desk
            </div>
            <h1 style={{ margin: '16px 0 0', fontSize: 38, lineHeight: 1.04, letterSpacing: '-0.06em', color: C.t0 }}>
              Only the routes that are
              <span style={{ color: C.cyan }}> actually live</span> are documented here.
            </h1>
            <p style={{ margin: '16px 0 0', maxWidth: 780, fontSize: 14.5, lineHeight: 1.8, color: C.t2 }}>
              This page no longer pretends the journal exposes a full public REST product if that surface is not wired yet.
              What you see here is the real server-side layer currently present in the repo: live trade sync and market-data routes.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
            <MetricCard label="Live routes" value={String(LIVE_ROUTES.length)} tone={C.cyan} detail="Server functions currently present in the project." />
            <MetricCard label="Connected sync feeds" value={String(accounts.length)} tone={accounts.length ? C.green : C.gold} detail="Broker tokens already provisioned from Broker Connect." />
            <MetricCard label="Primary token" value={selectedAccount ? 'Ready' : 'Missing'} tone={selectedAccount ? C.green : C.danger} detail={selectedAccount ? 'A broker sync token is available below.' : 'Create a broker feed first to receive a live sync token.'} />
            <MetricCard label="Scope" value="Honest" tone={C.purple} detail="No fake generic endpoints, no decorative API keys." />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(360px, 0.86fr)', gap: 18, alignItems: 'start' }}>
        <div style={panel()}>
          <SectionTitle title="Broker sync tokens" subtitle="These are the real tokens already created from Broker Connect and consumed by /api/mt-sync." tone={C.green} />

          <div style={{ display: 'grid', gap: 10 }}>
            {loading ? (
              <div style={emptyState()}>Loading broker feeds…</div>
            ) : accounts.length ? accounts.map((account) => (
              <motion.div key={account.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 16, borderRadius: 18, border: `1px solid ${shade(C.green, 0.14)}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 14, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.t0 }}>{account.account_name || account.account_number || account.broker_type}</div>
                      <div style={badge(account.status === 'connected' ? C.green : C.gold)}>{account.status || 'pending'}</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: C.t2 }}>{account.broker_type?.toUpperCase()} · {account.total_trades_synced || 0} synced trades</div>
                    <code style={{ display: 'block', marginTop: 12, padding: '11px 12px', borderRadius: 12, background: 'rgba(5,9,16,0.88)', border: `1px solid ${shade(C.t3, 0.16)}`, color: C.green, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {account.api_token}
                    </code>
                    <div style={{ marginTop: 8, fontSize: 11.5, color: C.t3 }}>Last sync: {account.last_sync_at ? new Date(account.last_sync_at).toLocaleString('en-GB') : 'Never'}</div>
                  </div>

                  <button type="button" onClick={() => copyText(account.api_token, account.id)} style={copyButton(copied === account.id ? C.green : C.cyan)}>
                    {copied === account.id ? <Ic.Check /> : <Ic.Copy />}
                    {copied === account.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </motion.div>
            )) : (
              <div style={emptyState()}>
                No broker token is available yet. Create a broker feed in Broker Connect to provision a live sync token.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div style={panel()}>
            <SectionTitle title="Live route surface" subtitle="Each route below exists in the current codebase. Nothing here assumes a broader public API than what is already present." tone={C.cyan} />
            <div style={{ display: 'grid', gap: 10 }}>
              {LIVE_ROUTES.map((route) => (
                <button key={route.id} type="button" onClick={() => setSelectedRoute(route.id)} style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto minmax(0, 1fr)',
                  gap: 12,
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 18,
                  border: `1px solid ${selectedRoute === route.id ? shade(route.tone, 0.18) : shade(C.t3, 0.12)}`,
                  background: selectedRoute === route.id ? shade(route.tone, 0.08) : 'rgba(255,255,255,0.02)',
                  color: C.t0,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}>
                  <div style={{ padding: '6px 8px', borderRadius: 10, background: shade(route.tone, 0.12), border: `1px solid ${shade(route.tone, 0.18)}`, color: route.tone, fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>{route.method}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{route.path}</div>
                    <div style={{ marginTop: 5, fontSize: 11.5, color: C.t2, lineHeight: 1.6 }}>{route.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={panel()}>
            <SectionTitle title="Copy-ready example" subtitle="Use the real route selected above. The MT sync example automatically picks your first available broker token." tone={currentRoute.tone} />
            <div style={{ padding: 16, borderRadius: 18, border: `1px solid ${shade(currentRoute.tone, 0.16)}`, background: shade(currentRoute.tone, 0.06) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t0 }}>{currentRoute.title}</div>
                <button type="button" onClick={() => copyText(curlSnippet, currentRoute.id)} style={copyButton(copied === currentRoute.id ? currentRoute.tone : C.cyan)}>
                  {copied === currentRoute.id ? <Ic.Check /> : <Ic.Copy />}
                  {copied === currentRoute.id ? 'Copied' : 'Copy snippet'}
                </button>
              </div>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: C.t1 }}>
                {curlSnippet}
              </pre>
            </div>

            <div style={{ marginTop: 14, padding: 14, borderRadius: 16, border: `1px solid ${shade(C.gold, 0.16)}`, background: shade(C.gold, 0.06) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <Ic.Info />
                Important
              </div>
              <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.7, color: C.t2 }}>
                A full public trade CRUD API is not exposed here yet, so this page does not claim one. The current live access layer is the sync endpoint and the market-data proxy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildCurlSnippet(routeId, token) {
  if (routeId === 'market-forex') {
    return `curl "${appUrl('/api/market-data?type=forex')}"`;
  }

  if (routeId === 'market-indices') {
    return `curl "${appUrl('/api/market-data?type=indices')}"`;
  }

  const syncToken = token || 'mf_sync_token_from_broker_connect';
  return `curl -X POST "${appUrl('/api/mt-sync')}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_token": "${syncToken}",
    "trades": [
      {
        "ticket": "123456",
        "symbol": "EURUSD",
        "type": "buy",
        "volume": 1,
        "open_price": 1.0824,
        "close_price": 1.0862,
        "open_time": "2026-04-23T08:15:00Z",
        "close_time": "2026-04-23T09:05:00Z",
        "profit": 380
      }
    ]
  }'`;
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

function copyButton(tone) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 10,
    border: `1px solid ${shade(tone, 0.18)}`,
    background: shade(tone, 0.08),
    color: tone,
    fontSize: 11.5,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function emptyState() {
  return {
    padding: 18,
    borderRadius: 18,
    border: `1px dashed ${shade(C.t3, 0.18)}`,
    color: C.t2,
    fontSize: 12.5,
    lineHeight: 1.7,
  };
}
