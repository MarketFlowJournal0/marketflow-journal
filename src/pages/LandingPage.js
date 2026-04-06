import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   MARKETFLOW JOURNAL — Landing Page v5
   Premium — SVG Icons, Animated Logos, Updated Features
   ═══════════════════════════════════════════════════════════════ */

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Ic = {
  Journal: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 9h6M7 12h3"/></svg>,
  AI: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5A2 2 0 015 3h10a2 2 0 012 2v7a2 2 0 01-2 2H8l-5 3.5V5z"/><circle cx="7" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="10" cy="8" r="0.8" fill="currentColor" stroke="none"/><circle cx="13" cy="8" r="0.8" fill="currentColor" stroke="none"/></svg>,
  Analytics: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,15 6,9 10,12 15,4 18,6"/><path d="M15 2h3v3"/></svg>,
  Psychology: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2a6 6 0 016 6c0 2.5-1.5 4.6-3.6 5.7L12.5 16l.5 2H7l.5-2 .1-.3A6 6 0 0110 2z"/><path d="M8 11h4"/></svg>,
  Backtest: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10.5" r="7"/><polyline points="10,6 10,10.5 13,12.5"/><path d="M5.5 3C3.5 4.5 2 7 2 10.5"/><polyline points="4.5,2 5.5,3 4.5,4.5"/></svg>,
  Prop: () => <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l2.5 6H18l-4.5 3.5 1.5 5.5L10 13.5 4.5 17l1.5-5.5L1.5 8h5.5z"/></svg>,
};

