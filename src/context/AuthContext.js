import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function shouldSyncSubscription(profile) {
  if (!profile) return true;
  if (!profile.stripe_customer_id || !profile.stripe_subscription_id || !profile.subscription_status) return true;
  if (!profile.plan) return true;
  if (profile.subscription_status === 'trialing' && profile.trial_end) {
    return new Date(profile.trial_end) <= new Date();
  }
  return false;
}

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [session,       setSession]       = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [error,         setError]         = useState(null);
  const [authLoading,   setAuthLoading]   = useState(false);
  const initDone     = useRef(false);
  const loggingOut   = useRef(false);

  const fetchProfile = useCallback(async (userId, userEmail = null) => {
    if (!userId) { setProfile(null); setProfileLoaded(true); return; }
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan, subscription_status, stripe_customer_id, stripe_subscription_id, trial_end, email')
        .eq('id', userId)
        .maybeSingle();

      let nextProfile = data || null;

      if (shouldSyncSubscription(nextProfile)) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await fetch('/api/sync-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
            body: JSON.stringify({ userId, email: userEmail || nextProfile?.email || null }),
          });
          if (response.ok) {
            const payload = await response.json();
            if (payload?.profile) {
              nextProfile = payload.profile;
            }
          }
        } catch (_) {}
      }

      setProfile(nextProfile);
    } catch (_) { setProfile(null); }
    finally { setProfileLoaded(true); }
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    let mounted = true;

    const t = setTimeout(() => {
      if (mounted) { setProfileLoaded(true); setLoading(false); }
    }, 4000);

    const init = async () => {
      try {
        if (localStorage.getItem('mfj_force_logout') === '1') {
          localStorage.removeItem('mfj_force_logout');
          localStorage.removeItem('mfj-auth');
          try { await supabase.auth.signOut(); } catch (_) {}
          clearTimeout(t);
          if (mounted) { setUser(null); setSession(null); setProfile(null); setProfileLoaded(true); setLoading(false); }
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(t);
        if (!mounted) return;
        if (!session?.user) {
          setUser(null); setSession(null); setProfile(null);
          setProfileLoaded(true); setLoading(false);
          return;
        }
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || null);
        if (mounted) setLoading(false);
      } catch (err) {
        clearTimeout(t);
        if (mounted) { setProfileLoaded(true); setLoading(false); }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (loggingOut.current) return;
        if (event === 'INITIAL_SESSION') return;
        if (!mounted) return;

        // Detect new OAuth signup (account created less than 15s ago)
        if (event === 'SIGNED_IN' && session?.user) {
          const createdAt = new Date(session.user.created_at).getTime();
          const isNewUser = Date.now() - createdAt < 15000;
          const alreadyDone = localStorage.getItem('mfj_onboarding_done_' + session.user.id);
          if (isNewUser && !alreadyDone) {
            sessionStorage.setItem('mfj_new_signup', '1');
          }
        }

        if (event === 'SIGNED_OUT' || !session) {
          setUser(null); setSession(null); setProfile(null);
          setProfileLoaded(true); setLoading(false);
          return;
        }
        setSession(session);
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email || null);
        if (mounted) setLoading(false);
      }
    );

    return () => { mounted = false; clearTimeout(t); subscription.unsubscribe(); };
  }, [fetchProfile]);

  const signup = useCallback(async ({ firstName, lastName, email, password }) => {
    setAuthLoading(true); setError(null);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: `${firstName.trim()} ${lastName.trim()}`, plan: 'trial' },
        emailRedirectTo: window.location.origin,
      },
    });
    setAuthLoading(false);
    if (error) { setError(translateError(error.message)); return { success: false }; }
    if (data?.user && data.user.identities?.length === 0) {
      setError('An account already exists with this email.');
      return { success: false };
    }
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
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(translateError(error.message));
  }, []);

  const loginWithGitHub = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
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
    loggingOut.current = true;
    setUser(null); setSession(null); setProfile(null); setProfileLoaded(true);
    try { await supabase.auth.signOut({ scope: 'global' }); } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    try {
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
    } catch (_) {}
  }, []);

  const updateProfile = useCallback(async (updates) => {
    const { error } = await supabase.auth.updateUser({ data: updates });
    if (error) { setError(translateError(error.message)); return false; }
    return true;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) await fetchProfile(session.user.id, session.user.email || null);
  }, [fetchProfile]);

  const clearError = useCallback(() => setError(null), []);

  const effectivePlan = profile?.plan || user?.user_metadata?.plan || 'trial';
  const subStatus     = profile?.subscription_status || null;
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
    needsPayment:         ['past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired'].includes(subStatus),
    trialDaysLeft,
    trialEnd,
    stripeCustomerId:     profile?.stripe_customer_id     || null,
    stripeSubscriptionId: profile?.stripe_subscription_id || null,
    createdAt:            user.created_at,
  } : null;

  return (
    <AuthContext.Provider value={{
      user: userProfile, session, loading, authLoading, error, profileLoaded,
      signup, login, loginWithGoogle, loginWithGitHub,
      resetPassword, logout, updateProfile, refreshProfile, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateError(msg) {
  if (!msg) return 'An error occurred.';
  if (msg.includes('Invalid login credentials'))        return 'Incorrect email or password.';
  if (msg.includes('Email not confirmed'))              return 'Confirm your email before logging in.';
  if (msg.includes('User already registered'))          return 'An account already exists with this email.';
  if (msg.includes('Password should be at least'))      return 'Password must contain at least 6 characters.';
  if (msg.includes('Unable to validate email address')) return 'Invalid email address.';
  if (msg.includes('Email rate limit exceeded'))        return 'Too many attempts. Wait a few minutes.';
  if (msg.includes('Invalid email'))                    return 'Invalid email address.';
  if (msg.includes('signup is disabled'))               return 'Sign-ups are temporarily disabled.';
  if (msg.includes('network'))                          return 'Network error. Check your connection.';
  return msg;
}
