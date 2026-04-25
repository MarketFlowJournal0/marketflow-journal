import React, { useState, useEffect, useRef } from 'react';

/* ===============================================================
   MARKETFLOW JOURNAL - Landing Page v5
   Premium - SVG Icons, Animated Logos, Updated Features
   =============================================================== */

// --- SVG Icons -------------------------------------------------------------
const Ic = {
  Journal: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 9h6M7 12h3"/></svg>,
  AI: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5A2 2 0 015 3h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-5 3.5V5z"/><circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="0.8" fill="currentColor" stroke="none"/></svg>,
  Analytics: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,15 6,9 10,12 15,4 18,6"/><path d="M15 2h3v3"/></svg>,
  Psychology: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a6 6 0 016 6c0 2.5-1.5 4.6-3.6 5.7L12.5 16l.5 2H7l.5-2 .1-.3A6 6 0 0110 2z"/><path d="M8 11h4"/></svg>,
  Backtest: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10.5" r="7"/><polyline points="10,6 10,10.5 13,12.5"/><path d="M5.5 3C3.5 4.5 2 7 2 10.5"/><polyline points="4.5,2 5.5,3 4.5,4.5"/></svg>,
  Prop: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l2.5 6H18l-4.5 3.5 1.5 5.5L10 13.5 4.5 17l1.5-5.5L1.5 8h5.5z"/></svg>,
};

const SUPPORT_EMAIL = 'support@marketflowjournal.com';

// --- Animated Canvas Background --------------------------------------------
function AnimatedBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, w, h;
    const particles = [], lines = [], orbs = [];
    const PC = 58, LC = 9, OC = 5;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    function init() {
      resize();
      particles.length = 0; lines.length = 0; orbs.length = 0;
      for (let i = 0; i < PC; i++) particles.push({ x: Math.random() * (w / devicePixelRatio), y: Math.random() * (h / devicePixelRatio), vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18, r: Math.random() * 1.3 + 0.35, o: Math.random() * 0.13 + 0.025 });
      for (let i = 0; i < LC; i++) {
        const pts = []; let x = Math.random() * (w / devicePixelRatio), y = Math.random() * (h / devicePixelRatio);
        for (let j = 0; j < 7; j++) { pts.push({ x, y }); x += (Math.random() - 0.36) * 150; y += (Math.random() - 0.5) * 94; }
        lines.push({ pts, o: Math.random() * 0.026 + 0.008, speed: Math.random() * 0.08 + 0.025 });
      }
      for (let i = 0; i < OC; i++) orbs.push({ x: Math.random() * (w / devicePixelRatio), y: Math.random() * (h / devicePixelRatio), r: 180 + Math.random() * 260, vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.5) * 0.08, hue: i % 2 ? '0,210,184' : '20,201,229', o: 0.025 + Math.random() * 0.035 });
    }
    function draw() {
      const rw = w / devicePixelRatio, rh = h / devicePixelRatio;
      ctx.clearRect(0, 0, rw, rh);
      orbs.forEach(o => {
        o.x += o.vx; o.y += o.vy;
        if (o.x < -o.r || o.x > rw + o.r) o.vx *= -1;
        if (o.y < -o.r || o.y > rh + o.r) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(${o.hue},${o.o})`);
        g.addColorStop(0.48, `rgba(${o.hue},${o.o * 0.28})`);
        g.addColorStop(1, `rgba(${o.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
      lines.forEach(l => { l.pts.forEach(p => { p.x += l.speed * 0.3; if (p.x > rw + 50) { p.x = -50; p.y = Math.random() * rh; } }); ctx.beginPath(); ctx.moveTo(l.pts[0].x, l.pts[0].y); for (let i = 1; i < l.pts.length; i++) { const pv = l.pts[i - 1], c = l.pts[i]; ctx.quadraticCurveTo(pv.x, pv.y, (pv.x + c.x) / 2, (pv.y + c.y) / 2); } ctx.strokeStyle = `rgba(6,230,255,${l.o})`; ctx.lineWidth = 0.7; ctx.stroke(); });
      particles.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > rw) p.vx *= -1; if (p.y < 0 || p.y > rh) p.vy *= -1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(6,230,255,${p.o})`; ctx.fill(); });
      for (let i = 0; i < particles.length; i++) for (let j = i + 1; j < particles.length; j++) { const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy); if (d < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(6,230,255,${0.03 * (1 - d / 120)})`; ctx.lineWidth = 0.5; ctx.stroke(); } }
      animId = requestAnimationFrame(draw);
    }
    init(); draw();
    const onR = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); init(); };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
}

