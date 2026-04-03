import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  .auth-overlay {
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(2,4,10,0.9);
    backdrop-filter:blur(20px) saturate(150%);
    animation:auth-fade-in 0.2s ease;
    padding:12px;
  }
  @keyframes auth-fade-in { from{opacity:0} to{opacity:1} }

  .auth-modal {
    position:relative;width:100%;max-width:420px;
    background:linear-gradient(160deg,#0C1524 0%,#070D1A 100%);
    border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;
    box-shadow:0 32px 80px rgba(0,0,0,0.75),0 0 0 1px rgba(6,230,255,0.07);
    animation:auth-slide-up 0.26s cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes auth-slide-up { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  .auth-modal::before {
    content:'';position:absolute;top:-60px;left:50%;transform:translateX(-50%);
    width:280px;height:120px;
    background:radial-gradient(ellipse,rgba(6,230,255,0.14) 0%,transparent 70%);
    pointer-events:none;z-index:0;
  }
  .auth-modal-inner { position:relative;z-index:1;padding:28px 28px 24px; }
  .auth-close {
    position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;
    border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);
    color:rgba(255,255,255,0.4);cursor:pointer;font-size:14px;
    display:flex;align-items:center;justify-content:center;
    transition:all 0.18s;z-index:10;
  }
  .auth-close:hover{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.2);}
  .auth-logo { display:flex;align-items:center;gap:10px;margin-bottom:22px; }
  .auth-logo-text { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:18px;color:#fff;letter-spacing:-0.4px; }
  .auth-logo-text span { color:#06E6FF; }
  .auth-tabs {
    display:flex;gap:0;background:rgba(255,255,255,0.04);border-radius:11px;
    padding:3px;margin-bottom:22px;border:1px solid rgba(255,255,255,0.06);
  }
  .auth-tab {
    flex:1;padding:9px;border-radius:9px;border:none;cursor:pointer;
    font-family:'Inter',sans-serif;font-size:13px;font-weight:600;
    transition:all 0.2s;background:transparent;color:rgba(255,255,255,0.38);
  }
  .auth-tab.active {
    background:linear-gradient(135deg,rgba(6,230,255,0.14),rgba(0,255,136,0.07));
    color:#fff;border:1px solid rgba(6,230,255,0.2);box-shadow:0 2px 10px rgba(6,230,255,0.08);
  }
  .auth-title { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:22px;color:#fff;margin-bottom:4px;letter-spacing:-0.6px;line-height:1.2; }
  .auth-title em { font-style:normal;color:#06E6FF; }
  .auth-subtitle { font-family:'Inter',sans-serif;font-size:13px;color:rgba(139,163,204,0.85);margin-bottom:20px; }
  .auth-row { display:flex;gap:10px; }
  .auth-field { display:flex;flex-direction:column;gap:5px;margin-bottom:12px;flex:1; }
  .auth-label { font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.45);letter-spacing:0.5px;text-transform:uppercase; }
  .auth-input-wrap { position:relative; }
  .auth-input {
    width:100%;padding:11px 14px;background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.08);border-radius:10px;
    font-family:'Inter',sans-serif;font-size:13.5px;color:#fff;
    outline:none;transition:all 0.18s;-webkit-appearance:none;box-sizing:border-box;
  }
  .auth-input::placeholder{color:rgba(255,255,255,0.2);}
  .auth-input:focus{border-color:rgba(6,230,255,0.4);background:rgba(6,230,255,0.04);box-shadow:0 0 0 3px rgba(6,230,255,0.07);}
  .auth-input.error{border-color:rgba(255,61,87,0.45);background:rgba(255,61,87,0.04);}
  .auth-input-icon { position:absolute;right:12px;top:50%;transform:translateY(-50%);color:rgba(255,255,255,0.25);font-size:15px;cursor:pointer;transition:color 0.18s;user-select:none;display:flex;align-items:center; }
  .auth-input-icon:hover{color:rgba(255,255,255,0.55);}
  .auth-input.has-icon{padding-right:40px;}
  .auth-error { display:flex;align-items:center;gap:8px;padding:10px 14px;margin-bottom:14px;background:rgba(255,61,87,0.07);border:1px solid rgba(255,61,87,0.2);border-radius:9px;font-family:'Inter',sans-serif;font-size:12.5px;color:#FF7088;animation:auth-fade-in 0.2s ease; }
  .auth-strength { margin-top:5px;display:flex;gap:3px;align-items:center; }
  .auth-strength-bar { flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,0.07);transition:background 0.3s; }
  .auth-strength-bar.s1{background:#FF3D57;} .auth-strength-bar.s2{background:#FF9500;} .auth-strength-bar.s3{background:#FFD700;} .auth-strength-bar.s4{background:#00FF88;}
  .auth-strength-label { font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:600;color:rgba(255,255,255,0.35);min-width:36px;text-align:right; }
  .auth-btn {
    width:100%;padding:13px;background:linear-gradient(135deg,#06E6FF,#00FF88);
    border:none;border-radius:11px;font-family:'Space Grotesk',sans-serif;font-size:14px;font-weight:700;
    color:#030508;cursor:pointer;transition:all 0.22s;position:relative;overflow:hidden;margin-top:4px;box-sizing:border-box;
  }
  .auth-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 8px 28px rgba(6,230,255,0.32);}
  .auth-btn:active:not(:disabled){transform:translateY(0);}
  .auth-btn:disabled{opacity:0.6;cursor:not-allowed;}
  .auth-btn-inner{display:flex;align-items:center;justify-content:center;gap:8px;}
  .auth-spinner{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(3,5,8,0.3);border-top-color:#030508;animation:auth-spin 0.7s linear infinite;}
  @keyframes auth-spin{to{transform:rotate(360deg)}}
  .auth-divider { display:flex;align-items:center;gap:10px;margin:14px 0;font-family:'Inter',sans-serif;font-size:10.5px;color:rgba(255,255,255,0.18);letter-spacing:0.5px;text-transform:uppercase; }
  .auth-divider::before,.auth-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06);}
  .auth-socials{display:flex;gap:8px;margin-bottom:2px;}
  .auth-social-btn { flex:1;padding:9px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;font-family:'Inter',sans-serif;font-size:12.5px;font-weight:500;color:rgba(255,255,255,0.55);transition:all 0.18s; }
  .auth-social-btn:hover{background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.14);}
  .auth-forgot { display:block;text-align:right;margin-top:-8px;margin-bottom:12px;font-family:'Inter',sans-serif;font-size:11.5px;color:rgba(6,230,255,0.65);cursor:pointer;transition:color 0.15s;text-decoration:none; }
  .auth-forgot:hover{color:#06E6FF;}
  .auth-terms { font-family:'Inter',sans-serif;font-size:11px;color:rgba(255,255,255,0.22);text-align:center;margin-top:12px;line-height:1.55; }
  .auth-terms a{color:rgba(6,230,255,0.5);text-decoration:none;}
  .auth-terms a:hover{color:#06E6FF;}
  .auth-success{text-align:center;padding:20px 0;animation:auth-fade-in 0.3s ease;}
  .auth-success-icon { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(6,230,255,0.15),rgba(0,255,136,0.1));border:1px solid rgba(0,255,136,0.3);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 16px; }
  .auth-success h3{font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:800;color:#fff;margin-bottom:8px;}
  .auth-success p{font-family:'Inter',sans-serif;font-size:14px;color:rgba(139,163,204,0.9);}
`;

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const STRENGTH_LABELS  = ['','Weak','Fair','Good','Strong'];
const STRENGTH_CLASSES = ['','s1','s2','s3','s4'];

export default function AuthModal({ onClose, onSuccess, defaultTab = 'login' }) {
  const { login, signup, loginWithGoogle, loginWithGitHub, resetPassword, authLoading, error, clearError } = useAuth();

  const [tab,         setTab]         = useState(defaultTab);
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [forgotMode,  setForgotMode]  = useState(false);
  const [forgotSent,  setForgotSent]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', password:'', confirm:'' });
  const [fieldErrors, setFieldErrors] = useState({});
  const firstInputRef = useRef(null);

  useEffect(() => {
    clearError(); setFieldErrors({}); setSuccess(false);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [tab]); // eslint-disable-line

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (fieldErrors[field]) setFieldErrors(fe => ({ ...fe, [field]: null }));
    clearError();
  };

  const validateLogin = () => {
    const errs = {};
    if (!form.email)    errs.email    = 'Email required';
    if (!form.password) errs.password = 'Password required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim())  errs.lastName  = 'Required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email    = 'Invalid email';
    if (!form.password || form.password.length < 8)       errs.password = '8 characters min.';
    if (form.confirm !== form.password)                    errs.confirm  = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Login: isNew = false ──────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;
    const ok = await login({ email: form.email, password: form.password });
    if (ok) {
      setSuccess(true);
      setTimeout(() => onSuccess({ email: form.email }, false), 900);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    const ok = await resetPassword(forgotEmail);
    if (ok) setForgotSent(true);
  };

  // ── Signup: isNew = true ──────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateSignup()) return;
    const result = await signup({
      firstName: form.firstName,
      lastName:  form.lastName,
      email:     form.email,
      password:  form.password,
    });
    if (result?.success) {
      setSuccess(true);
      if (!result.needsConfirmation) {
        setTimeout(() => onSuccess({ email: form.email }, true), 900);
      }
    }
  };

  const strength = getStrength(form.password);

  return (
    <>
      <style>{STYLES}</style>
      <div className="auth-overlay">
        <div className="auth-modal">
          <button className="auth-close" onClick={onClose}>✕</button>
          <div className="auth-modal-inner">

            {/* Logo */}
            <div className="auth-logo">
              <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA2QAAAMPCAYAAAC62xZRAAEAAElEQVR4nOz9aZgsy3nfif0iIjNr6eWcPvs9d993XOBeXKxcAJKACBDcwUWUKEoaUdLIoj0ay48oS3pk2R8sj6SR5/GMv3nsx56Rx+aIskRJXEQRErGIIAiQIECAWAnc/dyz9VpLZka8/hCZVdV1auuuqq7q7vjdp2/3qSWXyMjIeON93/+raiuXhVOMyHSnr5Sa0ZEcH3rbbN7nH67P8nGQazKu/cdtK1y/k81xv7/L4+8/j8Mc1zzORUSGbnfUe0fFvO//afvXoln09TmNDOsz5bU4yvlP4OiZ5fzmoEQz3VogEAgEAgEgLDgEAoFAYDKCQcbwh+IyrCAehPLhP+9jPsj2Z7GaNOvrc1JXuJb9+s9yuwfZ/0m5v5eRae+lRXtApt1/+f3e7RykTRZ5rx5F33fOjXx/Wg/6LDyTi2SQ1yVwdBxmweQo+9hhxteTOr85KmbZZgftX8EgCwQChyZMJALzJPSv402YEAYCgcBkBIMsEAgEAktJCPkLTEroC4FA4Dhz4g2ysMIaCAQCx5MwyQ6MY1gfUUqF538gEDg2nHiDLBAIzI9pc0ACgVGE/hUYxaJzfAKBQGBWBIMsEAgcmjBhDgQCwzjq8eG0GWMhpDcQODkEgywQCByaYHAF5knoX4FJCcZHIBA4zpx4gyysIAUCgUAgcHIJz/FAIHDcmbtBNq1BdBR1Zkbt4zgZdIOO5ShrUgyqgzWrOj8Hfe+w2zzOLON5LfqYpu0/4+qYHXR7/d9bdPschmFj4qDXp60TOG+CB+54cxzvn0EMq2M3y/nTSWmrg5zTrO7vYduZdv/zqFM4rzpaJ6X/zJuD9k+lVEeASM/74AKBQCAQCAQCgUAgMJgTH7IYCAQCgUBg9hynCJLAySN4uAMnieAhCwQCgUAgEAgEAoEFEQyyQCAQCAQCgUAgEFgQwSALBAKBQCAQCAQCgQURcsgCgUAgEAgcmJAjFlgkR114PBCYJ8FDFggEAoFAIBAIBAILIoJp60T538Nq8kyyQnHYGg/LwLKrTM1//6Nrjo2//vOtU7fo9l9GTlttkWnGl9NeB2/+K8yDnhPHp30mGb+O8/NtWubdf5a9bQ8yD+r/ziz3f5I4yDlNWgdq2HvTctznJwc5vkF1aI/7+R/m+A/TP8v9TB2yWG4ouIYDgUAgEAgEAoHlNzgC8+WgdtFYg2y8hTj4M6NWHgLLw3FfwVj245uWZb8+iz6+Re8/EAgEAoFAoJ+ZG2STMCgsI0yEAoFAIBA4uYTImEAgEBjMQVNuxhpk4zZYesiGxVKGAXu5CYZzYBoW3X8Wvf9AIBAIBAKBfg46PwkeskAgEAgETiFhwTQQmB9hHjya055y0H9+MxP16P07eMYCR8VJv6GP+/EHAoFAIBAInDYOOj+di6jHIPnLwHJy0g2awHxZdP9Z9P4DgdNMuP8CgUDgcNwRWVitX57SlTXd16cd0Kcd8E9bTaZ+pvdkTttmo/c/7vi0Hl3bPEwYRjPvOizTMmxxp3x93PWf1f4nYdqaLceRQePnwfrN4Os67XFM2q7T9vFpL99Juv7HkVkdf3+fm+V2TwvTjInz6ofznj/
