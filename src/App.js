import React, { useState } from 'react';
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
import { TradingProvider } from './context/TradingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { Toaster, toast } from 'react-hot-toast';
import PlanSelection from './pages/PlanSelection';
import AuthCallback from './pages/AuthCallback';
import './App.css';
import './theme.css';

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      position:'fixed',inset:0,
      background:'#060912',
      display:'flex',alignItems:'center',justifyContent:'center',
      flexDirection:'column',gap:16,
      zIndex:9999,
    }}>
      <div style={{
        width:48,height:48,borderRadius:12,overflow:'hidden',
        boxShadow:'0 0 30px rgba(6,230,255,0.4)',
      }}>
        <div style={{
          width:48,height:48,
          background:'linear-gradient(135deg,#06E6FF,#00FF88)',
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:24,
        }}>🧠</div>
      </div>
      <div style={{
        width:32,height:3,borderRadius:2,
        background:'rgba(255,255,255,0.06)',
        overflow:'hidden',
      }}>
        <div style={{
          height:'100%',
          background:'linear-gradient(90deg,#06E6FF,#00FF88)',
          animation:'mf-load 1.2s ease-in-out infinite',
          borderRadius:2,
        }}/>
      </div>
      <style>{`
        @keyframes mf-load {
          0%   { width:0%;   margin-left:0; }
          50%  { width:100%; margin-left:0; }
          100% { width:0%;   margin-left:100%; }
        }
      `}</style>
    </div>
  );
}

// ─── APP INNER ────────────────────────────────────────────────────────────────
function AppInner() {
  const { user, loading, logout } = useAuth();

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [collapsed,   setCollapsed]   = useState(false);
  const [authModal,   setAuthModal]   = useState(null); // null | 'login' | 'signup'
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  const openLogin  = () => setAuthModal('login');
  const openSignup = () => setAuthModal('signup');
  const closeAuth  = () => setAuthModal(null);

  // Ouvrir signup avec un plan en attente
  const openSignupWithPlan = (priceId) => {
    sessionStorage.setItem('pending_price_id', priceId);
    setAuthModal('signup');
  };

  // Lancer Stripe Checkout
  const launchCheckout = async (priceId, userEmail) => {
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: userEmail }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  // Après inscription/connexion réussie → vérifier si plan en attente
  const handleAuthSuccess = async (userData) => {
    setAuthModal(null);
    const pendingPriceId = sessionStorage.getItem('pending_price_id');
    if (pendingPriceId) {
      sessionStorage.removeItem('pending_price_id');
      setTimeout(() => launchCheckout(pendingPriceId, userData?.email), 800);
    } else {
      // Pas de plan en attente → afficher la page de sélection de plan
      setShowPlanSelection(true);
    }
  };

  // Détecter ?payment=success après retour Stripe
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        toast.success('🎉 Paiement confirmé ! Bienvenue sur MarketFlow Journal !', {
          duration: 6000,
          style: {
            background: '#0D1627',
            color: '#00FF88',
            border: '1px solid rgba(0,255,136,0.3)',
            borderRadius: '12px',
            fontSize: '15px',
          },
        });
      }, 500);
    }
    if (params.get('payment') === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
      toast('Paiement annulé. Tu peux réessayer quand tu veux ! 👋', {
        style: {
          background: '#0D1627',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
        },
      });
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    toast('À bientôt ! 👋', {
      style: {
        background:'#0D1627', color:'#fff',
        border:'1px solid rgba(255,255,255,0.1)',
        borderRadius:'12px',
      },
    });
  };

  // Vérification session en cours
  if (loading) return <LoadingScreen />;

  // ── Route /auth/callback (emails Supabase) ────────────────────────────────
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  // ── Non connecté → Landing ────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <LandingPage onLogin={openLogin} onSignup={openSignup} onSignupWithPlan={openSignupWithPlan} />
        {authModal && (
          <AuthModal
            defaultTab={authModal}
            onClose={closeAuth}
            onSuccess={handleAuthSuccess}
          />
        )}
      </>
    );
  }

  // ── Connecté mais pas encore de plan → Sélection plan ────────────────────
  if (showPlanSelection) {
    return (
      <PlanSelection
        user={user}
        onSkip={() => setShowPlanSelection(false)}
      />
    );
  }

  // ── Connecté → App ────────────────────────────────────────────────────────
  const sidebarWidth = collapsed ? 72 : 260;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':     return <Dashboard />;
      case 'all-trades':    return <AllTrades />;
      case 'analytics':     return <Analytics />;
      case 'analytics-pro': return <AnalyticsPro />;
      case 'backtest':      return <Backtest />;
      case 'calendar':      return <Calendar />;
      case 'equity':        return <Equity />;
      case 'psychology':    return <Psychology />;
      case 'ai-chat':       return <AIChat />;
      default:              return <Dashboard />;
    }
  };

  return (
    <TradingProvider>
      <div style={{
        display:'flex', minHeight:'100vh',
        backgroundColor:'#0F1420',
        fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{
          position:'fixed', top:0, left:0, bottom:0,
          width:sidebarWidth, zIndex:100,
          transition:'width 0.30s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            user={user}
            onLogout={handleLogout}
          />
        </div>
        <div style={{
          marginLeft:sidebarWidth, flex:1,
          minHeight:'100vh',
          transition:'margin-left 0.30s cubic-bezier(0.4,0,0.2,1)',
          backgroundColor:'#0F1420',
          overflow:'auto',
        }}>
          {renderPage()}
        </div>
      </div>
    </TradingProvider>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppInner />
    </AuthProvider>
  );
}