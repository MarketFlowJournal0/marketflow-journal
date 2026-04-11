import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { shade } from '../lib/colorAlpha';

const C = {
  bg: 'var(--mf-bg,#030508)', bgCard: 'var(--mf-card,#0C1422)', bgHigh: 'var(--mf-high,#111B2E)',
  cyan: 'var(--mf-accent,#06E6FF)', green: 'var(--mf-green,#00FF88)', danger: 'var(--mf-danger,#FF3D57)',
  t0: 'var(--mf-text-0,#FFFFFF)', t1: 'var(--mf-text-1,#E8EEFF)', t2: 'var(--mf-text-2,#7A90B8)', t3: 'var(--mf-text-3,#334566)',
  brd: 'var(--mf-border,#162034)', brdHi: 'var(--mf-border-hi,#1E2E48)',
};

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
    type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
    style={{
      width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
      background: disabled ? 'rgba(255,255,255,0.02)' : C.bgHigh,
      border: `1px solid ${C.brd}`, color: disabled ? C.t3 : C.t1,
      fontSize: 14, outline: 'none', fontFamily: 'inherit',
      transition: 'border-color 0.15s',
    }}
    onFocus={e => { if (!disabled) e.target.style.borderColor = C.cyan; }}
    onBlur={e => { e.target.style.borderColor = C.brd; }}
  />
);

const Btn = ({ children, onClick, color = C.cyan, loading = false, danger = false }) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    disabled={loading}
    style={{
      padding: '10px 22px', borderRadius: 10, border: 'none', cursor: loading ? 'wait' : 'pointer',
      background: danger ? `${shade(C.danger,'20')}` : `${shade(color,'20')}`,
      border: `1px solid ${shade(danger ? C.danger : color,'50')}`,
      color: danger ? C.danger : color,
      fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
      transition: 'all 0.15s', opacity: loading ? 0.6 : 1,
    }}
  >
    {loading ? '...' : children}
  </motion.button>
);

export default function AccountSettings({ user, onBack }) {
  const firstName = user?.user_metadata?.first_name || '';
  const lastName  = user?.user_metadata?.last_name  || '';
  const email     = user?.email || '';
  const plan      = user?.user_metadata?.plan || 'trial';

  const PLAN_LABELS = {
    starter: { label: 'Starter',       color: 'var(--mf-teal,#00F5D4)' },
    pro:     { label: 'Pro',           color: 'var(--mf-accent,#06E6FF)' },
    elite:   { label: 'Elite ✦',       color: 'var(--mf-gold,#FFD700)' },
    trial:   { label: 'Free Trial',    color: 'var(--mf-green,#00FF88)' },
  };
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.trial;

  const [fname,       setFname]       = useState(firstName);
  const [lname,       setLname]       = useState(lastName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [savingPw,    setSavingPw]    = useState(false);

  // Update first/last name
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { first_name: fname, last_name: lname },
      });
      if (error) throw error;
      toast.success('Profile updated ✓', {
        style: { background: '#0D1627', color: 'var(--mf-green,#00FF88)', borderRadius: '10px' },
      });
    } catch (err) {
      toast.error(err.message || 'Error during update');
    } finally {
      setSaving(false);
    }
  };

  // Change password
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
      toast.success('Password updated ✓', {
        style: { background: '#0D1627', color: 'var(--mf-green,#00FF88)', borderRadius: '10px' },
      });
    } catch (err) {
      toast.error(err.message || 'Error changing password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 32px 60px', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: 500, height: 350, background: 'radial-gradient(ellipse,rgba(var(--mf-blue-rgb, 77, 124, 255),0.05) 0%,transparent 70%)', filter: 'blur(40px)' }}/>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <button
            onClick={onBack}
            style={{
              width: 36, height: 36, borderRadius: 9, border: `1px solid ${C.brd}`,
              background: 'rgba(255,255,255,0.04)', color: C.t2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyan; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.brd; e.currentTarget.style.color = C.t2; }}
          >
            ←
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.t0, letterSpacing: '-0.4px' }}>
              Account Settings
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.t3 }}>Manage your personal information</p>
          </div>
        </div>

        {/* ── Account Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          style={{
            background: 'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
            border: `1px solid ${C.brd}`, borderRadius: 16, padding: '24px 26px', marginBottom: 16,
            boxShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 2, height: 14, background: C.cyan, borderRadius: 2 }}/>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1, letterSpacing: '-0.1px' }}>Profile Information</span>
          </div>

          {/* Avatar + plan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.brd}` }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.green})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: 'var(--mf-bg,#030508)',
            }}>
              {(fname || email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{fname} {lname}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{email}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                  background: planInfo.color + '22', border: `1px solid ${shade(planInfo.color,'44')}`,
                  color: planInfo.color,
                }}>
                  {planInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <Field label="First Name">
              <Input value={fname} onChange={e => setFname(e.target.value)} placeholder="Your first name"/>
            </Field>
            <Field label="Last Name">
              <Input value={lname} onChange={e => setLname(e.target.value)} placeholder="Your last name"/>
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
        </motion.div>

        {/* ── Security ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
          style={{
            background: 'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
            border: `1px solid ${C.brd}`, borderRadius: 16, padding: '24px 26px', marginBottom: 16,
            boxShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 2, height: 14, background: 'var(--mf-purple,#A78BFA)', borderRadius: 2 }}/>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Security</span>
          </div>

          <Field label="New Password">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters"/>
          </Field>
          <Field label="Confirm Password">
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password"/>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleChangePassword} loading={savingPw} color="var(--mf-purple,#A78BFA)">
              Change Password
            </Btn>
          </div>
        </motion.div>

        {/* ── Danger Zone ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
          style={{
            background: 'rgba(var(--mf-danger-rgb, 255, 61, 87),0.04)',
            border: `1px solid rgba(var(--mf-danger-rgb, 255, 61, 87),0.18)`, borderRadius: 16, padding: '20px 26px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 2, height: 14, background: C.danger, borderRadius: 2 }}/>
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
        </motion.div>

      </div>
    </div>
  );
}

