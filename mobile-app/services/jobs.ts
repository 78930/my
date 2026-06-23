import { apiRequest } from '../lib/api';
import { mapJob } from '../lib/mappers';

export async function listJobs(params: {
  area?: string;
  role?: string;
  skill?: string;
  shift?: string;
  q?: string;
  page?: number;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value));
  });

  const response = await apiRequest<{ items: any[]; pagination?: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }>(`/api/jobs?${search.toString()}`);
  return { items: response.items.map(mapJob), pagination: response.pagination };
}

export async function getJobDetails(jobId: string) {
  const response = await apiRequest<any>(`/api/jobs/${jobId}`);
  return mapJob(response);
}

export async function createJob(
  token: string,
  payload: {
    title: string;
    description: string;
    area: string;
    shift: string;
    skillsRequired: string[];
    payMin: number;
    payMax: number;
    employmentType: string;
  }
) {
  const response = await apiRequest<any>('/api/jobs', {
    method: 'POST',
    token,
    body: payload,
  });

  return mapJob(response);
}

export async function updateJob(
  token: string,
  jobId: string,
  payload: {
    title?: string;
    description?: string;
    area?: string;
    shift?: string;
    skillsRequired?: string[];
    payMin?: number;
    payMax?: number;
    employmentType?: string;
  }
) {
  const response = await apiRequest<any>(`/api/jobs/${jobId}`, {
    method: 'PATCH',
    token,
    body: payload,
  });
  return mapJob(response);
}

export async function applyToJob(token: string, jobId: string, note?: string) {
  return apiRequest(`/api/jobs/${jobId}/apply`, {
    method: 'POST',
    token,
    body: note ? { note } : {},
  });
}