// ─── Animated Canvas Background ────────────────────────────────────────────
function AnimatedBg() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId, w, h;
    const particles = [], lines = [];
    const PC = 50, LC = 10;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    function init() {
      resize();
      particles.length = 0; lines.length = 0;
      for (let i = 0; i < PC; i++) particles.push({ x: Math.random() * (w / devicePixelRatio), y: Math.random() * (h / devicePixelRatio), vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, r: Math.random() * 1.5 + 0.5, o: Math.random() * 0.25 + 0.05 });
      for (let i = 0; i < LC; i++) {
        const pts = []; let x = Math.random() * (w / devicePixelRatio), y = Math.random() * (h / devicePixelRatio);
        for (let j = 0; j < 8; j++) { pts.push({ x, y }); x += (Math.random() - 0.3) * 120; y += (Math.random() - 0.5) * 80; }
        lines.push({ pts, o: Math.random() * 0.05 + 0.02, speed: Math.random() * 0.12 + 0.04 });
      }
    }
    function draw() {
      const rw = w / devicePixelRatio, rh = h / devicePixelRatio;
      ctx.clearRect(0, 0, rw, rh);
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

// ─── Scroll Reveal ─────────────────────────────────────────────────────────
function useReveal() { const ref = useRef(null); const [v, setV] = useState(false); useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); o.disconnect(); } }, { threshold: 0.08 }); o.observe(el); return () => o.disconnect(); }, []); return [ref, v]; }
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, v] = useReveal();
  return <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`, ...style }}>{children}</div>;
}

// ─── Counter ───────────────────────────────────────────────────────────────
function Counter({ end, suffix = '', prefix = '', duration = 2 }) {
  const [val, setVal] = useState(0);
  const [ref, v] = useReveal();
  useEffect(() => { if (!v) return; let s = 0; const step = end / (duration * 60); const tick = () => { s += step; if (s >= end) { setVal(end); return; } setVal(Math.round(s)); requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, [v, end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Styles ────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
  :root { --cyan:#06E6FF;--green:#00FF88;--purple:#B06EFF;--blue:#4D7CFF;--gold:#FFD700;--pink:#FF4DC4;--danger:#FF3D57;--t0:#FFFFFF;--t1:#E8EEFF;--t2:#7A90B8;--t3:#334566;--bg:#030508;--brd:#162034; }
  * { box-sizing:border-box;margin:0;padding:0; }
  html { scroll-behavior:smooth; }
  body { background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;overflow-x:hidden; }
  @keyframes flowgrad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .flow-text { background:linear-gradient(90deg,#06E6FF,#00FF88,#06E6FF);background-size:200% 200%;animation:flowgrad 4s ease infinite;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text; }
  @keyframes ticker-scroll { from{transform:translateX(0)}to{transform:translateX(-50%)} }

  /* NAV */
  .lp-nav { position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between;background:rgba(3,5,8,0.7);backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid rgba(255,255,255,0.03);transition:all 0.3s; }
  .lp-nav.scrolled { background:rgba(3,5,8,0.95);border-bottom-color:var(--brd); }
  .lp-nav-logo { display:flex;align-items:center;gap:10px;cursor:pointer; }
  .lp-nav-logo-icon { width:36px;height:36px;border-radius:10px;overflow:hidden;border:1px solid rgba(6,230,255,0.15);box-shadow:0 0 16px rgba(6,230,255,0.1); }
  .lp-nav-logo-text { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:20px;color:var(--t0);letter-spacing:-0.5px; }
  .lp-nav-links { display:flex;align-items:center;gap:4px; }
  .lp-nav-links a { padding:8px 16px;border-radius:8px;color:var(--t2);text-decoration:none;font-size:13.5px;font-weight:500;transition:all 0.18s; }
  .lp-nav-links a:hover { color:var(--t0);background:rgba(255,255,255,0.04); }
  .lp-nav-cta { display:flex;align-items:center;gap:10px; }
  .btn-ghost { padding:8px 18px;border-radius:9px;border:1px solid var(--brd);background:transparent;color:var(--t1);font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.18s; }
  .btn-ghost:hover { border-color:var(--cyan);color:var(--cyan); }
  .btn-primary-nav { padding:9px 20px;border-radius:9px;background:linear-gradient(135deg,var(--cyan),var(--green));border:none;color:#030508;font-size:13px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;box-shadow:0 0 20px rgba(6,230,255,0.25); }
  .btn-primary-nav:hover { transform:translateY(-1px);box-shadow:0 4px 30px rgba(6,230,255,0.4); }

  /* TICKER */
  .lp-ticker-wrap { overflow:hidden;background:rgba(3,5,8,0.95);border-top:1px solid rgba(6,230,255,0.05);border-bottom:1px solid rgba(255,255,255,0.03);padding:11px 0;white-space:nowrap;margin-top:68px;position:relative; }
  .lp-ticker { display:inline-flex;gap:0;animation:ticker-scroll 50s linear infinite; }

  /* LOGOS TICKER */
  .lp-logos { padding:40px 0;border-top:1px solid rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.03);overflow:hidden; }
  .lp-logos-label { text-align:center;font-size:10px;color:var(--t3);letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:20px; }
  .lp-logos-track { display:inline-flex;gap:0;animation:ticker-scroll 35s linear infinite; }
  .lp-logo-item { display:inline-flex;align-items:center;justify-content:center;padding:0 40px;font-family:'Space Grotesk',sans-serif;font-size:15px;font-weight:700;color:var(--t0);opacity:0.35;transition:opacity 0.3s;white-space:nowrap; }
  .lp-logo-item:hover { opacity:0.7; }

  /* HERO */
  .lp-hero { min-height:100vh;padding:140px 48px 80px;display:flex;flex-direction:column;align-items:center;text-align:center;position:relative;overflow:hidden; }
  .lp-hero-badge { display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:50px;border:1px solid rgba(6,230,255,0.25);background:rgba(6,230,255,0.06);font-size:11px;font-weight:700;color:var(--cyan);letter-spacing:0.5px;margin-bottom:28px; }
  .lp-badge-dot { width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:lp-blink 1.5s ease infinite; }
  @keyframes lp-blink{0%,100%{opacity:1}50%{opacity:0.2}}
  .lp-hero h1 { font-family:'Space Grotesk',sans-serif;font-weight:800;font-size:clamp(44px,6vw,82px);line-height:1.05;color:var(--t0);letter-spacing:-2px;margin-bottom:22px;max-width:900px; }
  .lp-hero-sub { font-size:18px;color:var(--t2);max-width:640px;line-height:1.7;margin-bottom:36px; }
  .lp-hero-actions { display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:14px; }
  .btn-hero-primary { padding:15px 32px;border-radius:12px;background:linear-gradient(135deg,var(--cyan),var(--green));border:none;color:#030508;font-size:15px;font-weight:800;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;box-shadow:0 0 40px rgba(6,230,255,0.3);display:flex;align-items:center;gap:8px; }
  .btn-hero-primary:hover { transform:translateY(-2px);box-shadow:0 8px 50px rgba(6,230,255,0.45); }
  .btn-hero-secondary { padding:15px 30px;border-radius:12px;border:1px solid var(--brd);background:rgba(255,255,255,0.03);color:var(--t1);font-size:15px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif;transition:all 0.2s;display:flex;align-items:center;gap:8px; }
  .btn-hero-secondary:hover { border-color:var(--cyan);color:var(--cyan);background:rgba(6,230,255,0.04); }
  .lp-hero-note { font-size:11.5px;color:var(--t3); }
  .lp-hero-stats { display:flex;gap:0;margin-top:60px;border:1px solid var(--brd);border-radius:16px;background:rgba(12,20,34,0.6);backdrop-filter:blur(20px);overflow:hidden; }
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
  .lp-feature-card { padding:28px;border-radius:16px;border:1px solid var(--brd);background:rgba(12,20,34,0.5);position:relative;overflow:hidden;transition:all 0.25s; }
  .lp-feature-card:hover { border-color:rgba(6,230,255,0.2);transform:translateY(-2px);box-shadow:0 16px 48px rgba(0,0,0,0.4); }
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
  .lp-big-visual { border-radius:18px;overflow:hidden;border:1px solid var(--brd);box-shadow:0 24px 64px rgba(0,0,0,0.5);background:var(--bg); }
  .lp-visual-header { padding:10px 14px;background:rgba(6,9,18,0.9);border-bottom:1px solid var(--brd);display:flex;align-items:center;gap:8px; }
  .lp-visual-title { font-size:10px;font-weight:700;color:var(--t2);letter-spacing:0.5px; }
  .lp-visual-badge { margin-left:auto;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;background:rgba(6,230,255,0.1);border:1px solid rgba(6,230,255,0.2);color:var(--cyan); }
  .lp-visual-body { padding:16px; }

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
  .lp-toggle-btn.active { background:var(--cyan);color:#030508; }
  .lp-toggle-badge { background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.25);color:var(--green);font-size:10px;font-weight:700;padding:3px 10px;border-radius:50px;letter-spacing:0.04em; }
  .lp-pricing-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:44px; }
  .lp-pricing-card { padding:28px 24px;border-radius:18px;border:1px solid var(--brd);background:rgba(12,20,34,0.5);position:relative;overflow:hidden;transition:all 0.3s;display:flex;flex-direction:column; }
  .lp-pricing-card:hover { transform:translateY(-3px); }
  .lp-pricing-card.popular { border-color:rgba(6,230,255,0.35);background:linear-gradient(160deg,rgba(6,230,255,0.04),rgba(0,255,136,0.02),rgba(12,20,34,0.98));box-shadow:0 0 0 1px rgba(6,230,255,0.08),0 24px 48px rgba(0,0,0,0.5); }
  .lp-popular-badge { position:absolute;top:14px;right:14px;padding:3px 10px;border-radius:50px;background:linear-gradient(135deg,var(--cyan),var(--green));font-size:9px;font-weight:800;color:#030508;letter-spacing:0.5px; }
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
  .btn-plan.filled { background:linear-gradient(135deg,var(--cyan),var(--green));color:#030508;box-shadow:0 0 20px rgba(6,230,255,0.25); }
  .btn-plan.filled:hover { box-shadow:0 4px 32px rgba(6,230,255,0.4);transform:translateY(-1px); }

  /* TESTIMONIALS */
  .lp-testi-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:48px; }
  .lp-testi-card { padding:22px;border-radius:14px;border:1px solid var(--brd);background:rgba(12,20,34,0.4);transition:all 0.25s; }
  .lp-testi-card:hover { border-color:rgba(255,255,255,0.08);transform:translateY(-2px); }
  .lp-stars { font-size:10px;color:var(--gold);margin-bottom:10px;letter-spacing:1px; }
  .lp-testi-text { font-size:13.5px;color:var(--t2);line-height:1.7;margin-bottom:16px;font-style:italic; }
  .lp-testi-text strong { color:var(--cyan);font-style:normal; }
  .lp-testi-author { display:flex;align-items:center;gap:10px; }
  .lp-avatar { width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#030508;flex-shrink:0; }
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
  .lp-social-btn { width:30px;height:30px;border-radius:7px;border:1px solid var(--brd);background:transparent;color:var(--t3);font-size:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.18s;text-decoration:none; }
  .lp-social-btn:hover { border-color:var(--cyan);color:var(--cyan); }

  /* MODAL */
  .lp-modal-overlay { position:fixed;inset:0;background:rgba(2,4,10,0.85);backdrop-filter:blur(12px);z-index:10000;display:flex;align-items:center;justify-content:center; }
  .lp-modal { width:640px;max-height:80vh;overflow:auto;background:linear-gradient(160deg,#0C1830,#080F1E);border:1px solid var(--brd);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,0.6); }
  .lp-modal-header { padding:24px 28px 18px;border-bottom:1px solid var(--brd);display:flex;justify-content:space-between;align-items:flex-start; }
  .lp-modal-close { width:32px;height:32px;border-radius:8px;border:1px solid var(--brd);background:transparent;color:var(--t2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0; }
  .lp-modal-close:hover { border-color:var(--cyan);color:var(--cyan); }
  .lp-modal-body { padding:24px 28px; }

  @media (max-width:900px) {
    .lp-features-grid,.lp-pricing-grid,.lp-testi-grid { grid-template-columns:1fr; }
    .lp-big-feat { grid-template-columns:1fr; }
    .lp-hero-stats { flex-direction:column; }
    .lp-hero-stat { border-right:none!important;border-bottom:1px solid var(--brd); }
    .lp-footer-top { grid-template-columns:1fr 1fr; }
    .lp-nav { padding:0 20px; }
    .lp-nav-links { display:none; }
    .lp-section { padding:60px 20px; }
  }
`;

