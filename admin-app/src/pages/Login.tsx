import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardDescription>Byepo Feature Flags</CardDescription>
          <CardTitle className="text-2xl">
            {tab === 'login' ? 'Admin Sign In' : 'Create Admin Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Button type="button" variant={tab === 'login' ? 'default' : 'outline'} className="flex-1" onClick={() => switchTab('login')}>
              Sign In
            </Button>
            <Button type="button" variant={tab === 'signup' ? 'default' : 'outline'} className="flex-1" onClick={() => switchTab('signup')}>
              Sign Up
            </Button>
          </div>

          {success && (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400">
              {success}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {tab === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <Label>Organization</Label>
                <Select value={orgId} onValueChange={setOrgId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization…" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map(o => (
                      <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
