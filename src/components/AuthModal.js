import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW AUTH — Clean v3
   ═══════════════════════════════════════════════════════════════ */

function AuthBg() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    function resize() {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    function init() {
      resize();
      particles.length = 0;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      for (let i = 0; i < 30; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2, r: Math.random() * 1.2 + 0.4, o: Math.random() * 0.15 + 0.03 });
    }
    function draw() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,230,255,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 100) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(6,230,255,${0.03 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      animId = requestAnimationFrame(draw);
    }
    init(); draw();
    const onR = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); init(); };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const SL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const SC = ['', '#FF3D57', '#FF9500', '#FFD700', '#00FF88'];

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
);

const EyeOpen = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></svg>;
const EyeClosed = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14L14 2"/><path d="M4.5 4.5C3 5.5 1 8 1 8s2.5 5 7 5c1.2 0 2.3-.3 3.3-.8"/><path d="M11.5 11.5c1.5-1 3.5-3.5 3.5-3.5s-2.5-5-7-5c-.5 0-1 .05-1.5.15"/></svg>;

function Input({ label, type = 'text', value, onChange, error, placeholder, autoComplete, autoFocus, icon, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', marginBottom: error ? 4 : 14 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: error ? '#FF6B6B' : focused ? '#06E6FF' : 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, transition: 'color 0.2s' }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete} autoFocus={autoFocus}
        style={{
          width: '100%', padding: '12px 14px',
          background: error ? 'rgba(255,61,87,0.04)' : focused ? 'rgba(6,230,255,0.04)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${error ? 'rgba(255,61,87,0.3)' : focused ? 'rgba(6,230,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 10, fontSize: 13.5, color: '#fff',
          outline: 'none', transition: 'all 0.2s ease',
          fontFamily: "'Inter',sans-serif", boxSizing: 'border-box',
          paddingRight: icon ? 42 : 14,
        }}
        {...rest}
      />
      {icon && (
        <div style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'rgba(255,255,255,0.25)', cursor: 'pointer', zIndex: 2,
          display: 'flex', alignItems: 'center',
        }} onClick={icon.onClick}>{icon.el}</div>
      )}
      {error && <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4, marginLeft: 2 }}>{error}</div>}
    </div>
  );
}