// ─── Live Ticker ───────────────────────────────────────────────────────────
const FALLBACK = { 'S&P 500':{p:5680,pct:0.34},'NASDAQ':{p:19800,pct:0.56},'DOW':{p:41500,pct:0.22},'BTC/USD':{p:83200,pct:1.24},'ETH/USD':{p:2010,pct:0.87},'SOL/USD':{p:132,pct:1.45},'EUR/USD':{p:1.0842,pct:0.12},'GBP/USD':{p:1.271,pct:0.21},'USD/JPY':{p:149.82,pct:-0.08} };
const TICKER_ORDER = ['S&P 500','NASDAQ','DOW','BTC/USD','ETH/USD','SOL/USD','EUR/USD','GBP/USD','USD/JPY'];

function LiveTickerBar() {
  const doubled = [...TICKER_ORDER,...TICKER_ORDER];
  const fmt = (n,v) => v>=10000?v.toLocaleString('en-US',{maximumFractionDigits:0}):v>=100?v.toFixed(2):v.toFixed(4);
  return (
    <div className="lp-ticker-wrap">
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:60,background:'linear-gradient(90deg,rgba(3,5,8,0.95),transparent)',zIndex:2,pointerEvents:'none'}}/>
      <div style={{position:'absolute',right:0,top:0,bottom:0,width:60,background:'linear-gradient(270deg,rgba(3,5,8,0.95),transparent)',zIndex:2,pointerEvents:'none'}}/>
      <div className="lp-ticker">
        {doubled.map((name,i)=>{
          const d=FALLBACK[name];if(!d)return null;const pos=d.pct>=0;
          return (<span key={`${name}-${i}`} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 18px',borderRight:'1px solid rgba(255,255,255,0.03)'}}><span style={{color:'#3A5070',fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,letterSpacing:'1px'}}>{name}</span><span style={{color:'#D8E8FF',fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,fontWeight:500}}>{fmt(name,d.p)}</span><span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 6px',borderRadius:4,background:pos?'rgba(0,192,112,0.08)':'rgba(255,68,85,0.08)',border:`1px solid ${pos?'rgba(0,192,112,0.15)':'rgba(255,68,85,0.15)'}`,fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,color:pos?'#00C070':'#FF4455'}}>{pos?'▲':'▼'}{Math.abs(d.pct).toFixed(2)}%</span></span>);
        })}
      </div>
    </div>
  );
}

