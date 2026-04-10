import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEntryRoute, getPlanDetails, normalizePlan } from '../lib/subscription';

const POST_WELCOME_ACCESS_KEY = 'mfj_post_welcome_journal_access';
const FORCE_JOURNAL_ACCESS_PREFIX = 'mfj_force_journal_access_';
const FORCE_JOURNAL_PLAN_PREFIX = 'mfj_force_journal_plan_';
const CHECKOUT_PLAN_KEY = 'mfj_checkout_plan_id';

function FeatureTile({ text, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.28 + index * 0.05, duration: 0.4 }}
      style={{
        background: 'linear-gradient(180deg, rgba(12,20,34,0.9), rgba(6,10,18,0.88))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '16px 15px',
        minHeight: 98,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 85% 0%, ${accent}17, transparent 46%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 10,
          border: `1px solid ${accent}45`,
          background: `${accent}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 12px ${accent}`,
          }}
        />
      </div>
      <div
        style={{
          color: '#E6EEFF',
          fontSize: 14,
          lineHeight: 1.55,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

function SnapshotCard({ title, value, accent }) {
  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
        borderRadius: 16,
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: '#6E86AF',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          lineHeight: 1.04,
          letterSpacing: '-0.05em',
          fontWeight: 700,
          color: accent || '#E8EEFF',
          fontFamily: "'Space Grotesk',sans-serif",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [hasSessionId, setHasSessionId] = useState(false);
  const [syncHint, setSyncHint] = useState(false);
  const [ready, setReady] = useState(false);
  const [checkoutPlanId, setCheckoutPlanId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('plan_id') || sessionStorage.getItem(CHECKOUT_PLAN_KEY) || localStorage.getItem(CHECKOUT_PLAN_KEY) || null;
  });

  const forceAccessKey = user?.id ? FORCE_JOURNAL_ACCESS_PREFIX + user.id : null;
  const forcePlanKey = user?.id ? FORCE_JOURNAL_PLAN_PREFIX + user.id : null;
  const forcedPlanId = forcePlanKey ? localStorage.getItem(forcePlanKey) : null;
  const profilePlanId = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const planId = profilePlanId !== 'trial' ? profilePlanId : normalizePlan(checkoutPlanId || forcedPlanId || profilePlanId);
  const plan = getPlanDetails(planId);
  const journalRoute = '/' + getEntryRoute(planId);
  const firstName = user?.firstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const email = user?.email || '';
  const isActivated = Boolean(user?.stripeSubscriptionId && ['active', 'trialing'].includes(user?.subStatus));
  const featureList = useMemo(() => plan.features.slice(0, 6), [plan.features]);

  const unlockJournalNow = useCallback(() => {
    sessionStorage.setItem(POST_WELCOME_ACCESS_KEY, '1');
    if (forceAccessKey) localStorage.setItem(forceAccessKey, '1');
    if (forcePlanKey) localStorage.setItem(forcePlanKey, planId);
  }, [forceAccessKey, forcePlanKey, planId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const urlPlanId = params.get('plan_id');
    const alreadyUnlocked = Boolean(
      sessionStorage.getItem(POST_WELCOME_ACCESS_KEY) === '1' ||
      (forceAccessKey && localStorage.getItem(forceAccessKey) === '1')
    );

    if (sessionId) {
      setHasSessionId(true);
      if (urlPlanId) {
        setCheckoutPlanId(urlPlanId);
        sessionStorage.setItem(CHECKOUT_PLAN_KEY, urlPlanId);
        localStorage.setItem(CHECKOUT_PLAN_KEY, urlPlanId);
      }
      unlockJournalNow();
      return;
    }

    if (alreadyUnlocked) {
      navigate(journalRoute, { replace: true });
      return;
    }

    navigate('/plan', { replace: true });
  }, [forceAccessKey, journalRoute, navigate, unlockJournalNow]);

  useEffect(() => {
    if (!hasSessionId) return undefined;

    const timer = window.setTimeout(() => {
      unlockJournalNow();
      setReady(true);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [hasSessionId, unlockJournalNow]);

  useEffect(() => {
    if (!hasSessionId) return undefined;

    let cancelled = false;
    let attempts = 0;

    const runSync = async () => {
      attempts += 1;
      try {
        await refreshProfile?.();
      } catch (_) {}
      if (!cancelled && attempts >= 4 && !isActivated) {
        setSyncHint(true);
      }
    };

    runSync();
    const timer = window.setInterval(runSync, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [hasSessionId, isActivated, refreshProfile]);

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(1200px 600px at 50% -10%, #0A1A3A 0%, #050C1F 35%, #020510 70%, #010207 100%)',
      }}
    >
      <style>{`
        @keyframes mf-aurora-drift-a {
          0% { transform: translate3d(-6%, -8%, 0) scale(1); opacity: 0.55; }
          50% { transform: translate3d(8%, 2%, 0) scale(1.12); opacity: 0.85; }
          100% { transform: translate3d(-6%, -8%, 0) scale(1); opacity: 0.55; }
        }
        @keyframes mf-aurora-drift-b {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate3d(-8%, 4%, 0) scale(1.08); opacity: 0.72; }
          100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
        }
        @keyframes mf-grid-slide {
          0% { transform: translateY(0); }
          100% { transform: translateY(56px); }
        }
        @keyframes mf-scan {
          0% { transform: translateY(-20vh); opacity: 0; }
          20% { opacity: 0.4; }
          70% { opacity: 0.18; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
        @media (max-width: 980px) {
          .mf-welcome-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .mf-welcome-main {
            padding: 28px 22px 24px !important;
          }
        }
      `}</style>

      <div
        style={{
          position: 'absolute',
          inset: -120,
          background: `radial-gradient(500px 280px at 20% 20%, ${plan.accent}28, transparent 60%)`,
          filter: 'blur(48px)',
          animation: 'mf-aurora-drift-a 14s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: -120,
          background: 'radial-gradient(460px 260px at 80% 22%, rgba(6,230,255,0.28), transparent 62%)',
          filter: 'blur(52px)',
          animation: 'mf-aurora-drift-b 18s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(44,74,124,0.13) 1px, transparent 1px), linear-gradient(to bottom, rgba(44,74,124,0.13) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          opacity: 0.2,
          animation: 'mf-grid-slide 12s linear infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(3,8,20,0.38) 50%, rgba(1,3,8,0.72) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(6,230,255,0.45), transparent)',
          filter: 'blur(1.2px)',
          animation: 'mf-scan 7.5s linear infinite',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1160,
          margin: '0 auto',
          padding: '54px 24px 88px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(7,16,34,0.5)',
            color: '#91B2E2',
            padding: '7px 14px',
            fontWeight: 700,
            fontSize: 11.5,
            letterSpacing: '0.11em',
            textTransform: 'uppercase',
            marginBottom: 22,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#00FF88',
              boxShadow: '0 0 12px rgba(0,255,136,0.7)',
            }}
          />
          {ready ? 'Payment Confirmed' : 'Final Check'}
        </motion.div>

        <div
          className="mf-welcome-layout"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(310px, 0.8fr)',
            gap: 20,
            alignItems: 'start',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.4 }}
            className="mf-welcome-main"
            style={{
              background: 'linear-gradient(168deg, rgba(8,18,40,0.92) 0%, rgba(4,10,22,0.95) 50%, rgba(4,8,18,0.96) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 28,
              padding: '34px 30px 30px',
              boxShadow: '0 34px 100px rgba(0,0,0,0.48)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 86% -6%, ${plan.accent}26, transparent 45%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 43,
                  height: 43,
                  borderRadius: 14,
                  border: '1px solid rgba(6,230,255,0.18)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: 4,
                }}
              >
                <img src="/logo192.png" alt="MarketFlow" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: 30,
                    lineHeight: 1,
                    letterSpacing: '-0.06em',
                    fontWeight: 700,
                    color: '#F0F5FF',
                  }}
                >
                  Market<span style={{ color: '#06E6FF' }}>Flow</span>
                </div>
                <div style={{ marginTop: 3, fontSize: 11, color: '#6B86B0', letterSpacing: '0.11em', textTransform: 'uppercase' }}>
                  Trading Journal
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 999,
                border: `1px solid ${plan.accent}45`,
                background: `${plan.accent}16`,
                color: plan.accent,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '6px 12px',
                marginBottom: 16,
              }}
            >
              {ready ? `${plan.label} Access Unlocked` : 'Access Secured'}
            </div>

            <h1
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                color: '#F5F9FF',
                margin: '0 0 14px',
                fontWeight: 700,
                fontSize: 'clamp(42px, 7vw, 76px)',
                lineHeight: 0.93,
                letterSpacing: '-0.08em',
              }}
            >
              Welcome back,
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #06E6FF, #00FF88)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {firstName}
              </span>
            </h1>

            <p
              style={{
                color: '#8AA3CB',
                margin: '0 0 24px',
                maxWidth: 660,
                fontSize: 16,
                lineHeight: 1.8,
              }}
            >
              Your payment for {email} is confirmed. In a few seconds this page turns green and opens your journal button with your {plan.label} access.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22 }}
                  onClick={() => {
                    unlockJournalNow();
                    navigate(journalRoute);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #00FF88, #06E6FF)',
                    border: 'none',
                    color: '#02111B',
                    borderRadius: 14,
                    padding: '15px 26px',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 18px 42px rgba(0,255,136,0.34)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px)';
                    event.currentTarget.style.boxShadow = '0 24px 52px rgba(0,255,136,0.46)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0)';
                    event.currentTarget.style.boxShadow = '0 18px 42px rgba(0,255,136,0.34)';
                  }}
                >
                  Access Your Journal ->
                </motion.button>
              )}
              <button
                onClick={() => navigate('/subscription')}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#E8EEFF',
                  borderRadius: 14,
                  padding: '15px 20px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Manage Plan
              </button>
            </div>

            <div style={{ color: syncHint && !isActivated ? '#FDBA74' : '#7E98C2', fontSize: 12.5, lineHeight: 1.7 }}>
              {ready
                ? 'Your access is saved. You can return to the journal anytime with this account.'
                : 'Your journal access is being unlocked now.'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{ display: 'grid', gap: 16 }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(8,18,40,0.88), rgba(4,10,22,0.92))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 22,
                padding: 18,
              }}
            >
              <div
                style={{
                  color: '#7B96C1',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                }}
              >
                Workspace Snapshot
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <SnapshotCard title="Plan" value={plan.label} accent={plan.accent} />
                <SnapshotCard title="Status" value={ready ? 'Journal unlocked' : 'Unlocking'} accent={ready ? '#00FF88' : '#FDBA74'} />
                <SnapshotCard title="Home" value={journalRoute.replace('/', '')} accent="#E8EEFF" />
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, rgba(8,18,40,0.88), rgba(4,10,22,0.92))',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 22,
                padding: 18,
              }}
            >
              <div
                style={{
                  color: '#7B96C1',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}
              >
                Included Now
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: 30,
                  lineHeight: 1.06,
                  letterSpacing: '-0.05em',
                  color: '#F0F6FF',
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                {plan.description}
              </div>
              <div style={{ color: '#8AA3CB', fontSize: 14, lineHeight: 1.7 }}>
                {ready ? 'Access is open right now. Your plan modules are already applied to sidebar and route permissions.' : 'The journal button appears automatically in under 3 seconds.'}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.4 }}
          style={{ marginTop: 24 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  color: '#7B96C1',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 6,
                }}
              >
                Your Unlocked Modules
              </div>
              <div
                style={{
                  color: '#F2F7FF',
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: 34,
                  lineHeight: 1.03,
                  letterSpacing: '-0.06em',
                  fontWeight: 700,
                }}
              >
                {plan.label} experience
              </div>
            </div>
            <div
              style={{
                background: 'rgba(8,18,40,0.58)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                color: '#A0B8DD',
                fontSize: 13,
                padding: '10px 14px',
                maxWidth: 440,
              }}
            >
              {ready ? 'One click opens your journal now. Your access stays saved for this account.' : 'The journal opens as soon as the green access state appears.'}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 12,
            }}
          >
            {featureList.map((feature, index) => (
              <FeatureTile key={feature} text={feature} accent={plan.accent} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
