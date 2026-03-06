import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { getAuthDiagnostics, type AuthDiagnostics } from '@/services/auth/appIdAuthProvider';

const AuthDiagnosticsPanel = () => {
  const [diag, setDiag] = useState<AuthDiagnostics | null>(null);

  const refresh = useCallback(() => {
    setDiag(getAuthDiagnostics());
  }, []);

  const endpointLabel = (url: string) => {
    if (url.includes('codeengine.appdomain.cloud')) return 'IBM Code Engine';
    if (url.includes('supabase.co/functions')) return 'Supabase Edge';
    return new URL(url).hostname;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Auth Diagnostics
        </CardTitle>
        <Button size="sm" variant="outline" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!diag && (
          <p className="text-sm text-muted-foreground">
            Press "Refresh" to load auth endpoint diagnostics.
          </p>
        )}

        {diag && (
          <>
            {/* Active endpoint */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Endpoint</p>
              {diag.activeEndpoint ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <code className="text-xs bg-muted px-2 py-1 rounded break-all">{diag.activeEndpoint}</code>
                  <Badge variant="default" className="text-[10px]">{endpointLabel(diag.activeEndpoint)}</Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">No successful endpoint yet</span>
                </div>
              )}
            </div>

            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3 text-center">
                <p className="text-lg font-semibold">{diag.totalCalls}</p>
                <p className="text-[11px] text-muted-foreground">Total Calls</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-lg font-semibold">{diag.failoverAttempts}</p>
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> Failovers
                </p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className={`text-lg font-semibold ${diag.totalFailures > 0 ? 'text-destructive' : ''}`}>
                  {diag.totalFailures}
                </p>
                <p className="text-[11px] text-muted-foreground">Total Failures</p>
              </div>
            </div>

            {/* Last error */}
            {diag.lastError && (
              <div className="text-sm bg-destructive/10 text-destructive rounded-md p-3 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  Last Error
                </div>
                <p className="text-xs break-all">{diag.lastError}</p>
                {diag.lastErrorTime && (
                  <p className="text-[10px] opacity-70">{new Date(diag.lastErrorTime).toLocaleString()}</p>
                )}
              </div>
            )}

            {/* Last successful action */}
            {diag.lastAction && (
              <p className="text-xs text-muted-foreground">
                Last action: <strong>{diag.lastAction}</strong>
                {diag.lastActionTime && ` at ${new Date(diag.lastActionTime).toLocaleString()}`}
              </p>
            )}

            {/* Per-endpoint stats */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Endpoint Stats</p>
              <div className="space-y-2">
                {diag.configuredEndpoints.map((ep) => {
                  const s = diag.endpointStats[ep] || { attempts: 0, successes: 0, failures: 0 };
                  return (
                    <div key={ep} className="flex items-center gap-2 rounded-md border p-2 text-xs">
                      <Badge variant="outline" className="text-[10px] shrink-0">{endpointLabel(ep)}</Badge>
                      <span className="text-muted-foreground truncate flex-1" title={ep}>{ep}</span>
                      <span className="text-green-600 shrink-0">{s.successes}✓</span>
                      <span className="text-destructive shrink-0">{s.failures}✗</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthDiagnosticsPanel;
