import { cn } from '@/lib/utils';
interface LoanProgressBarProps {
  status: string;
  className?: string;
}
const stages = [{
  key: 'submitted',
  label: 'Submitted'
}, {
  key: 'processing',
  label: 'Loan Processing'
}, {
  key: 'underwriting',
  label: 'Underwriting'
}, {
  key: 'closing',
  label: 'Closing'
}, {
  key: 'funded',
  label: 'Funded'
}];
const getStageIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    draft: -1,
    submitted: 0,
    under_review: 1,
    approved: 3,
    funded: 4,
    paused: -1,
    rejected: -1
  };
  return statusMap[status] ?? -1;
};
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Not Submitted',
    submitted: 'Loan Submitted',
    under_review: 'Loan Processing',
    approved: 'Loan Closing',
    funded: 'Loan Funded',
    paused: 'Paused',
    rejected: 'Application Declined'
  };
  return labels[status] || 'Unknown';
};
export const LoanProgressBar = ({
  status,
  className
}: LoanProgressBarProps) => {
  const currentStageIndex = getStageIndex(status);
  const isRejected = status === 'rejected';
  const isPaused = status === 'paused';
  const isDraft = status === 'draft';
  return <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="uppercase tracking-wide font-semibold text-muted-foreground text-xs">
          Loan Progress
        </span>
        
      </div>

      {isRejected ? <div className="h-1.5 rounded-full bg-red-100 border border-red-200">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 w-full" />
        </div> : <div className="flex items-center gap-1">
          {stages.map((stage, index) => {
        const isCompleted = index <= currentStageIndex;
        const isCurrent = index === currentStageIndex;
        return <div key={stage.key} className={cn('flex-1 h-2 rounded-full transition-all duration-300', isCompleted ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-muted/50', isCurrent && 'ring-2 ring-primary/30')} />;
      })}
        </div>}

      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        {stages.map((stage, index) => {
        const isCompleted = index <= currentStageIndex;
        const isCurrent = index === currentStageIndex;
        return <span key={stage.key} className={cn('text-center flex-1', isCompleted && 'text-primary font-semibold', isCurrent && 'text-primary font-bold', !isCompleted && !isCurrent && 'text-muted-foreground')}>
              {stage.label}
            </span>;
      })}
      </div>
    </div>;
};