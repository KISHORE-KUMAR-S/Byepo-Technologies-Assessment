import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getFlags, createFlag, toggleFlag, deleteFlag } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { FeatureFlag } from '@/lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, orgId, logout } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newEnabled, setNewEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    loadFlags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadFlags() {
    try {
      const { data } = await getFlags(token!);
      setFlags(data);
    } catch {
      setError('Failed to load flags');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    setCreateError('');
    try {
      await createFlag(newKey.trim().toLowerCase(), newEnabled, token!);
      setNewKey('');
      setNewEnabled(false);
      loadFlags();
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'Failed to create flag');
    }
  }

  async function handleToggle(flag: FeatureFlag) {
    try {
      await toggleFlag(flag.id, !flag.is_enabled, token!);
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f));
    } catch {
      setError('Failed to update flag');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFlag(id, token!);
      setFlags(prev => prev.filter(f => f.id !== id));
    } catch {
      setError('Failed to delete flag');
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feature Flags</h1>
          {orgId && <p className="mt-1 text-sm text-muted-foreground">Org #{orgId}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Add Flag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
            <Input
              type="text"
              placeholder="feature_key"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers, underscores only"
              className="min-w-40 flex-1 font-mono"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newEnabled}
                onChange={e => setNewEnabled(e.target.checked)}
                className="accent-primary"
              />
              Enabled
            </label>
            <Button type="submit" disabled={!newKey.trim()}>Add</Button>
          </form>
          {createError && (
            <p className="mt-2 text-sm text-destructive">{createError}</p>
          )}
        </CardContent>
      </Card>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No flags yet.</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Key</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map(flag => (
                  <tr key={flag.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono">{flag.feature_key}</td>
                    <td className="px-4 py-3">
                      <Badge variant={flag.is_enabled ? 'success' : 'muted'}>
                        {flag.is_enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(flag.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggle(flag)}>
                          {flag.is_enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(flag.id)}
                        >
                          Delete
                        </Button>
                      </div>
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
