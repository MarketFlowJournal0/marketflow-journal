import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarketFlowMark from '../components/MarketFlowMark';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW ONBOARDING — Premium v2
   ═══════════════════════════════════════════════════════════════ */

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Ic = {
  Beginner: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="3"/><path d="M11 3v3M11 16v3M3 11h3M16 11h3"/></svg>,
  Intermediate: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,16 8,10 12,13 19,5"/><path d="M15 3h4v4"/></svg>,
  Advanced: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="4"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>,
  Professional: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2l2.5 5.5H19l-4.5 3.5 1.5 5.5L11 13l-5 3.5 1.5-5.5L3 7.5h5.5z"/></svg>,
  Forex: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11h14M11 4v14"/><path d="M6 6c1.5 2 2.5 3.5 2.5 5.5S7.5 15 6 17"/><path d="M16 6c-1.5 2-2.5 3.5-2.5 5.5s1 3.5 2.5 5.5"/></svg>,
  Indices: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18V4"/><path d="M3 18h16"/><polyline points="5,14 8,9 11,12 15,6 19,10"/></svg>,
  Crypto: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M12.5 7.5h-3a2 2 0 100 4h3a2 2 0 010 4h-3"/><path d="M9 6v2M9 14v2M13 6v2M13 14v2"/></svg>,
  Stocks: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="14" height="10" rx="2"/><path d="M8 8V5a3 3 0 016 0v3"/><path d="M11 12v3"/></svg>,
  Futures: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h8l-2 6L19 8h-8l2-6z"/></svg>,
  Options: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="16" height="16" rx="3"/><path d="M8 11h6M11 8v6"/></svg>,
  Scalping: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h8l-2 6L19 8h-8l2-6z"/></svg>,
  DayTrading: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="11" cy="11" r="4"/><path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.6 5.6l1.4 1.4M15 15l1.4 1.4M16.4 5.6L15 7M7 15l-1.4 1.4"/></svg>,
  Swing: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16c2-4 4-8 6-8s4 4 6 4 4-4 4-8"/></svg>,
  Position: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3v16M7 7l4-4 4 4"/><rect x="4" y="15" width="14" height="4" rx="1"/></svg>,
  Improve: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,16 8,10 12,13 19,5"/><path d="M15 3h4v4"/></svg>,
  Prop: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2l2.5 5.5H19l-4.5 3.5 1.5 5.5L11 13l-5 3.5 1.5-5.5L3 7.5h5.5z"/></svg>,
  Consistent: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><circle cx="11" cy="11" r="4"/><circle cx="11" cy="11" r="1" fill="currentColor"/></svg>,
  Manage: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="2" y="14" width="7" height="7" rx="1.5"/><rect x="13" y="14" width="7" height="7" rx="1.5"/></svg>,
  MT4: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="16" height="12" rx="2"/><path d="M7 9h8M7 12h5"/></svg>,
  MT5: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="16" height="12" rx="2"/><path d="M7 9h8M7 12h5"/></svg>,
  cTrader: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,16 8,10 12,13 19,5"/><path d="M3 18h16"/></svg>,
  TradingView: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="16" height="16" rx="2"/><polyline points="7,14 10,10 13,12 16,7"/></svg>,
  NinjaTrader: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3v16M7 7l4-4 4 4"/><path d="M5 17h12"/></svg>,
  Other: () => <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M8 11h6M11 8v6"/></svg>,
};