export default function AuthModal({ onClose, onSuccess, defaultTab = 'login' }) {
  const { login, signup, loginWithGoogle, resetPassword, authLoading, error, clearError } = useAuth();

  const [tab, setTab] = useState(defaultTab);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { clearError(); setFieldErrors({}); setSuccess(false); }, [tab]); // eslint-disable-line
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); if (fieldErrors[f]) setFieldErrors(p => ({ ...p, [f]: null })); clearError(); };
  const validateLogin = () => { const e = {}; if (!form.email) e.email = 'Email required'; if (!form.password) e.password = 'Password required'; setFieldErrors(e); return !Object.keys(e).length; };
  const validateSignup = () => { const e = {}; if (!form.firstName.trim()) e.firstName = 'Required'; if (!form.lastName.trim()) e.lastName = 'Required'; if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'; if (!form.password || form.password.length < 8) e.password = '8 characters minimum'; if (form.confirm !== form.password) e.confirm = 'Passwords do not match'; setFieldErrors(e); return !Object.keys(e).length; };

  const handleLogin = async (e) => { e.preventDefault(); if (!validateLogin()) return; const ok = await login({ email: form.email, password: form.password }); if (ok) { setSuccess(true); setTimeout(() => onSuccess({ email: form.email }, false), 900); } };
  const handleForgot = async (e) => { e.preventDefault(); if (!forgotEmail) return; const ok = await resetPassword(forgotEmail); if (ok) setForgotSent(true); };
  const handleSignup = async (e) => { e.preventDefault(); if (!validateSignup()) return; const r = await signup({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }); if (r?.success) { setSuccess(true); if (!r.needsConfirmation) setTimeout(() => onSuccess({ email: form.email }, true), 900); } };

  const strength = getStrength(form.password);

  return (
    <>
      <style>{`.auth-link { color: rgba(6,230,255,0.45); text-decoration: none; transition: color 0.15s; } .auth-link:hover { color: #06E6FF; }`}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(24px) saturate(150%)' }} onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', width: '100%', maxWidth: 400, overflow: 'hidden', borderRadius: 20, background: 'linear-gradient(160deg, #0C1524 0%, #070D1A 100%)', border: '1px solid rgba(6,230,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(6,230,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <AuthBg />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.4), rgba(0,255,136,0.3), transparent)', zIndex: 10 }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s', zIndex: 10 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}>✕</button>

          <div style={{ position: 'relative', zIndex: 1, padding: '28px 26px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, overflow: 'hidden', border: '1px solid rgba(6,230,255,0.15)' }}>
                <img src="/logo192.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
              </div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.4px' }}>Market<span style={{ color: '#06E6FF' }}>Flow</span></div>
            </div>

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }} style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(6,230,255,0.12), rgba(0,255,136,0.08))', border: '1px solid rgba(0,255,136,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24, color: '#00FF88' }}>✓</motion.div>
                  <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{tab === 'login' ? 'Welcome back!' : 'Welcome to MarketFlow!'}</h3>
                  <p style={{ fontSize: 13, color: 'rgba(139,163,204,0.9)' }}>{tab === 'login' ? 'Signed in successfully. Redirecting...' : 'Check your email to confirm your account, then sign in!'}</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div style={{ display: 'flex', gap: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 3, marginBottom: 18, border: '1px solid rgba(255,255,255,0.05)' }}>
                    {['login', 'signup'].map(t => (
                      <button key={t} onClick={() => { setTab(t); setForgotMode(false); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: tab === t ? 'linear-gradient(135deg, rgba(6,230,255,0.12), rgba(0,255,136,0.06))' : 'transparent', color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)', border: tab === t ? '1px solid rgba(6,230,255,0.15)' : '1px solid transparent' }}>
                        {t === 'login' ? 'Sign In' : 'Create Account'}
                      </button>
                    ))}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 4, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                      {forgotMode ? 'Reset your password' : tab === 'login' ? 'Welcome back' : 'Create your account'}
                    </h2>
                    <p style={{ fontSize: 12.5, color: 'rgba(139,163,204,0.85)' }}>
                      {forgotMode ? "We'll send you a reset link by email." : tab === 'login' ? 'Sign in to access your trading journal.' : 'Start your 14-day free trial. No credit card required.'}
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 12, background: 'rgba(255,61,87,0.06)', border: '1px solid rgba(255,61,87,0.15)', borderRadius: 8, fontSize: 12, color: '#FF7088' }}>
                        <span style={{ fontSize: 13 }}>⚠</span> {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {forgotMode ? (
                    <form onSubmit={handleForgot} noValidate>
                      {forgotSent ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(6,230,255,0.1)', border: '1px solid rgba(6,230,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20 }}>📧</div>
                          <h3 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Email sent!</h3>
                          <p style={{ fontSize: 12, color: 'rgba(139,163,204,0.9)', marginBottom: 14 }}>Check your inbox to reset your password.</p>
                          <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); }} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #06E6FF, #00FF88)', border: 'none', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: '#030508', cursor: 'pointer' }}>Back to Sign In</button>
                        </div>
                      ) : (
                        <>
                          <Input label="Email" type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="trader@example.com" autoFocus />
                          <button type="submit" disabled={authLoading} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #06E6FF, #00FF88)', border: 'none', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: '#030508', cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.6 : 1, marginTop: 4 }}>
                            {authLoading ? 'Sending...' : 'Send reset link →'}
                          </button>
                          <a href="#back" onClick={e => { e.preventDefault(); setForgotMode(false); }} style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 11.5, color: 'rgba(6,230,255,0.6)', textDecoration: 'none' }}>← Back to sign in</a>
                        </>
                      )}
                    </form>
                  ) : tab === 'login' ? (
                    <form onSubmit={handleLogin} noValidate>
                      <button type="button" onClick={loginWithGoogle} style={{ width: '100%', padding: '10px 0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', transition: 'all 0.18s', fontFamily: "'Inter',sans-serif", marginBottom: 14 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                        <GoogleIcon /> Continue with Google
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>or email</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      </div>

                      <Input label="Email" type="email" value={form.email} onChange={set('email')} error={fieldErrors.email} placeholder="trader@example.com" autoComplete="email" autoFocus />
                      <Input label="Password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} error={fieldErrors.password} placeholder="••••••••" autoComplete="current-password" icon={{ el: showPw ? <EyeOpen /> : <EyeClosed />, onClick: () => setShowPw(v => !v) }} />

                      <a href="#forgot" onClick={e => { e.preventDefault(); setForgotMode(true); }} style={{ display: 'block', textAlign: 'right', marginTop: -6, marginBottom: 12, fontSize: 11.5, color: 'rgba(6,230,255,0.55)', textDecoration: 'none' }}>Forgot password?</a>

                      <button type="submit" disabled={authLoading} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #06E6FF, #00FF88)', border: 'none', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: '#030508', cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.6 : 1, transition: 'all 0.22s', boxShadow: '0 0 20px rgba(6,230,255,0.2)' }} onMouseEnter={e => { if (!authLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(6,230,255,0.35)'; } }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 20px rgba(6,230,255,0.2)'; }}>
                        {authLoading ? 'Signing in...' : 'Sign in →'}
                      </button>

                      <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                        By continuing, you agree to our <a href="#terms" className="auth-link">Terms</a> and <a href="#privacy" className="auth-link">Privacy Policy</a>.
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} noValidate>
                      <button type="button" onClick={loginWithGoogle} style={{ width: '100%', padding: '10px 0', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', transition: 'all 0.18s', fontFamily: "'Inter',sans-serif", marginBottom: 14 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                        <GoogleIcon /> Continue with Google
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 600 }}>or email</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Input label="First Name" value={form.firstName} onChange={set('firstName')} error={fieldErrors.firstName} placeholder="John" autoComplete="given-name" autoFocus />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Input label="Last Name" value={form.lastName} onChange={set('lastName')} error={fieldErrors.lastName} placeholder="Doe" autoComplete="family-name" />
                        </div>
                      </div>

                      <Input label="Email" type="email" value={form.email} onChange={set('email')} error={fieldErrors.email} placeholder="trader@example.com" autoComplete="email" />
                      <Input label="Password" type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} error={fieldErrors.password} placeholder="••••••••" autoComplete="new-password" icon={{ el: showPw ? <EyeOpen /> : <EyeClosed />, onClick: () => setShowPw(v => !v) }} />

                      {form.password && (
                        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {[1, 2, 3, 4].map(n => (
                            <div key={n} style={{ flex: 1, height: 3, borderRadius: 2, background: strength >= n ? SC[strength] : 'rgba(255,255,255,0.06)', transition: 'background 0.3s' }} />
                          ))}
                          <span style={{ fontSize: 8.5, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: SC[strength], minWidth: 32, textAlign: 'right' }}>{SL[strength]}</span>
                        </div>
                      )}

                      <Input label="Confirm Password" type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} error={fieldErrors.confirm} placeholder="••••••••" autoComplete="new-password" icon={{ el: showConfirm ? <EyeOpen /> : <EyeClosed />, onClick: () => setShowConfirm(v => !v) }} />

                      <button type="submit" disabled={authLoading} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #06E6FF, #00FF88)', border: 'none', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontSize: 13, fontWeight: 700, color: '#030508', cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.6 : 1, transition: 'all 0.22s', boxShadow: '0 0 20px rgba(6,230,255,0.2)', marginTop: 4 }} onMouseEnter={e => { if (!authLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(6,230,255,0.35)'; } }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 20px rgba(6,230,255,0.2)'; }}>
                        {authLoading ? 'Creating account...' : 'Create my free account →'}
                      </button>

                      <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                        By creating an account, you agree to our <a href="#terms" className="auth-link">Terms</a> and <a href="#privacy" className="auth-link">Privacy Policy</a>. No credit card required.
                      </p>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
