import { apiRequest } from '../lib/api';
import { mapWorker, mapWorkerProfile } from '../lib/mappers';

export async function searchWorkers(params: {
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

  const response = await apiRequest<{ items: any[]; pagination?: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }>(`/api/workers/search?${search.toString()}`);
  return { items: response.items.map(mapWorker), pagination: response.pagination };
}

export async function getWorkerProfile(token: string) {
  const response = await apiRequest<any>('/api/workers/me/profile', { token });
  return mapWorkerProfile(response);
}

export async function getWorkerById(id: string) {
  const response = await apiRequest<any>(`/api/workers/${id}`);
  return mapWorker(response);
}

export async function updateWorkerProfile(
  token: string,
  payload: {
    fullName?: string;
    headline?: string;
    skills?: string[];
    preferredRoles?: string[];
    experienceYears?: number;
    certifications?: string[];
    preferredAreas?: string[];
    preferredShifts?: string[];
    salaryMin?: number;
    availability?: string;
    isOpenToWork?: boolean;
  }
) {
  const response = await apiRequest<any>('/api/workers/me/profile', {
    method: 'PUT',
    token,
    body: payload,
  });
  return mapWorkerProfile(response);
}