// ─── Step Definitions ──────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'experience',
    Icon: Ic.Advanced,
    question: 'What is your trading level?',
    subtitle: "We'll tailor analytics to your profile.",
    type: 'single',
    options: [
      { id: 'beginner',     label: 'Beginner',     desc: 'Less than 6 months',  Icon: Ic.Beginner },
      { id: 'intermediate', label: 'Intermediate', desc: '6 months – 2 years',  Icon: Ic.Intermediate },
      { id: 'advanced',     label: 'Advanced',     desc: '2 – 5 years',         Icon: Ic.Advanced },
      { id: 'professional', label: 'Professional', desc: '5+ years / funded',   Icon: Ic.Professional },
    ],
  },
  {
    id: 'market',
    Icon: Ic.Forex,
    question: 'Which markets do you trade?',
    subtitle: 'Select all that apply.',
    type: 'multi',
    options: [
      { id: 'forex',   label: 'Forex',   Icon: Ic.Forex },
      { id: 'indices', label: 'Indices',  Icon: Ic.Indices },
      { id: 'crypto',  label: 'Crypto',   Icon: Ic.Crypto },
      { id: 'stocks',  label: 'Stocks',   Icon: Ic.Stocks },
      { id: 'futures', label: 'Futures',  Icon: Ic.Futures },
      { id: 'options', label: 'Options',  Icon: Ic.Options },
    ],
  },
  {
    id: 'style',
    Icon: Ic.DayTrading,
    question: 'What is your trading style?',
    subtitle: "We'll optimize your reports accordingly.",
    type: 'single',
    options: [
      { id: 'scalping',   label: 'Scalping',    desc: 'Trades < 15 min', Icon: Ic.Scalping },
      { id: 'daytrading', label: 'Day Trading',  desc: 'Intraday',        Icon: Ic.DayTrading },
      { id: 'swing',      label: 'Swing Trading',desc: 'Few days',        Icon: Ic.Swing },
      { id: 'position',   label: 'Position',     desc: 'Weeks / months',  Icon: Ic.Position },
    ],
  },
  {
    id: 'goal',
    Icon: Ic.Improve,
    question: 'What is your main goal?',
    subtitle: 'This helps us personalize your dashboard.',
    type: 'single',
    options: [
      { id: 'improve',    label: 'Improve my performance',  Icon: Ic.Improve },
      { id: 'prop',       label: 'Pass a prop firm challenge', Icon: Ic.Prop },
      { id: 'consistent', label: 'Become consistent',         Icon: Ic.Consistent },
      { id: 'manage',     label: 'Manage multiple accounts',  Icon: Ic.Manage },
    ],
  },
  {
    id: 'platform',
    Icon: Ic.MT4,
    question: 'Which platform do you use?',
    subtitle: "We'll set up import automatically.",
    type: 'multi',
    options: [
      { id: 'mt4',         label: 'MetaTrader 4',  Icon: Ic.MT4 },
      { id: 'mt5',         label: 'MetaTrader 5',  Icon: Ic.MT5 },
      { id: 'ctrader',     label: 'cTrader',        Icon: Ic.cTrader },
      { id: 'tradingview', label: 'TradingView',    Icon: Ic.TradingView },
      { id: 'ninjatrader', label: 'NinjaTrader',    Icon: Ic.NinjaTrader },
      { id: 'other',       label: 'Other',          Icon: Ic.Other },
    ],
  },
];

