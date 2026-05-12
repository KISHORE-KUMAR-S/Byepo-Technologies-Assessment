/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextValue {
  token: string | null;
  orgId: number | null;
  login: (token: string, orgId: number) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('admin_token')
  );
  const [orgId, setOrgId] = useState<number | null>(() => {
    const v = localStorage.getItem('admin_org_id');
    return v ? Number(v) : null;
  });

  const login = (t: string, id: number) => {
    localStorage.setItem('admin_token', t);
    localStorage.setItem('admin_org_id', String(id));
    setToken(t);
    setOrgId(id);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_org_id');
    setToken(null);
    setOrgId(null);
  };

  return (
    <AuthContext.Provider value={{ token, orgId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
