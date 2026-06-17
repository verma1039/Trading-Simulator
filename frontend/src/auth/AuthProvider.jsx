import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import api from "../api/axios";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState(null);

  const bootstrapBackendUser = useCallback(async (activeSession) => {
    if (!activeSession?.access_token) return;

    try {
      setBootstrapError(null);
      const res = await api.post("/auth/bootstrap");
      if (res.data?.user) {
        setUser({
          ...activeSession.user,
          ...res.data.user,
          supabaseUser: activeSession.user,
        });
      }
    } catch (error) {
      setBootstrapError(
        error.response?.data?.detail || "Unable to bootstrap account",
      );
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const restoredSession = data.session ?? null;
      setSession(restoredSession);
      setUser(restoredSession?.user ?? null);
      await bootstrapBackendUser(restoredSession);
      if (mounted) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      await bootstrapBackendUser(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [bootstrapBackendUser]);

  const signup = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") };
    }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") };
    }

    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    await bootstrapBackendUser(result.data?.session);
    return result;
  }, [bootstrapBackendUser]);

  const logout = useCallback(async () => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      return { error: null };
    }

    const result = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    return result;
  }, []);

  const value = useMemo(
    () => ({
      accessToken: session?.access_token ?? null,
      bootstrapError,
      isAuthenticated: Boolean(user),
      isSupabaseConfigured,
      loading,
      login,
      logout,
      session,
      signup,
      user,
    }),
    [bootstrapError, loading, login, logout, session, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