// ─── Data ──────────────────────────────────────────────────────────────────
const LOGOS = ['FTMO','FundedNext','The5%ers','TopStep','Alpha Capital','E8 Funding','MyFundedFX','Lucid Funding','True Forex Funds','The Funded Trader','MyForexFunds','Surge Trading','FTMO','FundedNext','The5%ers','TopStep','Alpha Capital','E8 Funding','MyFundedFX','Lucid Funding','True Forex Funds','The Funded Trader','MyForexFunds','Surge Trading'];

const FAQS = [
  {q:"How do I import my MetaTrader trades?",a:"Go to File → Export CSV in MT4/MT5, then drag and drop the file into MarketFlow. Import takes less than 30 seconds with automatic format detection."},
  {q:"Is the AI Coach useful for beginners?",a:"Yes — it guides on risk management and identifies costly mistakes. For advanced traders, it detects subtle patterns and psychological biases."},
  {q:"Can I use MarketFlow with a prop firm?",a:"Absolutely. MarketFlow is designed for prop traders — FTMO, The5%ers, E8, TopStep. PDF reports are formatted for direct submission."},
  {q:"Are my data secure?",a:"Encrypted with AES-256 in transit and at rest. GDPR compliant. Your data is never sold or shared. Export or delete anytime."},
  {q:"What's the difference with TradeZella?",a:"MarketFlow offers AI Trade Coach, integrated visual backtesting, and Psychology Tracker that TradeZella doesn't have. Our Pro plan is also 50% cheaper."},
];

const TESTIS = [
  {i:'A',name:'Alexandre M.',role:'FTMO Trader · Paris',pnl:'+€8,200 this month',stars:5,grad:'linear-gradient(135deg,#06E6FF,#00FF88)',text:"Since I started using MarketFlow, I identified that I was losing <strong>80% of my gains</strong> on Fridays after 4pm. I stopped that time slot and my account exploded."},
  {i:'S',name:'Sarah K.',role:'Prop Trader · Brussels',pnl:'WR 52% → 71%',stars:5,grad:'linear-gradient(135deg,#B06EFF,#FF4DC4)',text:"The AI Coach is stunning. It detected a revenge trading pattern I wasn't seeing. In 3 weeks, <strong>my win rate went from 52% to 71%.</strong>"},
  {i:'R',name:'Ryan B.',role:'Index Scalper · Lyon',pnl:'FTMO challenge passed',stars:5,grad:'linear-gradient(135deg,#FFD700,#FF6B35)',text:"I tried TradeZella and TraderSync. MarketFlow is <strong>clearly above</strong> in analytics and the integrated backtesting saved me on my FTMO challenge."},
  {i:'M',name:'Maxime D.',role:'Swing Trader · Geneva',pnl:'+34% this quarter',stars:5,grad:'linear-gradient(135deg,#00F5D4,#4D7CFF)',text:"The mood × P&L correlation showed me I trade better in the morning. <strong>Seems silly but it changed my routine</strong> and my results."},
  {i:'L',name:'Laura T.',role:'Beginner Trader · Montreal',pnl:'First profitable month',stars:4,grad:'linear-gradient(135deg,#06E6FF,#4D7CFF)',text:"MT5 import in 2 clicks, clear dashboard, relevant AI. The only journal I've kept for more than 2 weeks. <strong>I 100% recommend</strong> it to all beginners."},
  {i:'K',name:'Karim A.',role:'Funded Trader · Dubai',pnl:'Managing 3 accounts',stars:5,grad:'linear-gradient(135deg,#FF4DC4,#B06EFF)',text:"The prop firm PDF report is a game changer. I send my formatted history in 30 seconds. <strong>Professional and credible.</strong>"},
];

