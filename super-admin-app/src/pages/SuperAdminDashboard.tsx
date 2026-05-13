import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Create Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              type="text"
              placeholder="Organization name"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!orgName.trim()}>Create</Button>
          </form>
          {createError && (
            <p className="mt-2 text-sm text-destructive">{createError}</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orgs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No organizations yet.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">{org.id}</td>
                    <td className="px-4 py-3 font-medium">{org.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(org.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
