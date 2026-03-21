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
const STRENGTH_LABELS  = ['','Faible','Moyen','Bien','Fort'];
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
    if (!form.email)    errs.email    = 'Email requis';
    if (!form.password) errs.password = 'Mot de passe requis';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignup = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Requis';
    if (!form.lastName.trim())  errs.lastName  = 'Requis';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email    = 'Email invalide';
    if (!form.password || form.password.length < 8)       errs.password = '8 caractères min.';
    if (form.confirm !== form.password)                    errs.confirm  = 'Les mots de passe ne correspondent pas';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Connexion : isNew = false ──────────────────────────────────────────────
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

  // ── Inscription : isNew = true ─────────────────────────────────────────────
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
              <img src="/logo192.png" alt="MarketFlow" style={{ width:36, height:36, objectFit:'contain', borderRadius:8, boxShadow:'0 0 12px rgba(6,230,255,0.3)' }}
                onError={e => { e.target.style.display='none'; }} />
              <div className="auth-logo-text">Market<span>Flow</span></div>
            </div>

            {/* Success */}
            {success ? (
              <div className="auth-success">
                <div className="auth-success-icon">✓</div>
                <h3>{tab === 'login' ? 'Content de te revoir !' : 'Bienvenue sur MarketFlow !'}</h3>
                <p>{tab === 'login'
                  ? 'Connexion réussie. Redirection...'
                  : 'Vérifie ton email pour confirmer ton compte, puis connecte-toi !'
                }</p>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div className="auth-tabs">
                  <button className={`auth-tab${tab==='login'?' active':''}`} onClick={()=>setTab('login')}>Connexion</button>
                  <button className={`auth-tab${tab==='signup'?' active':''}`} onClick={()=>setTab('signup')}>Créer un compte</button>
                </div>

                {tab === 'login' ? (
                  <><div className="auth-title">Bon retour <em>trader</em> 👋</div><div className="auth-subtitle">Connecte-toi pour accéder à ton journal.</div></>
                ) : (
                  <><div className="auth-title">Commence à <em>performer</em> 🚀</div><div className="auth-subtitle">14 jours gratuits. Aucune carte bancaire.</div></>
                )}

                {error && <div className="auth-error"><span>⚠</span> {error}</div>}

                {/* Forgot password */}
                {tab === 'login' && forgotMode && (
                  <form onSubmit={handleForgot} noValidate>
                    {forgotSent ? (
                      <div className="auth-success">
                        <div className="auth-success-icon">📧</div>
                        <h3>Email envoyé !</h3>
                        <p>Vérifie ta boîte mail pour réinitialiser ton mot de passe.</p>
                        <button type="button" className="auth-btn" style={{marginTop:20}} onClick={()=>{setForgotMode(false);setForgotSent(false);}}>
                          <span className="auth-btn-inner">Retour à la connexion</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="auth-title">Réinitialiser <em>le mot de passe</em></div>
                        <div className="auth-subtitle">On t'envoie un lien par email.</div>
                        <div className="auth-field">
                          <label className="auth-label">Email</label>
                          <input type="email" className="auth-input" placeholder="trader@example.com" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} autoFocus />
                        </div>
                        <button type="submit" className="auth-btn" disabled={authLoading}>
                          <span className="auth-btn-inner">{authLoading ? <><div className="auth-spinner"/> Envoi...</> : 'Envoyer le lien →'}</span>
                        </button>
                        <a className="auth-forgot" href="#back" style={{marginTop:12,display:'block',textAlign:'center'}} onClick={e=>{e.preventDefault();setForgotMode(false);}}>← Retour</a>
                      </>
                    )}
                  </form>
                )}

                {/* Login form */}
                {tab === 'login' && !forgotMode && (
                  <form onSubmit={handleLogin} noValidate>
                    <div className="auth-socials">
                      <button type="button" className="auth-social-btn" onClick={loginWithGoogle}>
                        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Google
                      </button>
                      <button type="button" className="auth-social-btn" onClick={loginWithGitHub}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        GitHub
                      </button>
                    </div>
                    <div className="auth-divider">ou par email</div>
                    <div className="auth-field">
                      <label className="auth-label">Email</label>
                      <input ref={firstInputRef} type="email" className={`auth-input${fieldErrors.email?' error':''}`} placeholder="trader@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Mot de passe</label>
                      <div className="auth-input-wrap">
                        <input type={showPw?'text':'password'} className={`auth-input has-icon${fieldErrors.password?' error':''}`} placeholder="••••••••" value={form.password} onChange={set('password')} autoComplete="current-password" />
                        <span className="auth-input-icon" onClick={()=>setShowPw(v=>!v)}>{showPw?'🙈':'👁'}</span>
                      </div>
                    </div>
                    <a className="auth-forgot" href="#forgot" onClick={e=>{e.preventDefault();setForgotMode(true);}}>Mot de passe oublié ?</a>
                    <button type="submit" className="auth-btn" disabled={authLoading}>
                      <span className="auth-btn-inner">{authLoading?<><div className="auth-spinner"/>Connexion...</>:'Se connecter →'}</span>
                    </button>
                    <p className="auth-terms">En continuant, tu acceptes nos <a href="#terms">CGU</a> et notre <a href="#privacy">Politique de confidentialité</a>.</p>
                  </form>
                )}

                {/* Signup form */}
                {tab === 'signup' && (
                  <form onSubmit={handleSignup} noValidate>
                    <div className="auth-row">
                      <div className="auth-field">
                        <label className="auth-label">Prénom</label>
                        <input ref={firstInputRef} type="text" className={`auth-input${fieldErrors.firstName?' error':''}`} placeholder="Lucas" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
                        {fieldErrors.firstName && <span style={{fontSize:11,color:'#FF7088',marginTop:2}}>{fieldErrors.firstName}</span>}
                      </div>
                      <div className="auth-field">
                        <label className="auth-label">Nom</label>
                        <input type="text" className={`auth-input${fieldErrors.lastName?' error':''}`} placeholder="Martin" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
                      </div>
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Email</label>
                      <input type="email" className={`auth-input${fieldErrors.email?' error':''}`} placeholder="trader@example.com" value={form.email} onChange={set('email')} autoComplete="email" />
                      {fieldErrors.email && <span style={{fontSize:11,color:'#FF7088',marginTop:2}}>{fieldErrors.email}</span>}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Mot de passe</label>
                      <div className="auth-input-wrap">
                        <input type={showPw?'text':'password'} className={`auth-input has-icon${fieldErrors.password?' error':''}`} placeholder="8 caractères minimum" value={form.password} onChange={set('password')} autoComplete="new-password" />
                        <span className="auth-input-icon" onClick={()=>setShowPw(v=>!v)}>{showPw?'🙈':'👁'}</span>
                      </div>
                      {fieldErrors.password && <span style={{fontSize:11,color:'#FF7088',marginTop:2}}>{fieldErrors.password}</span>}
                      {form.password && (
                        <div className="auth-strength">
                          {[1,2,3,4].map(n=>(
                            <div key={n} className={`auth-strength-bar${strength>=n?' '+STRENGTH_CLASSES[strength]:''}`}/>
                          ))}
                          <span className="auth-strength-label" style={{color:strength>=4?'#00FF88':strength>=3?'#FFD700':strength>=2?'#FF9500':'#FF3D57'}}>
                            {STRENGTH_LABELS[strength]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Confirmer le mot de passe</label>
                      <div className="auth-input-wrap">
                        <input type={showConfirm?'text':'password'} className={`auth-input has-icon${fieldErrors.confirm?' error':''}`} placeholder="••••••••" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
                        <span className="auth-input-icon" onClick={()=>setShowConfirm(v=>!v)}>{showConfirm?'🙈':'👁'}</span>
                      </div>
                      {fieldErrors.confirm && <span style={{fontSize:11,color:'#FF7088',marginTop:2}}>{fieldErrors.confirm}</span>}
                    </div>
                    <button type="submit" className="auth-btn" disabled={authLoading}>
                      <span className="auth-btn-inner">{authLoading?<><div className="auth-spinner"/>Création du compte...</>:'🚀 Créer mon compte gratuitement'}</span>
                    </button>
                    <p className="auth-terms">En créant un compte, tu acceptes nos <a href="#terms">CGU</a> et notre <a href="#privacy">Politique de confidentialité</a>. Aucune carte bancaire requise.</p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}