// src/pages/AuthCallback.js
// Gère les redirections depuis les emails Supabase
// (confirmation compte, reset password)

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const C = {
  bg:   '#030508',
  cyan: '#06E6FF',
  green:'#00FF88',
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

        // ── Cas 1 : token_hash (nouveau flow Supabase) ────────────────────
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
            setStatus('reset'); // Afficher le formulaire de reset
          } else {
            setStatus('success'); // Confirmation email OK
            setTimeout(() => { window.location.href = '/'; }, 2500);
          }
          return;
        }

        // ── Cas 2 : access_token dans le hash (ancien flow) ───────────────
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

        // Aucun token trouvé
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
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
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
      background: '#0C1422',
      border: '1px solid #162034',
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
      background: `linear-gradient(135deg, ${C.cyan}, #00F5D4)`,
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
      border: '1px solid #162034',
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
        {/* ── Chargement ── */}
        {status === 'loading' && (
          <>
            <div style={s.spinner} />
            <div style={s.title}>Vérification en cours…</div>
            <div style={s.subtitle}>Merci de patienter quelques secondes.</div>
          </>
        )}

        {/* ── Succès ── */}
        {status === 'success' && (
          <>
            <span style={s.icon}>✅</span>
            <div style={s.title}>C'est confirmé !</div>
            <div style={s.subtitle}>
              Ton compte est activé. Tu vas être redirigé vers MarketFlow Journal…
            </div>
            <button style={s.btn} onClick={() => window.location.href = '/'}>
              Accéder à l'app →
            </button>
          </>
        )}

        {/* ── Erreur ── */}
        {status === 'error' && (
          <>
            <span style={s.icon}>❌</span>
            <div style={s.title}>Lien invalide</div>
            <div style={s.subtitle}>
              Ce lien a expiré ou est invalide. Essaie de te reconnecter ou de redemander un email.
            </div>
            <button style={s.btn} onClick={() => window.location.href = '/'}>
              Retour à l'accueil
            </button>
          </>
        )}

        {/* ── Reset password ── */}
        {status === 'reset' && (
          <>
            <span style={s.icon}>🔐</span>
            <div style={s.title}>Nouveau mot de passe</div>
            <div style={s.subtitle}>Choisis un mot de passe sécurisé pour ton compte.</div>
            <form onSubmit={handleResetPassword} style={{ textAlign: 'left' }}>
              <input
                style={s.input}
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                style={s.input}
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <div style={s.error}>⚠️ {error}</div>}
              <button style={s.btn} type="submit" disabled={saving}>
                {saving ? '⏳ Enregistrement…' : 'Enregistrer le mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}