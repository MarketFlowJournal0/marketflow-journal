import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW PLAN SELECTION — Premium v2
   ═══════════════════════════════════════════════════════════════ */

// ─── Animated BG ────────────────────────────────────────────────────────────
function PlanBg() {
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
      for (let i = 0; i < 40; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() * 1.2 + 0.4, o: Math.random() * 0.12 + 0.03 });
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
        if (d < 100) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(6,230,255,${0.025 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      animId = requestAnimationFrame(draw);
    }
    init(); draw();
    const onR = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); init(); };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Ic = {
  Starter: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h8l-2 6L19 8h-8l2-6z"/></svg>,
  Pro: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,16 8,10 12,13 19,5"/><path d="M15 2h4v4"/></svg>,
  Elite: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2l2.5 5.5H19l-4.5 3.5 1.5 5.5L11 13l-5 3.5 1.5-5.5L3 7.5h5.5z"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6 5,9 10,3"/></svg>,
};

// ─── Plans Data ─────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter', name: 'Starter',
    monthly: 15, annual: 11,
    noAnnualDiscount: true,
    priceMonthly: 'price_1T9t9L2Ouddv7uendIMAR6IP',
    priceAnnual: 'price_1TDQ7w2Ouddv7ueno5CuaNTH',
    accent: '#00D2B8',
    desc: 'Perfect to start tracking your trades',
    features: ['Unlimited trading journal', 'Dashboard & basic statistics', 'CSV import', 'Performance calendar', '1 trading account'],
    Icon: Ic.Starter,
  },
  {
    id: 'pro', name: 'Pro', popular: true,
    monthly: 22, annual: 15,
    priceMonthly: 'price_1T9t9U2Ouddv7uenfg38PRZ2',
    priceAnnual: 'price_1T9t9U2Ouddv7uenK6oT1O13',
    accent: '#14C9E5',
    desc: 'For serious traders who want to improve',
    features: ['Everything in Starter plan', 'Advanced Pro analytics', 'Psychology & mental tracking', 'Equity curve & drawdown', 'Strategy backtesting', '3 trading accounts', 'PDF report export'],
    Icon: Ic.Pro,
  },
  {
    id: 'elite', name: 'Elite',
    monthly: 38, annual: 27,
    priceMonthly: 'price_1T9t9L2Ouddv7uen4DXuOatj',
    priceAnnual: 'price_1T9t9K2Ouddv7uennnWOJ44p',
    accent: '#D7B36A',
    desc: 'For pros who want the best tool',
    features: ['Everything in Pro plan', 'AI Trading Coach (GPT-4)', 'Unlimited accounts', 'Alerts & notifications', 'API access', '24/7 priority support', 'Beta features access'],
    Icon: Ic.Elite,
  },
];

const CHECKOUT_PLAN_KEY = 'mfj_checkout_plan_id';

