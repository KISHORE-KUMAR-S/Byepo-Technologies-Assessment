import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
const client = axios.create({ baseURL: BASE });

export interface Org {
  id: number;
  name: string;
}

export const getOrgs = () =>
  client.get<Org[]>('/user/orgs');

export const checkFlag = (org_id: number, feature_key: string) =>
  client.get<{ found: boolean; is_enabled: boolean }>('/user/check', {
    params: { org_id, feature_key },
  });
