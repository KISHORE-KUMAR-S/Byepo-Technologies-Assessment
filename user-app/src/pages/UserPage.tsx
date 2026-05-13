import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getOrgs, checkFlag } from '@/lib/api';
import type { Org } from '@/lib/api';

export default function UserPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState('');
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
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Feature Flag Checker</CardTitle>
          <CardDescription>Check if a feature is enabled for your organization.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Organization</Label>
              <Select value={orgId} onValueChange={v => { setOrgId(v); setResult(null); }} required>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="feature-key">Feature Key</Label>
              <Input
                id="feature-key"
                type="text"
                value={featureKey}
                onChange={e => { setFeatureKey(e.target.value); setResult(null); }}
                placeholder="e.g. dark_mode"
                required
                className="font-mono"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={!orgId || !featureKey.trim()} className="w-full">
              Check
            </Button>
          </form>

          {result && (
            <div className={`rounded-lg border p-4 ${result.is_enabled ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30' : 'border-border bg-muted/40'}`}>
              <p className={`font-semibold ${result.is_enabled ? 'text-green-800 dark:text-green-400' : 'text-muted-foreground'}`}>
                {!result.found
                  ? 'Feature not found for this organization'
                  : result.is_enabled
                  ? '✓ Feature is ENABLED'
                  : '✗ Feature is DISABLED'}
              </p>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{featureKey}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
