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

export async function requestVerification(token: string): Promise<{ message: string; verificationStatus: string }> {
  return apiRequest('/api/workers/me/request-verification', { method: 'POST', token });
}

export async function savePushToken(token: string, pushToken: string): Promise<void> {
  await apiRequest('/api/workers/me/push-token', { method: 'POST', token, body: { token: pushToken } });
}

export type DocumentType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'BANK_PASSBOOK';

export interface DocumentRecord {
  _id: string;
  type: DocumentType;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
}

export async function listDocuments(token: string): Promise<DocumentRecord[]> {
  const res = await apiRequest<{ items: DocumentRecord[] }>('/api/workers/me/documents', { token });
  return res.items;
}

export async function getDocument(token: string, type: DocumentType): Promise<{ imageBase64: string; mimeType: string }> {
  return apiRequest(`/api/workers/me/documents/${type}`, { token });
}

export async function uploadDocument(
  token: string,
  type: DocumentType,
  imageBase64: string,
  mimeType = 'image/jpeg'
): Promise<{ id: string; type: string; uploadedAt: string }> {
  return apiRequest('/api/workers/me/documents', { method: 'POST', token, body: { type, imageBase64, mimeType } });
}

export async function deleteDocument(token: string, type: DocumentType): Promise<void> {
  await apiRequest(`/api/workers/me/documents/${type}`, { method: 'DELETE', token });
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
