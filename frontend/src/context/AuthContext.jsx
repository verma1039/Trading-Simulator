import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import SessionContext from "@/context/sessionContext";
import { getCurrentUser, loginUser, logoutUser, signupUser, subscribeToAuthChanges } from "@/services/authService";

const guestSession = {
  accountId: "",
  email: "",
  isLoggedIn: false,
  name: "",
  phoneNumber: "",
  dateOfBirth: "",
  timezone: "Asia/Kolkata",
  country: "India",
  lastLoginAt: "",
  lastLoginLabel: "",
  loginBadge: null,
  profileCompleted: false,
  createdAt: "",
  joiningBonusAmount: 0,
  joiningBonusCredited: false,
  joiningBonusMessage: "",
  role: "GUEST",
  status: "GUEST",
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(guestSession);
  const [isLoading, setIsLoading] = useState(true);
  const isSigningUpRef = useRef(false);

  const refreshSession = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      const nextSession = normalizeUser(response.user);
      setSession(nextSession);
      return nextSession;
    } catch {
      setSession(guestSession);
      return guestSession;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    return subscribeToAuthChanges((supabaseSession, event) => {
      if (isSigningUpRef.current) {
        if (event === "SIGNED_OUT" || !supabaseSession) {
          isSigningUpRef.current = false;
        }
        setSession(guestSession);
        setIsLoading(false);
        return;
      }

      if (!supabaseSession) {
        setSession(guestSession);
        setIsLoading(false);
        return;
      }

      if (event === "SIGNED_IN") {
        return;
      }

      refreshSession();
    });
  }, [refreshSession]);

  const login = useCallback(async ({ email, password }) => {
    const response = await loginUser({ email: email.trim(), password });
    const nextSession = normalizeUser(response.user);
    setSession(nextSession);
    return nextSession;
  }, []);

  const signup = useCallback(async ({ dateOfBirth, email, name, password, phoneNumber }) => {
    isSigningUpRef.current = true;
    setSession(guestSession);

    let signupSucceeded = false;
    try {
      const response = await signupUser({
        dateOfBirth,
        email: email.trim(),
        name: name.trim(),
        password,
        phoneNumber,
      });
      signupSucceeded = true;
      setSession(guestSession);
      return response;
    } finally {
      if (!signupSucceeded) {
        isSigningUpRef.current = false;
      }
      setSession(guestSession);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setSession(guestSession);
  }, []);

  const value = useMemo(
    () => ({
      isAdmin: session.role === "ADMIN",
      isAuthenticated: session.isLoggedIn,
      isLoading,
      login,
      logout,
      refreshSession,
      session,
      signup,
    }),
    [isLoading, login, logout, refreshSession, session, signup],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function normalizeUser(user) {
  return {
    ...guestSession,
    ...user,
    profileCompleted: Boolean(user?.profileCompleted),
    isLoggedIn: true,
    role: user?.role || "USER",
  };
}
