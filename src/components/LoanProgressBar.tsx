import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
interface LoanProgressBarProps {
  status: string;
  className?: string;
}
const statusConfig = {
  draft: {
    progress: 20,
    label: 'Draft',
    color: 'hsl(215, 20%, 50%)' // slate-500
  },
  submitted: {
    progress: 40,
    label: 'Submitted',
    color: 'hsl(215, 25%, 40%)' // slate-600
  },
  under_review: {
    progress: 60,
    label: 'Under Review',
    color: 'hsl(38, 92%, 50%)' // amber-600
  },
  approved: {
    progress: 80,
    label: 'Approved',
    color: 'hsl(158, 64%, 52%)' // emerald-600
  },
  funded: {
    progress: 100,
    label: 'Funded',
    color: 'hsl(239, 84%, 67%)' // indigo-600
  },
  rejected: {
    progress: 0,
    label: 'Rejected',
    color: 'hsl(0, 84%, 60%)' // red-600
  }
};
export const LoanProgressBar = ({
  status,
  className
}: LoanProgressBarProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  const isRejected = status === 'rejected';
  return <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="uppercase tracking-wide font-semibold text-muted-foreground text-xs">Loan Progress</span>
        <span className={cn('font-semibold text-sm', isRejected ? 'text-red-700' : 'text-foreground')}>
          {config.label}
        </span>
      </div>
      
      {isRejected ? <div className="h-1.5 rounded-full bg-red-100 border border-red-200">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600 w-full" />
        </div> : <div className="relative">
          <Progress value={config.progress} className="h-1.5 bg-muted/50" />
          <style>
            {`
              [role="progressbar"] > div {
                background: linear-gradient(90deg, ${config.color}, ${config.color});
              }
            `}
          </style>
        </div>}
      
      <div className="flex justify-between text-xs text-muted-foreground font-medium">
        <span>Start</span>
        <span className="font-semibold">{isRejected ? 'Declined' : `${config.progress}%`}</span>
        <span>Complete</span>
      </div>
    </div>;
};