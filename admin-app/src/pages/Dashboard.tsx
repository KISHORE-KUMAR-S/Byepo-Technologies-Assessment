import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Feature Flags</h1>
          {orgId && <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>Org #{orgId}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15 }}>Add Flag</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="feature_key"
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, underscores only"
            style={{ flex: 1, minWidth: 160, padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={newEnabled}
              onChange={e => setNewEnabled(e.target.checked)}
            />
            Enabled
          </label>
          <Button type="submit" disabled={!newKey.trim()}>Add</Button>
        </form>
        {createError && <p style={{ color: 'red', fontSize: 13, margin: '8px 0 0' }}>{createError}</p>}
      </div>

      {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : flags.length === 0 ? (
        <p style={{ color: '#666' }}>No flags yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Key</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Status</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Created</th>
              <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {flags.map(flag => (
              <tr key={flag.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{flag.feature_key}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: flag.is_enabled ? '#dcfce7' : '#f1f5f9',
                    color: flag.is_enabled ? '#166534' : '#64748b',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                  }}>
                    {flag.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: '#64748b' }}>
                  {new Date(flag.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '10px 12px', display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm" onClick={() => handleToggle(flag)}>
                    {flag.is_enabled ? 'Disable' : 'Enable'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(flag.id)} style={{ color: '#ef4444' }}>
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
