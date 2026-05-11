/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Role = 'super_admin' | 'org_admin' | null;

interface AuthState {
  token: string | null;
  role: Role;
  orgId: number | null;
}

interface AuthContextValue extends AuthState {
  loginSuperAdmin: (token: string) => void;
  loginAdmin: (token: string, orgId: number) => void;
  logout: (role?: Role) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [saAuth, setSaAuth] = useState<{ token: string | null }>(() => ({
    token: localStorage.getItem('sa_token'),
  }));
  const [adminAuth, setAdminAuth] = useState<{ token: string | null; orgId: number | null }>(
    () => {
      const orgId = localStorage.getItem('admin_org_id');

      return {
        token: localStorage.getItem('admin_token'),
        orgId: orgId ? Number(orgId) : null,
      };
    },
  );

  const token = saAuth.token || adminAuth.token;
  const role: Role = saAuth.token ? 'super_admin' : adminAuth.token ? 'org_admin' : null;
  const orgId = adminAuth.orgId;

  const loginSuperAdmin = useCallback((token: string) => {
    localStorage.setItem('sa_token', token);
    setSaAuth({ token });
  }, []);

  const loginAdmin = useCallback((token: string, orgId: number) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_org_id', String(orgId));
    setAdminAuth({ token, orgId });
  }, []);

  const logout = useCallback((role?: Role) => {
    if (!role || role === 'super_admin') {
      localStorage.removeItem('sa_token');
      setSaAuth({ token: null });
    }
    if (!role || role === 'org_admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_org_id');
      setAdminAuth({ token: null, orgId: null });
    }
  }, []);

  const value = useMemo(
    () => ({ token, role, orgId, loginSuperAdmin, loginAdmin, logout }),
    [token, role, orgId, loginSuperAdmin, loginAdmin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
