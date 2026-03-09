import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);   // true pendant la vérif initiale
  const [error,   setError]   = useState(null);
  const [authLoading, setAuthLoading] = useState(false); // true pendant login/signup

  // ── Vérifier la session au démarrage + écouter les changements ─────────────
  useEffect(() => {
    // Session actuelle
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener sur les changements d'auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async ({ firstName, lastName, email, password }) => {
    setAuthLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name:  lastName.trim(),
          full_name:  `${firstName.trim()} ${lastName.trim()}`,
          plan:       'starter',
        },
        emailRedirectTo: window.location.origin,
      },
    });

    setAuthLoading(false);

    if (error) {
      // Traduction des erreurs Supabase en français
      const msg = translateError(error.message);
      setError(msg);
      return { success: false, needsConfirmation: false };
    }

    // Si email confirmation activée dans Supabase
    const needsConfirmation = !data.session;
    return { success: true, needsConfirmation };
  }, []);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setAuthLoading(false);

    if (error) {
      setError(translateError(error.message));
      return false;
    }
    return true;
  }, []);

  // ── LOGIN GOOGLE ───────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }, []);

  // ── LOGIN GITHUB ───────────────────────────────────────────────────────────
  const loginWithGitHub = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }, []);

  // ── RESET PASSWORD ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (email) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Infos user formatées
  const userProfile = user ? {
    id:         user.id,
    email:      user.email,
    firstName:  user.user_metadata?.first_name || user.email?.split('@')[0] || 'Trader',
    lastName:   user.user_metadata?.last_name  || '',
    fullName:   user.user_metadata?.full_name  || user.email?.split('@')[0],
    avatar:     user.user_metadata?.avatar_url || null,
    plan:       user.user_metadata?.plan       || 'starter',
    createdAt:  user.created_at,
  } : null;

  return (
    <AuthContext.Provider value={{
      user: userProfile,
      session,
      loading,
      authLoading,
      error,
      signup,
      login,
      loginWithGoogle,
      loginWithGitHub,
      resetPassword,
      logout,
      updateProfile,
      clearError,
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

// ── Traduction erreurs Supabase → français ─────────────────────────────────
function translateError(msg) {
  if (!msg) return 'Une erreur est survenue.';
  if (msg.includes('Invalid login credentials'))       return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed'))             return 'Confirme ton email avant de te connecter.';
  if (msg.includes('User already registered'))         return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be at least'))     return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (msg.includes('Unable to validate email address'))return 'Adresse email invalide.';
  if (msg.includes('Email rate limit exceeded'))       return 'Trop de tentatives. Attends quelques minutes.';
  if (msg.includes('Invalid email'))                   return 'Adresse email invalide.';
  if (msg.includes('signup is disabled'))              return 'Les inscriptions sont temporairement désactivées.';
  if (msg.includes('network'))                         return 'Erreur réseau. Vérifie ta connexion.';
  return msg;
}