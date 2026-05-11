import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings, Plus, Trash2, ArrowLeft, LogOut,
  Loader2, RefreshCw, ToggleLeft, ToggleRight, Key, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  adminCreateFlag,
  adminDeleteFlag,
  adminGetFlags,
  adminToggleFlag,
  getApiErrorMessage,
  getApiStatus,
  type FeatureFlag,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { token, orgId, logout } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newEnabled, setNewEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');

  const loadFlags = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await adminGetFlags(token);
      setFlags(data);
    } catch (err: unknown) {
      if (getApiStatus(err) === 401) {
        logout('org_admin');
        navigate('/login');
      } else {
        setError(getApiErrorMessage(err, 'Failed to load feature flags.'));
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
    loadFlags();
  }, [token, loadFlags, navigate]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !token) return;
    setCreating(true);
    setCreateError('');
    try {
      await adminCreateFlag(newKey.trim().toLowerCase(), newEnabled, token);
      setNewKey('');
      setNewEnabled(false);
      loadFlags();
    } catch (err: unknown) {
      setCreateError(getApiErrorMessage(err, 'Failed to create flag.'));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    if (!token) return;
    setTogglingId(flag.id);
    try {
      await adminToggleFlag(flag.id, !flag.is_enabled, token);
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f))
      );
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update flag.'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await adminDeleteFlag(id, token);
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to delete flag.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout('org_admin');
    navigate('/login');
  };

  const enabledCount = flags.filter((f) => f.is_enabled).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Customer Workspace</span>
              {orgId && (
                <span className="text-xs text-muted-foreground ml-2">Org #{orgId}</span>
              )}
            </div>
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
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Flags', value: flags.length, color: 'text-blue-600' },
            { label: 'Enabled', value: enabledCount, color: 'text-emerald-600' },
            { label: 'Disabled', value: flags.length - enabledCount, color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Create form */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> New Feature Flag
          </h2>
          <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                id="flag-key-input"
                type="text"
                placeholder="feature_key (e.g. dark_mode)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            {/* Initial state toggle */}
            <button
              type="button"
              onClick={() => setNewEnabled((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                newEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400'
                  : 'bg-muted border-input text-muted-foreground'
              }`}
            >
              {newEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {newEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <Button
              id="create-flag-btn"
              type="submit"
              disabled={creating || !newKey.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Flag'}
            </Button>
          </form>
          {createError && (
            <p className="text-destructive text-sm mt-3">{createError}</p>
          )}
        </div>

        {/* Flags table */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Feature Flags{' '}
              <span className="text-muted-foreground font-normal text-sm">({flags.length})</span>
            </h2>
            <button
              onClick={loadFlags}
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
          ) : flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Key className="w-10 h-10 opacity-30" />
              <p className="text-sm">No feature flags yet. Create one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Feature Key</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-6 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flags.map((flag) => (
                    <tr key={flag.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <code className="font-mono text-sm text-foreground bg-muted px-2 py-0.5 rounded">
                          {flag.feature_key}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            flag.is_enabled
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${flag.is_enabled ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                          {flag.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(flag.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(flag)}
                            disabled={togglingId === flag.id}
                            className={`gap-1.5 rounded-lg text-xs ${
                              flag.is_enabled
                                ? 'text-muted-foreground hover:text-foreground'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                          >
                            {togglingId === flag.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : flag.is_enabled ? (
                              <><ToggleRight className="w-4 h-4" /> Disable</>
                            ) : (
                              <><ToggleLeft className="w-4 h-4" /> Enable</>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(flag.id)}
                            disabled={deletingId === flag.id}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            {deletingId === flag.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
