import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Users, Activity, Lock, UserX, Database, Clock, Zap } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { restQuery } from '@/services/supabaseHttp';
import { Badge } from '@/components/ui/badge';

const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(easeOutQuad * value);
      
      if (countRef.current !== currentCount) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [value, duration]);

  return <span>{count}</span>;
};

interface SecurityMetrics {
  recentLogins: number;
  failedAuthAttempts: number;
  activeAdmins: number;
  recentAdminActions: number;
  pendingApplications: number;
  databaseSize: number;
}

interface RecentEvent {
  type: string;
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export const SecurityOverview = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    recentLogins: 0,
    failedAuthAttempts: 0,
    activeAdmins: 0,
    recentAdminActions: 0,
    pendingApplications: 0,
    databaseSize: 0
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    if (!isAdmin()) return;

    const fetchSecurityMetrics = async () => {
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Get admin users count
        const adminParams = new URLSearchParams();
        adminParams.set('role', 'eq.admin');
        const { data: adminRoles } = await restQuery<any[]>('user_roles', { params: adminParams });

        // Get recent admin actions
        const actionParams = new URLSearchParams();
        actionParams.set('created_at', `gte.${yesterday.toISOString()}`);
        actionParams.set('order', 'created_at.desc');
        actionParams.set('limit', '5');
        const { data: adminActions } = await restQuery<any[]>('loan_application_status_history', { params: actionParams });

        // Get pending applications count
        const pendingParams = new URLSearchParams();
        pendingParams.set('status', 'in.(submitted,under_review)');
        pendingParams.set('select', 'id');
        const { data: pendingApps } = await restQuery<any[]>('loan_applications', { params: pendingParams });
        const pendingCount = pendingApps?.length || 0;

        // Get record counts
        const loansParams = new URLSearchParams();
        loansParams.set('select', 'id');
        const { data: loansData } = await restQuery<any[]>('loan_applications', { params: loansParams });
        const loansCount = loansData?.length || 0;

        const docsParams = new URLSearchParams();
        docsParams.set('select', 'id');
        const { data: docsData } = await restQuery<any[]>('borrower_documents', { params: docsParams });
        const docsCount = docsData?.length || 0;

        // Get recent notifications
        const notifParams = new URLSearchParams();
        notifParams.set('created_at', `gte.${yesterday.toISOString()}`);
        notifParams.set('order', 'created_at.desc');
        notifParams.set('limit', '5');
        const { data: notifications } = await restQuery<any[]>('notifications', { params: notifParams });

        // Parse recent events
        const events: RecentEvent[] = [];
        
        if (adminActions) {
          adminActions.forEach(action => {
            events.push({
              type: 'admin_action',
              message: `Application status changed to ${action.status}`,
              timestamp: new Date(action.created_at),
              severity: action.status === 'rejected' ? 'warning' : 'info'
            });
          });
        }

        if (notifications) {
          notifications.slice(0, 3).forEach(notif => {
            events.push({
              type: 'notification',
              message: notif.message,
              timestamp: new Date(notif.created_at),
              severity: notif.type === 'error' ? 'error' : 'info'
            });
          });
        }

        setRecentEvents(events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5));

        setMetrics({
          recentLogins: 0, // Would need auth.audit_log_entries access
          failedAuthAttempts: 0, // Would need auth logs
          activeAdmins: adminRoles?.length || 0,
          recentAdminActions: adminActions?.length || 0,
          pendingApplications: pendingCount || 0,
          databaseSize: ((loansCount || 0) + (docsCount || 0))
        });
      } catch (error) {
        console.error('Error fetching security metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin()) return null;

  const securityItems = [
    {
      label: 'Active Admins',
      value: metrics.activeAdmins,
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      label: 'Admin Actions (24h)',
      value: metrics.recentAdminActions,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      label: 'Pending Reviews',
      value: metrics.pendingApplications,
      gradient: 'from-orange-500 to-red-500'
    },
    {
      label: 'Total Records',
      value: metrics.databaseSize,
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  const getSeverityColor = (severity: RecentEvent['severity']) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="relative">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-lg opacity-50" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] rounded-lg" />
      
      <Card className="relative border-primary/20 shadow-lg shadow-primary/5 backdrop-blur-sm">
        <CardHeader className="border-b border-primary/10">
          <CardTitle className="flex items-center gap-3">
            <div className="relative">
              <Shield className="h-6 w-6 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-bold">
              SECURITY & SYSTEM OVERVIEW
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* High-tech Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {securityItems.map((item, index) => {
                  return (
                    <div
                      key={item.label}
                      className="group relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-lg blur-xl`} />
                      
                      {/* Border gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-20 rounded-lg`} />
                      <div className="absolute inset-[1px] bg-background rounded-lg" />
                      
                      {/* Content */}
                      <div className="relative p-5 flex flex-col items-center text-center space-y-3">
                        {/* Animated counter */}
                        <div className="space-y-1">
                          <p className="text-3xl font-bold text-black tabular-nums">
                            <AnimatedCounter value={item.value} />
                          </p>
                          <p className="text-xs text-black uppercase tracking-wider font-medium">
                            {item.label}
                          </p>
                        </div>
                        
                        {/* Scan line effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activity Feed */}
              {recentEvents.length > 0 && (
                <div className="relative">
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-primary/20">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-black">
                      Live Activity Feed
                    </h4>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_currentColor]" />
                      <span className="text-xs text-black">ACTIVE</span>
                    </div>
                  </div>
                  
                  {/* Activity list */}
                  <div className="space-y-2">
                    {recentEvents.map((event, index) => (
                      <div
                        key={index}
                        className="group relative overflow-hidden rounded-lg border border-primary/10 bg-gradient-to-r from-background via-primary/5 to-background hover:border-primary/30 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {/* Animated border glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative flex items-start justify-between p-4">
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm text-black font-medium truncate">
                              {event.message}
                            </p>
                            <p className="text-xs text-black font-mono">
                              {event.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <Badge 
                            variant={getSeverityColor(event.severity)} 
                            className="ml-3 flex-shrink-0 shadow-sm"
                          >
                            {event.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        {/* Scan line */}
                        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
