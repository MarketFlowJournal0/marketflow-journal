import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const C = {
  bg:     '#030508',
  card:   '#0C1422',
  cardHi: '#111B2E',
  brd:    '#162034',
  brdHi:  '#1E2E48',
  cyan:   '#06E6FF',
  teal:   '#00F5D4',
  green:  '#00FF88',
  purple: '#B06EFF',
  pink:   '#FF4DC4',
  gold:   '#FFD700',
  t0:     '#FFFFFF',
  t1:     '#E8EEFF',
  t2:     '#7A90B8',
  t3:     '#334566',
};

const PLANS = [
  {
    id:       'starter',
    name:     'Starter',
    accent:   C.teal,
    glow:     'rgba(0,245,212,0.15)',
    icon:     '⚡',
    desc:     'Parfait pour commencer à tracker tes trades',
    monthly:  15,
    annual:   11,
    priceMonthly: 'price_1T97lcRrHTdWtpEZUhmUeTTk',
    priceAnnual:  'price_1T97mJRrHTdWtpEZAfccumX3',
    features: [
      'Journal de trading illimité',
      'Dashboard & statistiques de base',
      'Import CSV',
      'Calendrier de performance',
      '1 compte de trading',
    ],
  },
  {
    id:       'pro',
    name:     'Pro',
    accent:   C.cyan,
    glow:     'rgba(6,230,255,0.15)',
    icon:     '🚀',
    desc:     'Pour les traders sérieux qui veulent progresser',
    monthly:  22,
    annual:   15,
    priceMonthly: 'price_1T97psRrHTdWtpEZyNf4dG6a',
    priceAnnual:  'price_1T97qBRrHTdWtpEZJ6b8f3ga',
    popular:  true,
    features: [
      'Tout le plan Starter',
      'Analytics Pro avancés',
      'Psychology & mental tracking',
      'Equity curve & drawdown',
      'Backtesting stratégies',
      '3 comptes de trading',
      'Export PDF rapports',
    ],
  },
  {
    id:       'elite',
    name:     'Elite',
    accent:   C.gold,
    glow:     'rgba(255,215,0,0.12)',
    icon:     '👑',
    desc:     'Pour les pros qui veulent le meilleur outil',
    monthly:  38,
    annual:   27,
    priceMonthly: 'price_1T97qXRrHTdWtpEZnWH1JSb5',
    priceAnnual:  'price_1T97r3RrHTdWtpEZTCMcR9rb',
    features: [
      'Tout le plan Pro',
      'AI Trading Coach (GPT-4)',
      'Comptes illimités',
      'Alertes & notifications',
      'API access',
      'Support prioritaire 24/7',
      'Accès bêta fonctionnalités',
    ],
  },
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .ps-root {
    min-height: 100vh;
    background: ${C.bg};
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 80px;
    position: relative;
    overflow: hidden;
  }

  .ps-glow-top {
    position: absolute;
    top: -200px; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(6,230,255,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .ps-logo {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 48px;
    font-size: 20px; font-weight: 700;
    color: ${C.t0};
    text-decoration: none;
  }
  .ps-logo-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: ${C.cyan};
    box-shadow: 0 0 12px ${C.cyan};
  }

  .ps-header {
    text-align: center;
    margin-bottom: 48px;
    position: relative;
  }
  .ps-step {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(0,255,136,0.08);
    border: 1px solid rgba(0,255,136,0.2);
    border-radius: 100px;
    padding: 6px 16px;
    font-size: 12px; font-weight: 600;
    color: ${C.green};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }
  .ps-step-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: ${C.green};
    animation: ps-pulse 2s ease-in-out infinite;
  }
  @keyframes ps-pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:0.5; transform:scale(0.8); }
  }
  .ps-title {
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 800;
    color: ${C.t0};
    margin: 0 0 12px;
    line-height: 1.15;
  }
  .ps-title span {
    background: linear-gradient(135deg, ${C.cyan}, ${C.teal});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .ps-subtitle {
    font-size: 16px; color: ${C.t2};
    margin: 0;
    line-height: 1.6;
  }

  .ps-toggle {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 40px;
    background: rgba(255,255,255,0.03);
    border: 1px solid ${C.brd};
    border-radius: 100px;
    padding: 6px;
  }
  .ps-toggle-btn {
    padding: 8px 20px;
    border-radius: 100px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    color: ${C.t2};
    background: transparent;
  }
  .ps-toggle-btn.active {
    background: ${C.cyan};
    color: #000;
  }
  .ps-toggle-badge {
    background: rgba(0,255,136,0.1);
    border: 1px solid rgba(0,255,136,0.25);
    color: ${C.green};
    font-size: 11px; font-weight: 700;
    padding: 4px 10px; border-radius: 100px;
    letter-spacing: 0.04em;
  }

  .ps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
    gap: 20px;
    width: 100%;
    max-width: 980px;
    position: relative;
  }

  .ps-card {
    background: ${C.card};
    border-radius: 20px;
    padding: 32px;
    border: 1px solid ${C.brd};
    position: relative;
    transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
    cursor: pointer;
    overflow: hidden;
  }
  .ps-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .ps-card:hover {
    transform: translateY(-4px);
    border-color: var(--accent);
    box-shadow: 0 20px 60px var(--glow);
  }
  .ps-card:hover::before { opacity: 1; }

  .ps-card-popular {
    border-color: ${C.cyan};
    background: linear-gradient(135deg, #0C1422 0%, #0D1830 100%);
  }

  .ps-popular-badge {
    position: absolute;
    top: -1px; left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(90deg, ${C.cyan}, ${C.teal});
    color: #000;
    font-size: 11px; font-weight: 700;
    padding: 5px 16px;
    border-radius: 0 0 10px 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .ps-card-glow {
    position: absolute;
    top: -60px; right: -60px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: var(--glow);
    filter: blur(40px);
    pointer-events: none;
    opacity: 0.6;
  }

  .ps-card-icon {
    font-size: 32px;
    margin-bottom: 16px;
    display: block;
  }

  .ps-card-name {
    font-size: 22px; font-weight: 800;
    color: ${C.t0};
    margin: 0 0 6px;
  }

  .ps-card-desc {
    font-size: 13px; color: ${C.t2};
    margin: 0 0 24px;
    line-height: 1.5;
  }

  .ps-price-block {
    margin-bottom: 28px;
  }
  .ps-price-main {
    display: flex; align-items: baseline; gap: 4px;
    margin-bottom: 4px;
  }
  .ps-price-currency {
    font-size: 20px; font-weight: 700;
    color: var(--accent);
  }
  .ps-price-amount {
    font-size: 48px; font-weight: 900;
    color: ${C.t0};
    line-height: 1;
  }
  .ps-price-period {
    font-size: 14px; color: ${C.t2};
  }
  .ps-price-annual {
    font-size: 12px; color: ${C.t3};
  }
  .ps-price-annual span {
    color: ${C.green};
    font-weight: 600;
  }

  .ps-features {
    list-style: none;
    margin: 0 0 28px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ps-feature {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: ${C.t1};
  }
  .ps-feature-check {
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(0,255,136,0.1);
    border: 1px solid rgba(0,255,136,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-size: 9px;
    color: ${C.green};
  }

  .ps-cta {
    width: 100%;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px; font-weight: 700;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    letter-spacing: 0.03em;
    position: relative;
    overflow: hidden;
  }
  .ps-cta-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent-end, var(--accent)));
    color: #000;
    box-shadow: 0 4px 20px var(--glow);
  }
  .ps-cta-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 30px var(--glow);
    filter: brightness(1.1);
  }
  .ps-cta-secondary {
    background: rgba(255,255,255,0.05);
    color: ${C.t1};
    border: 1px solid ${C.brd};
  }
  .ps-cta-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: var(--accent);
    color: var(--accent);
  }
  .ps-cta:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }

  .ps-trial-note {
    text-align: center;
    margin-top: 32px;
    font-size: 13px;
    color: ${C.t3};
  }
  .ps-trial-note span { color: ${C.t2}; }

  .ps-skip {
    margin-top: 20px;
    background: none;
    border: none;
    color: ${C.t3};
    font-size: 13px;
    cursor: pointer;
    text-decoration: underline;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s;
  }
  .ps-skip:hover { color: ${C.t2}; }


  .ps-success-banner {
    background: linear-gradient(135deg, rgba(0,255,136,0.12), rgba(6,230,255,0.08));
    border: 1px solid rgba(0,255,136,0.3);
    border-radius: 12px;
    padding: 14px 20px;
    color: #00FF88;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 24px;
    text-align: center;
    width: 100%;
    max-width: 900px;
  }

  .ps-trial-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,215,0,0.07);
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 12px;
    padding: 12px 18px;
    margin-bottom: 24px;
    width: 100%;
    max-width: 900px;
    font-size: 13.5px;
    color: rgba(255,255,255,0.75);
  }
  .ps-trial-icon { font-size: 18px; flex-shrink: 0; }
  .ps-trial-banner strong { color: #FFD700; }

  .ps-alert-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255,61,87,0.08);
    border: 1px solid rgba(255,61,87,0.25);
    border-radius: 12px;
    padding: 12px 18px;
    margin-bottom: 24px;
    width: 100%;
    max-width: 900px;
    font-size: 13.5px;
    color: rgba(255,255,255,0.75);
  }
  .ps-alert-banner strong { color: #FF5570; }

  .ps-manage-btn {
    margin-left: auto;
    flex-shrink: 0;
    padding: 7px 14px;
    background: rgba(255,215,0,0.12);
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 8px;
    color: #FFD700;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
    font-family: 'Inter', sans-serif;
  }
  .ps-manage-btn:hover { background: rgba(255,215,0,0.2); }

  .ps-card-current {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 1px var(--accent), 0 24px 64px var(--glow) !important;
  }
  .ps-current-badge {
    position: absolute;
    top: -1px; left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: #030508;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 12px;
    border-radius: 0 0 8px 8px;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .ps-cta-manage {
    background: rgba(255,255,255,0.06) !important;
    border: 1px solid rgba(255,255,255,0.12) !important;
    color: rgba(255,255,255,0.7) !important;
  }
  .ps-cta-manage:hover:not(:disabled) {
    background: rgba(255,255,255,0.1) !important;
    color: #fff !important;
    transform: none !important;
  }

  @media (max-width: 640px) {
    .ps-grid { grid-template-columns: 1fr; }
  }
`;

export default function PlanSelection({ user: userProp, onSkip }) {
  const { user: authUser, refreshProfile } = useAuth();
  const user = authUser || userProp;

  const [billing,   setBilling]   = useState('monthly');
  const [loading,   setLoading]   = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Détecter retour depuis Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setSuccessMsg('🎉 Abonnement activé ! Bienvenue sur MarketFlow.');
      // Rafraîchir le profil pour avoir le bon plan
      setTimeout(() => refreshProfile?.(), 2000);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshProfile]);

  // Plan actuel
  const currentPlan = user?.plan || 'trial';
  const subStatus   = user?.subStatus || 'trialing';
  const isTrialing  = user?.isTrialing ?? true;
  const daysLeft    = user?.trialDaysLeft ?? 14;
  const needsPayment = user?.needsPayment || false;

  // Lancer le checkout Stripe
  const handleSelect = async (plan) => {
    const priceId = billing === 'monthly' ? plan.priceMonthly : plan.priceAnnual;
    setLoading(plan.id);
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          email:  user?.email,
          userId: user?.id,
        }),
      });
      const { url, error } = await res.json();
      if (url) window.location.href = url;
      else console.error('Checkout error:', error);
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  // Ouvrir le portail Stripe (gérer CB, annuler, changer plan)
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
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setPortalLoading(false);
    }
  };

  const isCurrentPlan = (planId) => currentPlan === planId && (isTrialing || subStatus === 'active');

  return (
    <div className="ps-root">
      <style>{STYLES}</style>
      <div className="ps-glow-top" />

      {/* Logo */}
      <div className="ps-logo">
        <div className="ps-logo-dot" />
        MarketFlow Journal
      </div>

      {/* Bannière succès */}
      {successMsg && (
        <div className="ps-success-banner">
          {successMsg}
        </div>
      )}

      {/* Bannière trial / paiement requis */}
      {user && isTrialing && daysLeft > 0 && (
        <div className="ps-trial-banner">
          <span className="ps-trial-icon">⏱</span>
          <div>
            <strong>Essai gratuit — {daysLeft} jour{daysLeft > 1 ? 's' : ''} restant{daysLeft > 1 ? 's' : ''}</strong>
            <span> · Ta carte sera débitée à la fin du trial</span>
          </div>
          {user.stripeCustomerId && (
            <button className="ps-manage-btn" onClick={handleManage} disabled={portalLoading}>
              {portalLoading ? '…' : 'Gérer ma CB'}
            </button>
          )}
        </div>
      )}

      {needsPayment && (
        <div className="ps-alert-banner">
          <span>⚠️</span>
          <div>
            <strong>Paiement requis</strong>
            <span> — Ton essai est terminé. Choisis un plan pour continuer.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="ps-header">
        {!user ? (
          <>
            <div className="ps-step">
              <div className="ps-step-dot" />
              Étape 2 sur 2 — Choisir ton plan
            </div>
            <h1 className="ps-title">
              Commence ton <span>essai gratuit</span><br />de 14 jours
            </h1>
            <p className="ps-subtitle">
              Entre ta carte maintenant, rien n'est débité pendant 14 jours.
            </p>
          </>
        ) : (
          <>
            <h1 className="ps-title">
              {needsPayment ? 'Choisis ton plan' : 'Ton abonnement'}
            </h1>
            <p className="ps-subtitle">
              {subStatus === 'active'
                ? `Plan actif · ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}`
                : subStatus === 'trialing'
                ? `Essai gratuit en cours · ${daysLeft}j restants`
                : subStatus === 'canceled'
                ? 'Abonnement annulé — Réactive un plan'
                : 'Gère ou change ton abonnement ci-dessous'}
            </p>
          </>
        )}
      </div>

      {/* Toggle billing */}
      <div className="ps-toggle">
        <button
          className={`ps-toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
          onClick={() => setBilling('monthly')}
        >Mensuel</button>
        <button
          className={`ps-toggle-btn ${billing === 'annual' ? 'active' : ''}`}
          onClick={() => setBilling('annual')}
        >Annuel</button>
        {billing === 'annual' && <span className="ps-toggle-badge">-30% 🎉</span>}
      </div>

      {/* Plans grid */}
      <div className="ps-grid">
        {PLANS.map(plan => {
          const isCurrent = isCurrentPlan(plan.id);
          return (
            <div
              key={plan.id}
              className={`ps-card ${plan.popular ? 'ps-card-popular' : ''} ${isCurrent ? 'ps-card-current' : ''}`}
              style={{ '--accent': plan.accent, '--glow': plan.glow }}
            >
              {isCurrent && (
                <div className="ps-current-badge">
                  {isTrialing ? `⏱ Essai · ${daysLeft}j` : '✓ Plan actuel'}
                </div>
              )}
              {plan.popular && !isCurrent && (
                <div className="ps-popular-badge">✦ Le plus populaire</div>
              )}
              <div className="ps-card-glow" />

              <span className="ps-card-icon">{plan.icon}</span>
              <div className="ps-card-name">{plan.name}</div>
              <div className="ps-card-desc">{plan.desc}</div>

              <div className="ps-price-block">
                <div className="ps-price-main">
                  <span className="ps-price-currency">$</span>
                  <span className="ps-price-amount">
                    {billing === 'monthly' ? plan.monthly : plan.annual}
                  </span>
                  <span className="ps-price-period">/mois</span>
                </div>
                {billing === 'annual' && (
                  <div className="ps-price-annual">
                    Facturé ${plan.annual * 12}/an —{' '}
                    <span>économise ${(plan.monthly - plan.annual) * 12}/an</span>
                  </div>
                )}
              </div>

              <ul className="ps-features">
                {plan.features.map((f, i) => (
                  <li key={i} className="ps-feature">
                    <span className="ps-feature-check">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent && user?.stripeCustomerId ? (
                <button
                  className="ps-cta ps-cta-manage"
                  onClick={handleManage}
                  disabled={portalLoading}
                >
                  {portalLoading ? '⏳ Chargement...' : '⚙️ Gérer mon abonnement'}
                </button>
              ) : (
                <button
                  className={`ps-cta ${plan.popular ? 'ps-cta-primary' : 'ps-cta-secondary'}`}
                  disabled={!!loading}
                  onClick={() => handleSelect(plan)}
                >
                  {loading === plan.id
                    ? '⏳ Chargement...'
                    : isCurrent
                    ? '✓ Plan actuel'
                    : isTrialing
                    ? `Passer à ${plan.name}`
                    : `Commencer avec ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="ps-trial-note">
        🔒 <span>Paiement 100% sécurisé par Stripe</span>
        {' · '}Annulation en 1 clic
        {' · '}14 jours gratuits — CB requise
      </div>


    </div>
  );
}