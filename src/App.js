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
          50%      { opacity:0.75; transform:scale(0.97); }
        }
        @keyframes mf-shimmer {
          0%   { transform:translateX(-100%); }
          100% { transform:translateX(350%); }
        }
        @keyframes mf-glow {
          0%,100% { box-shadow: 0 0 30px rgba(6,230,255,0.2); }
          50%      { box-shadow: 0 0 60px rgba(6,230,255,0.45); }
        }
      `}</style>

      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:18,animation:'mf-pulse 2.2s ease-in-out infinite'}}>

        {/* Logo image */}
        <div style={{
          width:72,height:72,borderRadius:20,
          overflow:'hidden',
          animation:'mf-glow 2.2s ease-in-out infinite',
        }}>
          <img
            src="/logo192.png"
            alt="MarketFlow"
            style={{width:'100%',height:'100%',objectFit:'cover'}}
            onError={(e)=>{
              // fallback si image pas dispo
              e.target.style.display='none';
              e.target.parentElement.style.background='linear-gradient(135deg,#06E6FF,#00FF88)';
              e.target.parentElement.innerHTML='<span style="font-size:32px;display:flex;align-items:center;justify-content:center;height:100%">📈</span>';
            }}
          />
        </div>

        {/* Nom */}
        <div style={{textAlign:'center',lineHeight:1}}>
          <div style={{
            fontFamily:"'Inter',sans-serif",
            fontWeight:800,fontSize:22,
            color:'#fff',letterSpacing:'-0.6px',
          }}>
            Market<span style={{color:'#06E6FF'}}>Flow</span>
          </div>
          <div style={{
            fontFamily:"'Inter',sans-serif",
            fontSize:11,
            color:'rgba(122,144,184,0.7)',
            marginTop:4,
            letterSpacing:'0.12em',
            textTransform:'uppercase',
          }}>
            Journal
          </div>
        </div>
      </div>

      {/* Barre de chargement */}
      <div style={{
        width:100,height:2,borderRadius:2,
        background:'rgba(255,255,255,0.05)',
        overflow:'hidden',
        marginTop:8,
      }}>
        <div style={{
          width:'35%',height:'100%',
          background:'linear-gradient(90deg,transparent,#06E6FF,#00FF88,transparent)',
          borderRadius:2,
          animation:'mf-shimmer 1.6s ease-in-out infinite',
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

  // Forcer PlanSelection si pas de Stripe customer
  // Utiliser une ref pour éviter les boucles
  const planCheckDone = React.useRef(false);
  React.useEffect(() => {
    if (loading) return;
    if (!user?.id) return;
    if (planCheckDone.current) return; // ne faire le check qu'une seule fois
    planCheckDone.current = true;
    if (!user.stripeCustomerId) {
      setShowPlanSelection(true);
    }
  }, [loading, user?.id]);

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
    // Bloquer le bouton retour du navigateur
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
    return (
      <PlanSelection
        user={user}
        onSkip={null}
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