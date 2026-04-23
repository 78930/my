import { apiRequest } from '../lib/api';
import { mapFactoryDashboardSummary, mapFactoryProfile, mapJob } from '../lib/mappers';

export async function getFactoryDashboard(token: string) {
  const response = await apiRequest<any>('/api/factories/dashboard/summary', { token });
  return mapFactoryDashboardSummary(response);
}

export async function getFactoryProfile(token: string) {
  const response = await apiRequest<any>('/api/factories/me/profile', { token });
  return mapFactoryProfile(response);
}

export async function updateFactoryProfile(
  token: string,
  payload: {
    companyName?: string;
    hrName?: string;
    industrialAreas?: string[];
    companySize?: string;
    description?: string;
  }
) {
  const response = await apiRequest<any>('/api/factories/me/profile', {
    method: 'PUT',
    token,
    body: payload,
  });
  return mapFactoryProfile(response);
}


export async function listFactoryJobs(token: string, params?: { status?: string }) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);

  const response = await apiRequest<{ items: any[] }>(
    `/api/factories/jobs${search.toString() ? `?${search.toString()}` : ''}`,
    { token }
  );
  return response.items.map(mapJob);
}
