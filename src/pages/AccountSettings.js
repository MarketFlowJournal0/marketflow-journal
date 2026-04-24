import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { shade } from '../lib/colorAlpha';
import { normalizePlan } from '../lib/subscription';
import {
  JOURNAL_THEME_KEY,
  JOURNAL_THEME_CHOICES,
  JOURNAL_THEME_CUSTOM_KEY,
  JOURNAL_THEME_CUSTOM_VALUE,
  DEFAULT_JOURNAL_THEME_VALUE,
  DEFAULT_JOURNAL_CUSTOM_ACCENT,
  normalizeHexColor,
  getJournalTheme,
  applyJournalTheme,
} from '../lib/journalTheme';

const C = {
  bg: 'var(--mf-bg,#01040A)',
  bgCard: 'var(--mf-card,#060D18)',
  bgHigh: 'var(--mf-high,#0B1525)',
  cyan: 'var(--mf-accent,#14C9E5)',
  secondary: 'var(--mf-accent-secondary,#66F0FF)',
  green: 'var(--mf-green,#00D2B8)',
  danger: 'var(--mf-danger,#FF3D57)',
  t0: 'var(--mf-text-0,#FFFFFF)',
  t1: 'var(--mf-text-1,#E8EEFF)',
  t2: 'var(--mf-text-2,#7A90B8)',
  t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#142033)',
  brdHi: 'var(--mf-border-hi,#1F2F47)',
};

const THEME_ENABLED_PLANS = ['pro', 'elite'];

function normalizeHexDraft(value) {
  const cleaned = String(value || '').toUpperCase().replace(/[^#0-9A-F]/g, '');
  if (!cleaned) return '#';
  if (cleaned.startsWith('#')) return cleaned.slice(0, 7);
  return `#${cleaned.slice(0, 6)}`;
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.t3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ value, onChange, type = 'text', placeholder, disabled }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      width: '100%',
      padding: '10px 14px',
      borderRadius: 12,
      boxSizing: 'border-box',
      background: disabled ? 'rgba(255,255,255,0.02)' : C.bgHigh,
      border: `1px solid ${C.brd}`,
      color: disabled ? C.t3 : C.t1,
      fontSize: 14,
      outline: 'none',
      fontFamily: 'inherit',
      transition: 'border-color 0.15s',
    }}
    onFocus={(event) => {
      if (!disabled) event.target.style.borderColor = C.cyan;
    }}
    onBlur={(event) => {
      event.target.style.borderColor = C.brd;
    }}
  />
);

const Btn = ({ children, onClick, color = C.cyan, loading = false, danger = false }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    disabled={loading}
    style={{
      padding: '10px 22px',
      borderRadius: 12,
      border: `1px solid ${shade(danger ? C.danger : color, '55')}`,
      cursor: loading ? 'wait' : 'pointer',
      background: danger ? shade(C.danger, '18') : shade(color, '18'),
      color: danger ? C.danger : color,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      opacity: loading ? 0.6 : 1,
    }}
  >
    {loading ? '...' : children}
  </motion.button>
);

const ToneCard = ({ option, active, onClick }) => {
  const previewTheme = getJournalTheme('pro', option.value);

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'grid',
        gap: 10,
        padding: '12px 10px',
        borderRadius: 14,
        border: active ? `1px solid ${shade(previewTheme.accent, '78')}` : `1px solid ${C.brd}`,
        background: active ? `linear-gradient(180deg, ${shade(previewTheme.accent, '16')}, rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.16s ease',
      }}
    >
      <div style={{ height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${previewTheme.accent}, ${previewTheme.secondary})`, boxShadow: active ? `0 12px 28px ${shade(previewTheme.accent, '30')}` : 'none' }} />
      <div style={{ fontSize: 10.5, fontWeight: 800, color: active ? C.t1 : C.t2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {option.label}
      </div>
    </button>
  );
};