// --- Scroll Reveal ---------------------------------------------------------
function useReveal() { const ref = useRef(null); const [v, setV] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.08 }); o.observe(el); return () => o.disconnect(); }, []); return [ref, v]; }
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useReveal();
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`, ...style }}>{children}</div>;
}

// --- Counter ---------------------------------------------------------------
function Counter({ end, suffix = '', prefix = '', duration = 2 }) {
  const [val, setVal] = useState(0);
  const [ref, v] = useReveal();
  useEffect(() => { if (!v) return; let s = 0; const step = end / (duration * 60); const tick = () => { s += step; if (s >= end) { setVal(end); return; } setVal(Math.round(s)); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, [v, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// --- Styles ----------------------------------------------------------------
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
  :root { --cyan:#14C9E5;--green:#00D2B8;--silver:#DCE4EF;--steel:#95A2B5;--purple:#6885FF;--blue:#1DC9FF;--gold:#D7B36A;--pink:#DF5F7A;--danger:#FF4D6A;--t0:#F7FAFC;--t1:#DCE7F2;--t2:#8EA0B8;--t3:#46566E;--bg:#01040A;--brd:#142033; }
  * { box-sizing:border-box;margin:0;padding:0; }
  html { scroll-behavior:smooth; }
  body { background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;overflow-x:hidden; }
  @keyframes flowgrad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .flow-text { background:linear-gradient(105deg,#F7FAFC 0%,#DCE4EF 24%,#14C9E5 58%,#00D2B8 100%);background-size:220% 220%;animation:flowgrad 5s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  @keyframes ticker-scroll { from{transform:translateX(0)}to{transform:translateX(-50%)} }
  @keyframes mf-shimmer { 0%{transform:translateX(-120%) skewX(-18deg)} 55%,100%{transform:translateX(160%) skewX(-18deg)} }
  @keyframes mf-float { 0%,100%{transform:translate3d(0,0,0)} 50%{transform:translate3d(0,-10px,0)} }
  @keyframes mf-pulse-line { 0%,100%{opacity:.35;transform:scaleX(.82)} 50%{opacity:1;transform:scaleX(1)} }
  @keyframes mf-scan { 0%{transform:translateY(-20%);opacity:0} 20%,80%{opacity:.55} 100%{transform:translateY(320%);opacity:0} }
  .lp-shell { background:
    radial-gradient(circle at 72% 8%, rgba(20,201,229,0.10), transparent 34%),
    radial-gradient(circle at 8% 92%, rgba(0,210,184,0.07), transparent 30%),
    linear-gradient(135deg,#000308 0%,#030914 42%,#01040A 100%);
    min-height:100vh;overflow-x:hidden;position:relative;
  }
  .lp-shell::before { content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background:
    linear-gradient(115deg,transparent 0 30%,rgba(255,255,255,0.035) 31%,transparent 32% 100%),
    repeating-linear-gradient(90deg,rgba(148,163,184,0.035) 0 1px,transparent 1px 120px);
    opacity:.26;mix-blend-mode:screen;
  }
  .lp-logo-img { width:100%;height:100%;object-fit:cover;filter:drop-shadow(0 16px 28px rgba(0,0,0,.42)); }

  /* NAV */
  .lp-nav { position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 48px;height:72px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,rgba(2,6,13,0.86),rgba(2,6,13,0.58));backdrop-filter:blur(26px) saturate(160%);border-bottom:1px solid rgba(220,228,239,0.06);transition:all 0.3s; }
  .lp-nav.scrolled { background:rgba(2,6,13,0.94);border-bottom-color:rgba(20,201,229,0.12);box-shadow:0 18px 50px rgba(0,0,0,.28); }
  .lp-nav-logo { display:flex;align-items:center;gap:10px;cursor:pointer; }
  .lp-nav-logo-icon { width:40px;height:40px;border-radius:12px;overflow:hidden;border:0;background:transparent;box-shadow:0 18px 38px rgba(0,0,0,.38),0 0 30px rgba(20,201,229,.12);position:relative; }
  .lp-nav-logo-icon::after { content:'';position:absolute;inset:-18px;background:radial-gradient(circle,rgba(20,201,229,.16),transparent 62%);z-index:-1; }
  .lp-nav-logo-text { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;color:var(--t0);letter-spacing:-0.5px; }
  .lp-nav-links { display:flex;align-items:center;gap:4px; }
  .lp-nav-links a { padding:8px 16px;border-radius:8px;color:var(--t2);text-decoration:none;font-size:13.5px;font-weight:500;transition:all 0.18s; }
  .lp-nav-links a:hover { color:var(--t0);background:rgba(255,255,255,0.04); }
  .lp-nav-cta { display:flex;align-items:center;gap:10px; }
  .btn-ghost { padding:8px 18px;border-radius:9px;border:1px solid var(--brd);background:transparent;color:var(--t1);font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s; }
  .btn-ghost:hover { border-color:var(--cyan);color:var(--cyan); }
  .btn-primary-nav { padding:9px 20px;border-radius:9px;background:linear-gradient(135deg,var(--cyan),var(--green));border:none;color:#01040A;font-size:13px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;box-shadow:0 0 20px rgba(6,230,255,0.25); }
  .btn-primary-nav:hover { transform:translateY(-1px);box-shadow:0 4px 30px rgba(6,230,255,0.4); }

  /* TICKER */
  .lp-ticker-wrap { overflow:hidden;background:rgba(2,6,13,0.74);border-top:1px solid rgba(20,201,229,0.05);border-bottom:1px solid rgba(220,228,239,0.04);padding:11px 0;white-space:nowrap;margin-top:72px;position:relative;backdrop-filter:blur(18px); }
  .lp-ticker { display:inline-flex;gap:0;animation:ticker-scroll 50s linear infinite; }

  /* LOGOS TICKER */
  .lp-logos { padding:34px 0 58px;overflow:hidden;position:relative;isolation:isolate; }
  .lp-logos::before { content:none; }
  .lp-logos::after { content:'';position:absolute;left:20%;right:20%;top:22px;height:120px;background:radial-gradient(circle,rgba(20,201,229,.09),transparent 70%);filter:blur(20px);z-index:-1; }
  .lp-logos-head { display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:22px; }
  .lp-logos-label { text-align:center;font-size:10px;color:rgba(220,228,239,.72);letter-spacing:2px;text-transform:uppercase;font-weight:800; }
  .lp-logos-note { padding:4px 9px;border-radius:999px;border:1px solid rgba(220,228,239,.08);background:rgba(255,255,255,.025);font-size:9px;color:rgba(142,160,184,.7);font-weight:800;letter-spacing:1px;text-transform:uppercase; }
  .lp-logos-track { display:inline-flex;gap:10px;animation:ticker-scroll 42s linear infinite;will-change:transform; }
  .lp-logo-item { display:inline-flex;align-items:center;justify-content:center;gap:10px;min-width:180px;padding:11px 18px;border-radius:999px;border:1px solid transparent;background:transparent;font-family:'Space Grotesk',sans-serif;color:var(--t0);opacity:0.62;transition:opacity 0.3s,transform .25s,text-shadow .25s;white-space:nowrap;text-shadow:0 0 24px rgba(20,201,229,.12); }
  .lp-logo-item strong { font-size:16px;font-weight:800;letter-spacing:-.03em; }
  .lp-logo-item em { font-style:normal;font-family:'JetBrains Mono',monospace;font-size:8px;font-weight:800;letter-spacing:1px;color:rgba(142,160,184,.72);text-transform:uppercase; }
  .lp-logo-item:hover { opacity:0.96;transform:translateY(-2px);text-shadow:0 0 30px rgba(20,201,229,.26); }

  /* HERO */
  .lp-hero { min-height:calc(100vh - 72px);padding:136px 48px 82px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden; }
  .lp-hero::before { content:'';position:absolute;top:11%;left:50%;width:min(760px,70vw);height:min(760px,70vw);transform:translateX(-50%);background:radial-gradient(circle,rgba(20,201,229,.13),rgba(0,210,184,.05) 34%,transparent 68%);filter:blur(8px);opacity:.72;animation:mf-float 8s ease-in-out infinite; }
  .lp-hero-badge { display:inline-flex;align-items:center;gap:8px;padding:7px 17px;border-radius:50px;border:1px solid rgba(220,228,239,0.12);background:linear-gradient(135deg,rgba(220,228,239,0.08),rgba(20,201,229,0.05));font-size:11px;font-weight:700;color:#bfefff;letter-spacing:0.5px;margin-bottom:28px;position:relative;overflow:hidden; }
  .lp-hero-badge::after { content:'';position:absolute;inset:0;width:42%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);animation:mf-shimmer 4.8s ease-in-out infinite; }
  .lp-badge-dot { width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:lp-blink 1.5s ease infinite; }
  @keyframes lp-blink{0%,100%{opacity:1}50%{opacity:0.2}}
  .lp-hero h1 { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(44px,6vw,82px);line-height:1.05;color:var(--t0);letter-spacing:-2px;margin-bottom:22px;max-width:900px; }
  .lp-hero-sub { font-size:18px;color:var(--t2);max-width:640px;line-height:1.7;margin-bottom:36px; }
  .lp-hero-actions { display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:14px; }
  .btn-hero-primary { padding:15px 32px;border-radius:12px;background:linear-gradient(135deg,#DCE4EF 0%,#14C9E5 46%,#00D2B8 100%);border:none;color:#02060D;font-size:15px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;box-shadow:0 0 42px rgba(20,201,229,0.28);display:flex;align-items:center;gap:8px;position:relative;overflow:hidden; }
  .btn-hero-primary::after { content:'';position:absolute;inset:0;width:45%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.42),transparent);animation:mf-shimmer 5s ease-in-out infinite; }
  .btn-hero-primary:hover { transform:translateY(-2px);box-shadow:0 8px 55px rgba(20,201,229,0.42); }
  .btn-hero-secondary { padding:15px 30px;border-radius:12px;border:1px solid var(--brd);background:rgba(255,255,255,0.03);color:var(--t1);font-size:15px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;display:flex;align-items:center;gap:8px; }
  .btn-hero-secondary:hover { border-color:var(--cyan);color:var(--cyan);background:rgba(6,230,255,0.04); }
  .lp-hero-note { font-size:11.5px;color:var(--t3); }
  .lp-hero-stats { display:flex;gap:0;margin-top:60px;border:1px solid rgba(220,228,239,0.08);border-radius:18px;background:linear-gradient(145deg,rgba(12,20,34,0.68),rgba(3,8,16,0.72));backdrop-filter:blur(24px);overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.34); }
  .lp-hero-stat { padding:24px 44px;flex:1;text-align:center;border-right:1px solid var(--brd);position:relative; }
  .lp-hero-stat:last-child { border-right:none; }
  .lp-hero-stat::after { content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--cyan),transparent);opacity:0;transition:opacity 0.3s; }
  .lp-hero-stat:hover::after { opacity:1; }
  .lp-stat-val { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:30px;color:var(--cyan);line-height:1;margin-bottom:5px; }
  .lp-stat-label { font-size:11px;color:var(--t3);font-weight:600;letter-spacing:0.8px;text-transform:uppercase; }

  /* SECTIONS */
  .lp-section { padding:100px 48px; }
  .lp-section-inner { max-width:1200px;margin:0 auto; }
  .lp-section-tag { display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:50px;border:1px solid rgba(6,230,255,0.2);background:rgba(6,230,255,0.05);font-size:10px;font-weight:700;color:var(--cyan);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:16px; }
  .lp-section h2 { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(32px,4vw,52px);line-height:1.1;color:var(--t0);letter-spacing:-1.5px;margin-bottom:14px; }
  .lp-section-sub { font-size:16px;color:var(--t2);max-width:580px;line-height:1.7; }

  /* FEATURES */
  .lp-features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:60px; }
  .lp-feature-card { padding:28px;border-radius:18px;border:1px solid rgba(220,228,239,0.08);background:linear-gradient(145deg,rgba(13,23,38,0.68),rgba(4,9,18,0.82));position:relative;overflow:hidden;transition:all 0.25s; }
  .lp-feature-card::before { content:'';position:absolute;inset:0;background:linear-gradient(115deg,transparent,rgba(220,228,239,.045),transparent);transform:translateX(-120%);transition:transform .7s ease; }
  .lp-feature-card:hover::before { transform:translateX(120%); }
  .lp-feature-card:hover { border-color:rgba(20,201,229,0.22);transform:translateY(-4px);box-shadow:0 18px 58px rgba(0,0,0,0.46); }
  .lp-feature-icon { width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--cyan);margin-bottom:14px;background:rgba(6,230,255,0.06);border:1px solid rgba(6,230,255,0.1); }
  .lp-feature-title { font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:16px;color:var(--t0);margin-bottom:6px; }
  .lp-feature-desc { font-size:13.5px;color:var(--t2);line-height:1.65; }

  /* BIG FEATURE */
  .lp-big-feat { display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-top:80px; }
  .lp-big-feat.reverse { direction:rtl; }
  .lp-big-feat.reverse > * { direction:ltr; }
  .lp-big-feat h3 { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(24px,2.5vw,34px);line-height:1.15;letter-spacing:-1px;color:var(--t0);margin-bottom:12px; }
  .lp-big-feat p { font-size:15px;color:var(--t2);line-height:1.75;margin-bottom:20px; }
  .lp-check-list { list-style:none;display:flex;flex-direction:column;gap:8px; }
  .lp-check-list li { display:flex;align-items:flex-start;gap:10px;font-size:14px;color:var(--t2); }
  .lp-check-ico { color:var(--green);font-weight:800;font-size:10px;width:18px;height:18px;border-radius:4px;background:rgba(0,255,136,0.08);border:1px solid rgba(0,255,136,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px; }
  .lp-big-visual { border-radius:22px;overflow:hidden;border:1px solid rgba(220,228,239,0.08);box-shadow:0 28px 80px rgba(0,0,0,0.54),inset 0 1px 0 rgba(255,255,255,.04);background:linear-gradient(155deg,rgba(8,16,28,.96),rgba(2,6,13,.94));position:relative; }
  .lp-big-visual::before { content:'';position:absolute;inset:0;background:radial-gradient(circle at 78% 10%,rgba(20,201,229,.14),transparent 34%);pointer-events:none; }
  .lp-visual-header { padding:10px 14px;background:rgba(6,9,18,0.9);border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:8px; }
  .lp-visual-title { font-size:10px;font-weight:700;color:var(--t2);letter-spacing:0.5px; }
  .lp-visual-badge { margin-left:auto;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;background:rgba(6,230,255,0.1);border:1px solid rgba(6,230,255,0.2);color:var(--cyan); }
  .lp-visual-body { padding:16px; }
  .lp-analytics-console { display:grid;grid-template-columns:168px 1fr;gap:14px;min-height:322px;position:relative; }
  .lp-module-rail { display:flex;flex-direction:column;gap:7px; }
  .lp-module-pill { border:1px solid rgba(220,228,239,0.08);background:rgba(255,255,255,0.025);border-radius:12px;padding:9px 10px;text-align:left;cursor:pointer;color:var(--t2);transition:all .24s ease;font-family:'Inter',sans-serif; }
  .lp-module-pill:hover { color:var(--t1);border-color:rgba(20,201,229,.22);background:rgba(20,201,229,.055); }
  .lp-module-pill.active { color:var(--t0);border-color:rgba(20,201,229,.42);background:linear-gradient(135deg,rgba(20,201,229,.12),rgba(0,210,184,.055));box-shadow:0 14px 32px rgba(0,0,0,.28); }
  .lp-module-pill span { display:block;font-size:9px;text-transform:uppercase;letter-spacing:1.1px;color:rgba(142,160,184,.68);margin-bottom:4px;font-weight:800; }
  .lp-module-pill strong { display:block;font-size:12.5px;letter-spacing:-.02em; }
  .lp-module-screen { border:1px solid rgba(220,228,239,0.08);border-radius:18px;background:radial-gradient(circle at 78% 8%,rgba(20,201,229,.13),transparent 34%),linear-gradient(160deg,rgba(8,17,30,.92),rgba(2,6,13,.86));padding:16px;position:relative;overflow:hidden; }
  .lp-module-screen::after { content:'';position:absolute;left:0;right:0;top:0;height:44%;background:linear-gradient(180deg,rgba(220,228,239,.06),transparent);opacity:.7;pointer-events:none; }
  .lp-scanline { position:absolute;left:16px;right:16px;height:1px;background:linear-gradient(90deg,transparent,rgba(20,201,229,.7),transparent);animation:mf-scan 3.6s linear infinite;z-index:2; }
  .lp-module-top { position:relative;z-index:3;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:14px; }
  .lp-module-kicker { font-size:9px;text-transform:uppercase;letter-spacing:1.2px;color:rgba(142,160,184,.72);font-weight:800;margin-bottom:6px; }
  .lp-module-title { font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:800;letter-spacing:-.05em;color:var(--t0);line-height:1; }
  .lp-module-copy { position:relative;z-index:3;max-width:460px;font-size:12.5px;line-height:1.7;color:var(--t2);margin-bottom:16px; }
  .lp-module-tags { position:relative;z-index:3;display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px; }
  .lp-module-tag { font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.9px;color:#bfefff;border:1px solid rgba(20,201,229,.18);background:rgba(20,201,229,.065);border-radius:999px;padding:5px 8px; }
  .lp-module-chart { position:relative;z-index:3;height:118px;display:flex;align-items:flex-end;gap:8px;padding:16px;border:1px solid rgba(220,228,239,0.07);border-radius:15px;background:rgba(255,255,255,0.025);overflow:hidden; }
  .lp-module-chart::before { content:'';position:absolute;left:16px;right:16px;top:50%;height:1px;background:linear-gradient(90deg,transparent,rgba(220,228,239,.12),transparent); }
  .lp-module-bar { flex:1;border-radius:8px 8px 3px 3px;min-height:18px;background:linear-gradient(180deg,rgba(220,228,239,.88),rgba(20,201,229,.48),rgba(0,210,184,.18));box-shadow:0 0 24px rgba(20,201,229,.16);transition:height .55s cubic-bezier(.2,.8,.2,1); }
  .lp-module-orbit { width:78px;height:78px;border-radius:50%;border:1px solid rgba(20,201,229,.28);background:radial-gradient(circle,rgba(20,201,229,.2),transparent 62%);position:relative;animation:mf-float 5.5s ease-in-out infinite;flex-shrink:0; }
  .lp-module-orbit::before,.lp-module-orbit::after { content:'';position:absolute;border-radius:50%;inset:12px;border:1px dashed rgba(220,228,239,.18); }
  .lp-module-orbit::after { inset:28px;background:linear-gradient(135deg,rgba(220,228,239,.6),rgba(20,201,229,.5));border:0;box-shadow:0 0 22px rgba(20,201,229,.42); }
  .lp-feature-progress { position:absolute;left:16px;right:16px;bottom:12px;height:2px;background:rgba(220,228,239,.08);border-radius:99px;overflow:hidden; }
  .lp-feature-progress span { display:block;height:100%;background:linear-gradient(90deg,#DCE4EF,#14C9E5,#00D2B8);animation:mf-pulse-line 2.4s ease-in-out infinite;transform-origin:left center; }

  /* COMPARE */
  .lp-compare { margin-top:60px;overflow-x:auto; }
  .lp-compare-table { width:100%;border-collapse:separate;border-spacing:0;min-width:600px; }
  .lp-compare-table th { padding:14px 20px;font-size:10px;font-weight:800;color:var(--t3);letter-spacing:1px;text-transform:uppercase;text-align:left;border-bottom:1px solid var(--brd); }
  .lp-compare-table th.hl { color:var(--cyan); }
  .lp-compare-table td { padding:14px 20px;font-size:13.5px;color:var(--t2);border-bottom:1px solid rgba(255,255,255,0.03); }
  .lp-compare-table td.hl { color:var(--t0);font-weight:600; }
  .cy { color:var(--green);font-weight:900;font-size:15px; }
  .cn { color:var(--t3);font-size:15px; }

  /* PRICING */
  .lp-pricing-toggle { display:flex;align-items:center;gap:14px;justify-content:center;margin-top:44px;margin-bottom:0; }
  .lp-toggle-btn { padding:8px 20px;border-radius:50px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:var(--t2);font-family:'Inter',sans-serif;transition:all 0.2s; }
  .lp-toggle-btn.active { background:var(--cyan);color:#01040A; }
  .lp-toggle-badge { background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);color:var(--green);font-size:10px;font-weight:700;padding:3px 10px;border-radius:50px;letter-spacing:0.04em; }
  .lp-pricing-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px; }
  .lp-pricing-card { padding:28px 24px;border-radius:18px;border:1px solid var(--brd);background:rgba(12,20,34,0.5);position:relative;overflow:hidden;transition:all 0.3s;display:flex;flex-direction:column; }
  .lp-pricing-card:hover { transform:translateY(-3px); }
  .lp-pricing-card.popular { border-color:rgba(6,230,255,0.35);background:linear-gradient(160deg,rgba(6,230,255,0.04),rgba(0,255,136,0.02),rgba(12,20,34,0.98));box-shadow:0 0 0 1px rgba(6,230,255,0.08),0 24px 48px rgba(0,0,0,0.5); }
  .lp-popular-badge { position:absolute;top:14px;right:14px;padding:3px 10px;border-radius:50px;background:linear-gradient(135deg,var(--cyan),var(--green));font-size:9px;font-weight:800;color:#01040A;letter-spacing:0.5px; }
  .lp-plan { font-size:10px;font-weight:800;color:var(--t3);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px; }
  .lp-price { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:46px;color:var(--t0);line-height:1;margin-bottom:4px;letter-spacing:-2px; }
  .lp-price sup { font-size:18px;vertical-align:super;letter-spacing:0; }
  .lp-period { font-size:12px;color:var(--t3);margin-bottom:4px; }
  .lp-save { display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:800;background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.2);color:var(--green);margin-bottom:18px; }
  .lp-divider { height:1px;background:var(--brd);margin:16px 0; }
  .lp-price-feats { list-style:none;display:flex;flex-direction:column;gap:9px;margin-bottom:24px;flex:1; }
  .lp-price-feats li { display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--t2); }
  .btn-plan { width:100%;padding:12px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;border:none; }
  .btn-plan.outline { background:transparent;border:1px solid var(--brd);color:var(--t1); }
  .btn-plan.outline:hover { border-color:var(--cyan);color:var(--cyan); }
  .btn-plan.filled { background:linear-gradient(135deg,var(--cyan),var(--green));color:#01040A;box-shadow:0 0 20px rgba(6,230,255,0.25); }
  .btn-plan.filled:hover { box-shadow:0 4px 32px rgba(6,230,255,0.4);transform:translateY(-1px); }

  /* TESTIMONIALS */
  .lp-testi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px; }
  .lp-testi-card { padding:22px;border-radius:14px;border:1px solid var(--brd);background:rgba(12,20,34,0.4);transition:all 0.25s; }
  .lp-testi-card:hover { border-color:rgba(255,255,255,0.08);transform:translateY(-2px); }
  .lp-stars { font-size:10px;color:var(--gold);margin-bottom:10px;letter-spacing:1px; }
  .lp-testi-text { font-size:13.5px;color:var(--t2);line-height:1.7;margin-bottom:16px;font-style:italic; }
  .lp-testi-text strong { color:var(--cyan);font-style:normal; }
  .lp-testi-author { display:flex;align-items:center;gap:10px; }
  .lp-avatar { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#01040A;flex-shrink:0; }
  .lp-testi-name { font-size:12.5px;font-weight:700;color:var(--t0); }
  .lp-testi-role { font-size:10.5px;color:var(--t3); }
  .lp-testi-pnl { display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;color:var(--green);background:rgba(0,255,136,0.06);border:1px solid rgba(0,255,136,0.15);padding:2px 7px;border-radius:4px;margin-top:4px; }

  /* FAQ */
  .lp-faq-list { margin-top:44px;display:flex;flex-direction:column;gap:8px;max-width:800px; }
  .lp-faq-item { border:1px solid var(--brd);border-radius:12px;background:rgba(12,20,34,0.4);overflow:hidden; }
  .lp-faq-q { padding:18px 22px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-size:14.5px;font-weight:600;color:var(--t1);transition:color 0.2s;user-select:none; }
  .lp-faq-q:hover { color:var(--cyan); }
  .lp-faq-arrow { color:var(--t3);font-size:18px;transition:transform 0.25s;line-height:1; }
  .lp-faq-item.open .lp-faq-arrow { transform:rotate(45deg);color:var(--cyan); }
  .lp-faq-a { max-height:0;overflow:hidden;transition:max-height 0.3s ease; }
  .lp-faq-item.open .lp-faq-a { max-height:200px; }
  .lp-faq-a-inner { padding:0 22px 18px;font-size:13.5px;color:var(--t2);line-height:1.7; }

  /* CTA */
  .lp-cta { padding:90px 48px;text-align:center;position:relative;overflow:hidden;border-top:1px solid rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.03); }
  .lp-cta h2 { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(34px,4.5vw,56px);letter-spacing:-1.5px;color:var(--t0);margin-bottom:12px;position:relative; }
  .lp-cta p { font-size:17px;color:var(--t2);margin-bottom:32px;position:relative; }
  .lp-cta-actions { display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative; }
  .lp-cta-note { font-size:11px;color:var(--t3);margin-top:14px;position:relative; }

  /* FOOTER */
  .lp-footer { padding:60px 48px 32px;border-top:1px solid rgba(255,255,255,0.03); }
  .lp-footer-inner { max-width:1200px;margin:0 auto; }
  .lp-footer-top { display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:36px;margin-bottom:40px; }
  .lp-footer-brand p { font-size:12.5px;color:var(--t3);line-height:1.65;margin-top:10px;max-width:300px; }
  .lp-footer-col h4 { font-size:10px;font-weight:800;color:var(--t2);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px; }
  .lp-footer-col a { display:block;font-size:12.5px;color:var(--t3);text-decoration:none;margin-bottom:8px;transition:color 0.18s; }
  .lp-footer-col a:hover { color:var(--t1); }
  .lp-footer-bottom { padding-top:20px;border-top:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px; }
  .lp-footer-bottom p { font-size:11.5px;color:var(--t3); }
  .lp-social-row { display:flex;gap:6px; }
  .lp-social-btn { min-width:30px;height:30px;padding:0 10px;border-radius:7px;border:1px solid var(--brd);background:transparent;color:var(--t3);font-size:12px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;text-decoration:none; }
  .lp-social-btn:hover { border-color:var(--cyan);color:var(--cyan); }

  /* MODAL */
  .lp-modal-overlay { position:fixed;inset:0;background:rgba(2,4,10,0.85);backdrop-filter:blur(12px);z-index:10000;display:flex;align-items:center;justify-content:center; }
  .lp-modal { width:640px;max-height:80vh;overflow:auto;background:linear-gradient(160deg,#0C1830,#080F1E);border:1px solid var(--brd);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,0.6); }
  .lp-modal-header { padding:24px 28px 18px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:flex-start; }
  .lp-modal-close { width:32px;height:32px;border-radius:8px;border:1px solid var(--brd);background:transparent;color:var(--t2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0; }
  .lp-modal-close:hover { border-color:var(--cyan);color:var(--cyan); }
  .lp-modal-body { padding:24px 28px; }
  .lp-footer-mark { width:42px;height:42px;border-radius:13px;overflow:hidden;border:0;background:transparent;box-shadow:0 0 38px rgba(20,201,229,.16),0 16px 34px rgba(0,0,0,.38);position:relative; }
  .lp-footer-mark::after { content:'';position:absolute;inset:-22px;background:radial-gradient(circle,rgba(20,201,229,.18),transparent 62%);z-index:-1; }
  .lp-footer-brand-row { display:flex;align-items:center;gap:11px; }
  .lp-resource-link { display:flex!important;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(220,228,239,.035);padding-bottom:7px;margin-bottom:7px!important; }
  .lp-resource-link span { color:rgba(20,201,229,.62);font-size:10px;letter-spacing:.08em;text-transform:uppercase; }

  @media (max-width:900px) {
    .lp-features-grid,.lp-pricing-grid,.lp-testi-grid { grid-template-columns:1fr; }
    .lp-big-feat { grid-template-columns:1fr; }
    .lp-analytics-console { grid-template-columns:1fr; }
    .lp-module-rail { display:grid;grid-template-columns:repeat(2,1fr); }
    .lp-hero-stats { flex-direction:column; }
    .lp-hero-stat { border-right:none!important;border-bottom:1px solid var(--brd); }
    .lp-footer-top { grid-template-columns:1fr 1fr; }
    .lp-nav { padding:0 20px; }
    .lp-nav-links { display:none; }
    .lp-section { padding:60px 20px; }
    .lp-module-top { flex-direction:column; }
  }
`;

