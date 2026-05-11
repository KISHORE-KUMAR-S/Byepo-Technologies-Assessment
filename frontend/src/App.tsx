import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';

import Login from '@/pages/Login';
import SuperAdminDashboard from '@/pages/SuperAdminDashboard';
import AdminDashboard from '@/pages/AdminDashboard';

function LoginRoute() {
  const { token, role } = useAuth();

  if (token && role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  if (token && role === 'org_admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Login />;
}

function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuth();

  if (!token || role !== 'super_admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireOrgAdmin({ children }: { children: React.ReactNode }) {
  const { token, role } = useAuth();

  if (!token || role !== 'org_admin') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />

          <Route
            path="/super-admin/dashboard"
            element={
              <RequireSuperAdmin>
                <SuperAdminDashboard />
              </RequireSuperAdmin>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <RequireOrgAdmin>
                <AdminDashboard />
              </RequireOrgAdmin>
            }
          />

          <Route path="/super-admin" element={<Navigate to="/login" replace />} />
          <Route path="/admin" element={<Navigate to="/login" replace />} />
          <Route path="/user" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
