import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { Check, Circle, X, Clock } from 'lucide-react';
import { restQuery } from '@/services/supabaseHttp';
import { cn } from '@/lib/utils';

interface StatusHistoryItem {
  id: string;
  status: string;
  changed_at: string;
  notes: string | null;
}

interface LoanTimelineProps {
  loanApplicationId: string;
  currentStatus: string;
}

const statusConfig = {
  draft: {
    label: 'Draft Created',
    icon: Circle,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-300',
  },
  submitted: {
    label: 'Application Submitted',
    icon: Check,
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-400',
  },
  under_review: {
    label: 'Under Review',
    icon: Clock,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
  },
  approved: {
    label: 'Approved',
    icon: Check,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-400',
  },
  funded: {
    label: 'Funded',
    icon: Check,
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-400',
  },
  rejected: {
    label: 'Application Declined',
    icon: X,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-400',
  },
};

export const LoanTimeline = ({ loanApplicationId, currentStatus }: LoanTimelineProps) => {
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params = new URLSearchParams();
        params.set('loan_application_id', `eq.${loanApplicationId}`);
        params.set('order', 'changed_at.asc');
        const { data } = await restQuery<StatusHistoryItem[]>('loan_application_status_history', { params });
        setHistory(data || []);
      } catch (error) {
        console.error('Error fetching status history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Poll for updates every 30s instead of realtime subscription
    pollRef.current = setInterval(fetchHistory, 30000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loanApplicationId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        No status history available yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold uppercase tracking-wide mb-4 text-muted-foreground">Application Timeline</h4>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px border-l border-dashed border-border/50" />
        <div className="space-y-6">
          {history.map((item, index) => {
            const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.draft;
            const Icon = config.icon;
            const isLast = index === history.length - 1;
            const isCurrent = item.status === currentStatus;

            return (
              <div key={item.id} className="relative flex gap-4">
                <div
                  className={cn(
                    'relative z-10 flex items-center justify-center w-9 h-9 rounded-full border-2',
                    config.borderColor,
                    config.bgColor,
                    isCurrent && 'ring-2 ring-offset-2 ring-offset-background ring-border shadow-sm',
                  )}
                >
                  <Icon className={cn('w-4 h-4', config.color)} />
                </div>
                <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h5
                        className={cn(
                          'text-sm font-semibold',
                          isCurrent ? config.color : 'text-slate-700'
                        )}
                      >
                        {config.label}
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">
                        {format(new Date(item.changed_at), 'MMM d, yyyy • h:mm a')}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic bg-muted/30 p-2 rounded border border-border/50">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