// --- Live Ticker -----------------------------------------------------------
const MODULE_TICKER = [
  ['Journal', 'CSV / Excel / JSON import'],
  ['Dashboard', 'Account scope and workflow'],
  ['Analytics', 'Starter basics to Elite intelligence'],
  ['Psychology', 'Mental score and behavior review'],
  ['Backtest', 'Plan-based replay sessions'],
  ['Reports', 'HTML, CSV and backup exports'],
  ['Alerts', 'Custom risk notifications'],
  ['API', 'Elite access surface'],
];

function LiveTickerBar() {
  const doubled = [...MODULE_TICKER, ...MODULE_TICKER];
  return (
    <div className="lp-ticker-wrap">
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:60,background:'linear-gradient(90deg,rgba(3,5,8,0.95),transparent)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:60,background:'linear-gradient(270deg,rgba(3,5,8,0.95),transparent)',zIndex:2,pointerEvents:'none'}}/>
      <div className="lp-ticker">
        {doubled.map(([name, detail],i)=>(
          <span key={`${name}-${i}`} style={{display:'inline-flex',alignItems:'center',gap:10,padding:'0 20px',borderRight:'1px solid rgba(255,255,255,0.03)'}}>
            <span style={{color:'#D8E8FF',fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:'1px',textTransform:'uppercase'}}>{name}</span>
            <span style={{color:'#3A5070',fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:500}}>{detail}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
const PROP_ENVIRONMENTS = [
  { name: 'FTMO', type: 'FX' },
  { name: 'The5ers', type: 'FX' },
  { name: 'Topstep', type: 'Futures' },
  { name: 'FundedNext', type: 'CFD' },
  { name: 'Funding Pips', type: 'CFD' },
  { name: 'E8 Markets', type: 'CFD' },
  { name: 'Alpha Capital Group', type: 'CFD' },
  { name: 'Blue Guardian', type: 'CFD' },
  { name: 'MyFundedFX', type: 'CFD' },
  { name: 'Apex Trader Funding', type: 'Futures' },
  { name: 'Take Profit Trader', type: 'Futures' },
  { name: 'OneUp Trader', type: 'Futures' },
];

const FAQS = [
  {q:'How do I import trades?',a:'MarketFlow currently supports CSV, Excel, JSON and pasted tables with column mapping, custom columns and account-aware storage.'},
  {q:'How does the 14-day trial work?',a:'Choose a plan, start the 14-day trial through Stripe, and keep access while your subscription status is trialing or active. Billing starts after the trial unless cancelled.'},
  {q:'Can I use MarketFlow with a prop firm?',a:'Yes. MarketFlow is built for prop-style review workflows, account tracking, reports, alerts and risk discipline. Firm names shown are examples, not partnerships.'},
  {q:'Are my data secure?',a:'Your journal data stays attached to your authenticated account. You can export backups and delete your trades from the journal.'},
  {q:'What is actually available today?',a:'The public page describes live product modules only: journal, dashboard, analytics, psychology, equity, backtest sessions, reports, alerts, API access and Elite broker tooling.'},
  {q:'What is the refund policy?',a:'Refund requests are handled by support within a 7-day window after the first paid charge. Contact support with the account email and invoice context.'},
];

const TESTIS = [
  {i:'01',name:'No invented traction',role:'Public site standard',pnl:'Transparent',stars:5,grad:'linear-gradient(135deg,#14C9E5,#00D2B8)',text:'No fake user counters, fake trade volume, invented ratings or synthetic testimonials are used on this landing page.'},
  {i:'02',name:'Plan-gated product',role:'Subscription standard',pnl:'Starter / Pro / Elite',stars:5,grad:'linear-gradient(135deg,#00D2B8,#4D7CFF)',text:'Modules are presented according to the access model currently used in the journal, including Starter analytics basics and Elite-only tooling.'},
  {i:'03',name:'Data ownership',role:'Journal standard',pnl:'Exportable',stars:5,grad:'linear-gradient(135deg,#14C9E5,#4D7CFF)',text:'The journal includes backup export, restore flows and full trade deletion controls with confirmation inside the product.'},
];
const PAGE_CONTENT = {
  changelog:{title:'Changelog',subtitle:'Update history',color:'#14C9E5',items:[{v:'Current',date:'2026',badge:'LIVE',badgeColor:'#00D2B8',items:['Landing page restored to the earlier site structure','New MF logo system across public and app surfaces','Reports, alerts, API access and Elite trade copier surfaces live in the product']}]},
  roadmap:{title:'Roadmap',subtitle:'Next product priorities',color:'#B06EFF',sections:[{label:'Near term',color:'#00D2B8',items:[{icon:'AI',title:'AI workflows',desc:'Sharper assistant flows inside the MarketFlow chatbot'},{icon:'Mobile',title:'Mobile app',desc:'Dedicated mobile experience beyond the current PWA foundation'},{icon:'Broker',title:'Broker execution bridge',desc:'Real broker connectivity requires platform-specific bridges and secure backend routing'}]}]},
  docs:{title:'Documentation',subtitle:'MarketFlow operating guide',color:'#14C9E5',sections:[{label:'Core workflow',color:'#14C9E5',items:[{icon:'01',title:'Import and map trades',desc:'Use All Trades to import CSV, Excel, JSON or pasted tables, then map symbol, side, date, entry, exit, P&L and custom fields.'},{icon:'02',title:'Review by account',desc:'Use account scope so dashboard, analytics, equity and calendar views stay aligned with the selected trading account.'},{icon:'03',title:'Close the day',desc:'Use the daily workflow, psychology review and calendar context to keep the journal actionable instead of noisy.'}]}]},
  import:{title:'Import Guide',subtitle:'Supported trade data flows',color:'#00D2B8',sections:[{label:'Import sources',color:'#00D2B8',items:[{icon:'CSV',title:'CSV and Excel',desc:'Upload broker exports or spreadsheets and create missing columns during mapping when your file has extra fields.'},{icon:'JSON',title:'JSON and raw tables',desc:'Paste structured rows or use JSON-style exports for flexible journal migration.'},{icon:'SAFE',title:'Validation first',desc:'MarketFlow previews detected rows before saving so bad rows can be corrected instead of silently polluting the journal.'}]}]},
  api:{title:'API Reference',subtitle:'Elite automation surface',color:'#4D7CFF',sections:[{label:'Access model',color:'#4D7CFF',items:[{icon:'Elite',title:'Elite-only access',desc:'API access is positioned for Elite users who need automation around journal data and operational workflows.'},{icon:'Auth',title:'Authenticated usage',desc:'Any production API workflow must use authenticated account access and should never expose private journal data publicly.'},{icon:'Road',title:'Implementation note',desc:'The public site describes the current access surface. Deeper endpoint documentation should be published as backend endpoints mature.'}]}]},
  tutoriels:{title:'Tutorials',subtitle:'Short workflow lessons',color:'#DCE4EF',sections:[{label:'Suggested lessons',color:'#DCE4EF',items:[{icon:'Start',title:'First journal setup',desc:'Create the account, confirm plan access, import the first data sample and verify dashboard metrics.'},{icon:'Review',title:'Weekly review',desc:'Use analytics, calendar, psychology and equity together to identify one process improvement for the next week.'},{icon:'Risk',title:'Prop-style discipline',desc:'Track drawdown, account scope, reports and alerts without implying a direct partnership with any prop firm.'}]}]},
  cgu:{title:'Terms of Service',subtitle:'Effective 2026',color:'#8BA3CC',articles:[{title:'Purpose',text:'These terms describe access to MarketFlow Journal, a SaaS trading journal for tracking, reviewing and improving trading activity.'},{title:'Billing',text:'Payments and trials are handled by Stripe. Subscription access depends on the active plan and payment status. Billing starts after the 14-day trial unless cancelled.'},{title:'Refunds',text:'Refund requests are handled by support within a 7-day window after the first paid charge.'},{title:'Trading disclaimer',text:'MarketFlow is a journaling and analytics product. It does not provide financial advice or guarantee trading results.'}]},
  rgpd:{title:'Privacy Policy',subtitle:'Data and privacy',color:'#00D2B8',articles:[{title:'Collected data',text:'Account details, journal data and technical data may be stored to operate the service. Payment data is processed by Stripe.'},{title:'User control',text:'Users can export backups and delete journal trades through the product.'},{title:'Contact',text:`For privacy requests, contact ${SUPPORT_EMAIL}.`}]},
  contact:{title:'Contact',subtitle:'Get in touch',color:'#4D7CFF',content:`Email: ${SUPPORT_EMAIL}\n\nFor support, use the journal support page or the support widget.`},
};

const ANALYTICS_SHOWCASE = [
  {
    id: 'dashboard',
    title: 'Command Dashboard',
    label: 'Daily control room',
    copy: 'Account scope, workflow, P&L, risk, calendar context and leaderboard signals in one calm opening view.',
    meta: ['Account scope', 'Daily workflow', 'Rank snapshot'],
    bars: [62, 46, 72, 58, 84, 68, 92],
    gradient: 'linear-gradient(135deg,#d7e2ee,#14c9e5)',
  },
  {
    id: 'trades',
    title: 'All Trades',
    label: 'Execution ledger',
    copy: 'Import CSV, Excel, JSON or pasted tables, map columns, create missing fields and keep every trade reviewable.',
    meta: ['Column mapping', 'Custom fields', 'Account-aware'],
    bars: [38, 64, 54, 76, 48, 70, 58],
    gradient: 'linear-gradient(135deg,#9ce9f5,#00d2b8)',
  },
  {
    id: 'analytics',
    title: 'Analytics Pro',
    label: 'Real journal intelligence',
    copy: 'Win rate, expectancy, drawdown, sessions, setups, confluences, long vs short and heatmaps from the same trade stream.',
    meta: ['Winrate depth', 'Drawdown reality', 'Confluences'],
    bars: [44, 55, 71, 63, 88, 79, 95],
    gradient: 'linear-gradient(135deg,#dce4ef,#22d3ee)',
  },
  {
    id: 'psychology',
    title: 'Psychology',
    label: 'Behavior layer',
    copy: 'Mood, discipline, confidence, patience and routine tracking connect mental performance to actual trading results.',
    meta: ['Mental score', 'Bias patterns', 'Routine review'],
    bars: [78, 66, 52, 69, 57, 81, 74],
    gradient: 'linear-gradient(135deg,#95a2b5,#15c7d7)',
  },
  {
    id: 'equity',
    title: 'Equity Curve',
    label: 'Capital path',
    copy: 'Track cumulative performance, drawdown zones, recovery behavior and account-by-account equity development.',
    meta: ['Curve', 'Drawdown', 'Recovery'],
    bars: [31, 42, 39, 55, 70, 66, 86],
    gradient: 'linear-gradient(135deg,#cfd8e3,#00d2b8)',
  },
  {
    id: 'backtest',
    title: 'Backtest Sessions',
    label: 'Replay discipline',
    copy: 'Plan-gated sessions help traders review strategy ideas without mixing practice data with live journal results.',
    meta: ['1 Starter', '5 Pro', '25 Elite'],
    bars: [22, 34, 48, 41, 63, 58, 73],
    gradient: 'linear-gradient(135deg,#c8d3df,#4db7ff)',
  },
  {
    id: 'reports',
    title: 'Reports, Alerts and API',
    label: 'Operational stack',
    copy: 'Export reports, configure risk alerts and open Elite API surfaces when the workflow needs more automation.',
    meta: ['Reports', 'Alerts', 'Elite API'],
    bars: [55, 47, 68, 72, 59, 83, 77],
    gradient: 'linear-gradient(135deg,#f1f5f9,#14c9e5)',
  },
  {
    id: 'broker',
    title: 'Broker and Copier Desk',
    label: 'Elite infrastructure',
    copy: 'Broker sync and Elite trade copier surfaces are organized for multi-account review and risk visibility.',
    meta: ['Broker sync', 'Accounts', 'Elite copier'],
    bars: [28, 52, 45, 69, 61, 88, 80],
    gradient: 'linear-gradient(135deg,#aab7c5,#00d2b8)',
  },
];
function PageModal({ page, onClose }) {
  const c = PAGE_CONTENT[page];
  if (!c) return null;
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={e=>e.stopPropagation()}>
        <div className="lp-modal-header"><div><h3 style={{fontSize:18,fontWeight:800,color:'#fff',margin:0}}>{c.title}</h3><p style={{fontSize:12,color:'#7A90B8',margin:'4px 0 0'}}>{c.subtitle}</p></div><button className="lp-modal-close" onClick={onClose}>x</button></div>
        <div className="lp-modal-body">
          {c.items?.map((item,i) => (<div key={i} style={{marginBottom:20}}><div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}><span style={{fontSize:13,fontWeight:800,color:c.color}}>{item.v||item.label}</span>{item.badge&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:8,fontWeight:800,background:`${item.badgeColor}15`,border:`1px solid ${item.badgeColor}30`,color:item.badgeColor}}>{item.badge}</span>}<span style={{fontSize:11,color:'#334566'}}>{item.date}</span></div>{(item.items||[]).map((t,j)=><div key={j} style={{fontSize:13,color:'#7A90B8',padding:'4px 0 4px 16px',lineHeight:1.6}}>{t}</div>)}</div>))}
          {c.sections?.map((sec,i) => (<div key={i} style={{marginBottom:20}}><div style={{fontSize:13,fontWeight:700,color:sec.color,marginBottom:10}}>{sec.label}</div>{(sec.items||[]).map((item,j)=>(<div key={j} style={{display:'flex',gap:10,marginBottom:12}}><span style={{fontSize:16}}>{item.icon}</span><div><div style={{fontSize:13,fontWeight:700,color:'#E8EEFF'}}>{item.title}</div><div style={{fontSize:12,color:'#7A90B8',lineHeight:1.55}}>{item.desc}</div></div></div>))}</div>))}
          {c.articles?.map((a,i) => (<div key={i} style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:'#E8EEFF',marginBottom:4}}>{a.title}</div><div style={{fontSize:12.5,color:'#7A90B8',lineHeight:1.65}}>{a.text}</div></div>))}
          {c.content&&<div style={{fontSize:13,color:'#7A90B8',lineHeight:1.7,whiteSpace:'pre-wrap'}}>{c.content}</div>}
        </div>
      </div>
    </div>
  );
}

