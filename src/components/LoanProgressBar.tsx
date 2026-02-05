import { cn } from '@/lib/utils';
import { Calendar, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface LoanProgressBarProps {
  status: string;
  className?: string;
  startDate?: string | null;
}
const stages = [{
  key: 'submitted',
  label: 'Loan Submitted',
  description: 'Your application has been received and is awaiting initial review.',
  timeframe: 'Typically 1-2 business days',
  minDays: 1,
  maxDays: 2
}, {
  key: 'processing',
  label: 'Loan Processing',
  description: 'Our team is verifying your documents and gathering necessary information.',
  timeframe: 'Typically 3-5 business days',
  minDays: 3,
  maxDays: 5
}, {
  key: 'underwriting',
  label: 'Loan Underwriting',
  description: 'A detailed analysis of your financials and risk assessment is in progress.',
  timeframe: 'Typically 5-10 business days',
  minDays: 5,
  maxDays: 10
}, {
  key: 'closing',
  label: 'Loan Closing',
  description: 'Final documents are being prepared for your signature and funding approval.',
  timeframe: 'Typically 3-7 business days',
  minDays: 3,
  maxDays: 7
}, {
  key: 'funded',
  label: 'Loan Funded',
  description: 'Congratulations! Your loan has been funded and disbursed.',
  timeframe: 'Funds available within 1-3 business days',
  minDays: 1,
  maxDays: 3
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
const calculateEstimatedDate = (startDate: string, stageIndex: number): {
  min: Date;
  max: Date;
} => {
  const start = new Date(startDate);

  // Sum up days from all previous stages plus current stage
  let totalMinDays = 0;
  let totalMaxDays = 0;
  for (let i = 0; i <= stageIndex; i++) {
    totalMinDays += stages[i].minDays;
    totalMaxDays += stages[i].maxDays;
  }
  const minDate = new Date(start);
  minDate.setDate(minDate.getDate() + totalMinDays);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + totalMaxDays);
  return {
    min: minDate,
    max: maxDate
  };
};
const formatDateRange = (min: Date, max: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };
  const minStr = min.toLocaleDateString('en-US', options);
  const maxStr = max.toLocaleDateString('en-US', options);
  if (minStr === maxStr) {
    return minStr;
  }
  return `${minStr} - ${maxStr}`;
};
export const LoanProgressBar = ({
  status,
  className,
  startDate
}: LoanProgressBarProps) => {
  const currentStageIndex = getStageIndex(status);
  const isRejected = status === 'rejected';
  const isPaused = status === 'paused';
  const isDraft = status === 'draft';
  const isFunded = status === 'funded';

  // Calculate estimated completion for current stage
  const estimatedDates = startDate && currentStageIndex >= 0 && !isFunded ? calculateEstimatedDate(startDate, currentStageIndex) : null;
  return <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
        <span className="uppercase tracking-wide font-semibold text-muted-foreground text-xs whitespace-nowrap">
          Loan Progress
        </span>
        
        {/* Estimated completion indicator */}
        {estimatedDates && !isRejected && !isPaused && <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted/50 text-foreground w-fit">
            <Clock className="w-3 h-3" />
            <span className="font-medium whitespace-nowrap">
              Est. completion: {formatDateRange(estimatedDates.min, estimatedDates.max)}
            </span>
          </div>}
        
        {isFunded && <div className="flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">Completed</span>
          </div>}
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

      <TooltipProvider>
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          {stages.map((stage, index) => {
          const isCompleted = index <= currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const stageEstimate = startDate ? calculateEstimatedDate(startDate, index) : null;
          return <Tooltip key={stage.key}>
                <TooltipTrigger asChild>
                  <span className={cn("text-center flex-1 cursor-help text-black", isCompleted && 'text-primary font-semibold', isCurrent && 'text-primary font-bold', !isCompleted && !isCurrent && 'text-muted-foreground')}>
                    {stage.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-center">
                  <p className="font-medium">{stage.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stage.timeframe}</p>
                  {stageEstimate && <p className="text-xs text-primary mt-1 font-medium">
                      Target: {formatDateRange(stageEstimate.min, stageEstimate.max)}
                    </p>}
                </TooltipContent>
              </Tooltip>;
        })}
        </div>
      </TooltipProvider>
    </div>;
};