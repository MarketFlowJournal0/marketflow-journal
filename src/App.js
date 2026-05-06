import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MarketFlowMark, MarketFlowWordmark } from './components/MarketFlowBrand';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import PublicInfoPage from './pages/PublicInfoPage';
import Dashboard from './pages/Dashboard';
import AllTrades from './pages/AllTrades';
import AnalyticsPro from './pages/AnalyticsPro';
import Backtest from './pages/Backtest';
import Development from './pages/Development';
import Calendar from './pages/Calendar';
import Equity from './pages/Equity';
import Psychology from './pages/Psychology';
import AccountSettings from './pages/AccountSettings';
import PlanSelection from './pages/PlanSelection';
import SupportPage from './pages/SupportPage';
import OnboardingFlow from './pages/OnboardingFlow';
import OnboardingStats from './pages/OnboardingStats';
import SupportWidget from './components/SupportWidget';
import { TradingProvider } from './context/TradingContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import { Toaster, toast } from 'react-hot-toast';
import AuthCallback from './pages/AuthCallback';
import BrokerConnect from './pages/BrokerConnect';
import AIChatBot from './components/AIChatBot';
import DailyPsychologyCheckIn from './components/DailyPsychologyCheckIn';
import JournalAmbientBackground from './components/JournalAmbientBackground';
import ReportsPage from './pages/Reports';
import AlertsPage from './pages/Alerts';
import ApiAccessPage from './pages/ApiAccess';
import Competition from './pages/Competition';
import WelcomePage from './pages/WelcomePage';
import { getEntryRoute, hasJournalAccess, hasRouteAccess, normalizePlan } from './lib/subscription';
import { JOURNAL_THEME_KEY, JOURNAL_THEME_CUSTOM_KEY, getJournalTheme, applyJournalTheme } from './lib/journalTheme';
import { buildOnboardingRecord } from './lib/onboarding';
import { appUrl, publicSiteUrl, shouldRenderApp } from './lib/appUrls';
import { PRICE_PLAN_MAP } from './lib/stripePriceConfig';
import './App.css';
import './theme.css';

const ONBOARDING_DONE_KEY = 'mfj_onboarding_done';
const CHECKOUT_PLAN_KEY = 'mfj_checkout_plan_id';
const POST_AUTH_ROUTE_KEY = 'mfj_post_auth_route';
const AUTO_CHECKOUT_KEY = 'mfj_auto_checkout_after_auth';
const PENDING_SIGNUP_EMAIL_KEY = 'mfj_pending_new_account_email';
const PENDING_SIGNUP_AT_KEY = 'mfj_pending_new_account_at';
const ADMIN_EMAIL = 'marketflowjournal0@gmail.com';
const SEO_SITE_NAME = 'MarketFlow Journal';
const SEO_TITLE_TEMPLATE = '%s | MarketFlow Journal';
const SEO_ROUTE_TITLES = {
  '/': 'Professional Trading Journal & Analytics',
  '/dashboard': 'Dashboard',
  '/all-trades': 'All Trades',
  '/analytics': 'Analytics',
  '/backtest': 'Backtest',
  '/development': 'Development Workspace',
  '/psychology': 'Psychology Tracker',
  '/equity': 'Equity Curve',
  '/broker-connect': 'Broker Connect',
  '/reports': 'Reports',
  '/alerts': 'Alerts',
  '/api-access': 'API Access',
  '/competition': 'Competition',
  '/plan': 'Plans',
  '/welcome': 'Welcome',
  '/support': 'Support',
};
const SEO_DESCRIPTION = 'MarketFlow Journal is a premium trading journal for trade review, execution tracking, analytics, psychology, backtesting, broker workflows, reports, and disciplined performance improvement.';

const PUBLIC_INFO_ROUTES = {
  '/docs': 'docs',
  '/documentation': 'docs',
  '/guide': 'docs',
  '/import-guide': 'import',
  '/csv': 'import',
  '/tutorials': 'tutorials',
  '/workflows': 'tutorials',
  '/terms': 'terms',
  '/terms-of-service': 'terms',
  '/privacy': 'privacy',
  '/privacy-policy': 'privacy',
  '/contact': 'contact',
};

