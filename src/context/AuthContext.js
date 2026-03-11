import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [session,     setSession]     = useState(null);
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const initialized   = useRef(false);

  const fetchProfile = async (userId) => {
    if (!userId) { setProfile(null); return; }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_end')
        .eq('id', userId)
        .maybeSingle();
      setProfile(data || null);
    } catch (_) {
      setProfile(null);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Nettoyer les tokens corrompus AVANT de vérifier la session
    const cleanCorruptTokens = () => {
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => {
            try {
              const val = JSON.parse(localStorage.getItem(k));
              // Si le token est expiré, le supprimer
              if (val?.expires_at && val.expires_at * 1000 < Date.now()) {
                localStorage.removeItem(k);
              }
            } catch (_) {
              localStorage.removeItem(k); // JSON invalide → supprimer
            }
          });
      } catch (_) {}
    };

    cleanCorruptTokens();

    // Timeout de sécurité : si loading reste true après 5s → forcer false
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      clearTimeout(safetyTimeout);
      if (error || !session) {
        // Pas de session valide → nettoyer et afficher landing
        Object.keys(localStorage)
          .filter(k => k.startsWith('sb-'))
          .forEach(k => localStorage.removeItem(k));
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session.user);
      await fetchProfile(session.user.id);
      setLoading(false);
    }).catch(() => {
      clearTimeout(safetyTimeout);
      // Erreur réseau ou token invalide → nettoyer
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k));
      setUser(null);
      setSession(null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signup = useCallback(async ({ firstName, lastName, email, password }) => {
    setAuthLoading(true); setError(null);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          full_name:  `${firstName.trim()} ${lastName.trim()}`,
          plan: 'trial',
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setAuthLoading(false);
    if (error) { setError(translateError(error.message)); return { success: false }; }
    return { success: true, needsConfirmation: !data.session };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthLoading(false);
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }, []);

  const loginWithGitHub = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github', options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    Object.keys(localStorage)
      .filter(k => k.startsWith('sb-'))
      .forEach(k => localStorage.removeItem(k));
    setUser(null); setSession(null); setProfile(null);
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await fetchProfile(session.user.id);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const effectivePlan = profile?.plan || user?.user_metadata?.plan || 'trial';
  const subStatus     = profile?.subscription_status || 'trialing';
  const trialEnd      = profile?.trial_end || null;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd) - new Date()) / 86400000))
    : 14;

  const userProfile = user ? {
    id:                   user.id,
    email:                user.email,
    firstName:            user.user_metadata?.first_name || user.email?.split('@')[0] || 'Trader',
    lastName:             user.user_metadata?.last_name  || '',
    fullName:             user.user_metadata?.full_name  || user.email?.split('@')[0],
    avatar:               user.user_metadata?.avatar_url || null,
    plan:                 effectivePlan,
    subStatus,
    isTrialing:           subStatus === 'trialing',
    isActive:             subStatus === 'active',
    isPastDue:            subStatus === 'past_due',
    isCanceled:           subStatus === 'canceled',
    needsPayment:         subStatus === 'past_due',
    trialDaysLeft,
    trialEnd,
    stripeCustomerId:     profile?.stripe_customer_id     || null,
    stripeSubscriptionId: profile?.stripe_subscription_id || null,
    createdAt:            user.created_at,
  } : null;

  return (
    <AuthContext.Provider value={{
      user: userProfile,
      session, loading, authLoading, error,
      signup, login, loginWithGoogle, loginWithGitHub,
      resetPassword, logout, updateProfile, refreshProfile, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}

function translateError(msg) {
  if (!msg) return 'Une erreur est survenue.';
  if (msg.includes('Invalid login credentials'))        return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))              return 'Confirme ton email avant de te connecter.';
  if (msg.includes('User already registered'))          return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be at least'))      return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('Unable to validate email address')) return 'Adresse email invalide.';
  if (msg.includes('Email rate limit exceeded'))        return 'Trop de tentatives. Attends quelques minutes.';
  if (msg.includes('Invalid email'))                    return 'Adresse email invalide.';
  if (msg.includes('signup is disabled'))               return 'Les inscriptions sont temporairement désactivées.';
  if (msg.includes('network'))                          return 'Erreur réseau. Vérifie ta connexion.';
  return msg;
}