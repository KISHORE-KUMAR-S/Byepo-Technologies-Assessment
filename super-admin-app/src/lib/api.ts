import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const client = axios.create({ baseURL: BASE });

export interface Organization {
  id: number;
  name: string;
  created_at: string;
}

export const login = (email: string, password: string) =>
  client.post<{ token: string; role: string }>('/auth/login', { email, password });

export const saGetOrgs = (token: string) =>
  client.get<Organization[]>('/superadmin/organizations', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const saCreateOrg = (name: string, token: string) =>
  client.post<Organization>(
    '/superadmin/organizations',
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );

export const saDeleteOrg = (id: number, token: string) =>
  client.delete(`/superadmin/organizations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
