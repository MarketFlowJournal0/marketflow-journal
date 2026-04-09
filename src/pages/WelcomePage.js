import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW WELCOME PAGE
   ═══════════════════════════════════════════════════════════════ */

function WelcomeBg() {
  const ref = React.useRef(null);
  React.useEffect(() => {
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
      for (let i = 0; i < 50; i++) particles.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() * 1.5 + 0.4, o: Math.random() * 0.15 + 0.03 });
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
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

export default function WelcomePage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const isActivated = Boolean(user?.stripeSubscriptionId && ['active', 'trialing'].includes(user?.subStatus));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (!sessionId) { navigate('/plan'); return; }

    let cancelled = false;
    let attempts = 0;

    const pollActivation = async () => {
      attempts += 1;
      try {
        await refreshProfile?.();
      } catch (_) {}

      if (cancelled) return;
      if (attempts >= 20 && !isActivated) {
        setTimedOut(true);
        setLoading(false);
      }
    };

    pollActivation();
    const timer = setInterval(pollActivation, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [navigate, refreshProfile, isActivated]);

  useEffect(() => {
    if (isActivated) {
      setTimedOut(false);
      setLoading(false);
    }
  }, [isActivated]);

  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const email = user?.email || '';

  const features = [
    { icon: '📊', title: 'Trade Journal', desc: 'Log every trade with full analytics' },
    { icon: '🤖', title: 'AI Coach', desc: 'Get personalized trading insights' },
    { icon: '📈', title: 'Advanced Analytics', desc: 'Sharpe, drawdown, expectancy & more' },
    { icon: '🔄', title: 'Broker Sync', desc: 'Auto-import from MT4/MT5' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#030508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 40, height: 40, border: '3px solid rgba(6,230,255,0.1)', borderTopColor: '#06E6FF', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p style={{ color: '#7A90B8', fontSize: 14 }}>Activating your account...</p>
          </motion.div>
        </div>
      );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030508', position: 'relative', overflow: 'hidden' }}>
      <WelcomeBg />

      {/* Top glow */}
      <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse, rgba(6,230,255,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto', padding: '60px 24px 80px', textAlign: 'center' }}>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(6,230,255,0.15)' }}>
            <img src="/logo192.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.5px' }}>Market<span style={{ color: '#06E6FF' }}>Flow</span></span>
        </motion.div>

        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(6,230,255,0.12), rgba(0,255,136,0.08))',
            border: '1px solid rgba(0,255,136,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 36, color: '#00FF88',
            boxShadow: '0 0 40px rgba(0,255,136,0.15)',
          }}
        >
          ✓
        </motion.div>

        {/* Welcome text */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.15, letterSpacing: '-1.5px' }}
        >
          Welcome to MarketFlow, <span style={{ background: 'linear-gradient(135deg, #06E6FF, #00FF88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: 16, color: '#7A90B8', margin: '0 0 40px', lineHeight: 1.7, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
        >
          {timedOut
            ? <>Your payment went through, but the account activation is still syncing for <strong style={{ color: '#E8EEFF' }}>{email}</strong>. Please wait a moment, then refresh this page. If it still blocks you, contact support and we can unlock it manually.</>
            : <>Your account is activated. A confirmation email has been sent to <strong style={{ color: '#E8EEFF' }}>{email}</strong>. Start your trading journey now.</>}
        </motion.p>

        {/* Features grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              style={{
                background: 'rgba(12,20,34,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14,
                padding: '20px 18px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#E8EEFF', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#7A90B8', lineHeight: 1.5 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <button
            onClick={() => navigate(timedOut ? '/plan' : '/dashboard')}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #06E6FF, #00FF88)',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              color: '#030508',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 0 30px rgba(6,230,255,0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(6,230,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 0 30px rgba(6,230,255,0.25)'; }}
          >
            {timedOut ? 'Back to Plan →' : 'Go to Dashboard →'}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          style={{ fontSize: 11.5, color: '#334566', marginTop: 20 }}
        >
          {timedOut ? 'If the activation still does not complete after a refresh, contact support with your payment email.' : 'Check your inbox for a welcome email with tips to get started'}
        </motion.p>
      </div>
    </div>
  );
}
