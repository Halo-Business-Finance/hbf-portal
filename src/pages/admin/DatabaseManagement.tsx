import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { ibmDatabaseService } from '@/services/ibmDatabaseService';
import {
  Database, HardDrive, Play, RefreshCw, Table2, AlertTriangle, CheckCircle2, XCircle, Loader2, ShieldAlert,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface DbStatus {
  status: string;
  host: string;
  port: string;
  database: string;
  ssl: string;
  postgresVersion: string;
}

interface DbTable {
  table_name: string;
  table_type: string;
}

const WRITE_PREFIXES = ['INSERT', 'UPDATE', 'DELETE'];

function isWriteQuery(sql: string): boolean {
  const upper = sql.trim().toUpperCase();
  return WRITE_PREFIXES.some((p) => upper.startsWith(p));
}

const DatabaseManagement = () => {
  const { isSuperAdmin, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();

  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [tables, setTables] = useState<DbTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[] | null>(null);
  const [queryRowCount, setQueryRowCount] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingMutation, setPendingMutation] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await ibmDatabaseService.getStatus();
      setDbStatus(data);
    } catch (err: unknown) {
      setStatusError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    setTablesLoading(true);
    try {
      const data = await ibmDatabaseService.getTables();
      setTables(data.tables ?? []);
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to fetch tables', variant: 'destructive' });
    } finally {
      setTablesLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!roleLoading && isAdmin()) {
      fetchStatus();
      fetchTables();
    }
  }, [roleLoading, isAdmin, fetchStatus, fetchTables]);

  const executeQuery = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (isWriteQuery(trimmed)) {
      if (!isSuperAdmin()) {
        toast({ title: 'Access Denied', description: 'Write operations require super_admin privileges.', variant: 'destructive' });
        return;
      }
      setPendingMutation(trimmed);
      setConfirmOpen(true);
      return;
    }

    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setQueryRowCount(null);
    try {
      const data = await ibmDatabaseService.executeQuery(trimmed);
      setQueryResult(data.rows ?? []);
      setQueryRowCount(data.rowCount ?? 0);
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setQueryLoading(false);
    }
  };

  const confirmMutation = async () => {
    if (!pendingMutation) return;
    setConfirmOpen(false);
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setQueryRowCount(null);
    try {
      const data = await ibmDatabaseService.executeMutation(pendingMutation);
      setQueryResult(data.rows ?? []);
      setQueryRowCount(data.rowCount ?? 0);
      toast({ title: 'Write Executed', description: `${data.rowCount ?? 0} row(s) affected.` });
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : 'Mutation failed');
    } finally {
      setQueryLoading(false);
      setPendingMutation(null);
    }
  };

  const resultColumns = queryResult?.length ? Object.keys(queryResult[0]) : [];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Database Management" subtitle="IBM PostgreSQL — Monitor, query, and manage your database" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6 pb-12">
        {/* Connection Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5" />
                Connection Status
              </CardTitle>
              <CardDescription>IBM PostgreSQL connectivity</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStatus} disabled={statusLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {statusLoading && !dbStatus && (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Connecting…</div>
            )}
            {statusError && (
              <div className="flex items-center gap-2 text-destructive"><XCircle className="w-4 h-4" /> {statusError}</div>
            )}
            {dbStatus && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center gap-1 mt-1 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Connected
                  </div>
                </div>
                <div><span className="text-muted-foreground">Host</span><div className="mt-1 font-mono text-xs">{dbStatus.host}</div></div>
                <div><span className="text-muted-foreground">Database</span><div className="mt-1 font-mono text-xs">{dbStatus.database}</div></div>
                <div><span className="text-muted-foreground">Port</span><div className="mt-1 font-mono text-xs">{dbStatus.port}</div></div>
                <div><span className="text-muted-foreground">SSL</span><div className="mt-1"><Badge variant="secondary">{dbStatus.ssl}</Badge></div></div>
                <div><span className="text-muted-foreground">Version</span><div className="mt-1 font-mono text-xs truncate">{dbStatus.postgresVersion}</div></div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tables List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Table2 className="w-5 h-5" />
                Tables
              </CardTitle>
              <CardDescription>{tables.length} table(s) in public schema</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTables} disabled={tablesLoading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${tablesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {tablesLoading && !tables.length && (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading tables…</div>
            )}
            {tables.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tables.map((t) => (
                  <Badge key={t.table_name} variant="outline" className="font-mono text-xs cursor-pointer hover:bg-accent"
                    onClick={() => setQuery(`SELECT * FROM ${t.table_name} LIMIT 25`)}
                  >
                    {t.table_name}
                    {t.table_type === 'VIEW' && <span className="ml-1 text-muted-foreground">(view)</span>}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Query Editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5" />
              SQL Query Editor
            </CardTitle>
            <CardDescription>
              Execute read queries (SELECT). {isSuperAdmin() ? 'Write operations (INSERT/UPDATE/DELETE) require confirmation.' : 'Write operations require super_admin role.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM loan_applications LIMIT 10"
              className="font-mono text-sm min-h-[120px] resize-y"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  executeQuery();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">⌘ + Enter to execute</span>
              <Button onClick={executeQuery} disabled={queryLoading || !query.trim()}>
                {queryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Execute
              </Button>
            </div>

            {queryError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-mono text-xs break-all">{queryError}</span>
              </div>
            )}

            {queryResult !== null && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{queryRowCount} row(s) returned</div>
                {resultColumns.length > 0 ? (
                  <div className="rounded-md border overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {resultColumns.map((col) => (
                            <TableHead key={col} className="font-mono text-xs whitespace-nowrap">{col}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queryResult.map((row, i) => (
                          <TableRow key={i}>
                            {resultColumns.map((col) => (
                              <TableCell key={col} className="font-mono text-xs max-w-[300px] truncate">
                                {row[col] === null ? <span className="text-muted-foreground italic">null</span> : String(row[col])}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Query executed successfully. No rows to display.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Write Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Confirm Write Operation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 p-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0" />
                  <span className="text-sm">This will modify data in the IBM production database. This action is audited and cannot be undone easily.</span>
                </div>
                <div className="rounded-md bg-muted p-3">
                  <div className="text-xs text-muted-foreground mb-1">SQL Statement:</div>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all">{pendingMutation}</pre>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMutation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Execute Write
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DatabaseManagement;