// ─── Main Component ────────────────────────────────────────────────────────
export default function PlanSelection({ user: userProp, onSkip, onLogout }) {
  const { user: authUser, refreshProfile } = useAuth();
  const user = authUser || userProp;

  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setSuccessMsg('Subscription activated! Redirecting...');
      const doRefresh = async () => { try { await refreshProfile?.(); } catch (_) {} };
      doRefresh();
      setTimeout(() => { window.location.href = window.location.origin; }, 1500);
    }
  }, []); // eslint-disable-line

  const currentPlan = user?.user_metadata?.plan || user?.plan || 'trial';
  const subStatus = user?.user_metadata?.subStatus || user?.subStatus || 'trialing';
  const isTrialing = user?.user_metadata?.isTrialing ?? user?.isTrialing ?? (currentPlan === 'trial');
  const daysLeft = user?.user_metadata?.trialDaysLeft ?? user?.trialDaysLeft ?? 14;
  const needsPayment = user?.user_metadata?.needsPayment || user?.needsPayment || false;

  const handleSelect = async (plan) => {
    const priceId = billing === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
    sessionStorage.setItem(CHECKOUT_PLAN_KEY, plan.id);
    localStorage.setItem(CHECKOUT_PLAN_KEY, plan.id);
    setLoading(plan.id);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: user?.email, userId: user?.id, planId: plan.id }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else console.error('Checkout error:', error);
    } catch (err) { console.error('Checkout error:', err); }
    finally { setLoading(null); }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/create-billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else console.error('Portal error:', error);
    } catch (err) { console.error('Portal error:', err); }
    finally { setPortalLoading(false); }
  };

  const isCurrentPlan = (planId) => currentPlan === planId;
  const planLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  return (
    <div style={{ minHeight: '100vh', background: '#01040A', fontFamily: "'Inter',sans-serif", position: 'relative', overflow: 'hidden' }}>
      <PlanBg />

      {/* Top glow */}
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(6,230,255,0.06), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Back button */}
      {onLogout && (
        <motion.button initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} onClick={onLogout} style={{ position: 'fixed', top: 24, left: 24, zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '9px 14px', fontSize: 12.5, fontWeight: 600, color: '#7A90B8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(6,230,255,0.2)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#7A90B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8L10 13"/></svg>
          Back
        </motion.button>
      )}

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Success */}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(6,230,255,0.06))', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12, padding: '12px 20px', color: '#00D2B8', fontSize: 13.5, fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>{successMsg}</motion.div>
        )}

        {/* Trial banner */}
        {user && isTrialing && daysLeft > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.08em', color: '#D7B36A' }}>TRIAL</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#D7B36A' }}>Free trial - {daysLeft} day{daysLeft > 1 ? 's' : ''} remaining</strong>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}> - Billing starts after the trial unless cancelled</span>
            </div>
            {user.stripeCustomerId && (
              <button onClick={handleManage} disabled={portalLoading} style={{ padding: '6px 12px', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 7, color: '#D7B36A', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{portalLoading ? '...' : 'Manage card'}</button>
            )}
          </motion.div>
        )}

        {/* Payment required */}
        {needsPayment && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,61,87,0.06)', border: '1px solid rgba(255,61,87,0.15)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, fontSize: 13 }}>
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.16em' }}>PAY</span>
            <div><strong style={{ color: '#FF5570' }}>Payment required</strong><span style={{ color: 'rgba(255,255,255,0.5)' }}> - Your trial has ended. Choose a plan to continue.</span></div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ textAlign: 'center', marginBottom: 40 }}>
          {!user ? (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 50, padding: '5px 14px', marginBottom: 16, fontSize: 11, fontWeight: 600, color: '#00D2B8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00D2B8', boxShadow: '0 0 6px #00D2B8', animation: 'pulse 2s ease-in-out infinite' }} />
                Step 2 of 2 - Choose your plan
              </div>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-1px' }}>
                Start your <span style={{ background: 'linear-gradient(135deg, #14C9E5, #00D2B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>free trial</span><br />of 14 days
              </h1>
              <p style={{ fontSize: 15, color: '#7A90B8', margin: 0, lineHeight: 1.6 }}>Start with 14 days to test the journal. Billing starts after the trial unless cancelled. One free trial per account.</p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.15, letterSpacing: '-1px' }}>
                {needsPayment ? 'Choose your plan' : <>Your <span style={{ background: 'linear-gradient(135deg, #14C9E5, #00D2B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>subscription</span></>}
              </h1>
              <p style={{ fontSize: 15, color: '#7A90B8', margin: 0, lineHeight: 1.6 }}>
                {subStatus === 'active' ? `Active plan · ${planLabel}` : isTrialing ? `Free trial in progress · ${daysLeft}d remaining` : subStatus === 'canceled' ? 'Subscription canceled — Reactivate a plan' : 'Manage or change your subscription below'}
              </p>
            </>
          )}
        </motion.div>

        {/* Billing Toggle */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 36 }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 50, padding: 3 }}>
            {['monthly', 'annual'].map(t => (
              <button key={t} onClick={() => setBilling(t)} style={{ padding: '7px 18px', borderRadius: 50, border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 600, transition: 'all 0.2s', background: billing === t ? '#14C9E5' : 'transparent', color: billing === t ? '#01040A' : '#7A90B8' }}>
                {t === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
          </div>
          {billing === 'annual' && <span style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00D2B8', fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 50, letterSpacing: '0.04em' }}>-30% on Pro & Elite</span>}
        </motion.div>

        {/* Plans Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 960, margin: '0 auto' }}>
          {PLANS.map((plan, i) => {
            const isCurrent = isCurrentPlan(plan.id);
            const price = billing === 'monthly' ? plan.monthly : plan.annual;
            const annualSave = (plan.monthly - plan.annual) * 12;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.08 }}
                whileHover={{ y: -3 }}
                style={{
                  background: plan.popular && !isCurrent ? 'linear-gradient(160deg, rgba(6,230,255,0.04), rgba(0,255,136,0.02), rgba(12,20,34,0.98))' : 'rgba(12,20,34,0.5)',
                  border: `1px solid ${isCurrent ? plan.accent + '40' : plan.popular && !isCurrent ? 'rgba(6,230,255,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 18,
                  padding: '28px 24px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s',
                  boxShadow: isCurrent ? `0 0 0 1px ${plan.accent}20, 0 20px 48px rgba(0,0,0,0.4)` : plan.popular && !isCurrent ? '0 0 0 1px rgba(6,230,255,0.08), 0 20px 48px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Top glow line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${plan.accent}50, transparent)` }} />

                {/* Badges */}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 50, background: `${plan.accent}15`, border: `1px solid ${plan.accent}30`, fontSize: 9, fontWeight: 700, color: plan.accent, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {isTrialing ? `Trial · ${daysLeft}d left` : 'Current plan'}
                  </div>
                )}
                {plan.id === 'starter' && !isCurrent && (
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '3px 10px', borderRadius: 50, background: 'linear-gradient(135deg, #14C9E5, #00D2B8)', fontSize: 9, fontWeight: 800, color: '#01040A', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    14 days free
                  </div>
                )}

                {/* Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${plan.accent}08`, border: `1px solid ${plan.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: plan.accent }}>
                    <plan.Icon />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{plan.name}</div>
                    <div style={{ fontSize: 12, color: '#7A90B8', marginTop: 2 }}>{plan.desc}</div>
                  </div>
                </div>

                {/* Price */}
                <div style={{ marginBottom: 18, marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 3 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: plan.accent }}>$</span>
                    <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>{price}</span>
                    <span style={{ fontSize: 13, color: '#7A90B8' }}>/mo</span>
                  </div>
                  {billing === 'annual' && !plan.noAnnualDiscount && (
                    <div style={{ fontSize: 11, color: '#334566' }}>Billed ${plan.annual * 12}/yr — <span style={{ color: '#00D2B8', fontWeight: 600 }}>save ${annualSave}/yr</span></div>
                  )}
                  {billing === 'annual' && plan.noAnnualDiscount && (
                    <div style={{ fontSize: 11, color: '#334566' }}>Billed ${plan.annual * 12}/yr</div>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: '#E8EEFF' }}>
                      <span style={{ color: '#00D2B8', marginTop: 1, flexShrink: 0 }}><Ic.Check /></span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent && user?.stripeCustomerId ? (
                  <button onClick={handleManage} disabled={portalLoading} style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: portalLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}>
                    {portalLoading ? 'Loading...' : 'Manage subscription'}
                  </button>
                ) : isCurrent ? (
                  <button disabled style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600, cursor: 'default', fontFamily: 'inherit' }}>
                    Current plan
                  </button>
                ) : (
                  <button onClick={() => handleSelect(plan)} disabled={!!loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.06)', background: plan.popular ? 'linear-gradient(135deg, #14C9E5, #00D2B8)' : 'rgba(255,255,255,0.03)', color: plan.popular ? '#01040A' : '#E8EEFF', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', boxShadow: plan.popular ? '0 0 20px rgba(6,230,255,0.2)' : 'none' }} onMouseEnter={e => { if (!loading) { if (plan.popular) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(6,230,255,0.35)'; } else { e.currentTarget.style.borderColor = plan.accent; e.currentTarget.style.color = plan.accent; } } }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = plan.popular ? '0 0 20px rgba(6,230,255,0.2)' : 'none'; e.currentTarget.style.borderColor = plan.popular ? 'none' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = plan.popular ? '#01040A' : '#E8EEFF'; }}>
                    {loading === plan.id ? 'Loading...' : plan.id === 'starter' ? 'Start free trial' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#334566' }}>
          <span style={{ color: '#7A90B8' }}>100% secure payment by Stripe</span>
          {' - '}Manage or cancel online
          {' - '}14-day free trial - one per account
          {' - '}Billing starts after trial unless cancelled
        </motion.p>
      </div>
    </div>
  );
}
