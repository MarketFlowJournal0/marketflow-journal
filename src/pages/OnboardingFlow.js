import React, { useState } from 'react';

const C = {
  bg: '#030508', cyan: '#06E6FF', green: '#00FF88',
  t0: '#FFFFFF', t1: '#E8EEFF', t2: '#7A90B8', t3: '#334566',
  brd: '#162034', card: '#0C1422',
};

const STEPS = [
  {
    id: 'experience',
    emoji: '📊',
    question: 'Quel est ton niveau en trading ?',
    subtitle: 'On adaptera tes analytics à ton profil.',
    type: 'single',
    options: [
      { id: 'beginner',      label: 'Débutant',        desc: 'Moins de 6 mois',         emoji: '🌱' },
      { id: 'intermediate',  label: 'Intermédiaire',   desc: '6 mois – 2 ans',          emoji: '📈' },
      { id: 'advanced',      label: 'Avancé',          desc: '2 – 5 ans',               emoji: '🎯' },
      { id: 'professional',  label: 'Professionnel',   desc: '5+ ans / funded trader',  emoji: '👑' },
    ],
  },
  {
    id: 'market',
    emoji: '🌍',
    question: 'Quels marchés trades-tu ?',
    subtitle: 'Sélectionne tout ce qui s\'applique.',
    type: 'multi',
    options: [
      { id: 'forex',    label: 'Forex',          emoji: '💱' },
      { id: 'indices',  label: 'Indices',         emoji: '📉' },
      { id: 'crypto',   label: 'Crypto',          emoji: '₿'  },
      { id: 'stocks',   label: 'Actions',         emoji: '🏦' },
      { id: 'futures',  label: 'Futures',         emoji: '⚡' },
      { id: 'options',  label: 'Options',         emoji: '🔧' },
    ],
  },
  {
    id: 'style',
    emoji: '⏱',
    question: 'Quel est ton style de trading ?',
    subtitle: 'On optimisera tes rapports en conséquence.',
    type: 'single',
    options: [
      { id: 'scalping',  label: 'Scalping',       desc: 'Trades < 15 min',         emoji: '⚡' },
      { id: 'daytrading',label: 'Day Trading',    desc: 'Intraday',                emoji: '☀️' },
      { id: 'swing',     label: 'Swing Trading',  desc: 'Quelques jours',          emoji: '🌊' },
      { id: 'position',  label: 'Position',       desc: 'Semaines / mois',         emoji: '🏔️' },
    ],
  },
  {
    id: 'goal',
    emoji: '🎯',
    question: 'Quel est ton objectif principal ?',
    subtitle: 'Ça nous aide à personnaliser ton dashboard.',
    type: 'single',
    options: [
      { id: 'improve',   label: 'Améliorer mes performances',  emoji: '🚀' },
      { id: 'prop',      label: 'Passer un challenge prop firm', emoji: '🏆' },
      { id: 'consistent',label: 'Devenir consistent',           emoji: '🎯' },
      { id: 'manage',    label: 'Gérer plusieurs comptes',      emoji: '💼' },
    ],
  },
  {
    id: 'platform',
    emoji: '💻',
    question: 'Quelle plateforme utilises-tu ?',
    subtitle: 'On configurera l\'import automatiquement.',
    type: 'multi',
    options: [
      { id: 'mt4',      label: 'MetaTrader 4',   emoji: '📟' },
      { id: 'mt5',      label: 'MetaTrader 5',   emoji: '📟' },
      { id: 'ctrader',  label: 'cTrader',         emoji: '💹' },
      { id: 'tradingview', label: 'TradingView',  emoji: '📊' },
      { id: 'ninjatrader', label: 'NinjaTrader',  emoji: '🥷' },
      { id: 'other',    label: 'Autre',           emoji: '🔧' },
    ],
  },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .ob-root {
    min-height: 100vh;
    background: #030508;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    position: relative;
    overflow: hidden;
  }
  .ob-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .ob-card {
    background: #0C1422;
    border: 1px solid #162034;
    border-radius: 24px;
    padding: 48px 40px;
    width: 100%;
    max-width: 560px;
    position: relative;
    z-index: 1;
    animation: ob-in 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes ob-in {
    from { opacity: 0; transform: translateY(20px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ob-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }
  .ob-logo {
    display: flex; align-items: center; gap: 8px;
    font-size: 15px; font-weight: 700; color: #fff;
  }
  .ob-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #06E6FF;
    box-shadow: 0 0 8px #06E6FF;
  }
  .ob-skip {
    background: none; border: none;
    color: #334566; font-size: 13px; font-weight: 500;
    cursor: pointer; font-family: inherit;
    padding: 6px 12px; border-radius: 8px;
    transition: all 0.18s;
  }
  .ob-skip:hover { color: #7A90B8; background: rgba(255,255,255,0.04); }
  .ob-progress-bar {
    width: 100%; height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    margin-bottom: 36px;
    overflow: hidden;
  }
  .ob-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #06E6FF, #00FF88);
    border-radius: 3px;
    transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  }
  .ob-step-count {
    font-size: 11px; font-weight: 600; color: #334566;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 10px;
  }
  .ob-emoji { font-size: 40px; margin-bottom: 16px; display: block; line-height: 1; }
  .ob-question {
    font-size: clamp(20px, 3vw, 26px);
    font-weight: 800; color: #fff;
    margin: 0 0 8px; line-height: 1.2;
    letter-spacing: -0.4px;
  }
  .ob-subtitle {
    font-size: 14px; color: #7A90B8;
    margin: 0 0 28px; line-height: 1.6;
  }
  .ob-options {
    display: grid;
    gap: 10px;
    margin-bottom: 28px;
  }
  .ob-options.grid-2 { grid-template-columns: 1fr 1fr; }
  .ob-options.grid-1 { grid-template-columns: 1fr; }
  .ob-option {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    border: 1.5px solid #162034;
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: all 0.18s;
    text-align: left;
    font-family: inherit;
    width: 100%;
  }
  .ob-option:hover {
    border-color: rgba(6,230,255,0.3);
    background: rgba(6,230,255,0.04);
  }
  .ob-option.selected {
    border-color: #06E6FF;
    background: rgba(6,230,255,0.08);
    box-shadow: 0 0 0 1px rgba(6,230,255,0.2), 0 4px 20px rgba(6,230,255,0.1);
  }
  .ob-option-emoji { font-size: 22px; flex-shrink: 0; }
  .ob-option-text { flex: 1; }
  .ob-option-label { font-size: 14px; font-weight: 600; color: #E8EEFF; }
  .ob-option-desc { font-size: 12px; color: #334566; margin-top: 2px; }
  .ob-option.selected .ob-option-label { color: #fff; }
  .ob-option.selected .ob-option-desc { color: #7A90B8; }
  .ob-check {
    width: 20px; height: 20px; border-radius: 50%;
    border: 1.5px solid #162034;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 10px;
    transition: all 0.18s;
  }
  .ob-option.selected .ob-check {
    background: linear-gradient(135deg, #06E6FF, #00FF88);
    border-color: transparent;
    color: #060912;
    font-weight: 900;
  }
  .ob-multi-hint {
    font-size: 11.5px; color: #334566;
    text-align: center; margin-bottom: 20px;
    margin-top: -18px;
  }
  .ob-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ob-btn-prev {
    padding: 12px 20px; border-radius: 12px;
    border: 1px solid #162034;
    background: rgba(255,255,255,0.03);
    color: #7A90B8; font-size: 14px; font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: all 0.18s; display: flex; align-items: center; gap: 6px;
  }
  .ob-btn-prev:hover { background: rgba(255,255,255,0.06); color: #E8EEFF; }
  .ob-btn-next {
    flex: 1; padding: 14px 24px; border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #06E6FF, #00FF88);
    color: #060912; font-size: 14px; font-weight: 800;
    cursor: pointer; font-family: inherit;
    transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .ob-btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(6,230,255,0.4); }
  .ob-btn-next:disabled { opacity: 0.4; cursor: not-allowed; }

  @media (max-width: 520px) {
    .ob-card { padding: 32px 24px; }
    .ob-options.grid-2 { grid-template-columns: 1fr; }
  }
`;

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [animKey, setAnimKey] = useState(0);

  const current = STEPS[step];
  const total   = STEPS.length;
  const progress = ((step + 1) / total) * 100;
  const selected = answers[current.id] || (current.type === 'multi' ? [] : null);

  const canNext = current.type === 'multi'
    ? selected.length > 0
    : selected !== null;

  const toggleOption = (optId) => {
    if (current.type === 'single') {
      setAnswers(a => ({ ...a, [current.id]: optId }));
    } else {
      const cur = answers[current.id] || [];
      const next = cur.includes(optId)
        ? cur.filter(x => x !== optId)
        : [...cur, optId];
      setAnswers(a => ({ ...a, [current.id]: next }));
    }
  };

  const isSelected = (optId) => {
    if (current.type === 'multi') return (selected || []).includes(optId);
    return selected === optId;
  };

  const goNext = () => {
    if (step < total - 1) {
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    } else {
      onComplete(answers);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setAnimKey(k => k + 1);
      setStep(s => s - 1);
    }
  };

  const handleSkipAll = () => onComplete({});

  return (
    <div className="ob-root">
      <style>{STYLES}</style>

      {/* BG orbs */}
      <div className="ob-bg-orb" style={{ width: 500, height: 300, top: -100, left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(ellipse,rgba(6,230,255,0.07),transparent 70%)' }} />
      <div className="ob-bg-orb" style={{ width: 300, height: 300, bottom: -50, left: -50, background: 'radial-gradient(ellipse,rgba(0,255,136,0.05),transparent 70%)' }} />

      <div className="ob-card" key={animKey}>
        {/* Top bar */}
        <div className="ob-top">
          <div className="ob-logo">
            <div className="ob-logo-dot" />
            MarketFlow Journal
          </div>
          <button className="ob-skip" onClick={handleSkipAll}>
            Passer →
          </button>
        </div>

        {/* Progress */}
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step count */}
        <div className="ob-step-count">{step + 1} / {total}</div>

        {/* Question */}
        <span className="ob-emoji">{current.emoji}</span>
        <h2 className="ob-question">{current.question}</h2>
        <p className="ob-subtitle">{current.subtitle}</p>

        {current.type === 'multi' && (
          <div className="ob-multi-hint">Tu peux en sélectionner plusieurs</div>
        )}

        {/* Options */}
        <div className={`ob-options ${current.options.length > 4 ? 'grid-2' : 'grid-1'}`}>
          {current.options.map(opt => (
            <button
              key={opt.id}
              className={`ob-option${isSelected(opt.id) ? ' selected' : ''}`}
              onClick={() => toggleOption(opt.id)}
            >
              <span className="ob-option-emoji">{opt.emoji}</span>
              <div className="ob-option-text">
                <div className="ob-option-label">{opt.label}</div>
                {opt.desc && <div className="ob-option-desc">{opt.desc}</div>}
              </div>
              <div className="ob-check">{isSelected(opt.id) ? '✓' : ''}</div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="ob-footer">
          {step > 0 ? (
            <button className="ob-btn-prev" onClick={goPrev}>
              ← Retour
            </button>
          ) : (
            <div />
          )}
          <button
            className="ob-btn-next"
            onClick={goNext}
            disabled={!canNext}
          >
            {step === total - 1 ? 'Voir les plans 🚀' : 'Continuer →'}
          </button>
        </div>
      </div>
    </div>
  );
}