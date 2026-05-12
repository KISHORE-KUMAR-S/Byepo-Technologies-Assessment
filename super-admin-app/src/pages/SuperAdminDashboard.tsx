import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { saCreateOrg, saDeleteOrg, saGetOrgs } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Organization } from '@/lib/api';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadOrgs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrgs() {
    try {
      const { data } = await saGetOrgs(token!);
      setOrgs(data);
    } catch {
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreateError('');
    try {
      await saCreateOrg(orgName.trim(), token!);
      setOrgName('');
      loadOrgs();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'Failed to create organization');
    }
  }

  async function handleDelete(id: number) {
    try {
      await saDeleteOrg(id, token!);
      setOrgs(prev => prev.filter(o => o.id !== id));
    } catch {
      setError('Failed to delete organization');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Organizations</h1>
        <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15 }}>Create Organization</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Organization name"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            style={{ flex: 1, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
          />
          <Button type="submit" disabled={!orgName.trim()}>Create</Button>
        </form>
        {createError && <p style={{ color: 'red', fontSize: 13, margin: '8px 0 0' }}>{createError}</p>}
      </div>

      {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : orgs.length === 0 ? (
        <p style={{ color: '#666' }}>No organizations yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>ID</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Name</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Created</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}></th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(org => (
              <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>{org.id}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{org.name}</td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(org.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(org.id)} style={{ color: '#ef4444' }}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