// ─── Animated BG ────────────────────────────────────────────────────────────
function ObBg() {
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
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [direction, setDirection] = useState(0);

  const current = STEPS[step];
  const total = STEPS.length;
  const progress = ((step + 1) / total) * 100;
  const selected = answers[current.id] || (current.type === 'multi' ? [] : null);
  const canNext = current.type === 'multi' ? selected.length > 0 : selected !== null;

  const toggleOption = (optId) => {
    if (current.type === 'single') {
      setAnswers(a => ({ ...a, [current.id]: optId }));
    } else {
      const cur = answers[current.id] || [];
      const next = cur.includes(optId) ? cur.filter(x => x !== optId) : [...cur, optId];
      setAnswers(a => ({ ...a, [current.id]: next }));
    }
  };

  const isSelected = (optId) => {
    if (current.type === 'multi') return (selected || []).includes(optId);
    return selected === optId;
  };

  const goNext = () => {
    if (step < total - 1) { setDirection(1); setStep(s => s + 1); }
    else onComplete(answers);
  };

  const goPrev = () => {
    if (step > 0) { setDirection(-1); setStep(s => s - 1); }
  };

  const variants = {
    enter: (d) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030508', fontFamily: "'Inter',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <ObBg />

      {/* Top glow */}
      <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'radial-gradient(ellipse, rgba(6,230,255,0.06), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0 }} />

      <motion.div
        key={step}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 540, position: 'relative', zIndex: 1,
          background: 'linear-gradient(160deg, #0C1524 0%, #070D1A 100%)',
          border: '1px solid rgba(6,230,255,0.06)',
          borderRadius: 24,
          padding: '40px 36px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,230,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Top glow line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.3), rgba(0,255,136,0.2), transparent)', borderRadius: '24px 24px 0 0' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 10px 20px rgba(6,230,255,0.12))' }}>
            <MarketFlowMark size={30} accent="#06E6FF" secondary="#67F5E0" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.3px' }}>Market<span style={{ color: '#06E6FF' }}>Flow</span></span>
        </div>

        {/* Progress */}
        <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginBottom: 28, overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} style={{ height: '100%', background: 'linear-gradient(90deg, #06E6FF, #00FF88)', borderRadius: 3 }} />
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#06E6FF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step {step + 1} of {total}</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>

        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(6,230,255,0.06)', border: '1px solid rgba(6,230,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06E6FF', marginBottom: 16 }}>
          <current.Icon />
        </div>

        {/* Question */}
        <h2 style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, color: '#fff', margin: '0 0 6px', lineHeight: 1.2, letterSpacing: '-0.4px' }}>{current.question}</h2>
        <p style={{ fontSize: 14, color: '#7A90B8', margin: '0 0 24px', lineHeight: 1.6 }}>{current.subtitle}</p>

        {current.type === 'multi' && (
          <div style={{ fontSize: 11, color: '#334566', textAlign: 'center', marginBottom: 16, marginTop: -12 }}>You can select multiple options</div>
        )}

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: current.options.length > 4 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 24 }}>
          {current.options.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => toggleOption(opt.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: `1.5px solid ${isSelected(opt.id) ? 'rgba(6,230,255,0.3)' : 'rgba(255,255,255,0.05)'}`,
                background: isSelected(opt.id) ? 'rgba(6,230,255,0.06)' : 'rgba(255,255,255,0.015)',
                cursor: 'pointer', transition: 'all 0.18s',
                fontFamily: 'inherit', textAlign: 'left', width: '100%',
                boxShadow: isSelected(opt.id) ? '0 0 0 1px rgba(6,230,255,0.15), 0 4px 16px rgba(6,230,255,0.08)' : 'none',
              }}
              onMouseEnter={e => { if (!isSelected(opt.id)) { e.currentTarget.style.borderColor = 'rgba(6,230,255,0.15)'; e.currentTarget.style.background = 'rgba(6,230,255,0.03)'; } }}
              onMouseLeave={e => { if (!isSelected(opt.id)) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; } }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: isSelected(opt.id) ? 'rgba(6,230,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected(opt.id) ? 'rgba(6,230,255,0.15)' : 'rgba(255,255,255,0.04)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected(opt.id) ? '#06E6FF' : 'rgba(255,255,255,0.2)', flexShrink: 0, transition: 'all 0.18s' }}>
                <opt.Icon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: isSelected(opt.id) ? '#fff' : '#E8EEFF', marginBottom: opt.desc ? 2 : 0 }}>{opt.label}</div>
                {opt.desc && <div style={{ fontSize: 11.5, color: isSelected(opt.id) ? '#7A90B8' : '#334566' }}>{opt.desc}</div>}
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `1.5px solid ${isSelected(opt.id) ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
                background: isSelected(opt.id) ? 'linear-gradient(135deg, #06E6FF, #00FF88)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 900, color: isSelected(opt.id) ? '#030508' : 'transparent',
                flexShrink: 0, transition: 'all 0.18s',
              }}>✓</div>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {step > 0 ? (
            <button onClick={goPrev} style={{ padding: '11px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', color: '#7A90B8', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 6 }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E8EEFF'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#7A90B8'; }}>← Back</button>
          ) : <div />}
          <button onClick={goNext} disabled={!canNext} style={{ flex: 1, padding: '13px 24px', borderRadius: 11, border: 'none', background: canNext ? 'linear-gradient(135deg, #06E6FF, #00FF88)' : 'rgba(255,255,255,0.04)', color: canNext ? '#030508' : 'rgba(255,255,255,0.15)', fontSize: 14, fontWeight: 800, cursor: canNext ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: canNext ? '0 0 24px rgba(6,230,255,0.2)' : 'none' }} onMouseEnter={e => { if (canNext) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(6,230,255,0.35)'; } }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canNext ? '0 0 24px rgba(6,230,255,0.2)' : 'none'; }}>
            {step === total - 1 ? 'View plans →' : 'Continue →'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
