import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApiErrorMessage, unifiedLogin, unifiedSignup } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'login' | 'signup';

export default function Login() {
  const navigate = useNavigate();
  const { loginSuperAdmin, loginAdmin } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => {
    setEmail('');
    setPassword('');
    setOrgId('');
    setError('');
    setSuccess('');
  };

  const switchTab = (nextTab: Tab) => {
    reset();
    setTab(nextTab);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const { data } = await unifiedLogin(email, password);

        if (data.role === 'super_admin') {
          loginSuperAdmin(data.token);
          navigate('/super-admin/dashboard', { replace: true });
        } else {
          loginAdmin(data.token, data.org_id!);
          navigate('/admin/dashboard', { replace: true });
        }
      } else {
        await unifiedSignup(email, password, Number(orgId));
        reset();
        setTab('login');
        setSuccess('Account created. Sign in to continue.');
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground">Byepo Feature Flags</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
            {tab === 'login' ? 'Sign in' : 'Create admin account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === 'login'
              ? 'Access your feature flag workspace.'
              : 'Create an org-admin account for an existing organization.'}
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={tab === 'login' ? 'default' : 'outline'}
            onClick={() => switchTab('login')}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={tab === 'signup' ? 'default' : 'outline'}
            onClick={() => switchTab('signup')}
          >
            Create Account
          </Button>
        </div>

        {success && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {tab === 'signup' && (
            <div className="space-y-2">
              <label htmlFor="login-org-id" className="text-sm font-medium text-foreground">
                Organization ID
              </label>
              <input
                id="login-org-id"
                type="number"
                value={orgId}
                onChange={(event) => setOrgId(event.target.value)}
                required
                min={1}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Organization IDs are provided during tenant onboarding.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button id="auth-submit-btn" type="submit" disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tab === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </section>
    </main>
  );
}
