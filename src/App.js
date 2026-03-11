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
      background:'#030508',
      display:'flex',alignItems:'center',justifyContent:'center',
      flexDirection:'column',gap:20,
      zIndex:9999,
    }}>
      <style>{`
        @keyframes mf-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.7; transform:scale(0.96); }
        }
        @keyframes mf-load {
          0%   { transform:translateX(-100%); }
          100% { transform:translateX(400%); }
        }
      `}</style>

      {/* Logo + nom */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,animation:'mf-pulse 2s ease-in-out infinite'}}>
        <div style={{
          width:64,height:64,borderRadius:16,
          background:'linear-gradient(135deg,#06E6FF22,#00FF8822)',
          border:'1px solid rgba(6,230,255,0.25)',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 0 40px rgba(6,230,255,0.15)',
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M6 26 L13 16 L18 21 L23 11 L30 26" stroke="#06E6FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="30" cy="26" r="2" fill="#00FF88"/>
          </svg>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{
            fontFamily:"'Inter',sans-serif",
            fontWeight:800,fontSize:20,
            color:'#fff',letterSpacing:'-0.5px',
          }}>
            Market<span style={{color:'#06E6FF'}}>Flow</span>
          </div>
          <div style={{
            fontFamily:"'Inter',sans-serif",
            fontSize:12,color:'rgba(122,144,184,0.8)',
            marginTop:3,letterSpacing:'0.05em',
          }}>
            Journal
          </div>
        </div>
      </div>

      {/* Barre de chargement */}
      <div style={{
        width:120,height:2,borderRadius:2,
        background:'rgba(255,255,255,0.06)',
        overflow:'hidden',marginTop:4,
      }}>
        <div style={{
          width:'40%',height:'100%',
          background:'linear-gradient(90deg,#06E6FF,#00FF88)',
          borderRadius:2,
          animation:'mf-load 1.4s ease-in-out infinite',
        }}/>
      </div>
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

  // Nettoyer session corrompue + forcer PlanSelection si pas de Stripe customer
  React.useEffect(() => {
    if (loading) return;
    // Session corrompue (user supprimé côté Supabase mais token encore présent)
    // → on déconnecte proprement
    if (!user) {
      // Nettoyer les tokens Supabase du localStorage automatiquement
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-') || k.includes('supabase'))
        .forEach(k => localStorage.removeItem(k));
      return;
    }
    if (!user.id) return;
    // Attendre que le profil soit chargé avant de décider
    const timer = setTimeout(() => {
      if (!user.stripeCustomerId) {
        setShowPlanSelection(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [loading, user?.id, user?.stripeCustomerId]);

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
        body: JSON.stringify({ priceId, email: userEmail, userId: user?.id }),
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
        backgroundColor:'var(--bg)',
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
        <div
          className="mf-main"
          style={{
            marginLeft:sidebarWidth, flex:1,
            minHeight:'100vh',
            transition:'margin-left 0.30s cubic-bezier(0.4,0,0.2,1)',
            backgroundColor:'var(--bg)',
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