function rememberCheckoutPlan(planId) {
  const normalizedPlan = normalizePlan(planId);
  if (normalizedPlan === 'trial') return;
  sessionStorage.setItem(CHECKOUT_PLAN_KEY, normalizedPlan);
  localStorage.setItem(CHECKOUT_PLAN_KEY, normalizedPlan);
}

function formatSeoTitle(pathname = '/') {
  const title = SEO_ROUTE_TITLES[pathname] || SEO_ROUTE_TITLES['/'];
  return pathname === '/' ? `${SEO_SITE_NAME} | ${title}` : SEO_TITLE_TEMPLATE.replace('%s', title);
}

function updateMetaTag(selector, attr, value) {
  if (typeof document === 'undefined' || !value) return;
  const tag = document.head.querySelector(selector);
  if (tag) tag.setAttribute(attr, value);
}


function LoadingScreen() {
  return (
    <div className="mfj-loading-screen" style={{
      position: 'fixed', inset: 0, background: '#01040A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20, zIndex: 9999,
    }}>
      <style>{`
        @keyframes mf-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.75;transform:scale(.97)} }
        @keyframes mf-shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }
        @keyframes mf-glow    { 0%,100%{filter:drop-shadow(0 0 18px rgba(20,201,229,.14))} 50%{filter:drop-shadow(0 0 34px rgba(20,201,229,.24))} }
        .mfj-loading-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 18%, rgba(20,201,229,.10), transparent 32%),
            radial-gradient(circle at 78% 72%, rgba(0,210,184,.08), transparent 34%),
            linear-gradient(135deg, rgba(220,228,239,.018), transparent 45%);
          pointer-events: none;
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, animation: 'mf-pulse 2.2s ease-in-out infinite' }}>
        <div style={{ animation: 'mf-glow 2.2s ease-in-out infinite' }}>
          <MarketFlowMark
            size={72}
            radius={20}
            padding={0}
            border="0"
            background="transparent"
            shadow="0 18px 44px rgba(0, 0, 0, 0.42), 0 0 42px rgba(20, 201, 229, 0.14)"
          />
        </div>
        <MarketFlowWordmark
          align="center"
          subtitle="Journal"
          titleFamily="'Inter',sans-serif"
          titleSize={22}
          titleLetterSpacing="-0.6px"
          subtitleSize={11}
          subtitleLetterSpacing="0.12em"
          subtitleStyle={{ color: 'rgba(122,144,184,0.7)', marginTop: 4 }}
        />
      </div>
      <div style={{ width: 100, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginTop: 8 }}>
        <div style={{ width: '35%', height: '100%', background: 'linear-gradient(90deg,transparent,#DCE4EF,#14C9E5,#00D2B8,transparent)', borderRadius: 2, animation: 'mf-shimmer 1.6s ease-in-out infinite' }} />
      </div>
    </div>
  );

}

class BacktestSafetyBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MarketFlow Backtest crash]', error, info);
  }

  resetSavedSessions = () => {
    try {
      if (this.props.userId) {
        localStorage.removeItem(`mf_backtest_sessions_v1_${this.props.userId}`);
      }
    } catch (_) {}
    this.setState((current) => ({ error: null, resetKey: current.resetKey + 1 }));
  };

  retryWithoutClearing = () => {
    this.setState((current) => ({ error: null, resetKey: current.resetKey + 1 }));
  };

  render() {
    if (!this.state.error) {
      return React.cloneElement(this.props.children, { key: this.state.resetKey });
    }

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg,#01040A)', padding: '28px', color: 'var(--mf-text-1,#E8EEFF)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{
            border: '1px solid rgba(255,179,26,0.22)',
            borderRadius: 24,
            padding: '22px 24px',
            background: 'linear-gradient(135deg, rgba(255,179,26,0.10), rgba(7,11,19,0.84))',
            boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            fontSize: 13,
            lineHeight: 1.65,
          }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mf-warn,#FFB31A)', fontWeight: 900, marginBottom: 8 }}>
              Backtest module recovered
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: 28, letterSpacing: '-0.04em' }}>A local Backtest state crashed before render.</h2>
            <p style={{ margin: '0 0 14px', color: 'var(--mf-text-2,#8EA4C8)' }}>
              The journal is still alive and your All Trades data is untouched. Retry first; if the same saved replay crashes again, reset only the local Backtest sessions.
            </p>
            {this.state.error?.message ? (
              <details style={{ marginTop: 8, color: 'var(--mf-text-2,#8EA4C8)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Technical detail</summary>
                <span>{this.state.error.message}</span>
              </details>
            ) : null}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <button
                type="button"
                onClick={this.retryWithoutClearing}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 999,
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--mf-text-1,#E8EEFF)',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Retry module
              </button>
              <button
                type="button"
                onClick={this.resetSavedSessions}
                style={{
                  border: '1px solid rgba(255,179,26,0.28)',
                  borderRadius: 999,
                  padding: '10px 14px',
                  background: 'rgba(255,179,26,0.12)',
                  color: 'var(--mf-warn,#FFB31A)',
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                Reset local Backtest sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Layout principal avec sidebar
function AppLayout({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const profilePlan = normalizePlan(user?.plan || user?.user_metadata?.plan || user?.app_metadata?.plan || 'trial');
  const checkoutPlan = sessionStorage.getItem(CHECKOUT_PLAN_KEY) || localStorage.getItem(CHECKOUT_PLAN_KEY);
  const plan = profilePlan !== 'trial' ? profilePlan : normalizePlan(checkoutPlan || profilePlan);
  const effectiveUser = user ? { ...user, plan } : user;
  const entryRoute = getEntryRoute(plan);
  const fallbackRoute = '/' + entryRoute;
  const isAdmin = user?.email === ADMIN_EMAIL;

  const currentPage = location.pathname.replace('/', '') || entryRoute;
  const setCurrentPage = (page) => navigate('/' + page);

  useEffect(() => {
    const storedTheme = localStorage.getItem(JOURNAL_THEME_KEY);
    const storedCustomAccent = localStorage.getItem(JOURNAL_THEME_CUSTOM_KEY);
    applyJournalTheme(getJournalTheme(plan, storedTheme, storedCustomAccent));
  }, [plan]);

  const fullscreenPages = ['subscription', 'account-settings', 'support'];
  const isFullscreen = fullscreenPages.includes(currentPage);
  const sidebarWidth = isFullscreen ? 0 : (collapsed ? 72 : 260);
  const renderProtectedRoute = (routeId, element) => {
    if (routeId === 'onboarding-stats' && isAdmin) return element;
    if (hasRouteAccess(plan, routeId)) return element;
    return <Navigate to="/subscription" replace state={{ upgradeFrom: routeId }} />;
  };

  return (
    <TradingProvider>
      <div className="mfj-shell" style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'Inter',sans-serif", overflowX: 'visible', position: 'relative' }}>
        {!isFullscreen && (
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: sidebarWidth, zIndex: 100, transition: 'width 0.30s cubic-bezier(0.4,0,0.2,1)', overflow: 'visible' }}>
            <Sidebar
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              user={effectiveUser}
              onLogout={onLogout}
            />
          </div>
        )}
        <div className="mf-main" style={{ marginLeft: sidebarWidth, flex: 1, minHeight: '100vh', transition: 'margin-left 0.30s cubic-bezier(0.4,0,0.2,1)', backgroundColor: 'var(--bg)', overflow: 'auto', position: 'relative', zIndex: 1 }}>
          <JournalAmbientBackground />
          <div className="mf-main-content">
            <Routes>
              <Route path="/dashboard" element={renderProtectedRoute('dashboard', <Dashboard />)} />
              <Route path="/all-trades" element={renderProtectedRoute('all-trades', <AllTrades />)} />
              <Route path="/analytics" element={<Navigate to="/analytics-pro" replace />} />
              <Route path="/analytics-pro" element={renderProtectedRoute('analytics-pro', <AnalyticsPro />)} />
              <Route
                path="/backtest"
                element={renderProtectedRoute(
                  'backtest',
                  <BacktestSafetyBoundary userId={effectiveUser?.id}>
                    <Backtest />
                  </BacktestSafetyBoundary>
                )}
              />
              <Route path="/development" element={renderProtectedRoute('development', <Development />)} />
              <Route path="/calendar" element={renderProtectedRoute('calendar', <Calendar />)} />
              <Route path="/equity" element={renderProtectedRoute('equity', <Equity />)} />
              <Route path="/psychology" element={renderProtectedRoute('psychology', <Psychology />)} />
              <Route path="/ai-chat" element={<Navigate to="/dashboard" replace />} />
              <Route path="/broker-connect" element={renderProtectedRoute('broker-connect', <BrokerConnect />)} />
              <Route
                path="/account-settings"
                element={renderProtectedRoute('account-settings', <AccountSettings user={effectiveUser} onBack={() => navigate(fallbackRoute)} />)}
              />
              <Route
                path="/subscription"
                element={renderProtectedRoute('subscription', <PlanSelection user={effectiveUser} onSkip={() => navigate(fallbackRoute)} />)}
              />
              <Route
                path="/support"
                element={renderProtectedRoute('support', <SupportPage user={effectiveUser} onBack={() => navigate(fallbackRoute)} />)}
              />
              <Route
                path="/onboarding-stats"
                element={renderProtectedRoute('onboarding-stats', <OnboardingStats onBack={() => navigate(fallbackRoute)} />)}
              />
              <Route path="/reports" element={renderProtectedRoute('reports', <ReportsPage />)} />
              <Route path="/alerts" element={renderProtectedRoute('alerts', <AlertsPage />)} />
              <Route path="/api-access" element={renderProtectedRoute('api-access', <ApiAccessPage />)} />
              <Route path="/competition" element={renderProtectedRoute('competition', <Competition />)} />
              <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
            </Routes>
          </div>
        </div>
        {hasRouteAccess(plan, 'ai-chat') && <AIChatBot />}
        <DailyPsychologyCheckIn
          user={effectiveUser}
          enabled={!isFullscreen && hasRouteAccess(plan, 'psychology')}
        />
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
  const [authTransitioning, setAuthTransitioning] = useState(false);
  const [forceLoggedOut, setForceLoggedOut] = useState(
    () => sessionStorage.getItem('mfj_logged_out') === '1'
  );

  useEffect(() => {
    const hash = window.location.hash || '';
    const authHash = /access_token|refresh_token|token_hash|type=/.test(hash);
    if (hash === '#' || (user && authHash && location.pathname !== '/auth/callback')) {
      window.history.replaceState(null, document.title, `${window.location.pathname}${window.location.search}`);
    }
  }, [location.pathname, location.search, user]);

  useEffect(() => {
    const title = formatSeoTitle(location.pathname);
    const canonicalPath = shouldRenderApp() ? location.pathname : '/';
    const canonicalUrl = shouldRenderApp()
      ? appUrl(canonicalPath)
      : publicSiteUrl('/');

    document.title = title;
    updateMetaTag('meta[name="description"]', 'content', SEO_DESCRIPTION);
    updateMetaTag('meta[property="og:title"]', 'content', title);
    updateMetaTag('meta[property="og:description"]', 'content', SEO_DESCRIPTION);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[name="twitter:title"]', 'content', title);
    updateMetaTag('meta[name="twitter:description"]', 'content', SEO_DESCRIPTION);
    updateMetaTag('meta[name="twitter:url"]', 'content', canonicalUrl);

    const canonical = document.head.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', canonicalUrl);
  }, [location.pathname]);

  useEffect(() => {
    if (forceLoggedOut) {
      sessionStorage.removeItem('mfj_logged_out');
      setForceLoggedOut(false);
    }
  }, [forceLoggedOut]);

  useEffect(() => {
    if (user) setAuthTransitioning(false);
  }, [user]);

  // Gestion payment=success / cancelled depuis Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('payment') === 'success') {
      if (!shouldRenderApp()) {
        window.location.replace(appUrl('/dashboard'));
        return;
      }
      navigate('/dashboard', { replace: true });
      const doRefresh = async () => {
        try { await refreshProfile?.(); } catch (_) {}
      };
      doRefresh();
      toast.success('Welcome to MarketFlow Journal. Your access is active.', {
        duration: 8000,
        style: { background: '#0D1627', color: '#00D2B8', border: '1px solid rgba(0,255,136,0.3)', borderRadius: '12px', fontSize: '15px' },
      });
    }
    if (params.get('payment') === 'cancelled') {
      if (!shouldRenderApp()) {
        window.location.replace(appUrl('/plan'));
        return;
      }
      navigate('/plan', { replace: true });
      toast('Payment cancelled.', { style: { background: '#0D1627', color: '#fff', borderRadius: '12px' } });
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authMode = params.get('auth');
    const priceId = params.get('price_id');

    if (!authMode && !priceId) return;

    if (priceId && PRICE_PLAN_MAP[priceId]) {
      sessionStorage.setItem('pending_price_id', priceId);
      rememberCheckoutPlan(PRICE_PLAN_MAP[priceId]);
    }

    if (authMode === 'login') sessionStorage.setItem(POST_AUTH_ROUTE_KEY, '/dashboard');
    if (authMode === 'signup') sessionStorage.setItem(POST_AUTH_ROUTE_KEY, '/plan');

    if (!user && shouldRenderApp() && (authMode === 'login' || authMode === 'signup')) {
      setAuthModal(authMode);
    }

    params.delete('auth');
    params.delete('price_id');
    const nextSearch = params.toString();
    navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true });
  }, [location.search, location.pathname, navigate, user]);

  useEffect(() => {
    if (!user || !profileLoaded) return;
    if (sessionStorage.getItem('mfj_new_signup') === '1') return;
    const pendingRoute = sessionStorage.getItem(POST_AUTH_ROUTE_KEY);
    if (!pendingRoute || sessionStorage.getItem('pending_price_id')) return;

    sessionStorage.removeItem(POST_AUTH_ROUTE_KEY);
    const targetRoute = pendingRoute.startsWith('/') ? pendingRoute : `/${pendingRoute}`;

    if (!shouldRenderApp()) {
      window.location.replace(appUrl(targetRoute));
      return;
    }

    if (location.pathname !== targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  }, [user, profileLoaded, location.pathname, navigate]);


  // Onboarding — uniquement après une nouvelle inscription
  useEffect(() => {
    if (!shouldRenderApp()) return;
    if (!user || !profileLoaded) return;
    if ((user.email || '').toLowerCase() === ADMIN_EMAIL) return;

    const localKey = ONBOARDING_DONE_KEY + '_' + user.id;
    const pendingSignup = sessionStorage.getItem('mfj_new_signup') === '1';
    const pendingSignupEmail = String(localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY) || '').trim().toLowerCase();
    const pendingSignupAt = Number(localStorage.getItem(PENDING_SIGNUP_AT_KEY) || 0);
    const currentEmail = String(user.email || '').trim().toLowerCase();
    const pendingSignupMatchesUser = Boolean(
      pendingSignupAt
      && (!pendingSignupEmail || pendingSignupEmail === currentEmail)
      && Date.now() - pendingSignupAt < 30 * 24 * 60 * 60 * 1000
    );
    const isPendingNewSignup = pendingSignup || pendingSignupMatchesUser;
    const hasRealBillingFootprint = Boolean(
      user.stripeCustomerId
      || user.stripeSubscriptionId
      || hasJournalAccess(user)
      || user.needsPayment
    );

    if (user.onboardingCompleted) {
      sessionStorage.removeItem('mfj_new_signup');
      localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
      localStorage.removeItem(PENDING_SIGNUP_AT_KEY);
      localStorage.setItem(localKey, '1');
      setShowOnboarding(false);
      return;
    }

    if (isPendingNewSignup) {
      setShowOnboarding(true);
      return;
    }

    if (hasRealBillingFootprint) {
      sessionStorage.removeItem('mfj_new_signup');
      if (!pendingSignupEmail || pendingSignupEmail === currentEmail) {
        localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        localStorage.removeItem(PENDING_SIGNUP_AT_KEY);
      }
      setShowOnboarding(false);
      return;
    }

    if (pendingSignup || pendingSignupMatchesUser || !localStorage.getItem(localKey)) {
      sessionStorage.removeItem('mfj_new_signup');
      if (!pendingSignupEmail || pendingSignupEmail === currentEmail) {
        localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        localStorage.removeItem(PENDING_SIGNUP_AT_KEY);
      }
      setShowOnboarding(true);
      return;
    }
    setShowOnboarding(false);
  }, [user, profileLoaded]);

  const rememberPostAuthRoute = (authMode) => {
    sessionStorage.setItem(POST_AUTH_ROUTE_KEY, authMode === 'signup' ? '/plan' : '/dashboard');
  };

  const routeAuthToApp = (authMode, priceId = '') => {
    rememberPostAuthRoute(authMode);
    const target = new URL(appUrl('/'));
    target.searchParams.set('auth', authMode);
    if (priceId) target.searchParams.set('price_id', priceId);
    window.location.href = target.toString();
  };

  const openLogin = () => {
    rememberPostAuthRoute('login');
    if (shouldRenderApp()) return setAuthModal('login');
    return routeAuthToApp('login');
  };
  const openSignup = () => {
    rememberPostAuthRoute('signup');
    if (shouldRenderApp()) return setAuthModal('signup');
    return routeAuthToApp('signup');
  };
  const closeAuth          = () => setAuthModal(null);
  const openSignupWithPlan = (priceId) => {
    if (priceId) {
      sessionStorage.setItem('pending_price_id', priceId);
      rememberCheckoutPlan(PRICE_PLAN_MAP[priceId]);
    }
    rememberPostAuthRoute('signup');
    if (shouldRenderApp()) return setAuthModal('signup');
    return routeAuthToApp('signup', priceId);
  };

  const launchCheckout = async (priceId, userEmail) => {
    const rawPlanId = PRICE_PLAN_MAP[priceId] || sessionStorage.getItem(CHECKOUT_PLAN_KEY) || localStorage.getItem(CHECKOUT_PLAN_KEY);
    const planId = rawPlanId ? normalizePlan(rawPlanId) : '';
    if (planId && planId !== 'trial') rememberCheckoutPlan(planId);

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, email: userEmail, userId: user?.id, planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) { console.error('Checkout error:', err); }
  };

  useEffect(() => {
    if (!user || !profileLoaded || showOnboarding) return;
    if (sessionStorage.getItem('mfj_new_signup') === '1') return;
    if (sessionStorage.getItem(AUTO_CHECKOUT_KEY) !== '1') return;

    const pendingPriceId = sessionStorage.getItem('pending_price_id');
    if (!pendingPriceId) {
      sessionStorage.removeItem(AUTO_CHECKOUT_KEY);
      return;
    }

    sessionStorage.removeItem(AUTO_CHECKOUT_KEY);
    sessionStorage.removeItem('pending_price_id');
    sessionStorage.removeItem(POST_AUTH_ROUTE_KEY);
    launchCheckout(pendingPriceId, user.email);
  }, [user, profileLoaded, showOnboarding]); // eslint-disable-line

  const handleAuthSuccess = async (userData, isNewAccount = false) => {
    setAuthTransitioning(true);
    setAuthModal(null);
    // Flag posé uniquement pour une vraie inscription (pas une connexion)
    if (isNewAccount === true) {
      sessionStorage.setItem('mfj_new_signup', '1');
      sessionStorage.setItem(POST_AUTH_ROUTE_KEY, '/plan');
      setShowOnboarding(true);

      if (!shouldRenderApp()) {
        window.location.href = appUrl('/');
      }
      return;
    }
    const pendingPriceId = sessionStorage.getItem('pending_price_id');
    if (pendingPriceId) {
      sessionStorage.setItem(AUTO_CHECKOUT_KEY, '1');
      sessionStorage.setItem(POST_AUTH_ROUTE_KEY, '/plan');
      if (!shouldRenderApp()) {
        window.location.href = appUrl('/plan');
        return;
      }
      navigate('/plan', { replace: true });
      return;
    }

    const pendingRoute = sessionStorage.getItem(POST_AUTH_ROUTE_KEY);
    sessionStorage.removeItem(POST_AUTH_ROUTE_KEY);
    const targetRoute = pendingRoute || (isNewAccount ? '/plan' : '/dashboard');

    if (!shouldRenderApp()) {
      window.location.href = appUrl(targetRoute);
      return;
    }

    navigate(targetRoute, { replace: true });
  };

  const handleLogout = async () => {
    // Flag lu au prochain init() pour bloquer la restauration de session
    localStorage.setItem('mfj_force_logout', '1');
    localStorage.removeItem('mfj-auth');
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k.startsWith('mfj') && k !== 'mfj_force_logout') localStorage.removeItem(k);
    });
    sessionStorage.clear();
    try { await logout(); } catch (_) {}
    try {
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
    } catch (_) {}
    window.location.href = appUrl('/');
  };

  const handleOnboardingComplete = async (answers) => {
    if (user?.id) {
      const onboardingRecord = buildOnboardingRecord({ answers, user });
      localStorage.setItem(ONBOARDING_DONE_KEY + '_' + user.id, '1');
      localStorage.setItem(`mfj_onboarding_backup_${user.id}`, JSON.stringify(onboardingRecord));

      try {
        const { supabase } = await import('./lib/supabase');
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        let savedThroughApi = false;

        if (accessToken) {
          const response = await fetch('/api/onboarding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ onboarding: onboardingRecord }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload?.error || 'Unable to save onboarding.');
          }

          savedThroughApi = true;
        }

        if (!savedThroughApi) {
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || null,
              onboarding: onboardingRecord,
            }, { onConflict: 'id' });
        }

        try { await refreshProfile?.(); } catch (_) {}
      } catch (error) {
        console.error('Onboarding save error:', error);
        try {
          const { supabase } = await import('./lib/supabase');
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email || null,
              onboarding: onboardingRecord,
            }, { onConflict: 'id' });
        } catch (fallbackError) {
          console.error('Onboarding fallback save error:', fallbackError);
        }
      }
    }

    sessionStorage.removeItem('pending_price_id');
    sessionStorage.removeItem(POST_AUTH_ROUTE_KEY);
    sessionStorage.removeItem('mfj_new_signup');
    localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
    localStorage.removeItem(PENDING_SIGNUP_AT_KEY);
    const nextRoute = hasJournalAccess(user) ? '/dashboard' : '/plan';
    setShowOnboarding(false);
    navigate(nextRoute, { replace: true });
  };

  // ── Auth callback ──
  if (location.pathname === '/auth/callback') return <AuthCallback />;

  // ── Loading ──
  if (loading && !profileLoaded) return <LoadingScreen />;

  if (!shouldRenderApp() && location.pathname === '/welcome') {
    const target = new URL(appUrl('/welcome'));
    target.search = location.search;
    if (location.hash && location.hash !== '#') target.hash = location.hash;
    window.location.replace(target.toString());
    return <LoadingScreen />;
  }

  const publicInfoPage = PUBLIC_INFO_ROUTES[location.pathname];
  if (publicInfoPage && !shouldRenderApp()) {
    return (
      <>
        <PublicInfoPage page={publicInfoPage} />
        <SupportWidget onOpenPage={() => { window.location.href = publicSiteUrl('/contact'); }} />
      </>
    );
  }

  // ── Non connecté ──
  if (!user) {
    if (shouldRenderApp()) {
      const pendingAuthMode = new URLSearchParams(location.search).get('auth');
      const appAuthTab = authModal || (pendingAuthMode === 'signup' ? 'signup' : 'login');

      if (authTransitioning) {
        return <LoadingScreen />;
      }

      if (location.pathname === '/plan' || location.pathname === '/subscription') {
        return (
          <>
            <PlanSelection
              user={null}
              onLogout={() => { navigate('/', { replace: true }); }}
            />
            <SupportWidget onOpenPage={() => { window.location.href = publicSiteUrl('/contact'); }} />
            {authModal && <AuthModal defaultTab={authModal} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
          </>
        );
      }

      return (
        <>
          <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at 18% 18%, rgba(20,201,229,.10), transparent 34%), radial-gradient(circle at 84% 72%, rgba(0,210,184,.07), transparent 36%), #01040A',
          }} />
          <SupportWidget onOpenPage={() => { window.location.href = publicSiteUrl('/contact'); }} />
          <AuthModal
            defaultTab={appAuthTab}
            onClose={() => { window.location.href = publicSiteUrl('/'); }}
            onSuccess={handleAuthSuccess}
          />
        </>
      );
    }

    return (
      <>
        <Routes>
          <Route path="*" element={
            <LandingPage
              onLogin={openLogin}
              onSignup={openSignup}
              onSignupWithPlan={openSignupWithPlan}
            />
          } />
        </Routes>
        <SupportWidget onOpenPage={() => { window.location.href = publicSiteUrl('/contact'); }} />
      </>
    );
  }

  // ── Onboarding ──
  if (!shouldRenderApp()) {
    const isAuthHash = /access_token|refresh_token|token_hash|type=/.test(location.hash || '');
    const hasPostAuthIntent = Boolean(sessionStorage.getItem(POST_AUTH_ROUTE_KEY) || sessionStorage.getItem('mfj_new_signup'));
    const isEmptyHashAfterAuth = location.pathname === '/' && location.hash === '#' && (user.isTrialing || user.isActive || user.needsPayment);

    if (isAuthHash || hasPostAuthIntent || isEmptyHashAfterAuth) {
      const targetRoute = sessionStorage.getItem('mfj_new_signup') === '1'
        ? '/'
        : hasJournalAccess(user)
          ? '/dashboard'
          : '/plan';
      window.location.replace(appUrl(targetRoute));
      return <LoadingScreen />;
    }

    return (
      <>
        <Routes>
          <Route path="*" element={
            <LandingPage
              onLogin={openLogin}
              onSignup={openSignup}
              onSignupWithPlan={openSignupWithPlan}
            />
          } />
        </Routes>
        <SupportWidget onOpenPage={() => { window.location.href = publicSiteUrl('/contact'); }} />
      </>
    );
  }
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // ── Retour Stripe / activation ──
  if (location.pathname === '/welcome') {
    return <WelcomePage />;
  }

  // ── Pas d'abonnement → /plan ──
  const hasValidSub = hasJournalAccess(user);
  const justPaid = location.pathname === '/welcome' || location.search.includes('session_id');
  const needsPlan = !hasValidSub && !forceLoggedOut && !justPaid;
  if (needsPlan) {
    return (
      <>
        <Routes>
          <Route path="/plan" element={
            <PlanSelection
              user={user}
              onLogout={async () => { await logout().catch(() => {}); window.location.href = appUrl('/'); }}
            />
          } />
          <Route path="*" element={<Navigate to="/plan" replace />} />
        </Routes>
        <SupportWidget onOpenPage={() => { navigate('/support'); }} />
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
