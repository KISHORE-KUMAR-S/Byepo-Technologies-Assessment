import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getOrgs, checkFlag } from '@/lib/api';
import type { Org } from '@/lib/api';

export default function UserPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<number | ''>('');
  const [featureKey, setFeatureKey] = useState('');
  const [result, setResult] = useState<{ found: boolean; is_enabled: boolean } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrgs()
      .then(({ data }) => setOrgs(data))
      .catch(() => setError('Could not load organizations'));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !featureKey.trim()) return;
    setError('');
    setResult(null);
    try {
      const { data } = await checkFlag(Number(orgId), featureKey.trim());
      setResult(data);
    } catch {
      setError('Something went wrong');
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Feature Flag Checker</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        Check if a feature is enabled for your organization.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
            Organization
          </label>
          <select
            value={orgId}
            onChange={e => { setOrgId(e.target.value ? Number(e.target.value) : ''); setResult(null); }}
            required
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
          >
            <option value="">Select organization…</option>
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 500 }}>
            Feature Key
          </label>
          <input
            type="text"
            value={featureKey}
            onChange={e => { setFeatureKey(e.target.value); setResult(null); }}
            placeholder="e.g. dark_mode"
            required
            style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, fontFamily: 'monospace', boxSizing: 'border-box' }}
          />
        </div>

        <Button type="submit" disabled={!orgId || !featureKey.trim()}>
          Check
        </Button>
      </form>

      {error && <p style={{ color: 'red', marginTop: 16, fontSize: 14 }}>{error}</p>}

      {result && (
        <div style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 8,
          border: '1px solid',
          borderColor: result.is_enabled ? '#86efac' : '#e2e8f0',
          background: result.is_enabled ? '#f0fdf4' : '#f8fafc',
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: result.is_enabled ? '#166534' : '#475569' }}>
            {!result.found
              ? 'Feature not found for this organization'
              : result.is_enabled
              ? '✓ Feature is ENABLED'
              : '✗ Feature is DISABLED'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>
            {featureKey}
          </p>
        </div>
      )}
    </div>
  );
}
