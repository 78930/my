import { apiRequest } from '../lib/api';
import { mapJobApplication } from '../lib/mappers';
import { HirePayload } from '../types';

export async function listJobApplications(token: string, jobId: string) {
  const response = await apiRequest<{ items: any[] }>(`/api/jobs/${jobId}/applications`, { token });
  return response.items.map(mapJobApplication);
}

export async function listMyApplications(token: string) {
  const response = await apiRequest<{ items: any[] }>('/api/workers/me/applications', { token });
  return response.items.map(mapJobApplication);
}

export async function shortlistApplication(token: string, applicationId: string) {
  const response = await apiRequest<any>(`/api/applications/${applicationId}/shortlist`, {
    method: 'POST',
    token,
  });

  return mapJobApplication(response);
}

export async function hireApplication(token: string, applicationId: string, payload: HirePayload) {
  return apiRequest(`/api/applications/${applicationId}/hire`, {
    method: 'POST',
    token,
    body: payload,
  });
}
