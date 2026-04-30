import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredItem, removeStoredItem, setStoredItem } from '../lib/storage';
<<<<<<< HEAD
import { getMe, login, loginWithOtp, registerFactory, registerWorker, requestLoginOtp } from '../services/auth';
=======
import { getMe, login, registerFactory, registerWorker } from '../services/auth';
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
import { AuthUser, FactoryProfile, UserType, WorkerProfile } from '../types';

const SESSION_KEY = 'sketu.session';

type SessionProfile = WorkerProfile | FactoryProfile | null;

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  profile: SessionProfile;
  isLoading: boolean;
  isSubmitting: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
<<<<<<< HEAD
  requestOtp: (payload: { phone: string }) => Promise<{ message: string; expiresInSeconds: number; otpCode?: string }>;
  signInWithOtp: (payload: { phone: string; otp: string }) => Promise<void>;
=======
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
  signUpWorker: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredAreas: string[];
    preferredRoles: string[];
    skills: string[];
    preferredShifts: string[];
  }) => Promise<void>;
  signUpFactory: (payload: {
    companyName: string;
    hrName: string;
    email: string;
    phone: string;
    password: string;
    industrialAreas: string[];
    description: string;
  }) => Promise<void>;
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

      const fresh = await getMe(parsed.token);
      await persistSession({ token: parsed.token, user: fresh.user, profile: fresh.profile });
    } catch {
      await clearSession();
    } finally {
      setIsLoading(false);
    }
  }, [clearSession, persistSession]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (payload: { email: string; password: string }) => {
    setIsSubmitting(true);
    try {
      const session = await login(payload);
      await persistSession(session);
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

<<<<<<< HEAD
  const requestOtp = useCallback(async (payload: { phone: string }) => {
    setIsSubmitting(true);
    try {
      return await requestLoginOtp(payload);
    } finally {
      setIsSubmitting(false);
    }
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

=======
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
  const signUpWorker = useCallback(async (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredAreas: string[];
    preferredRoles: string[];
    skills: string[];
    preferredShifts: string[];
  }) => {
    setIsSubmitting(true);
    try {
      const session = await registerWorker(payload);
      await persistSession(session);
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const signUpFactory = useCallback(async (payload: {
    companyName: string;
    hrName: string;
    email: string;
    phone: string;
    password: string;
    industrialAreas: string[];
    description: string;
  }) => {
    setIsSubmitting(true);
    try {
      const session = await registerFactory(payload);
      await persistSession(session);
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
<<<<<<< HEAD
      requestOtp,
      signInWithOtp,
=======
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
      signUpWorker,
      signUpFactory,
      refreshSession,
      signOut,
      isFactory: user?.type === 'factory',
      isWorker: user?.type === 'worker',
    }),
<<<<<<< HEAD
    [user, token, profile, isLoading, isSubmitting, signIn, requestOtp, signInWithOtp, signUpWorker, signUpFactory, refreshSession, signOut]
=======
    [user, token, profile, isLoading, isSubmitting, signIn, signUpWorker, signUpFactory, refreshSession, signOut]
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