const ThemePreviewPanel = ({ label }) => (
  <div
    style={{
      position: 'relative',
      padding: '18px',
      borderRadius: 18,
      background: 'linear-gradient(150deg,rgba(10,16,28,0.98),rgba(7,11,20,0.98))',
      border: `1px solid ${shade(C.cyan, '34')}`,
      boxShadow: `0 24px 48px ${shade(C.cyan, '14')}`,
      overflow: 'hidden',
      minHeight: 100,
    }}
  >
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 16% 0%, ${shade(C.cyan, '16')}, transparent 34%), radial-gradient(circle at 100% 100%, ${shade(C.secondary, '12')}, transparent 38%)`, pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.cyan, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Live Preview</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.t0, marginTop: 6 }}>Journal Accent Study</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: shade(C.cyan, '12'), border: `1px solid ${shade(C.cyan, '30')}`, color: C.cyan, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 10px ${shade(C.cyan, '88')}` }} />
          {label}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ padding: '12px 14px', borderRadius: 14, background: `linear-gradient(90deg, ${shade(C.cyan, '10')}, ${shade(C.secondary, '08')}, rgba(255,255,255,0.02))`, border: `1px solid ${shade(C.cyan, '28')}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.cyan, boxShadow: `0 0 8px ${shade(C.cyan, '90')}` }} />
            <span style={{ fontSize: 10.5, fontWeight: 800, color: C.cyan, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Command Center</span>
          </div>
          <span style={{ fontSize: 10.5, color: C.t2 }}>Borders, focus and highlights react here.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {[
            { label: 'Focus', value: '+$142', tone: C.cyan },
            { label: 'Secondary', value: '68%', tone: C.secondary },
            { label: 'Risk', value: '-2.1%', tone: C.danger },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '14px 12px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${shade(item.tone, '28')}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 10px 24px ${shade(item.tone, '10')}`,
              }}
            >
              <div style={{ width: 24, height: 2, borderRadius: 999, background: item.tone, boxShadow: `0 0 12px ${shade(item.tone, '66')}`, marginBottom: 12 }} />
              <div style={{ fontSize: 9, fontWeight: 800, color: C.t3, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: item.tone, fontFamily: 'monospace' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.022)', border: `1px solid ${shade(C.cyan, '24')}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.t1 }}>Equity preview</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['1M', '3M', 'All'].map((period, index) => (
                <div
                  key={period}
                  style={{
                    padding: '5px 9px',
                    borderRadius: 8,
                    border: `1px solid ${index === 2 ? shade(C.cyan, '30') : C.brd}`,
                    background: index === 2 ? shade(C.cyan, '14') : 'transparent',
                    color: index === 2 ? C.cyan : C.t3,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {period}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', height: 112, borderRadius: 14, background: 'linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))', border: `1px solid ${C.brd}` }}>
            <svg viewBox="0 0 320 112" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="theme-preview-line" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--mf-accent,#14C9E5)" />
                  <stop offset="55%" stopColor="var(--mf-accent-secondary,#66F0FF)" />
                  <stop offset="100%" stopColor="var(--mf-blue,#4D7CFF)" />
                </linearGradient>
                <linearGradient id="theme-preview-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(6,230,255,0.22)" />
                  <stop offset="100%" stopColor="rgba(6,230,255,0)" />
                </linearGradient>
              </defs>
              <path d="M0 88 C24 84, 42 72, 58 66 S96 58, 118 62 S158 40, 182 42 S220 50, 244 34 S282 18, 320 24" fill="none" stroke="url(#theme-preview-line)" strokeWidth="3.2" strokeLinecap="round" />
              <path d="M0 112 L0 88 C24 84, 42 72, 58 66 S96 58, 118 62 S158 40, 182 42 S220 50, 244 34 S282 18, 320 24 L320 112 Z" fill="url(#theme-preview-fill)" />
            </svg>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '6px 10px', borderRadius: 10, background: shade(C.cyan, '12'), border: `1px solid ${shade(C.cyan, '26')}`, color: C.cyan, fontSize: 10, fontWeight: 700 }}>Accent border</div>
            <div style={{ padding: '6px 10px', borderRadius: 10, background: shade(C.secondary, '12'), border: `1px solid ${shade(C.secondary, '26')}`, color: C.secondary, fontSize: 10, fontWeight: 700 }}>Secondary glow</div>
            <div style={{ padding: '6px 10px', borderRadius: 10, background: shade(C.green, '12'), border: `1px solid ${shade(C.green, '26')}`, color: C.green, fontSize: 10, fontWeight: 700 }}>Positive state</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