// --- Main ------------------------------------------------------------------
export default function LandingPage({ onLogin, onSignup, onSignupWithPlan }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);
  const [billing, setBilling] = useState('monthly');
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveModule((current) => (current + 1) % ANALYTICS_SHOWCASE.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const activeShowcase = ANALYTICS_SHOWCASE[activeModule];

  const PLANS = [
    { id:'starter', name:'Starter', monthly:15, annual:11, priceMonthly:'price_1T9t9L2Ouddv7uendIMAR6IP', priceAnnual:'price_1TDQ7w2Ouddv7ueno5CuaNTH', desc:'Core journal and review workflow', features:['Unlimited trade journal','Dashboard and daily workflow','CSV, Excel and JSON import','Performance calendar','1 backtest session'] },
    { id:'pro', name:'Pro', monthly:22, annual:15, priceMonthly:'price_1T9t9U2Ouddv7uenfg38PRZ2', priceAnnual:'price_1T9t9U2Ouddv7uenK6oT1O13', desc:'Deeper review stack for active traders', features:['Everything in Starter','Advanced Pro analytics','Psychology tracker','Equity curve and drawdown','Broker desk access','5 backtest sessions','Report exports'], popular:true },
    { id:'elite', name:'Elite', monthly:38, annual:27, priceMonthly:'price_1T9t9L2Ouddv7uen4DXuOatj', priceAnnual:'price_1T9t9K2Ouddv7uennnWOJ44p', desc:'Highest-access MarketFlow workspace', features:['Everything in Pro','AI assistant access','Unlimited accounts','Alerts and notifications','API access','25 backtest sessions','Elite trade copier desk'] },
  ];

  return (
    <div className="lp-shell">
      <style>{STYLES}</style>
      <AnimatedBg />

      {/* NAV */}
      <nav className={`lp-nav ${scrolled?'scrolled':''}`}>
        <div className="lp-nav-logo" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <div className="lp-nav-logo-icon"><img className="lp-logo-img" src="/logo-mark.png" alt="" /></div>
          <span className="lp-nav-logo-text">Market<span className="flow-text">Flow</span></span>
        </div>
        <div className="lp-nav-links"><a href="#features">Product</a><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="/changelog">Changelog</a><a href="/roadmap">Roadmap</a><a href="/docs">Resources</a></div>
        <div className="lp-nav-cta"><button className="btn-ghost" onClick={onLogin}>Log in</button><button className="btn-primary-nav" onClick={onSignup}>Start 14-day trial</button></div>
      </nav>

      <LiveTickerBar />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-badge"><div className="lp-badge-dot"/>Professional journal. Real execution discipline.</div>
        <Reveal><h1>MarketFlow Journal.<br/><span className="flow-text">Turn execution into a system.</span></h1></Reveal>
        <Reveal delay={0.1}><p className="lp-hero-sub">A premium trading workspace built to make every import, review, psychology check, equity read and report feel connected, serious and repeatable.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="lp-hero-actions">
            <button className="btn-hero-primary" onClick={onSignup}>Start your 14-day trial</button>
            <button className="btn-hero-secondary" onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>See how it works</button>
          </div>
        </Reveal>
        <Reveal delay={0.3}><p className="lp-hero-note">14-day trial - billing starts after the trial unless cancelled</p></Reveal>
        <Reveal delay={0.4}>
          <div className="lp-hero-stats">
            <div className="lp-hero-stat"><div className="lp-stat-val">14</div><div className="lp-stat-label">Trial days</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val">3</div><div className="lp-stat-label">Plans</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val">25</div><div className="lp-stat-label">Elite sessions</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val">CSV</div><div className="lp-stat-label">Excel and JSON</div></div>
          </div>
        </Reveal>
      </section>

      {/* PROP ENVIRONMENTS TICKER */}
      <div className="lp-logos">
        <div className="lp-logos-head">
          <div className="lp-logos-label">Prop-style environments traders recognize</div>
          <div className="lp-logos-note">Examples only - no partnership implied</div>
        </div>
        <div style={{overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width:120,background:'linear-gradient(90deg,#01040A,transparent)',zIndex:2,pointerEvents:'none'}}/>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:120,background:'linear-gradient(270deg,#01040A,transparent)',zIndex:2,pointerEvents:'none'}}/>
          <div className="lp-logos-track">
            {[...PROP_ENVIRONMENTS,...PROP_ENVIRONMENTS].map((firm,i)=>(
              <span key={`${firm.name}-${i}`} className="lp-logo-item">
                <strong>{firm.name}</strong>
                <em>{firm.type}</em>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">MarketFlow Features</div></Reveal>
          <Reveal><h2>A calmer workspace for<br/><em>high-standard traders</em></h2></Reveal>
          <Reveal><p className="lp-section-sub">MarketFlow keeps the interface focused, then lets the data work underneath: trades, accounts, analytics, psychology, equity and reports stay connected.</p></Reveal>
          <div className="lp-features-grid">
            {[
              {Icon:Ic.Journal,title:'Smart Trade Journal',desc:'Import CSV, Excel, JSON or pasted tables, then map base fields and custom columns into a clean execution ledger.'},
              {Icon:Ic.AI,title:'AI Trade Coach',desc:'The assistant lives inside the journal chatbot and helps review patterns, behavior and decision quality from your saved data.'},
              {Icon:Ic.Analytics,title:'Advanced Analytics',desc:'Win rate, profit factor, expectancy, drawdown, equity and session reads stay tied to the same trade stream.'},
              {Icon:Ic.Psychology,title:'Psychology Tracker',desc:'Track your emotional state, identify tilt patterns, and understand how your mindset directly affects your P&L.'},
              {Icon:Ic.Backtest,title:'Strategy Backtesting',desc:'Create and resume plan-gated backtest sessions, review replay notes, and connect the work back to your journal.'},
              {Icon:Ic.Prop,title:'Prop Firm Ready',desc:'Built around prop-style workflows, account scope, reports, alerts and risk discipline. No partnership is implied.'},
            ].map((f,i)=>(<Reveal key={i} delay={i*0.08}><div className="lp-feature-card"><div className="lp-feature-icon"><f.Icon /></div><div className="lp-feature-title">{f.title}</div><div className="lp-feature-desc">{f.desc}</div></div></Reveal>))}
          </div>
        </div>
      </section>

      {/* BIG FEATURES */}
      <section className="lp-section" id="analytics" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal>
            <div className="lp-big-feat">
              <div>
                <div className="lp-section-tag">MarketFlow Analytics</div>
                <h3>Every module, one<br/><em>connected review system</em></h3>
                <p>MarketFlow is not a dashboard full of random widgets. It is a daily review engine where trades, accounts, psychology, equity, reports and alerts speak the same language.</p>
                <ul className="lp-check-list">{['Interactive module preview across the live product stack','Analytics tied to the same imported trade stream','Plan-aware access without fake counters or invented proof','Professional review flow for solo traders, prop traders and teams'].map((t,i)=><li key={i}><span className="lp-check-ico">+</span>{t}</li>)}</ul>
              </div>
              <div className="lp-big-visual">
                <div className="lp-visual-header"><span className="lp-visual-title">MarketFlow Analytics Preview</span><span className="lp-visual-badge">INTERACTIVE</span></div>
                <div className="lp-visual-body">
                  <div className="lp-analytics-console">
                    <div className="lp-module-rail">
                      {ANALYTICS_SHOWCASE.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`lp-module-pill ${activeModule === index ? 'active' : ''}`}
                          onMouseEnter={() => setActiveModule(index)}
                          onFocus={() => setActiveModule(index)}
                        >
                          <span>{item.label}</span>
                          <strong>{item.title}</strong>
                        </button>
                      ))}
                    </div>
                    <div className="lp-module-screen">
                      <div className="lp-scanline" />
                      <div className="lp-module-top">
                        <div>
                          <div className="lp-module-kicker">{activeShowcase.label}</div>
                          <div className="lp-module-title">{activeShowcase.title}</div>
                        </div>
                        <div className="lp-module-orbit" style={{ background: activeShowcase.gradient }} />
                      </div>
                      <div className="lp-module-copy">{activeShowcase.copy}</div>
                      <div className="lp-module-tags">
                        {activeShowcase.meta.map((item) => <span key={item} className="lp-module-tag">{item}</span>)}
                      </div>
                      <div className="lp-module-chart">
                        {activeShowcase.bars.map((height, index) => (
                          <div key={`${activeShowcase.id}-${index}`} className="lp-module-bar" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      <div className="lp-feature-progress"><span /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-big-feat reverse">
              <div>
                <div className="lp-section-tag">MarketFlow AI Coach</div>
                <h3>Your personal<br/><em>trading psychologist</em></h3>
                <p>MarketFlow AI helps review patterns, emotional context and execution quality from your saved journal data.</p>
                <ul className="lp-check-list">{['Automatic bias detection (revenge trading, FOMO, overtrading)','Personalized improvement recommendations','Pattern recognition across hundreds of trades','Natural language chat about your trading'].map((t,i)=><li key={i}><span className="lp-check-ico">+</span>{t}</li>)}</ul>
              </div>
              <div className="lp-big-visual">
                <div className="lp-visual-header"><span className="lp-visual-title">AI Coach Analysis</span><span className="lp-visual-badge">ASSISTANT</span></div>
                <div className="lp-visual-body" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.8}}>
                  <div style={{color:'#7A90B8',marginBottom:8}}>Signal: <span style={{color:'#14C9E5'}}>Pattern detected</span></div>
                  <div style={{color:'#E8EEFF',marginBottom:4}}>Review loss-after-loss behavior with</div>
                  <div style={{color:'#E8EEFF',marginBottom:4}}>your saved trades and notes.</div>
                  <div style={{color:'#334566',marginBottom:12}}>The assistant surfaces the pattern for review.</div>
                  <div style={{color:'#00D2B8',marginBottom:4}}>Action: Recommendation:</div>
                  <div style={{color:'#E8EEFF'}}>Add a cooldown rule, note the context,</div>
                  <div style={{color:'#E8EEFF'}}>and compare future sessions against it.</div>
                  <div style={{color:'#334566',marginTop:8}}>Linked to psychology and trade history</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ACCESS MATRIX */}
      <section className="lp-section" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Access</div></Reveal>
          <Reveal><h2>Choose the depth<br/><em>your workflow needs</em></h2></Reveal>
          <div className="lp-compare">
            <table className="lp-compare-table">
              <thead><tr><th>Module</th><th className="hl">Starter</th><th>Pro</th><th>Elite</th></tr></thead>
              <tbody>
                {[
                  ['Trade journal and imports','Included','Included','Included'],
                  ['Analytics','Basic','Advanced','Advanced plus Elite layers'],
                  ['Psychology tracker','Core','Full','Full'],
                  ['Backtest sessions','1','5','25'],
                  ['Reports and alerts','Limited','Included','Advanced'],
                  ['API and trade copier','-','-','Included'],
                ].map((r,i)=>(
                  <tr key={i}><td className="hl">{r[0]}</td><td className="hl">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      {/* PRICING */}
      <section className="lp-section" id="pricing" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">MarketFlow Pricing</div></Reveal>
          <Reveal><h2>Start with a trial. Scale<br/><em>when you're ready</em></h2></Reveal>
          <Reveal><p className="lp-section-sub">14-day trial on every plan. Billing starts after the trial unless cancelled. Refund requests are handled by support within 7 days after the first paid charge.</p></Reveal>
          <div className="lp-pricing-toggle">
            <button className={`lp-toggle-btn ${billing==='monthly'?'active':''}`} onClick={()=>setBilling('monthly')}>Monthly</button>
            <button className={`lp-toggle-btn ${billing==='annual'?'active':''}`} onClick={()=>setBilling('annual')}>Annual</button>
            <span className="lp-toggle-badge">-30% on Pro & Elite</span>
          </div>
          <div className="lp-pricing-grid">
            {PLANS.map((plan,i) => {
              const price = billing === 'monthly' ? plan.monthly : plan.annual;
              const priceId = billing === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
              const annualSave = (plan.monthly - plan.annual) * 12;
              return (
                <Reveal key={plan.id} delay={i*0.1}>
                  <div className={`lp-pricing-card ${plan.popular?'popular':''}`}>
                    {plan.popular && <div className="lp-popular-badge">Most popular</div>}
                    <div className="lp-plan">{plan.name}</div>
                    <div className="lp-price"><sup>$</sup>{price}</div>
                    <div className="lp-period">per month{billing==='annual'?', billed annually':''}</div>
                    {billing==='annual' && <div className="lp-save">Save ${annualSave}/year</div>}
                    {billing==='monthly' && <div className="lp-save">14-day trial</div>}
                    <div className="lp-divider"/>
                    <ul className="lp-price-feats">{plan.features.map((f,j)=><li key={j}><span style={{color:'#00D2B8',fontWeight:800,fontSize:11}}>+</span>{f}</li>)}</ul>
                    <button className={`btn-plan ${plan.popular?'filled':'outline'}`} onClick={()=>onSignupWithPlan?onSignupWithPlan(priceId):onSignup?.()}>{plan.popular?'Start 14-day trial':'Start '+plan.name}</button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="lp-section" id="reviews" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">Trust</div></Reveal>
          <Reveal><h2>Clear promises.<br/><em>No invented proof.</em></h2></Reveal>
          <div className="lp-testi-grid">
            {TESTIS.map((t,i)=>(<Reveal key={i} delay={i*0.08}><div className="lp-testi-card"><div className="lp-stars">MARKETFLOW STANDARD</div><div className="lp-testi-text" dangerouslySetInnerHTML={{__html:t.text}}/><div className="lp-testi-author"><div className="lp-avatar" style={{background:t.grad}}>{t.i}</div><div><div className="lp-testi-name">{t.name}</div><div className="lp-testi-role">{t.role}</div><div className="lp-testi-pnl">{t.pnl}</div></div></div></div></Reveal>))}
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="lp-section" id="faq" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">MarketFlow FAQ</div></Reveal>
          <Reveal><h2>Common questions</h2></Reveal>
          <div className="lp-faq-list">
            {FAQS.map((f,i)=>(<div key={i} className={`lp-faq-item ${openFaq===i?'open':''}`} onClick={()=>setOpenFaq(openFaq===i?null:i)}><div className="lp-faq-q">{f.q}<span className="lp-faq-arrow">+</span></div><div className="lp-faq-a"><div className="lp-faq-a-inner">{f.a}</div></div></div>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <Reveal><h2>Ready to level up<br/>your <em>trading</em>?</h2></Reveal>
        <Reveal delay={0.1}><p>Build a daily review system that stays connected to your trades, accounts and discipline.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="lp-cta-actions">
            <button className="btn-hero-primary" onClick={onSignup}>Start your 14-day trial</button>
            <button className="btn-hero-secondary" onClick={onLogin}>Log in</button>
          </div>
        </Reveal>
        <Reveal delay={0.3}><p className="lp-cta-note">14-day trial - billing starts after the trial unless cancelled</p></Reveal>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-footer-brand-row"><div className="lp-footer-mark"><img className="lp-logo-img" src="/logo-mark.png" alt="" /></div><span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:17,color:'#fff'}}>Market<span className="flow-text">Flow</span></span></div>
              <p>A structured trading journal for professional execution review, analytics and accountability.</p>
            </div>
            <div className="lp-footer-col"><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="/changelog">Changelog</a><a href="/roadmap">Roadmap</a></div>
            <div className="lp-footer-col"><h4>Resources</h4><a className="lp-resource-link" href="/docs">Documentation <span>Guide</span></a><a className="lp-resource-link" href="/import-guide">Import Guide <span>CSV</span></a><a className="lp-resource-link" href="/api-reference">API Reference <span>Elite</span></a><a className="lp-resource-link" href="/tutorials">Tutorials <span>Workflows</span></a></div>
            <div className="lp-footer-col"><h4>Legal</h4><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a><a href="/contact">Contact</a><a href={`mailto:${SUPPORT_EMAIL}`}>Support</a></div>
          </div>
          <div className="lp-footer-bottom">
            <p>Copyright 2026 MarketFlow Journal. All rights reserved.</p>
            <div className="lp-social-row"><a href="https://twitter.com/marketflowjrl" target="_blank" rel="noopener noreferrer" className="lp-social-btn">X</a><a href="https://discord.gg/Cvh6H8yK8m" target="_blank" rel="noopener noreferrer" className="lp-social-btn">Discord</a></div>
          </div>
        </div>
      </footer>

      {modal && <PageModal page={modal} onClose={()=>setModal(null)}/>}
    </div>
  );
}
