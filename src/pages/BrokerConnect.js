import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const BROKER_TYPES = [
  { value: 'mt4', label: 'MetaTrader 4' },
  { value: 'mt5', label: 'MetaTrader 5' },
];

function generateToken() {
  const arr = new Uint8Array(32);
  window.crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function BrokerConnect() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    broker_type: 'mt4',
    account_number: '',
    account_name: '',
    server_name: '',
  });

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
    if (!form.account_number.trim()) {
      toast.error('Account number required');
      return;
    }
    const token = generateToken();
    const { data, error } = await supabase
      .from('broker_accounts')
      .insert({
        user_id: user.id,
        broker_type: form.broker_type,
        account_number: form.account_number.trim(),
        account_name: form.account_name.trim(),
        server_name: form.server_name.trim(),
        api_token: token,
        status: 'disconnected',
      })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account added successfully');
      setForm({ broker_type: 'mt4', account_number: '', account_name: '', server_name: '' });
      setShowForm(false);
      fetchAccounts();
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    const { error } = await supabase.from('broker_accounts').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account deleted');
      fetchAccounts();
    }
    setDeletingId(null);
  }

  function copyToken(token) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success('Token copied');
  }

  return (
    <div style={{ padding: '32px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Broker Connect</h1>
          <p style={{ fontSize: 14, color: '#7A90B8', margin: '6px 0 0' }}>Connect your MetaTrader accounts to automatically sync your trades</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #06E6FF, #00FF88)',
            color: '#030508',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{
          background: '#0C1422',
          border: '1px solid #162034',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#7A90B8', marginBottom: 6 }}>Broker Type</label>
              <select
                value={form.broker_type}
                onChange={e => setForm(f => ({ ...f, broker_type: e.target.value }))}
                style={{
                  width: '100%', padding: '10px 12px', background: '#060D1A', color: '#fff',
                  border: '1px solid #162034', borderRadius: 8, fontSize: 13, outline: 'none',
                }}
              >
                {BROKER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#7A90B8', marginBottom: 6 }}>Account Number</label>
              <input
                value={form.account_number}
                onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                placeholder="e.g. 50123456"
                style={{
                  width: '100%', padding: '10px 12px', background: '#060D1A', color: '#fff',
                  border: '1px solid #162034', borderRadius: 8, fontSize: 13, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#7A90B8', marginBottom: 6 }}>Account Name (optional)</label>
              <input
                value={form.account_name}
                onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
                placeholder="e.g. FTMO Challenge"
                style={{
                  width: '100%', padding: '10px 12px', background: '#060D1A', color: '#fff',
                  border: '1px solid #162034', borderRadius: 8, fontSize: 13, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#7A90B8', marginBottom: 6 }}>Server (optional)</label>
              <input
                value={form.server_name}
                onChange={e => setForm(f => ({ ...f, server_name: e.target.value }))}
                placeholder="e.g. ICMarkets-Demo"
                style={{
                  width: '100%', padding: '10px 12px', background: '#060D1A', color: '#fff',
                  border: '1px solid #162034', borderRadius: 8, fontSize: 13, outline: 'none',
                }}
              />
            </div>
          </div>
          <button type="submit" style={{
            padding: '10px 24px',
            background: 'linear-gradient(135deg, #06E6FF, #00FF88)',
            color: '#030508',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}>
            Generate Token
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#7A90B8' }}>Loading...</div>
      ) : accounts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, background: '#0C1422',
          border: '1px solid #162034', borderRadius: 12,
        }}>
          <p style={{ color: '#7A90B8', fontSize: 14 }}>No connected accounts</p>
          <p style={{ color: '#334566', fontSize: 13 }}>Click "Add Account" to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{
              background: '#0C1422',
              border: '1px solid #162034',
              borderRadius: 12,
              padding: 20,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      padding: '3px 8px', background: acc.broker_type === 'mt4' ? 'rgba(6,230,255,0.1)' : 'rgba(0,255,136,0.1)',
                      color: acc.broker_type === 'mt4' ? '#06E6FF' : '#00FF88',
                      borderRadius: 4, fontSize: 11, fontWeight: 600,
                    }}>
                      {acc.broker_type === 'mt4' ? 'MT4' : 'MT5'}
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                      {acc.account_name || acc.account_number}
                    </span>
                    <span style={{
                      padding: '3px 8px',
                      background: acc.status === 'connected' ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                      color: acc.status === 'connected' ? '#00FF88' : '#7A90B8',
                      borderRadius: 4, fontSize: 11, fontWeight: 500,
                    }}>
                      {acc.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {acc.server_name && (
                    <p style={{ color: '#334566', fontSize: 12, margin: '0 0 12px' }}>Server: {acc.server_name}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{
                      background: '#060D1A', padding: '6px 10px', borderRadius: 6,
                      fontSize: 12, color: '#06E6FF', fontFamily: 'monospace',
                    }}>
                      {acc.api_token}
                    </code>
                    <button
                      onClick={() => copyToken(acc.api_token)}
                      style={{
                        padding: '6px 12px', background: 'rgba(6,230,255,0.08)', color: '#06E6FF',
                        border: '1px solid rgba(6,230,255,0.15)', borderRadius: 6,
                        fontSize: 11, cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {copiedToken === acc.api_token ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  disabled={deletingId === acc.id}
                  style={{
                    padding: '6px 12px', background: 'rgba(255,70,70,0.06)', color: '#FF6B6B',
                    border: '1px solid rgba(255,70,70,0.1)', borderRadius: 6,
                    fontSize: 11, cursor: 'pointer', fontWeight: 500,
                  }}
                >
                  {deletingId === acc.id ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
