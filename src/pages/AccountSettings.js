import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

const C = {
  bg: '#030508', bgCard: '#0C1422', bgHigh: '#111B2E',
  cyan: '#06E6FF', green: '#00FF88', danger: '#FF3D57',
  t0: '#FFFFFF', t1: '#E8EEFF', t2: '#7A90B8', t3: '#334566',
  brd: '#162034', brdHi: '#1E2E48',
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
      background: danger ? `${C.danger}20` : `${color}20`,
      border: `1px solid ${danger ? C.danger : color}50`,
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
    starter: { label: 'Starter',       color: '#00F5D4' },
    pro:     { label: 'Pro',           color: '#06E6FF' },
    elite:   { label: 'Elite ✦',       color: '#FFD700' },
    trial:   { label: 'Essai gratuit', color: '#00FF88' },
  };
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.trial;

  const [fname,       setFname]       = useState(firstName);
  const [lname,       setLname]       = useState(lastName);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw,   setConfirmPw]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const [savingPw,    setSavingPw]    = useState(false);

  // Mettre à jour nom/prénom
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { first_name: fname, last_name: lname },
      });
      if (error) throw error;
      toast.success('Profil mis à jour ✓', {
        style: { background: '#0D1627', color: '#00FF88', borderRadius: '10px' },
      });
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPw) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPw('');
      toast.success('Mot de passe mis à jour ✓', {
        style: { background: '#0D1627', color: '#00FF88', borderRadius: '10px' },
      });
    } catch (err) {
      toast.error(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '32px 32px 60px', fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Fond ambiance */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '20%', width: 500, height: 350, background: 'radial-gradient(ellipse,rgba(77,124,255,0.05) 0%,transparent 70%)', filter: 'blur(40px)' }}/>
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
              Paramètres du compte
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.t3 }}>Gérez vos informations personnelles</p>
          </div>
        </div>

        {/* ── Infos du compte ── */}
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
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1, letterSpacing: '-0.1px' }}>Informations du profil</span>
          </div>

          {/* Avatar + plan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.brd}` }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${C.cyan}, ${C.green})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#030508',
            }}>
              {(fname || email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.t0 }}>{fname} {lname}</div>
              <div style={{ fontSize: 12, color: C.t3, marginTop: 2 }}>{email}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 100,
                  background: planInfo.color + '22', border: `1px solid ${planInfo.color}44`,
                  color: planInfo.color,
                }}>
                  {planInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <Field label="Prénom">
              <Input value={fname} onChange={e => setFname(e.target.value)} placeholder="Ton prénom"/>
            </Field>
            <Field label="Nom">
              <Input value={lname} onChange={e => setLname(e.target.value)} placeholder="Ton nom"/>
            </Field>
          </div>

          <Field label="Adresse e-mail">
            <Input value={email} disabled placeholder="Email" />
            <div style={{ fontSize: 10.5, color: C.t3, marginTop: 5 }}>
              L'adresse e-mail ne peut pas être modifiée ici.
            </div>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleSaveProfile} loading={saving}>Enregistrer</Btn>
          </div>
        </motion.div>

        {/* ── Sécurité ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}
          style={{
            background: 'linear-gradient(145deg,rgba(14,21,37,0.95),rgba(11,16,28,0.98))',
            border: `1px solid ${C.brd}`, borderRadius: 16, padding: '24px 26px', marginBottom: 16,
            boxShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 2, height: 14, background: '#B06EFF', borderRadius: 2 }}/>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Sécurité</span>
          </div>

          <Field label="Nouveau mot de passe">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8 caractères minimum"/>
          </Field>
          <Field label="Confirmer le mot de passe">
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Répète le mot de passe"/>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Btn onClick={handleChangePassword} loading={savingPw} color="#B06EFF">
              Changer le mot de passe
            </Btn>
          </div>
        </motion.div>

        {/* ── Zone danger ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }}
          style={{
            background: 'rgba(255,61,87,0.04)',
            border: `1px solid rgba(255,61,87,0.18)`, borderRadius: 16, padding: '20px 26px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 2, height: 14, background: C.danger, borderRadius: 2 }}/>
            <span style={{ fontSize: 12, fontWeight: 800, color: C.t1 }}>Zone de danger</span>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: C.t3, lineHeight: 1.6 }}>
            La suppression du compte est permanente. Toutes tes données de trading seront effacées définitivement.
          </p>
          <Btn
            danger
            onClick={() => toast.error('Contacte le support pour supprimer ton compte.', {
              style: { background: '#0D1627', color: '#FF3D57', borderRadius: '10px' },
            })}
          >
            Supprimer mon compte
          </Btn>
        </motion.div>

      </div>
    </div>
  );
}