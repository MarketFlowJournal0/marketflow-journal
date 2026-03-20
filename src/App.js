import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, animation: 'mf-pulse 2.2s ease-in-out infinite' }}>
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

// Layout principal avec sidebar
function AppLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const currentPage = location.pathname.replace('/', '') || 'dashboard';
  const setCurrentPage = (page) => navigate('/' + page);

  const fullscreenPages = ['subscription', 'account-settings', 'support'];
  const isFullscreen = fullscreenPages.includes(currentPage);
  const sidebarWidth = isFullscreen ? 0 : (collapsed ? 72 : 260);

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
              onLogout={onLogout}
            />
          </div>
        )}
        <div className="mf-main" style={{ marginLeft: sidebarWidth, flex: 1, minHeight: '100vh', transition: 'margin-left 0.30s cubic-bezier(0.4,0,0.2,1)', backgroundColor: 'var(--bg)', overflow: 'auto' }}>
          <Routes>
            <Route path="/dashboard"        element={<Dashboard />} />
            <Route path="/all-trades"       element={<AllTrades />} />
            <Route path="/analytics"        element={<Analytics />} />
            <Route path="/analytics-pro"    element={<AnalyticsPro />} />
            <Route path="/backtest"         element={<Backtest />} />
            <Route path="/calendar"         element={<Calendar />} />
            <Route path="/equity"           element={<Equity />} />
            <Route path="/psychology"       element={<Psychology />} />
            <Route path="/ai-chat"          element={<AIChat />} />
            <Route path="/account-settings" element={<AccountSettings user={user} onBack={() => navigate('/dashboard')} />} />
            <Route path="/subscription"     element={<PlanSelection user={user} onSkip={() => navigate('/dashboard')} />} />
            <Route path="/support"          element={<SupportPage user={user} onBack={() => navigate('/dashboard')} />} />
            <Route path="*"                 element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
        <SupportWidget onOpenPage={(page) => navigate('/' + page)} />
      </div>
    </TradingProvider>
  );
}

function AppInner() {
  const { user, loading, profileLoaded, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authModal,      setAuthModal]      = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Gestion payment=success / cancelled depuis Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      navigate('/', { replace: true });
      const doRefresh = async () => {
        try { await refreshProfile?.(); } catch (_) {}
      };
      doRefresh();
      setTimeout(() => toast.success('🎉 Bienvenue sur MarketFlow Journal ! Ton accès est activé.', {
        duration: 8000,
        style: { background: '#0D1627', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', fontSize: '15px' },
      }), 500);
    }
    if (params.get('payment') === 'cancelled') {
      navigate('/plan', { replace: true });
      toast('Paiement annulé. 👋', { style: { background: '#0D1627', color: '#fff', borderRadius: '12px' } });
    }
  }, []); // eslint-disable-line

  // Onboarding après nouvelle inscription — détecté via sessionStorage
  useEffect(() => {
    if (user) {
      const isNew = sessionStorage.getItem('mfj_new_signup') === '1';
      const done  = localStorage.getItem(ONBOARDING_DONE_KEY + '_' + user.id);
      if (isNew && !done) {
        sessionStorage.removeItem('mfj_new_signup');
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const openLogin          = () => setAuthModal('login');
  const openSignup         = () => setAuthModal('signup');
  const closeAuth          = () => setAuthModal(null);
  const openSignupWithPlan = (priceId) => {
    sessionStorage.setItem('pending_price_id', priceId);
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
    // Marquer nouvelle inscription dans sessionStorage (survit au re-render)
    sessionStorage.setItem('mfj_new_signup', '1');
    const pendingPriceId = sessionStorage.getItem('pending_price_id');
    if (pendingPriceId) {
      sessionStorage.removeItem('pending_price_id');
      setTimeout(() => launchCheckout(pendingPriceId, userData?.email), 800);
    }
  };

  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    // Supprimer explicitement la session Supabase
    localStorage.removeItem('mfj-auth');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.startsWith('mfj')) localStorage.removeItem(k);
    });
    sessionStorage.clear();
    // Forcer retour sur la racine proprement
    window.location.href = 'https://marketflowjournal.com/';
  };

  const handleOnboardingComplete = (answers) => {
    if (user?.id) localStorage.setItem(ONBOARDING_DONE_KEY + '_' + user.id, '1');
    setShowOnboarding(false);
    navigate('/plan');
  };

  // ── Auth callback ──
  if (location.pathname === '/auth/callback') return <AuthCallback />;

  // ── Loading ──
  if (loading && !profileLoaded) return <LoadingScreen />;

  // ── Non connecté ──
  if (!user) {
    return (
      <>
        <Routes>
          <Route path="*" element={
            <LandingPage onLogin={openLogin} onSignup={openSignup} onSignupWithPlan={openSignupWithPlan} />
          } />
        </Routes>
        <SupportWidget onOpenPage={() => {}} />
        {authModal && <AuthModal defaultTab={authModal} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
      </>
    );
  }

  // ── Onboarding ──
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // ── Pas d'abonnement → /plan ──
  if (profileLoaded && !user.stripeCustomerId) {
    return (
      <>
        <Routes>
          <Route path="/plan" element={
            <PlanSelection
              user={user}
              onLogout={() => { logout().catch(() => {}); setTimeout(() => { window.location.href = '/'; }, 300); }}
            />
          } />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
        <SupportWidget onOpenPage={() => {}} />
      </>
    );
  }

  // ── App principale ──
  return <AppLayout user={user} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}