const PAGE_CONTENT = {
  changelog:{title:'📋 Changelog',subtitle:'Update History',color:'#06E6FF',items:[{v:'v2.5.0',date:'April 2026',badge:'LATEST',badgeColor:'#00FF88',items:['✅ Premium landing page redesign','✅ Broker Connect — MT4/MT5 auto-sync','✅ AI ChatBot floating assistant','✅ Rank system with country/world rankings','✅ Premium sidebar with living gradient']},{v:'v2.4.0',date:'March 2026',items:['✅ Trading calendar with MarketFlow Rank','✅ Light/dark theme','✅ Pro Analytics with advanced indicators','✅ Psychology module','✅ Strategy backtesting']},{v:'v2.3.0',date:'February 2026',items:['✅ Stripe subscriptions with 14-day trial','✅ Secure Supabase auth','✅ Redesigned dashboard','✅ Live market ticker']}]},
  roadmap:{title:'🗺️ Roadmap',subtitle:'What\'s coming next',color:'#B06EFF',sections:[{label:'Q2 2026',color:'#00FF88',items:[{icon:'🤖',title:'AI Chat Trader',desc:'AI assistant trained on trading patterns'},{icon:'📱',title:'Mobile App',desc:'Full journal access from your phone'},{icon:'🔗',title:'Direct broker sync',desc:'Auto import from MT4/MT5, cTrader, IBKR'}]},{label:'Q3 2026',color:'#06E6FF',items:[{icon:'📊',title:'Market Screener',desc:'Real-time opportunity identification'},{icon:'👥',title:'Community',desc:'Share strategies, leaderboards'}]},{label:'Q4 2026',color:'#FFD700',items:[{icon:'🧬',title:'Psychological profiling',desc:'Automatic bias detection'},{icon:'🌐',title:'Multi-account',desc:'Up to 10 accounts from one interface'}]}]},
  cgu:{title:'📄 Terms of Service',subtitle:'Effective January 1, 2026',color:'#8BA3CC',articles:[{title:'Article 1 — Purpose',text:'These Terms define the conditions under which MarketFlow Journal makes the platform available at marketflowjournal.com.'},{title:'Article 2 — Acceptance',text:'Use of the platform implies full acceptance of these Terms.'},{title:'Article 3 — Service',text:'MarketFlow Journal is a SaaS trading journal for tracking, analyzing and improving trading performance.'},{title:'Article 4 — Billing',text:'Access requires a monthly or annual subscription. Payments are processed by Stripe. Annual plans get 30% discount.'},{title:'Article 5 — Data',text:'Users own all their trading data. MarketFlow never sells or shares personal data.'}]},
  rgpd:{title:'🔒 Privacy Policy',subtitle:'Last updated January 1, 2026',color:'#00F5D4',articles:[{title:'Data controller',text:'MarketFlow Journal SAS. DPO: privacy@marketflowjournal.com'},{title:'Collected data',text:'Email, name, trading data (pairs, prices, results), technical data (IP, cookies). Payment data is processed exclusively by Stripe.'},{title:'Your rights',text:'Access, rectify, delete, export your data at any time.'}]},
  contact:{title:'📬 Contact',subtitle:'Get in touch',color:'#4D7CFF',content:'Email: marketflowjournal0@gmail.com\n\nFor support, use the chat widget or visit the Support page.\n\nWe respond within 24 hours.'},
};

