import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

const client = axios.create({ baseURL: BASE });

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? fallback;
  }

  return fallback;
}

export function getApiStatus(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.status;
  }

  return undefined;
}

client.interceptors.request.use((config) => {
  if (config.headers.Authorization) {
    return config;
  }

  const saToken = localStorage.getItem('sa_token');
  const adminToken = localStorage.getItem('admin_token');
  const token = saToken || adminToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export interface LoginResponse {
  token: string;
  role: 'super_admin' | 'org_admin';
  org_id?: number;
}

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export interface FeatureFlag {
  id: number;
  feature_key: string;
  is_enabled: boolean;
  org_id: number;
  created_at: string;
}

export const unifiedLogin = (email: string, password: string) =>
  client.post<LoginResponse>('/auth/login', { email, password });

export const unifiedSignup = (email: string, password: string, org_id: number) =>
  client.post('/auth/signup', { email, password, org_id });

export const saGetOrgs = (token: string) =>
  client.get<Organization[]>('/superadmin/organizations', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saCreateOrg = (name: string, token: string) =>
  client.post<Organization>(
    '/superadmin/organizations',
    { name },
    { headers: { Authorization: `Bearer ${token}` } },
  );

export const saDeleteOrg = (id: number, token: string) =>
  client.delete(`/superadmin/organizations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const adminGetFlags = (token: string) =>
  client.get<FeatureFlag[]>('/admin/flags', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const adminCreateFlag = (feature_key: string, is_enabled: boolean, token: string) =>
  client.post(
    '/admin/flags',
    { feature_key, is_enabled },
    { headers: { Authorization: `Bearer ${token}` } },
  );

export const adminToggleFlag = (id: number, is_enabled: boolean, token: string) =>
  client.put(
    `/admin/flags/${id}`,
    { is_enabled },
    { headers: { Authorization: `Bearer ${token}` } },
  );

export const adminDeleteFlag = (id: number, token: string) =>
  client.delete(`/admin/flags/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
