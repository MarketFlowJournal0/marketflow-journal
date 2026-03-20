import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AllTrades from './pages/AllTrades';
import Analytics from './pages/Analytics';
import AnalyticsPro from './pages/AnalyticsPro';
import Backtest from './pages/Backtest';
import Calendar from './pages/Calendar';
import Equity from './pages/Equity';
import Psychology from './pages/Psychology';
import AIChat from './pages/AIChat';
import AccountSettings from './pages/AccountSettings';
import PlanSelection from './pages/PlanSelection';
import SupportPage from './pages/SupportPage';
import OnboardingFlow from './pages/OnboardingFlow';
import SupportWidget from './components/supportwidget';
import { TradingProvider } from './context/TradingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { Toaster, toast } from 'react-hot-toast';
import AuthCallback from './pages/AuthCallback';
import './App.css';
import './theme.css';

const PAYMENT_SUCCESS_KEY = 'mfj_payment_success';
const BACK_FROM_PLAN_KEY  = 'mfj_back_from_plan';
const ONBOARDING_DONE_KEY = 'mfj_onboarding_done';

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#030508',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, zIndex: 9999,
    }}>
      <style>{`
        @keyframes mf-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(.97)} }
        @keyframes mf-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
        @keyframes mf-glow    { 0%,100%{box-shadow:0 0 30px rgba(6,230,255,.2)} 50%{box-shadow:0 0 60px rgba(6,230,255,.45)} }
      `}</style>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        animation: 'mf-pulse 2.2s ease-in-out infinite',
      }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, overflow: 'hidden', animation: 'mf-glow 2.2s ease-in-out infinite' }}>
          <img src="/logo192.png" alt="MarketFlow" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg,#06E6FF,#00FF88)'; }} />
        </div>
        <div style={{ textAlign: 'center', lineHeight: 1 }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.6px' }}>
            Market<span style={{ color: '#06E6FF' }}>Flow</span>
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(122,144,184,0.7)', marginTop: 4, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Journal
          </div>
        </div>
      </div>
      <div style={{ width: 100, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: '35%', height: '100%', background: 'linear-gradient(90deg,transparent,#06E6FF,#00FF88,transparent)', borderRadius: 2, animation: 'mf-shimmer 1.6s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading, profileLoaded, logout, refreshProfile } = useAuth();

  const [currentPage,   setCurrentPage]   = useState('dashboard');
  const [collapsed,     setCollapsed]      = useState(false);
  const [authModal,     setAuthModal]      = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isNewSignup,   setIsNewSignup]    = useState(false);

  const [forceLanding, setForceLanding] = useState(
    () => sessionStorage.getItem(BACK_FROM_PLAN_KEY) === '1'
  );

  const [paymentOk, setPaymentOk] = useState(false);

  // ── Détection route /abonnement (supporte aussi /#/abonnement) ──────────────
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const isAbonnementRoute = pathname === '/abonnement' || hash === '#/abonnement' || hash.startsWith('#/abonnement');

  useEffect(() => {
    if (forceLanding) sessionStorage.removeItem(BACK_FROM_PLAN_KEY);
  }, []); // eslint-disable-line

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      localStorage.setItem(PAYMENT_SUCCESS_KEY, Date.now().toString());
      setPaymentOk(true);
      setForceLanding(false);
      refreshProfile?.().catch(() => {});
      setTimeout(() => toast.success('🎉 Abonnement activé !', {
        duration: 6000,
        style: { background: '#0D1627', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', fontSize: '15px' },
      }), 500);
    }
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      toast('Paiement annulé. 👋', { style: { background: '#0D1627', color: '#fff', borderRadius: '12px' } });
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    if (user && isNewSignup) {
      const done = localStorage.getItem(ONBOARDING_DONE_KEY + '_' + user.id);
      if (!done) setShowOnboarding(true);
      setIsNewSignup(false);
    }
  }, [user, isNewSignup]);

  const openLogin          = () => { setForceLanding(false); setAuthModal('login'); };
  const openSignup         = () => { setForceLanding(false); setAuthModal('signup'); };
  const closeAuth          = () => setAuthModal(null);
  const openSignupWithPlan = (priceId) => {
    sessionStorage.setItem('pending_price_id', priceId);
    setForceLanding(false);
    setAuthModal('signup');
  };

  const launchCheckout = async (priceId, userEmail) => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: userEmail, userId: user?.id }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) { console.error('Checkout error:', err); }
  };

  const handleAuthSuccess = async (userData) => {
    setAuthModal(null);
    setForceLanding(false);
    setIsNewSignup(true);
    const pendingPriceId = sessionStorage.getItem('pending_price_id');
    if (pendingPriceId) {
      sessionStorage.removeItem('pending_price_id');
      setTimeout(() => launchCheckout(pendingPriceId, userData?.email), 800);
    }
  };

  const handleOnboardingComplete = (answers) => {
    if (user?.id) localStorage.setItem(ONBOARDING_DONE_KEY + '_' + user.id, '1');
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem(PAYMENT_SUCCESS_KEY);
    sessionStorage.removeItem(BACK_FROM_PLAN_KEY);
    try { await logout(); } catch (_) {}
    window.location.href = '/';
  };

  // ── Callback OAuth ──────────────────────────────────────────────────────────
  if (window.location.pathname === '/auth/callback') return <AuthCallback />;

  // ── Route /abonnement — accessible même connecté sans abo ───────────────────
  // Permet de "s'échapper" de la page bloquante via l'URL
  if (isAbonnementRoute) {
    if (!user) {
      return (
        <>
          <LandingPage onLogin={openLogin} onSignup={openSignup} onSignupWithPlan={openSignupWithPlan} />
          <SupportWidget onOpenPage={() => {}} />
          {authModal && <AuthModal defaultTab={authModal} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
        </>
      );
    }
    // Connecté → affiche PlanSelection avec bouton retour vers landing
    return (
      <>
        <PlanSelection
          user={user}
          onSkip={() => { window.location.href = '/'; }}
        />
        <SupportWidget onOpenPage={() => {}} />
      </>
    );
  }

  // ── forceLanding ─────────────────────────────────────────────────────────────
  if (forceLanding) {
    return (
      <>
        <LandingPage onLogin={openLogin} onSignup={openSignup} onSignupWithPlan={openSignupWithPlan} />
        <SupportWidget onOpenPage={() => {}} />
        {authModal && <AuthModal defaultTab={authModal} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
      </>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading && !profileLoaded) return <LoadingScreen />;

  // ── Non connecté ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <LandingPage onLogin={openLogin} onSignup={openSignup} onSignupWithPlan={openSignupWithPlan} />
        <SupportWidget onOpenPage={() => {}} />
        {authModal && <AuthModal defaultTab={authModal} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
      </>
    );
  }

  // ── Onboarding (première inscription) ────────────────────────────────────────
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // ── Pas d'abonnement → PlanSelection (vérification stricte Supabase) ─────────
  // On attend profileLoaded pour être sûr que stripeCustomerId est à jour
  if (profileLoaded && !user.stripeCustomerId) {
    return <PlanSelection user={user} onLogout={() => { logout().catch(()=>{}); window.location.href = '/'; }} />;
  }

  // ── App principale ──────────────────────────────────────────────────────────
  const fullscreenPages = ['subscription', 'account-settings', 'support'];
  const isFullscreen    = fullscreenPages.includes(currentPage);
  const sidebarWidth    = isFullscreen ? 0 : (collapsed ? 72 : 260);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':        return <Dashboard />;
      case 'all-trades':       return <AllTrades />;
      case 'analytics':        return <Analytics />;
      case 'analytics-pro':    return <AnalyticsPro />;
      case 'backtest':         return <Backtest />;
      case 'calendar':         return <Calendar />;
      case 'equity':           return <Equity />;
      case 'psychology':       return <Psychology />;
      case 'ai-chat':          return <AIChat />;
      case 'account-settings':
        return <AccountSettings user={user} onBack={() => setCurrentPage('dashboard')} />;
      case 'subscription':
        return <PlanSelection user={user} onSkip={() => setCurrentPage('dashboard')} />;
      case 'support':
        return <SupportPage user={user} onBack={() => setCurrentPage('dashboard')} />;
      default: return <Dashboard />;
    }
  };

  return (
    <TradingProvider>
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'Inter',sans-serif" }}>
        {!isFullscreen && (
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: sidebarWidth, zIndex: 100, transition: 'width 0.30s cubic-bezier(0.4,0,0.2,1)' }}>
            <Sidebar
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              user={user}
              onLogout={handleLogout}
            />
          </div>
        )}
        <div className="mf-main" style={{
          marginLeft: sidebarWidth, flex: 1, minHeight: '100vh',
          transition: 'margin-left 0.30s cubic-bezier(0.4,0,0.2,1)',
          backgroundColor: 'var(--bg)', overflow: 'auto',
        }}>
          {renderPage()}
        </div>
        <SupportWidget onOpenPage={(page) => setCurrentPage(page)} />
      </div>
    </TradingProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppInner />
    </AuthProvider>
  );
}