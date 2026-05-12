import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { login, signup, getOrgs } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'login' | 'signup';

interface Org { id: number; name: string }

export default function Login() {
  const navigate = useNavigate();
  const { login: setAuth } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getOrgs().then(({ data }) => setOrgs(data)).catch(() => {});
  }, []);

  function switchTab(next: Tab) {
    setTab(next);
    setEmail('');
    setPassword('');
    setOrgId('');
    setError('');
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (tab === 'login') {
        const { data } = await login(email, password);
        if (data.role !== 'org_admin') {
          setError('This portal is for org admins only');
          return;
        }
        setAuth(data.token, data.org_id!);
        navigate('/dashboard', { replace: true });
      } else {
        await signup(email, password, Number(orgId));
        switchTab('login');
        setSuccess('Account created. Sign in to continue.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, background: '#fff' }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748b' }}>Byepo Feature Flags</p>
        <h1 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 600 }}>
          {tab === 'login' ? 'Admin Sign In' : 'Create Admin Account'}
        </h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <Button type="button" variant={tab === 'login' ? 'default' : 'outline'} style={{ flex: 1 }} onClick={() => switchTab('login')}>
            Sign In
          </Button>
          <Button type="button" variant={tab === 'signup' ? 'default' : 'outline'} style={{ flex: 1 }} onClick={() => switchTab('signup')}>
            Sign Up
          </Button>
        </div>

        {success && (
          <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: 13, color: '#166534' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          {tab === 'signup' && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Organization</label>
              <select
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
                required
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
              >
                <option value="">Select organization…</option>
                {orgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>
    </main>
  );
}
