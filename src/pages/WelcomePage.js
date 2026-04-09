import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEntryRoute, getPlanDetails, normalizePlan } from '../lib/subscription';

function WelcomeBg() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    const particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const init = () => {
      resize();
      particles.length = 0;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      for (let index = 0; index < 52; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.16,
          vy: (Math.random() - 0.5) * 0.16,
          radius: Math.random() * 1.6 + 0.35,
          opacity: Math.random() * 0.14 + 0.03,
        });
      }
    };

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,230,255,${particle.opacity})`;
        ctx.fill();
      });

      for (let left = 0; left < particles.length; left += 1) {
        for (let right = left + 1; right < particles.length; right += 1) {
          const dx = particles[left].x - particles[right].x;
          const dy = particles[left].y - particles[right].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[left].x, particles[left].y);
            ctx.lineTo(particles[right].x, particles[right].y);
            ctx.strokeStyle = `rgba(6,230,255,${0.028 * (1 - distance / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    init();
    draw();

    const handleResize = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      init();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '16px 18px',
        minHeight: 92,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#5D739A',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontSize: 22,
          fontWeight: 700,
          color: accent || '#E8EEFF',
          letterSpacing: '-0.04em',
          lineHeight: 1.15,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function FeatureTile({ feature, accent, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.44 + index * 0.06, duration: 0.45 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(12,20,34,0.88), rgba(9,14,24,0.86))',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 18,
        padding: '18px 18px 20px',
        minHeight: 132,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at top right, ${accent}18, transparent 45%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 38,
          height: 38,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${accent}26, rgba(255,255,255,0.05))`,
          border: `1px solid ${accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          boxShadow: `0 0 24px ${accent}15`,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 16px ${accent}`,
          }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          fontSize: 14,
          lineHeight: 1.55,
          color: '#D9E4F8',
        }}
      >
        {feature}
      </div>
    </motion.div>
  );
}

export default function WelcomePage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  const planId = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const plan = getPlanDetails(planId);
  const journalRoute = '/' + getEntryRoute(planId);
  const isActivated = Boolean(user?.stripeSubscriptionId && ['active', 'trialing'].includes(user?.subStatus));
  const firstName = user?.firstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Trader';
  const email = user?.email || '';

  const highlightedFeatures = useMemo(() => plan.features.slice(0, 6), [plan.features]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate(isActivated ? journalRoute : '/plan', { replace: true });
      return undefined;
    }

    let cancelled = false;
    let attempts = 0;

    const pollActivation = async () => {
      attempts += 1;

      try {
        await refreshProfile?.();
      } catch (_) {}

      if (cancelled) return;

      if (attempts >= 20 && !isActivated) {
        setTimedOut(true);
        setLoading(false);
      }
    };

    pollActivation();
    const timer = window.setInterval(pollActivation, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isActivated, journalRoute, navigate, refreshProfile]);

  useEffect(() => {
    if (isActivated) {
      setTimedOut(false);
      setLoading(false);
    }
  }, [isActivated]);

  const primaryLabel = timedOut ? 'Open Subscription' : 'Access Journal';
  const secondaryLabel = timedOut ? 'Contact Support' : 'Manage Subscription';
  const statusLabel = timedOut ? 'Activation Syncing' : 'Subscription Active';
  const accessLabel = timedOut ? 'Pending unlock' : `${plan.label} workspace`;

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#030508',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <WelcomeBg />
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 520,
            background: 'linear-gradient(180deg, rgba(12,20,34,0.94), rgba(8,12,20,0.96))',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 26,
            padding: '42px 34px',
            textAlign: 'center',
            boxShadow: '0 28px 90px rgba(0,0,0,0.5)',
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 20px',
              border: '3px solid rgba(6,230,255,0.08)',
              borderTopColor: '#06E6FF',
              boxShadow: '0 0 32px rgba(6,230,255,0.16)',
            }}
          />
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              background: 'rgba(6,230,255,0.08)',
              border: '1px solid rgba(6,230,255,0.14)',
              color: '#9EDCFF',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            Finalizing access
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 'clamp(28px, 5vw, 40px)',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.06em',
              lineHeight: 1.05,
              margin: '0 0 14px',
            }}
          >
            Activating your
            <br />
            MarketFlow workspace
          </h1>
          <p
            style={{
              color: '#7A90B8',
              fontSize: 15,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            We are validating your payment and unlocking your {plan.label.toLowerCase()} features for {email}.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030508',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 960px) {
          .mf-welcome-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .mf-welcome-hero {
            padding: 28px 22px 26px !important;
          }
        }
      `}</style>
      <WelcomeBg />

      <div
        style={{
          position: 'absolute',
          top: -120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 680,
          height: 320,
          background: 'radial-gradient(ellipse, rgba(6,230,255,0.10), transparent 72%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 120,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${plan.accent}12, transparent 68%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1160,
          margin: '0 auto',
          padding: '56px 24px 88px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            color: '#9BB2D5',
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: timedOut ? '#FB923C' : '#00FF88',
              boxShadow: timedOut ? '0 0 14px rgba(251,146,60,0.75)' : '0 0 14px rgba(0,255,136,0.75)',
            }}
          />
          {statusLabel}
        </motion.div>

        <div
          className="mf-welcome-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)',
            gap: 22,
            alignItems: 'stretch',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mf-welcome-hero"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(180deg, rgba(12,20,34,0.96), rgba(7,11,18,0.96))',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 28,
              padding: '34px 30px 32px',
              boxShadow: '0 34px 100px rgba(0,0,0,0.52)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at top right, ${plan.accent}15, transparent 32%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid rgba(6,230,255,0.14)',
                  background: 'rgba(255,255,255,0.03)',
                  padding: 4,
                }}
              >
                <img
                  src="/logo192.png"
                  alt="MarketFlow"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk',sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    letterSpacing: '-0.05em',
                    lineHeight: 1,
                  }}
                >
                  Market<span style={{ color: '#06E6FF' }}>Flow</span>
                </div>
                <div
                  style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: '#6882A9',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Trading Journal
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                borderRadius: 999,
                background: `${plan.accent}12`,
                border: `1px solid ${plan.accent}24`,
                color: plan.accent,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              {plan.label} unlocked
            </div>

            <h1
              style={{
                fontFamily: "'Space Grotesk',sans-serif",
                fontSize: 'clamp(38px, 6vw, 66px)',
                fontWeight: 700,
                lineHeight: 0.96,
                letterSpacing: '-0.08em',
                color: '#FFFFFF',
                margin: '0 0 16px',
                maxWidth: 700,
              }}
            >
              Welcome aboard,
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
                maxWidth: 640,
                margin: '0 0 26px',
                color: '#7A90B8',
                fontSize: 16,
                lineHeight: 1.8,
              }}
            >
              {timedOut
                ? `Your payment was received for ${email}, but the subscription sync is taking longer than expected. You can reopen your subscription flow now and we will finish the unlock automatically.`
                : `Your ${plan.label.toLowerCase()} workspace is live for ${email}. Open the journal below and you will land inside the version of MarketFlow that matches your subscription.`}
            </p>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => navigate(timedOut ? '/plan' : journalRoute)}
                style={{
                  padding: '15px 26px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #06E6FF, #00FF88)',
                  color: '#041019',
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  boxShadow: '0 16px 38px rgba(6,230,255,0.26)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-2px)';
                  event.currentTarget.style.boxShadow = '0 24px 52px rgba(6,230,255,0.34)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.boxShadow = '0 16px 38px rgba(6,230,255,0.26)';
                }}
              >
                {primaryLabel} ->
              </button>

              <button
                onClick={() => {
                  if (timedOut) {
                    window.location.href = 'mailto:marketflowjournal0@gmail.com?subject=MarketFlow%20activation%20help';
                    return;
                  }
                  navigate('/subscription');
                }}
                style={{
                  padding: '15px 22px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#E8EEFF',
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  transition: 'background 0.18s ease, border-color 0.18s ease, transform 0.18s ease',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.transform = 'translateY(-2px)';
                  event.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  event.currentTarget.style.borderColor = 'rgba(6,230,255,0.18)';
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.transform = 'translateY(0)';
                  event.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  event.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                {secondaryLabel}
              </button>
            </div>

            <div
              style={{
                color: timedOut ? '#F7B267' : '#7C97C0',
                fontSize: 12.5,
                lineHeight: 1.7,
              }}
            >
              {timedOut
                ? 'If the unlock still does not complete after reopening the subscription page, contact support and we will activate it manually.'
                : 'Your sidebar and accessible modules now follow the plan you purchased, including any Pro or Elite-only pages.'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.45 }}
            style={{
              display: 'grid',
              gap: 16,
              alignContent: 'start',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(180deg, rgba(12,20,34,0.92), rgba(8,12,20,0.96))',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24,
                padding: '22px 20px',
                boxShadow: '0 20px 54px rgba(0,0,0,0.35)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6882A9',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 16,
                }}
              >
                Workspace Snapshot
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <StatCard label="Plan" value={plan.label} accent={plan.accent} />
                <StatCard label="Status" value={accessLabel} accent={timedOut ? '#FB923C' : '#00FF88'} />
                <StatCard label="Home" value={journalRoute.replace('/', '')} accent="#E8EEFF" />
              </div>
            </div>

            <div
              style={{
                background: 'linear-gradient(180deg, rgba(12,20,34,0.92), rgba(8,12,20,0.96))',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24,
                padding: '22px 20px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6882A9',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                Included right now
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.05em',
                  lineHeight: 1.15,
                  marginBottom: 8,
                }}
              >
                {plan.description}
              </div>
              <div
                style={{
                  color: '#7A90B8',
                  fontSize: 13.5,
                  lineHeight: 1.75,
                }}
              >
                {timedOut
                  ? 'The design and plan mapping are ready. As soon as activation completes, the journal opens with the correct modules for your subscription.'
                  : 'Starter, Pro, and Elite each unlock a different MarketFlow workspace. The journal now adapts the sidebar and route access to the plan attached to your payment.'}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
          style={{ marginTop: 24 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#6882A9',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Your unlocked modules
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk',sans-serif",
                  fontSize: 30,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.06em',
                }}
              >
                {plan.label} experience
              </div>
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.03)',
                color: '#93A9CB',
                fontSize: 12.5,
                lineHeight: 1.6,
                maxWidth: 420,
              }}
            >
              {timedOut
                ? 'Payment succeeded. Unlock is still syncing.'
                : 'Open the journal and you will only see the tools included in your current subscription.'}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 14,
            }}
          >
            {highlightedFeatures.map((feature, index) => (
              <FeatureTile
                key={feature}
                feature={feature}
                accent={plan.accent}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
