import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { functionUrl, IBM_FUNCTIONS_URL } from '@/config/supabase';
import { Activity, RefreshCw, Database, Server, Clock } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, string>;
  version?: string;
  responseTimeMs?: number;
}

const statusColor = (s: string) => {
  if (s === 'healthy' || s === 'connected') return 'default';
  if (s === 'degraded') return 'secondary';
  return 'destructive';
};

const HealthCheckPanel = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = functionUrl('health-check');
      const res = await fetch(url);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Non-JSON response (${res.status})`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5" />
          IBM Runtime Health
        </CardTitle>
        <Button size="sm" variant="outline" onClick={checkHealth} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking…' : 'Check Now'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {!health && !error && (
          <p className="text-sm text-muted-foreground">
            Press "Check Now" to ping the IBM API at{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">
              {IBM_FUNCTIONS_URL || 'Supabase (no IBM URL set)'}
            </code>
          </p>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
            <strong>Error:</strong> {error}
          </div>
        )}

        {health && (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={statusColor(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
              {health.responseTimeMs != null && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {health.responseTimeMs}ms
                </span>
              )}
              {health.version && (
                <span className="text-xs text-muted-foreground">v{health.version}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {Object.entries(health.services).map(([name, status]) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  {name === 'database' ? (
                    <Database className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Server className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="capitalize">{name}</span>
                  <Badge variant={statusColor(status)} className="ml-auto text-xs">
                    {status}
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Checked: {new Date(health.timestamp).toLocaleString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthCheckPanel;
