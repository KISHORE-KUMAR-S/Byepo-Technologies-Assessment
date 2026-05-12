import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const client = axios.create({ baseURL: BASE });

export interface FeatureFlag {
  id: number;
  feature_key: string;
  is_enabled: boolean;
  org_id: number;
  created_at: string;
}

export interface Organization {
  id: number;
  name: string;
}

export const login = (email: string, password: string) =>
  client.post<{ token: string; role: string; org_id?: number }>('/auth/login', { email, password });

export const signup = (email: string, password: string, org_id: number) =>
  client.post('/auth/signup', { email, password, org_id });

export const getOrgs = () =>
  client.get<Organization[]>('/user/orgs');

export const getFlags = (token: string) =>
  client.get<FeatureFlag[]>('/admin/flags', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createFlag = (feature_key: string, is_enabled: boolean, token: string) =>
  client.post('/admin/flags', { feature_key, is_enabled }, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const toggleFlag = (id: number, is_enabled: boolean, token: string) =>
  client.put(`/admin/flags/${id}`, { is_enabled }, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteFlag = (id: number, token: string) =>
  client.delete(`/admin/flags/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
