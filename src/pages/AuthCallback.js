// src/pages/AuthCallback.js
// Handles redirects from Supabase emails
// (account confirmation, password reset)

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const C = {
  bg:   '#01040A',
  cyan: '#14C9E5',
  green:'#00D2B8',
  t0:   '#FFFFFF',
  t2:   '#7A90B8',
  red:  '#FF4D6A',
};

export default function AuthCallback() {
  const [status, setStatus] = useState('loading'); // loading | success | error | reset
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    const handle = async () => {
      try {
        const params  = new URLSearchParams(window.location.search);
        const hash    = new URLSearchParams(window.location.hash.replace('#', '?'));

        const token_hash = params.get('token_hash') || hash.get('token_hash');
        const type       = params.get('type')       || hash.get('type');
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');

        // ── Case 1: token_hash (new Supabase flow) ────────────────────
        if (token_hash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type === 'recovery' ? 'recovery' : 'email',
          });

          if (error) {
            console.error('OTP error:', error);
            setStatus('error');
            return;
          }

          if (type === 'recovery') {
            setStatus('reset'); // Show reset form
          } else {
            setStatus('success'); // Email confirmation OK
            setTimeout(() => { window.location.href = '/'; }, 2500);
          }
          return;
        }

        // ── Case 2: access_token in hash (old flow) ───────────────
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) { setStatus('error'); return; }

          const hashType = hash.get('type');
          if (hashType === 'recovery') {
            setStatus('reset');
          } else {
            setStatus('success');
            setTimeout(() => { window.location.href = '/'; }, 2500);
          }
          return;
        }

        // No token found
        setStatus('error');
      } catch (err) {
        console.error('AuthCallback error:', err);
        setStatus('error');
      }
    };

    handle();
  }, []);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);

    if (error) {
      setError(error.message);
    } else {
      setStatus('success');
      setTimeout(() => { window.location.href = '/'; }, 2500);
    }
  };

  const s = {
    root: {
      minHeight: '100vh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
    },
    card: {
      background: '#060D18',
      border: '1px solid #142033',
      borderRadius: '20px',
      padding: '48px 40px',
      maxWidth: '420px',
      width: '100%',
      textAlign: 'center',
    },
    icon: {
      fontSize: '48px',
      marginBottom: '20px',
      display: 'block',
    },
    title: {
      fontSize: '24px',
      fontWeight: '800',
      color: C.t0,
      margin: '0 0 10px',
    },
    subtitle: {
      fontSize: '14px',
      color: C.t2,
      margin: '0 0 32px',
      lineHeight: '1.6',
    },
    btn: {
      width: '100%',
      padding: '14px',
      borderRadius: '12px',
      background: `linear-gradient(135deg, ${C.cyan}, #00D2B8)`,
      color: '#000',
      fontWeight: '700',
      fontSize: '14px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid #142033',
      borderRadius: '10px',
      color: C.t0,
      fontSize: '14px',
      outline: 'none',
      boxSizing: 'border-box',
      marginBottom: '12px',
      fontFamily: "'Inter', sans-serif",
    },
    error: {
      color: C.red,
      fontSize: '13px',
      marginBottom: '12px',
      textAlign: 'left',
    },
    spinner: {
      width: '40px', height: '40px',
      border: `3px solid rgba(6,230,255,0.2)`,
      borderTop: `3px solid ${C.cyan}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      margin: '0 auto 20px',
    },
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={s.card}>
        {/* ── Loading ── */}
        {status === 'loading' && (
          <>
            <div style={s.spinner} />
            <div style={s.title}>Verifying…</div>
            <div style={s.subtitle}>Please wait a few seconds.</div>
          </>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <>
            <span style={s.icon}>✅</span>
            <div style={s.title}>Confirmed!</div>
            <div style={s.subtitle}>
              Your account is activated. You will be redirected to MarketFlow Journal…
            </div>
            <button style={s.btn} onClick={() => window.location.href = '/'}>
              Go to the app →
            </button>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <>
            <span style={s.icon}>❌</span>
            <div style={s.title}>Invalid link</div>
            <div style={s.subtitle}>
              This link has expired or is invalid. Try logging in again or requesting a new email.
            </div>
            <button style={s.btn} onClick={() => window.location.href = '/'}>
              Back to home
            </button>
          </>
        )}

        {/* ── Reset password ── */}
        {status === 'reset' && (
          <>
            <span style={s.icon}>🔐</span>
            <div style={s.title}>New password</div>
            <div style={s.subtitle}>Choose a secure password for your account.</div>
            <form onSubmit={handleResetPassword} style={{ textAlign: 'left' }}>
              <input
                style={s.input}
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                style={s.input}
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <div style={s.error}>⚠️ {error}</div>}
              <button style={s.btn} type="submit" disabled={saving}>
                {saving ? '⏳ Saving…' : 'Save password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
