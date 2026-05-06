// src/pages/AuthCallback.js
// Handles redirects from Supabase emails
// (account confirmation, password reset)

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { appUrl } from '../lib/appUrls';

const C = {
  bg:   '#01040A',
  cyan: '#14C9E5',
  green:'#00D2B8',
  t0:   '#FFFFFF',
  t2:   '#7A90B8',
  red:  '#FF4D6A',
};

const PENDING_SIGNUP_EMAIL_KEY = 'mfj_pending_new_account_email';
const PENDING_SIGNUP_AT_KEY = 'mfj_pending_new_account_at';

function markPendingOnboarding(email = '') {
  try {
    sessionStorage.setItem('mfj_new_signup', '1');
    localStorage.setItem(PENDING_SIGNUP_AT_KEY, String(Date.now()));
    if (email) localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, String(email).trim().toLowerCase());
  } catch (_) {}
}

async function markOnboardingIfNewAccount() {
  try {
    const { data } = await supabase.auth.getUser();
    const createdAt = data?.user?.created_at ? new Date(data.user.created_at).getTime() : 0;
    if (createdAt && Date.now() - createdAt < 60000) {
      markPendingOnboarding();
    }
  } catch (_) {}
}

function redirectToApp(path = '/') {
  window.location.replace(appUrl(path));
}

function clearEmptyHash() {
  if (window.location.hash === '#') {
    window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
  }
}

function withTimeout(promise, ms = 600) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      window.setTimeout(() => resolve({ data: { session: null }, timeout: true }), ms);
    }),
  ]);
}

function parseCallbackHash() {
  const rawHash = window.location.hash || '';
  if (!rawHash || rawHash === '#') return new URLSearchParams();
  return new URLSearchParams(rawHash.replace(/^#/, '?'));
}

function isRecoverableCallbackError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('expired') || message.includes('invalid') || message.includes('already');
}

async function waitForSession() {
  const sessionResult = await withTimeout(supabase.auth.getSession(), 600);
  return sessionResult?.data?.session || null;
}

async function redirectWithCurrentSession({ isSignupFlow, callbackEmail, onRedirect = redirectToApp }) {
  const session = await waitForSession();
  if (session?.user) {
    if (isSignupFlow) markPendingOnboarding(session.user.email || callbackEmail);
    else await markOnboardingIfNewAccount();
  }
  onRedirect('/');
}

export default function AuthCallback() {
  const [status, setStatus] = useState('loading'); // loading | success | error | reset
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    let redirected = false;
    let watchdog = null;

    const safeRedirect = (path = '/') => {
      if (redirected) return;
      redirected = true;
      if (watchdog) window.clearTimeout(watchdog);
      window.location.replace(appUrl(path));
    };

    watchdog = window.setTimeout(() => {
      safeRedirect('/');
    }, 2800);

    const handle = async () => {
      try {
        clearEmptyHash();
        const params  = new URLSearchParams(window.location.search);
        const hash    = parseCallbackHash();

        const token_hash = params.get('token_hash') || hash.get('token_hash');
        const type       = params.get('type')       || hash.get('type');
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        const code = params.get('code');
        const flow = String(params.get('flow') || hash.get('flow') || '').toLowerCase();
        const callbackEmail = params.get('email') || hash.get('email') || '';
        const isSignupFlow = flow === 'signup';
        const hasCallbackPayload = Boolean(token_hash || accessToken || refreshToken || code || type || params.get('error') || hash.get('error'));

        if (!hasCallbackPayload || params.get('error') || hash.get('error')) {
          safeRedirect('/');
          return;
        }

        if (code) {
          const result = await withTimeout(supabase.auth.exchangeCodeForSession(code), 1800);
          if (result?.timeout || (result?.error && !isRecoverableCallbackError(result.error))) {
            safeRedirect('/');
            return;
          }
          if (isSignupFlow) markPendingOnboarding(callbackEmail);
          else await markOnboardingIfNewAccount();
          safeRedirect('/');
          return;
        }

        // ── Case 1: token_hash (new Supabase flow) ────────────────────
        if (token_hash && type) {
          const { error, timeout } = await withTimeout(supabase.auth.verifyOtp({
            token_hash,
            type: type === 'recovery' ? 'recovery' : type,
          }), 1800);

          if (timeout) {
            safeRedirect('/');
            return;
          }

          if (error) {
            console.error('OTP error:', error);
            if (isRecoverableCallbackError(error)) {
              await redirectWithCurrentSession({ isSignupFlow: true, callbackEmail, onRedirect: safeRedirect });
            } else {
              safeRedirect('/');
            }
            return;
          }

          if (type === 'recovery') {
            if (watchdog) window.clearTimeout(watchdog);
            setStatus('reset'); // Show reset form
          } else {
            markPendingOnboarding(callbackEmail);
            setStatus('success'); // Email confirmation OK
            safeRedirect('/');
          }
          return;
        }

        // ── Case 2: access_token in hash (old flow) ───────────────
        if (accessToken && refreshToken) {
          const { error, timeout } = await withTimeout(supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }), 1800);
          if (timeout || error) { safeRedirect('/'); return; }

          const hashType = hash.get('type');
          if (hashType === 'recovery') {
            if (watchdog) window.clearTimeout(watchdog);
            setStatus('reset');
          } else {
            if (isSignupFlow) markPendingOnboarding(callbackEmail);
            else await markOnboardingIfNewAccount();
            setStatus('success');
            safeRedirect('/');
          }
          return;
        }

        // No token found
        const session = await waitForSession();
        if (session?.user) {
          if (isSignupFlow) markPendingOnboarding(session.user.email || callbackEmail);
          else await markOnboardingIfNewAccount();
          setStatus('success');
          safeRedirect('/');
          return;
        }

        safeRedirect('/');
      } catch (err) {
        console.error('AuthCallback error:', err);
        safeRedirect('/');
      }
    };

    handle();

    return () => {
      if (watchdog) window.clearTimeout(watchdog);
    };
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
      redirectToApp('/dashboard');
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
            <div style={s.title}>Opening workspace…</div>
            <div style={s.subtitle}>Securing your session.</div>
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
            <button style={s.btn} onClick={() => { window.location.href = appUrl('/dashboard'); }}>
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
            <button style={s.btn} onClick={() => { window.location.href = appUrl('/dashboard'); }}>
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
