import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { getStoredItem, removeStoredItem, setStoredItem } from '../lib/storage';
import { getMe, login, loginWithOtp, registerFactory, registerWorker, requestLoginOtp, OtpRequestResponse } from '../services/auth';
import { ApiError } from '../lib/api';
import { AuthUser, FactoryProfile, UserType, WorkerProfile } from '../types';
import { registerForPushNotifications } from '../lib/notifications';
import { savePushToken } from '../services/workers';

const SESSION_KEY = 'sketu.session';

type SessionProfile = WorkerProfile | FactoryProfile | null;

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  profile: SessionProfile;
  isLoading: boolean;
  isSubmitting: boolean;
  signIn: (payload: { role: UserType; name: string; phone: string }) => Promise<void>;
  requestOtp: (payload: { phone: string }) => Promise<OtpRequestResponse>;
  signInWithOtp: (payload: { phone: string; otp: string }) => Promise<void>;
  signUpWorker: (payload: { name: string; phone: string }) => Promise<string>;
  signUpFactory: (payload: { name: string; phone: string }) => Promise<string>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  isFactory: boolean;
  isWorker: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<SessionProfile>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const persistSession = useCallback(async (next: { token: string; user: AuthUser; profile: SessionProfile }) => {
    setToken(next.token);
    setUser(next.user);
    setProfile(next.profile);
    await setStoredItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    await removeStoredItem(SESSION_KEY);
  }, []);

  const refreshSession = useCallback(async () => {
    const stored = await getStoredItem(SESSION_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { token: string; user: AuthUser; profile: SessionProfile };
      setToken(parsed.token);
      setUser(parsed.user);
      setProfile(parsed.profile ?? null);

      try {
        const fresh = await getMe(parsed.token);
        await persistSession({ token: parsed.token, user: fresh.user, profile: fresh.profile });
      } catch (err) {
        // Only evict the session on a confirmed 401 — network errors keep the user logged in
        if (err instanceof ApiError && err.status === 401) {
          Alert.alert('Session expired', 'Your session has expired. Please log in again.');
          await clearSession();
        }
        // Any other error (network offline, 5xx) — silently keep the stored session
      }
    } catch {
      // JSON parse failure — stored data is corrupt, clear it
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, persistSession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // After any successful login, register for push notifications and send token to backend.
  useEffect(() => {
    if (!token) return;
    registerForPushNotifications().then((pushToken) => {
      if (pushToken) savePushToken(token, pushToken).catch(() => {});
    }).catch(() => {});
  }, [token]);

  const signIn = useCallback(async (payload: { role: UserType; name: string; phone: string }) => {
    setIsSubmitting(true);
    try {
      const session = await login(payload);
      await persistSession(session);
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const requestOtp = useCallback(async (payload: { phone: string }): Promise<OtpRequestResponse> => {
    return requestLoginOtp(payload);
  }, []);

  const signInWithOtp = useCallback(async (payload: { phone: string; otp: string }) => {
    setIsSubmitting(true);
    try {
      const session = await loginWithOtp(payload);
      await persistSession(session);
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const signUpWorker = useCallback(async (payload: { name: string; phone: string }): Promise<string> => {
    setIsSubmitting(true);
    try {
      const session = await registerWorker(payload);
      await persistSession(session);
      return session.token;
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const signUpFactory = useCallback(async (payload: { name: string; phone: string }): Promise<string> => {
    setIsSubmitting(true);
    try {
      const session = await registerFactory(payload);
      await persistSession(session);
      return session.token;
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const signOut = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      profile,
      isLoading,
      isSubmitting,
      signIn,
      requestOtp,
      signInWithOtp,
      signUpWorker,
      signUpFactory,
      refreshSession,
      signOut,
      isFactory: user?.type === 'factory',
      isWorker: user?.type === 'worker',
    }),
    [user, token, profile, isLoading, isSubmitting, signIn, requestOtp, signInWithOtp, signUpWorker, signUpFactory, refreshSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
