import { apiRequest } from '../lib/api';
import { mapAuthUser, mapFactoryProfile, mapWorkerProfile } from '../lib/mappers';
import { AuthUser, FactoryProfile, WorkerProfile } from '../types';

export type WorkerRegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  preferredAreas: string[];
  preferredRoles: string[];
  skills: string[];
  preferredShifts: string[];
};

export type FactoryRegisterPayload = {
  companyName: string;
  hrName: string;
  email: string;
  phone: string;
  password: string;
  industrialAreas: string[];
  description: string;
};

export type SessionPayload = {
  token: string;
  user: AuthUser;
  profile: WorkerProfile | FactoryProfile | null;
};

<<<<<<< HEAD
export type OtpRequestResponse = {
  message: string;
  expiresInSeconds: number;
  otpCode?: string;
};

=======
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
export async function login(payload: { email: string; password: string }): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: payload,
    }
  );

  const me = await getMe(auth.token);
  return {
    token: auth.token,
    user: mapAuthUser({ user: auth.user, profile: me.profile }),
    profile: me.profile,
  };
}

<<<<<<< HEAD
export async function requestLoginOtp(payload: { phone: string }): Promise<OtpRequestResponse> {
  return apiRequest<OtpRequestResponse>('/api/auth/request-otp', {
    method: 'POST',
    body: payload,
  });
}

export async function loginWithOtp(payload: { phone: string; otp: string }): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/verify-otp',
    {
      method: 'POST',
      body: payload,
    }
  );

  const me = await getMe(auth.token);
  return {
    token: auth.token,
    user: mapAuthUser({ user: auth.user, profile: me.profile }),
    profile: me.profile,
  };
}

=======
>>>>>>> 5c0caeb4c7685069d55b1ae0abb69aceeba0ca1e
export async function registerWorker(payload: WorkerRegisterPayload): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: {
        role: 'WORKER',
        ...payload,
      },
    }
  );

  const me = await getMe(auth.token);
  return {
    token: auth.token,
    user: mapAuthUser({ user: auth.user, profile: me.profile }),
    profile: me.profile,
  };
}

export async function registerFactory(payload: FactoryRegisterPayload): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: {
        role: 'FACTORY',
        ...payload,
      },
    }
  );

  const me = await getMe(auth.token);
  return {
    token: auth.token,
    user: mapAuthUser({ user: auth.user, profile: me.profile }),
    profile: me.profile,
  };
}

export async function getMe(token: string): Promise<{ user: AuthUser; profile: WorkerProfile | FactoryProfile | null }> {
  const result = await apiRequest<{ user: { _id?: string; id?: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' }; profile?: any }>(
    '/api/auth/me',
    {
      token,
    }
  );

  const type = result.user.role === 'FACTORY' ? 'factory' : 'worker';
  const profile = result.profile
    ? type === 'factory'
      ? mapFactoryProfile(result.profile)
      : mapWorkerProfile(result.profile)
    : null;

  return {
    user: mapAuthUser({ user: result.user, profile }),
    profile,
  };
}