function PageModal({ page, onClose }) {
  const c = PAGE_CONTENT[page];
  if (!c) return null;
  return (
    <div className="lp-modal-overlay" onClick={onClose}>
      <div className="lp-modal" onClick={e=>e.stopPropagation()}>
        <div className="lp-modal-header"><div><h3 style={{fontSize:18,fontWeight:800,color:'#fff',margin:0}}>{c.title}</h3><p style={{fontSize:12,color:'#7A90B8',margin:'4px 0 0'}}>{c.subtitle}</p></div><button className="lp-modal-close" onClick={onClose}>×</button></div>
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

// ─── Main ──────────────────────────────────────────────────────────────────
export default function LandingPage({ onLogin, onSignup, onSignupWithPlan }) {
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [modal, setModal] = useState(null);
  const [billing, setBilling] = useState('monthly');

  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);

  const PLANS = [
    { id:'starter', name:'Starter', monthly:15, annual:11, desc:'Perfect to start tracking your trades', features:['Unlimited trading journal','Dashboard & basic statistics','CSV import','Performance calendar','1 trading account'] },
    { id:'pro', name:'Pro', monthly:22, annual:15, desc:'For serious traders who want to improve', features:['Everything in Starter plan','Advanced Pro analytics','Psychology & mental tracking','Equity curve & drawdown','Strategy backtesting','3 trading accounts','PDF report export'], popular:true },
    { id:'elite', name:'Elite', monthly:38, annual:27, desc:'For pros who want the best tool', features:['Everything in Pro plan','AI Trading Coach (GPT-4)','Unlimited accounts','Alerts & notifications','API access','24/7 priority support','Beta features access'] },
  ];

  return (
    <div style={{background:'#030508',minHeight:'100vh',overflowX:'hidden'}}>
      <style>{STYLES}</style>
      <AnimatedBg />

      {/* NAV */}
      <nav className={`lp-nav ${scrolled?'scrolled':''}`}>
        <div className="lp-nav-logo" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <div className="lp-nav-logo-icon"><img src="/logo192.png" alt="" style={{width:'100%',height:'100%',objectFit:'contain',padding:2}}/></div>
          <span className="lp-nav-logo-text">Market<span className="flow-text">Flow</span></span>
        </div>
        <div className="lp-nav-links"><a href="#features">Features</a><a href="#analytics">Analytics</a><a href="#pricing">Pricing</a><a href="#reviews">Reviews</a><a href="#faq">FAQ</a></div>
        <div className="lp-nav-cta"><button type="button" className="btn-ghost" onClick={onLogin}>Log in</button><button type="button" className="btn-primary-nav" onClick={onSignup}>Start free trial →</button></div>
      </nav>

      <LiveTickerBar />

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-badge"><div className="lp-badge-dot"/>Trusted by 2,400+ traders worldwide</div>
        <Reveal><h1>Trade Smarter.<br/><span className="flow-text">Track Everything.</span></h1></Reveal>
        <Reveal delay={0.1}><p className="lp-hero-sub">The most powerful trading journal with AI-powered analytics, automatic broker sync, and psychological insights. Built for traders who want to level up.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="lp-hero-actions">
            <button type="button" className="btn-hero-primary" onClick={onSignup}>Start your free trial <span>→</span></button>
            <button type="button" className="btn-hero-secondary" onClick={()=>document.getElementById('features')?.scrollIntoView({behavior:'smooth'})}>See how it works</button>
          </div>
        </Reveal>
        <Reveal delay={0.3}><p className="lp-hero-note">14 days free · No credit card required · Cancel anytime</p></Reveal>
        <Reveal delay={0.4}>
          <div className="lp-hero-stats">
            <div className="lp-hero-stat"><div className="lp-stat-val"><Counter end={2400} suffix="+" /></div><div className="lp-stat-label">Active Traders</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val"><Counter end={12} suffix="M+" /></div><div className="lp-stat-label">Trades Tracked</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val"><Counter end={98} suffix="%" /></div><div className="lp-stat-label">Satisfaction</div></div>
            <div className="lp-hero-stat"><div className="lp-stat-val">4.9</div><div className="lp-stat-label">Avg Rating</div></div>
          </div>
        </Reveal>
      </section>

      {/* LOGOS TICKER */}
      <div className="lp-logos">
        <div className="lp-logos-label">Used by traders from</div>
        <div style={{overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',left:0,top:0,bottom:0,width:120,background:'linear-gradient(90deg,#030508,transparent)',zIndex:2,pointerEvents:'none'}}/>
          <div style={{position:'absolute',right:0,top:0,bottom:0,width:120,background:'linear-gradient(270deg,#030508,transparent)',zIndex:2,pointerEvents:'none'}}/>
          <div className="lp-logos-track">
            {[...LOGOS,...LOGOS].map((n,i)=>(<span key={i} className="lp-logo-item">{n}</span>))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">✦ Features</div></Reveal>
          <Reveal><h2>Everything you need to<br/><em>become profitable</em></h2></Reveal>
          <Reveal><p className="lp-section-sub">From trade journaling to AI-powered insights, MarketFlow gives you the complete toolkit to analyze, improve and scale your trading.</p></Reveal>
          <div className="lp-features-grid">
            {[
              {Icon:Ic.Journal,title:'Smart Trade Journal',desc:'Log trades in seconds. Auto-import from MT4, MT5, cTrader or any CSV. Universal format detection maps your columns automatically.'},
              {Icon:Ic.AI,title:'AI Trade Coach',desc:'Your personal trading AI analyzes patterns, detects biases, and gives actionable recommendations to improve your edge.'},
              {Icon:Ic.Analytics,title:'Advanced Analytics',desc:'Sharpe ratio, profit factor, expectancy, drawdown analysis — all the metrics pros use in one powerful dashboard.'},
              {Icon:Ic.Psychology,title:'Psychology Tracker',desc:'Track your emotional state, identify tilt patterns, and understand how your mindset directly affects your P&L.'},
              {Icon:Ic.Backtest,title:'Strategy Backtesting',desc:'Test your strategies on historical data with visual charts. Monte Carlo simulation for realistic risk analysis.'},
              {Icon:Ic.Prop,title:'Prop Firm Ready',desc:'Formatted reports for FTMO, The5%ers, E8, TopStep. Track challenge progress and rule compliance automatically.'},
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
                <div className="lp-section-tag">✦ Analytics</div>
                <h3>See what your<br/><em>competitors can't</em></h3>
                <p>Go beyond basic win rate. MarketFlow analyzes your trading from every angle — by session, pair, setup, emotional state, and time of day.</p>
                <ul className="lp-check-list">{['Equity curve with drawdown analysis','Performance by session, pair & setup','Hour × day heatmap for optimal timing','Risk-adjusted returns (Sharpe, Sortino, Calmar)'].map((t,i)=><li key={i}><span className="lp-check-ico">✓</span>{t}</li>)}</ul>
              </div>
              <div className="lp-big-visual">
                <div className="lp-visual-header"><span className="lp-visual-title">Analytics Pro</span><span className="lp-visual-badge">LIVE</span></div>
                <div className="lp-visual-body">
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    {[{l:'Win Rate',v:'68%',c:'#00FF88'},{l:'Profit Factor',v:'2.34',c:'#06E6FF'},{l:'Sharpe',v:'1.87',c:'#B06EFF'},{l:'Max DD',v:'-4.2%',c:'#FF3D57'}].map((m,i)=>(<div key={i} style={{padding:'10px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid #162034'}}><div style={{fontSize:8,color:'#334566',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:3}}>{m.l}</div><div style={{fontSize:16,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color:m.c}}>{m.v}</div></div>))}
                  </div>
                  <div style={{padding:'10px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid #162034',height:120,display:'flex',alignItems:'flex-end',gap:3}}>
                    {[35,45,30,55,65,50,70,60,75,85,70,80,90,85,95].map((h,i)=>(<div key={i} style={{flex:1,height:`${h}%`,borderRadius:'3px 3px 0 0',background:h>70?'rgba(0,255,136,0.3)':h>50?'rgba(6,230,255,0.2)':'rgba(255,255,255,0.06)'}}/>))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal>
            <div className="lp-big-feat reverse">
              <div>
                <div className="lp-section-tag">✦ AI Coach</div>
                <h3>Your personal<br/><em>trading psychologist</em></h3>
                <p>MarketFlow's AI analyzes every trade, every pattern, every emotional trigger. It tells you what you're doing wrong before it costs you money.</p>
                <ul className="lp-check-list">{['Automatic bias detection (revenge trading, FOMO, overtrading)','Personalized improvement recommendations','Pattern recognition across hundreds of trades','Natural language chat — ask anything about your trading'].map((t,i)=><li key={i}><span className="lp-check-ico">✓</span>{t}</li>)}</ul>
              </div>
              <div className="lp-big-visual">
                <div className="lp-visual-header"><span className="lp-visual-title">AI Coach Analysis</span><span className="lp-visual-badge">GPT-4</span></div>
                <div className="lp-visual-body" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,lineHeight:1.8}}>
                  <div style={{color:'#7A90B8',marginBottom:8}}>⚡ <span style={{color:'#06E6FF'}}>Pattern detected</span></div>
                  <div style={{color:'#E8EEFF',marginBottom:4}}>You lose 73% of trades taken after</div>
                  <div style={{color:'#E8EEFF',marginBottom:4}}>a loss in the previous hour.</div>
                  <div style={{color:'#334566',marginBottom:12}}>This is a classic revenge trading pattern.</div>
                  <div style={{color:'#00FF88',marginBottom:4}}>💡 Recommendation:</div>
                  <div style={{color:'#E8EEFF'}}>After a losing trade, wait at least</div>
                  <div style={{color:'#E8EEFF'}}>2 hours before entering a new position.</div>
                  <div style={{color:'#334566',marginTop:8}}>Estimated monthly savings: <span style={{color:'#00FF88',fontWeight:700}}>+$1,240</span></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARE */}
      <section className="lp-section" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">✦ Comparison</div></Reveal>
          <Reveal><h2>Why traders choose<br/><em>MarketFlow</em></h2></Reveal>
          <div className="lp-compare">
            <table className="lp-compare-table">
              <thead><tr><th>Feature</th><th className="hl">MarketFlow</th><th>TradeZella</th><th>TraderSync</th></tr></thead>
              <tbody>
                {[['AI Trade Coach',true,false,false],['Psychology Tracker',true,false,false],['Visual Backtesting',true,false,true],['Auto MT4/MT5 Sync',true,true,true],['Prop Firm Reports',true,false,false],['Live Market Ticker',true,false,false]].map((r,i)=>(
                  <tr key={i}><td className="hl">{r[0]}</td><td className="hl">{r[1]?<span className="cy">✓</span>:<span className="cn">✗</span>}</td><td>{r[2]?<span className="cy">✓</span>:<span className="cn">✗</span>}</td><td>{r[3]?<span className="cy">✓</span>:<span className="cn">✗</span>}</td></tr>
                ))}
                <tr><td className="hl">Price (Pro)</td><td className="hl" style={{color:'#00FF88',fontWeight:800}}>From $15/mo</td><td>$29/mo</td><td>$25/mo</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-section" id="pricing" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">✦ Pricing</div></Reveal>
          <Reveal><h2>Start free. Scale<br/><em>when you're ready</em></h2></Reveal>
          <Reveal><p className="lp-section-sub">14-day free trial on every plan. No credit card required. Cancel anytime.</p></Reveal>
          <div className="lp-pricing-toggle">
            <button className={`lp-toggle-btn ${billing==='monthly'?'active':''}`} onClick={()=>setBilling('monthly')}>Monthly</button>
            <button className={`lp-toggle-btn ${billing==='annual'?'active':''}`} onClick={()=>setBilling('annual')}>Annual</button>
            <span className="lp-toggle-badge">-30% on Pro & Elite</span>
          </div>
          <div className="lp-pricing-grid">
            {PLANS.map((plan,i) => {
              const price = billing === 'monthly' ? plan.monthly : plan.annual;
              const annualSave = (plan.monthly - plan.annual) * 12;
              return (
                <Reveal key={plan.id} delay={i*0.1}>
                  <div className={`lp-pricing-card ${plan.popular?'popular':''}`}>
                    {plan.popular && <div className="lp-popular-badge">Most popular</div>}
                    <div className="lp-plan">{plan.name}</div>
                    <div className="lp-price"><sup>$</sup>{price}</div>
                    <div className="lp-period">per month{billing==='annual'?', billed annually':''}</div>
                    {billing==='annual' && <div className="lp-save">Save ${annualSave}/year</div>}
                    {billing==='monthly' && <div className="lp-save">14 days free trial</div>}
                    <div className="lp-divider"/>
                    <ul className="lp-price-feats">{plan.features.map((f,j)=><li key={j}><span style={{color:'#00FF88',fontWeight:800,fontSize:11}}>✓</span>{f}</li>)}</ul>
                    <button className={`btn-plan ${plan.popular?'filled':'outline'}`} onClick={()=>onSignupWithPlan?onSignupWithPlan():onSignup?.()}>{plan.popular?'Start free trial':'Upgrade to '+plan.name}</button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section" id="reviews" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">✦ Reviews</div></Reveal>
          <Reveal><h2>Loved by traders<br/><em>worldwide</em></h2></Reveal>
          <div className="lp-testi-grid">
            {TESTIS.map((t,i)=>(<Reveal key={i} delay={i*0.08}><div className="lp-testi-card"><div className="lp-stars">{'★'.repeat(t.stars)}{'☆'.repeat(5-t.stars)}</div><div className="lp-testi-text" dangerouslySetInnerHTML={{__html:t.text}}/><div className="lp-testi-author"><div className="lp-avatar" style={{background:t.grad}}>{t.i}</div><div><div className="lp-testi-name">{t.name}</div><div className="lp-testi-role">{t.role}</div><div className="lp-testi-pnl">{t.pnl}</div></div></div></div></Reveal>))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section" id="faq" style={{borderTop:'1px solid rgba(255,255,255,0.03)'}}>
        <div className="lp-section-inner">
          <Reveal><div className="lp-section-tag">✦ FAQ</div></Reveal>
          <Reveal><h2>Common questions</h2></Reveal>
          <div className="lp-faq-list">
            {FAQS.map((f,i)=>(<div key={i} className={`lp-faq-item ${openFaq===i?'open':''}`} onClick={()=>setOpenFaq(openFaq===i?null:i)}><div className="lp-faq-q">{f.q}<span className="lp-faq-arrow">+</span></div><div className="lp-faq-a"><div className="lp-faq-a-inner">{f.a}</div></div></div>))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <Reveal><h2>Ready to level up<br/>your <em>trading</em>?</h2></Reveal>
        <Reveal delay={0.1}><p>Join 2,400+ traders who track, analyze and improve with MarketFlow.</p></Reveal>
        <Reveal delay={0.2}>
          <div className="lp-cta-actions">
            <button type="button" className="btn-hero-primary" onClick={onSignup}>Start your free trial →</button>
            <button type="button" className="btn-hero-secondary" onClick={onLogin}>Log in</button>
          </div>
        </Reveal>
        <Reveal delay={0.3}><p className="lp-cta-note">14 days free · No credit card · Cancel anytime</p></Reveal>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:28,height:28,borderRadius:8,overflow:'hidden',border:'1px solid rgba(6,230,255,0.15)'}}><img src="/logo192.png" alt="" style={{width:'100%',height:'100%',objectFit:'contain',padding:2}}/></div><span style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:16,color:'#fff'}}>Market<span className="flow-text">Flow</span></span></div>
              <p>The most powerful trading journal with AI analytics. Built for traders who want to level up.</p>
            </div>
            <div className="lp-footer-col"><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#" onClick={e=>{e.preventDefault();setModal('changelog')}}>Changelog</a><a href="#" onClick={e=>{e.preventDefault();setModal('roadmap')}}>Roadmap</a></div>
            <div className="lp-footer-col"><h4>Resources</h4><a href="#" onClick={e=>{e.preventDefault();setModal('docs')}}>Documentation</a><a href="#" onClick={e=>{e.preventDefault();setModal('api')}}>API Reference</a><a href="#" onClick={e=>{e.preventDefault();setModal('tutoriels')}}>Tutorials</a></div>
            <div className="lp-footer-col"><h4>Legal</h4><a href="#" onClick={e=>{e.preventDefault();setModal('cgu')}}>Terms of Service</a><a href="#" onClick={e=>{e.preventDefault();setModal('rgpd')}}>Privacy Policy</a><a href="#" onClick={e=>{e.preventDefault();setModal('contact')}}>Contact</a></div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 MarketFlow Journal. All rights reserved.</p>
            <div className="lp-social-row"><a href="https://twitter.com/marketflowjrl" target="_blank" rel="noopener noreferrer" className="lp-social-btn">𝕏</a><a href="https://discord.gg/Cvh6H8yK8m" target="_blank" rel="noopener noreferrer" className="lp-social-btn">💬</a></div>
          </div>
        </div>
      </footer>

      {modal && <PageModal page={modal} onClose={()=>setModal(null)}/>}
    </div>
  );
}
