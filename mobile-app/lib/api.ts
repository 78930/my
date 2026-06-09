import Constants from 'expo-constants';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function resolveApiBaseUrl() {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  return String(fromExtra || fromEnv || '').replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

export function hasApiBaseUrl() {
  return Boolean(API_BASE_URL);
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getApiConfigError() {
  return 'API URL is not configured. Restart Expo after saving .env (npx expo start -c).';
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(getApiConfigError(), 500);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data), response.status, data);
  }

  return data as T;
}

function getErrorMessage(data: unknown) {
  if (typeof data !== 'object' || !data) {
    return 'Request failed';
  }

  const payload = data as {
    message?: unknown;
    issues?: Array<{ message?: string; path?: Array<string | number> }>;
  };

  if (Array.isArray(payload.issues) && payload.issues.length > 0) {
    const paths = payload.issues.map((issue) => issue.path?.[0]).filter(Boolean);
    const wantsLegacyAuth = paths.includes('email') || paths.includes('password');

    if (wantsLegacyAuth) {
      return `Wrong API server (${API_BASE_URL}). Stop Expo, run "npx expo start -c", and ensure backend is running on your PC.`;
    }

    const details = payload.issues
      .map((issue) => {
        const field = issue.path?.length ? String(issue.path.join('.')) : 'field';
        return issue.message ? `${field}: ${issue.message}` : field;
      })
      .join('; ');

    return details || (typeof payload.message === 'string' ? payload.message : 'Request failed');
  }

  return typeof payload.message === 'string' ? payload.message : 'Request failed';
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
