import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Building2, Plus, Trash2, ArrowLeft, LogOut,
  Loader2, RefreshCw, Calendar, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getApiErrorMessage,
  getApiStatus,
  saCreateOrg,
  saDeleteOrg,
  saGetOrgs,
  type Organization,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');

  const loadOrgs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await saGetOrgs(token);
      setOrgs(data);
    } catch (err: unknown) {
      if (getApiStatus(err) === 401) {
        logout('super_admin');
        navigate('/login');
      } else {
        setError(getApiErrorMessage(err, 'Failed to load organizations.'));
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrgs();
  }, [token, loadOrgs, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !token) return;
    setCreating(true);
    setCreateError('');
    try {
      await saCreateOrg(orgName.trim(), token);
      setOrgName('');
      loadOrgs();
    } catch (err: unknown) {
      setCreateError(getApiErrorMessage(err, 'Failed to create organization.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await saDeleteOrg(id, token);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete organization.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout('super_admin');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">Super Admin</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2"
          >
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
          <p className="text-muted-foreground mt-1">Create and manage tenant organizations</p>
        </div>

        {/* Create form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-600" /> New Organization
          </h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <div className="relative flex-1">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="org-name-input"
                type="text"
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-violet-500 transition"
              />
            </div>
            <Button
              id="create-org-btn"
              type="submit"
              disabled={creating || !orgName.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </form>
          {createError && (
            <p className="text-destructive text-sm mt-3">{createError}</p>
          )}
        </div>

        {/* Org list */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              All Organizations{' '}
              <span className="text-muted-foreground font-normal text-sm">({orgs.length})</span>
            </h2>
            <button
              onClick={loadOrgs}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-6 py-3">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : orgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Building2 className="w-10 h-10 opacity-30" />
              <p className="text-sm">No organizations yet. Create one above.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{org.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" /> ID: {org.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(org.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(org.id)}
                    disabled={deletingId === org.id}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    {deletingId === org.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
