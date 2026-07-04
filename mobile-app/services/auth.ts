import { apiRequest } from '../lib/api';
import { mapAuthUser, mapFactoryProfile, mapWorkerProfile } from '../lib/mappers';
import { AuthUser, FactoryProfile, UserType, WorkerProfile } from '../types';

export type SimpleRegisterPayload = {
  name: string;
  phone: string;
};

export type SessionPayload = {
  token: string;
  user: AuthUser;
  profile: WorkerProfile | FactoryProfile | null;
};

export type OtpRequestResponse = {
  message: string;
  expiresInSeconds: number;
  otpCode?: string;
};

export async function login(payload: { role: UserType; name: string; phone: string }): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: {
        role: payload.role === 'factory' ? 'FACTORY' : 'WORKER',
        name: payload.name,
        phone: payload.phone,
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

export async function requestLoginOtp(payload: { phone: string }): Promise<OtpRequestResponse> {
  return apiRequest<OtpRequestResponse>('/api/auth/request-otp', {
    method: 'POST',
    body: payload,
  });
}

export async function loginWithOtp(payload: { phone: string; otp: string }): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/verify-login-otp',
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

export async function registerWorker(payload: SimpleRegisterPayload): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: {
        role: 'WORKER',
        name: payload.name,
        phone: payload.phone,
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

export async function registerFactory(payload: SimpleRegisterPayload): Promise<SessionPayload> {
  const auth = await apiRequest<{ token: string; user: { id: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY' } }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: {
        role: 'FACTORY',
        name: payload.name,
        phone: payload.phone,
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
  const result = await apiRequest<{ user: { _id?: string; id?: string; email: string; phone?: string; role: 'WORKER' | 'FACTORY'; photoBase64?: string | null; photoMimeType?: string }; profile?: any }>(
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

export async function uploadProfilePhoto(
  token: string,
  photoBase64: string,
  mimeType = 'image/jpeg'
): Promise<void> {
  await apiRequest('/api/auth/me/photo', {
    method: 'POST',
    token,
    body: { photoBase64, mimeType },
  });
}
