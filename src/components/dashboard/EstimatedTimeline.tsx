import { Calendar, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface TimelineStage {
  id: string;
  name: string;
  duration: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
}
interface EstimatedTimelineProps {
  loanType?: string;
  currentStatus?: string;
  className?: string;
}
export const EstimatedTimeline = ({
  loanType = 'standard',
  currentStatus = 'draft',
  className
}: EstimatedTimelineProps) => {
  const getTimelineForLoanType = (): TimelineStage[] => {
    const statusIndex: Record<string, number> = {
      'draft': 0,
      'submitted': 1,
      'under_review': 2,
      'approved': 3,
      'funded': 4
    };
    const currentIndex = statusIndex[currentStatus] ?? 0;
    const stages: TimelineStage[] = [{
      id: 'application',
      name: 'Application',
      duration: '1-2 days',
      description: 'Complete and submit your application',
      status: currentIndex > 0 ? 'completed' : 'current'
    }, {
      id: 'review',
      name: 'Initial Review',
      duration: '2-3 days',
      description: 'Our team reviews your application',
      status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming'
    }, {
      id: 'underwriting',
      name: 'Underwriting',
      duration: '5-7 days',
      description: 'Detailed financial analysis',
      status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming'
    }, {
      id: 'approval',
      name: 'Approval',
      duration: '1-2 days',
      description: 'Final approval decision',
      status: currentIndex > 3 ? 'completed' : currentIndex === 3 ? 'current' : 'upcoming'
    }, {
      id: 'funding',
      name: 'Funding',
      duration: '2-5 days',
      description: 'Funds disbursed to your account',
      status: currentIndex >= 4 ? 'completed' : 'upcoming'
    }];
    return stages;
  };
  const stages = getTimelineForLoanType();
  const totalDaysMin = 11;
  const totalDaysMax = 19;
  const currentStage = stages.find(s => s.status === 'current');
  const completedStages = stages.filter(s => s.status === 'completed').length;
  return <Card className={cn("border border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Estimated Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-lg mb-4 bg-secondary">
          <div>
            <p className="text-sm font-medium text-card-foreground">Total Estimated Time</p>
            <p className="text-xs text-muted-foreground">From application to funding</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{totalDaysMin}-{totalDaysMax} days</p>
            <p className="text-xs text-muted-foreground">Business days</p>
          </div>
        </div>

        {/* Current stage highlight */}
        {currentStage && <div className="p-3 border border-primary/30 rounded-lg mb-4 bg-primary/5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Current Stage</span>
            </div>
            <p className="font-semibold text-card-foreground">{currentStage.name}</p>
            <p className="text-xs text-muted-foreground">{currentStage.description}</p>
          </div>}

        {/* Timeline stages */}
        <div className="space-y-3">
          {stages.map((stage, index) => <div key={stage.id} className={cn("flex items-center gap-3", stage.status === 'upcoming' && "opacity-50")}>
              {/* Status indicator */}
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-medium", stage.status === 'completed' && "bg-green-500 text-white", stage.status === 'current' && "bg-primary text-primary-foreground ring-2 ring-primary/30", stage.status === 'upcoming' && "bg-muted text-muted-foreground")}>
                {stage.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-card-foreground", stage.status === 'current' && "text-primary")}>
                  {stage.name}
                </p>
              </div>

              {/* Duration */}
              <div className="text-right shrink-0">
                <p className={cn("text-sm font-medium", stage.status === 'completed' ? "text-green-600" : "text-muted-foreground")}>
                  {stage.duration}
                </p>
              </div>

              {/* Arrow to next stage */}
              {index < stages.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground/50 hidden sm:block" />}
            </div>)}
        </div>

        {/* Progress note */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {completedStages === 0 ? "Submit your application to start the process" : completedStages === stages.length ? "🎉 Congratulations! Your loan has been funded!" : `${completedStages} of ${stages.length} stages completed`}
          </p>
        </div>
      </CardContent>
    </Card>;
};