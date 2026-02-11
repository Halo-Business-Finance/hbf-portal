import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { restQuery } from '@/services/supabaseHttp';
import { Shield, AlertTriangle, Info, User, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  details: Record<string, unknown> | null;
}

export const SecurityAuditLog: React.FC = () => {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (isAdmin()) {
      fetchAuditEvents();
    }
  }, [isAdmin]);

  const fetchAuditEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('order', 'created_at.desc');
      params.set('limit', '50');
      const { data } = await restQuery<AuditEvent[]>('audit_logs', { params });
      setAuditEvents(data || []);
    } catch (err) {
      console.error('Error fetching audit events:', err);
      setError('Failed to load audit events');
      setAuditEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
      case 'mfa_verify':
        return <User className="w-4 h-4" />;
      case 'create_application':
      case 'update_application':
      case 'submit_application':
        return <FileText className="w-4 h-4" />;
      case 'access_denied':
      case 'failed_login':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getEventSeverity = (action: string): "destructive" | "default" | "secondary" => {
    if (action.includes('denied') || action.includes('failed')) {
      return 'destructive';
    }
    if (action.includes('admin') || action.includes('role') || action.includes('mfa')) {
      return 'default';
    }
    return 'secondary';
  };

  if (!isAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading audit events...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Audit Log
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={fetchAuditEvents}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        {!error && auditEvents.length === 0 ? (
          <div className="text-center py-4">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No audit events found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Events will appear here as users perform actions
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {auditEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-0.5">
                  {getEventIcon(event.action)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.action.replace(/_/g, ' ')}</span>
                    <Badge variant={getEventSeverity(event.action)} className="text-xs">
                      {event.resource_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    User: {event.user_id.slice(0, 8)}... • 
                    {event.ip_address && ` IP: ${event.ip_address} •`}
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  {event.details && Object.keys(event.details).length > 0 && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      {JSON.stringify(event.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