function CardShell({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{
        background: 'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
        border: `1px solid ${C.brd}`,
        borderRadius: 18,
        padding: '24px 26px',
        marginBottom: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.28)',
      }}
    >
      {children}
    </motion.div>
  );
}

export default function AccountSettings({ user, onBack }) {
  const firstName = user?.user_metadata?.first_name || '';
  const lastName = user?.user_metadata?.last_name || '';
  const email = user?.email || '';
  const plan = normalizePlan(user?.plan || user?.user_metadata?.plan);
  const canEditTheme = THEME_ENABLED_PLANS.includes(plan);
  const isElite = plan === 'elite';

  const PLAN_LABELS = {
    starter: { label: 'Starter', color: 'var(--mf-teal,#00D2B8)' },
    pro: { label: 'Pro', color: 'var(--mf-accent,#14C9E5)' },
    elite: { label: 'Elite', color: 'var(--mf-gold,#D7B36A)' },
    trial: { label: 'Free Trial', color: 'var(--mf-green,#00D2B8)' },
  };

  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.trial;

  const [fname, setFname] = useState(firstName);
  const [lname, setLname] = useState(lastName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toneChoice, setToneChoice] = useState(() => localStorage.getItem(JOURNAL_THEME_KEY) || DEFAULT_JOURNAL_THEME_VALUE);
  const [customAccent, setCustomAccent] = useState(() => normalizeHexColor(localStorage.getItem(JOURNAL_THEME_CUSTOM_KEY)) || DEFAULT_JOURNAL_CUSTOM_ACCENT);
  const [customDraft, setCustomDraft] = useState(() => normalizeHexColor(localStorage.getItem(JOURNAL_THEME_CUSTOM_KEY)) || DEFAULT_JOURNAL_CUSTOM_ACCENT);

  useEffect(() => {
    const normalizedCustom = normalizeHexColor(customAccent) || DEFAULT_JOURNAL_CUSTOM_ACCENT;
    const nextChoice = toneChoice === JOURNAL_THEME_CUSTOM_VALUE && isElite
      ? JOURNAL_THEME_CUSTOM_VALUE
      : (normalizeHexColor(toneChoice) || DEFAULT_JOURNAL_THEME_VALUE);
    const hasPreset = JOURNAL_THEME_CHOICES.some((item) => item.value === nextChoice);
    const resolvedChoice = nextChoice === JOURNAL_THEME_CUSTOM_VALUE || hasPreset
      ? nextChoice
      : DEFAULT_JOURNAL_THEME_VALUE;

    if (resolvedChoice !== toneChoice) {
      setToneChoice(resolvedChoice);
      return;
    }

    if (normalizedCustom !== customAccent) {
      setCustomAccent(normalizedCustom);
      setCustomDraft(normalizedCustom);
      return;
    }

    if (canEditTheme) {
      localStorage.setItem(JOURNAL_THEME_KEY, resolvedChoice);
      localStorage.setItem(JOURNAL_THEME_CUSTOM_KEY, normalizedCustom);
    }

    applyJournalTheme(getJournalTheme(plan, resolvedChoice, normalizedCustom));
  }, [plan, canEditTheme, isElite, toneChoice, customAccent]);

  const activeToneLabel = toneChoice === JOURNAL_THEME_CUSTOM_VALUE
    ? customAccent
    : (JOURNAL_THEME_CHOICES.find((item) => item.value === normalizeHexColor(toneChoice))?.label || 'Aqua');

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { first_name: fname, last_name: lname },
      });
      if (error) throw error;
      toast.success('Profile updated', {
        style: { background: '#0D1627', color: 'var(--mf-green,#00D2B8)', borderRadius: '10px' },
      });
    } catch (error) {
      toast.error(error.message || 'Error during update');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPw) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPw('');
      toast.success('Password updated', {
        style: { background: '#0D1627', color: 'var(--mf-green,#00D2B8)', borderRadius: '10px' },
      });
    } catch (error) {
      toast.error(error.message || 'Error changing password');
    } finally {
      setSavingPw(false);
    }
  };

  const setPresetTone = (value) => {
    const normalizedValue = normalizeHexColor(value) || DEFAULT_JOURNAL_THEME_VALUE;
    setToneChoice(normalizedValue);
  };

  const setCustomTone = (value) => {
    const normalizedValue = normalizeHexColor(value);
    if (!normalizedValue) return;
    setCustomAccent(normalizedValue);
    setCustomDraft(normalizedValue);
    setToneChoice(JOURNAL_THEME_CUSTOM_VALUE);
  };

  const handleCustomDraftChange = (event) => {
    const nextValue = normalizeHexDraft(event.target.value);
    setCustomDraft(nextValue);

    const normalizedValue = normalizeHexColor(nextValue);
    if (normalizedValue) {
      setCustomTone(normalizedValue);
    }
  };

  const handleCustomDraftBlur = () => {
    setCustomDraft(normalizeHexColor(customDraft) || customAccent);
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', padding: '32px 32px 60px', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: 520, height: 360, background: 'radial-gradient(ellipse,rgba(var(--mf-accent-rgb, 6, 230, 255),0.03) 0%,transparent 70%)', filter: 'blur(46px)' }} />
        <div style={{ position: 'absolute', bottom: 0, right: '10%', width: 420, height: 280, background: 'radial-gradient(ellipse,rgba(var(--mf-accent-secondary-rgb, 102, 240, 255),0.02) 0%,transparent 70%)', filter: 'blur(46px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${C.brd}`,
              background: 'rgba(255,255,255,0.04)',
              color: C.t2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = C.cyan;
              event.currentTarget.style.color = C.cyan;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = C.brd;
              event.currentTarget.style.color = C.t2;
            }}
          >
            &lt;
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.t0, letterSpacing: '-0.4px' }}>
              Account Settings
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.t3 }}>
              Manage your profile, security and journal appearance
            </p>
          </div>
        </div>

        <CardShell delay={0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 2, height: 14, background: C.cyan, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1, letterSpacing: '-0.1px' }}>Profile Information</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.brd}` }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                flexShrink: 0,
                background: `linear-gradient(135deg, ${C.cyan}, ${C.secondary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--mf-bg,#01040A)',
              }}
            >
              {(fname || email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{fname} {lname}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{email}</div>
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: 100,
                    background: `${shade(planInfo.color, '22')}`,
                    border: `1px solid ${shade(planInfo.color, '44')}`,
                    color: planInfo.color,
                  }}
                >
                  {planInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <Field label="First Name">
              <Input value={fname} onChange={(event) => setFname(event.target.value)} placeholder="Your first name" />
            </Field>
            <Field label="Last Name">
              <Input value={lname} onChange={(event) => setLname(event.target.value)} placeholder="Your last name" />
            </Field>
          </div>

          <Field label="Email Address">
            <Input value={email} disabled placeholder="Email" />
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>
              Email address cannot be changed here.
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSaveProfile} loading={saving}>Save</Btn>
          </div>
        </CardShell>

        {canEditTheme && (
          <CardShell delay={0.05}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 2, height: 14, background: C.cyan, borderRadius: 2 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Journal Appearance</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18, alignItems: 'stretch' }}>
              <div style={{ marginBottom: 18, padding: '16px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.brd}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t0 }}>Interface Tone</div>
                    <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                      Accent variations apply across the journal while the dark base stays clean and premium.
                    </div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${shade(C.cyan, '32')}` }}>
                    <div style={{ width: 18, height: 18, borderRadius: 6, background: `linear-gradient(135deg, ${C.cyan}, ${C.secondary})` }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: C.t1 }}>{activeToneLabel}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 10 }}>
                  {JOURNAL_THEME_CHOICES.map((option) => (
                    <ToneCard
                      key={option.value}
                      option={option}
                      active={toneChoice === option.value}
                      onClick={() => setPresetTone(option.value)}
                    />
                  ))}
                </div>

                {isElite && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.brd}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.t0 }}>Custom Accent</div>
                        <div style={{ fontSize: 11, color: C.t3, marginTop: 4 }}>
                          Elite unlocks the native color picker with live preview while you drag.
                        </div>
                      </div>
                      <div style={{ fontSize: 10.5, color: C.cyan, fontWeight: 700 }}>{customAccent}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '56px minmax(0, 1fr) 64px', gap: 12, alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setToneChoice(JOURNAL_THEME_CUSTOM_VALUE)}
                        style={{
                          width: 56,
                          height: 48,
                          borderRadius: 14,
                          border: toneChoice === JOURNAL_THEME_CUSTOM_VALUE ? `1px solid ${shade(customAccent, '88')}` : `1px solid ${C.brd}`,
                          background: `linear-gradient(135deg, ${customAccent}, ${getJournalTheme('elite', JOURNAL_THEME_CUSTOM_VALUE, customAccent).secondary})`,
                          boxShadow: toneChoice === JOURNAL_THEME_CUSTOM_VALUE ? `0 14px 26px ${shade(customAccent, '32')}` : 'none',
                          cursor: 'pointer',
                        }}
                      />
                      <input
                        type="text"
                        value={customDraft}
                        onChange={handleCustomDraftChange}
                        onBlur={handleCustomDraftBlur}
                        spellCheck={false}
                        style={{
                          height: 48,
                          borderRadius: 14,
                          border: `1px solid ${toneChoice === JOURNAL_THEME_CUSTOM_VALUE ? shade(customAccent, '70') : C.brd}`,
                          background: 'rgba(255,255,255,0.025)',
                          color: C.t1,
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          padding: '0 14px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                      <input
                        type="color"
                        value={customAccent}
                        onInput={(event) => setCustomTone(event.target.value)}
                        onChange={(event) => setCustomTone(event.target.value)}
                        aria-label="Custom accent color"
                        style={{
                          width: 64,
                          height: 48,
                          padding: 4,
                          borderRadius: 14,
                          border: `1px solid ${shade(customAccent, '58')}`,
                          background: 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <ThemePreviewPanel label={activeToneLabel} />
            </div>
          </CardShell>
        )}

        <CardShell delay={0.1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 2, height: 14, background: 'var(--mf-purple,#A78BFA)', borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Security</span>
          </div>

          <Field label="New Password">
            <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimum 8 characters" />
          </Field>
          <Field label="Confirm Password">
            <Input type="password" value={confirmPw} onChange={(event) => setConfirmPw(event.target.value)} placeholder="Repeat password" />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleChangePassword} loading={savingPw} color="var(--mf-purple,#A78BFA)">
              Change Password
            </Btn>
          </div>
        </CardShell>

        <CardShell delay={0.15}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 2, height: 14, background: C.danger, borderRadius: 2 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Danger Zone</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: C.t3, lineHeight: 1.6 }}>
            Account deletion is permanent. All your trading data will be permanently erased.
          </p>
          <Btn
            danger
            onClick={() => toast.error('Contact support to delete your account.', {
              style: { background: '#0D1627', color: 'var(--mf-danger,#FF3D57)', borderRadius: '10px' },
            })}
          >
            Delete my account
          </Btn>
        </CardShell>
      </div>
    </div>
  );
}
