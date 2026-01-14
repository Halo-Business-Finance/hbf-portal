import { CheckCircle, Circle, Clock, FileText, Search, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: React.ElementType;
}
interface ApplicationProgressTrackerProps {
  currentStatus?: string;
  className?: string;
}
export const ApplicationProgressTracker = ({
  currentStatus = 'draft',
  className
}: ApplicationProgressTrackerProps) => {
  const getSteps = (): ProgressStep[] => {
    const statusMap: Record<string, number> = {
      'draft': 0,
      'submitted': 1,
      'under_review': 2,
      'approved': 3,
      'funded': 4,
      'rejected': -1
    };
    const currentIndex = statusMap[currentStatus] ?? 0;
    return [{
      id: 'start',
      title: 'Application Started',
      description: 'Begin your loan application',
      status: currentIndex >= 0 ? 'completed' : 'upcoming',
      icon: FileText
    }, {
      id: 'submitted',
      title: 'Application Submitted',
      description: 'Documents uploaded and submitted',
      status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'upcoming',
      icon: CheckCircle
    }, {
      id: 'review',
      title: 'Under Review',
      description: 'Our team is reviewing your application',
      status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'upcoming',
      icon: Search
    }, {
      id: 'approved',
      title: 'Approved',
      description: 'Your loan has been approved',
      status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'upcoming',
      icon: CheckCircle
    }, {
      id: 'funded',
      title: 'Funded',
      description: 'Funds have been disbursed',
      status: currentIndex >= 4 ? 'completed' : currentIndex === 3 ? 'current' : 'upcoming',
      icon: DollarSign
    }];
  };
  const steps = getSteps();
  return <Card className={cn("overflow-hidden border border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
          <Clock className="h-5 w-5 text-primary" />
          Application Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          
          <div className="space-y-4">
            {steps.map((step, index) => {
            const Icon = step.icon;
            return <div key={step.id} className={cn("relative flex items-start gap-4 pl-10 transition-all duration-300", step.status === 'current' && "scale-[1.02]")}>
                  {/* Step indicator */}
                  <div className={cn("absolute left-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300", step.status === 'completed' && "bg-green-500 text-white", step.status === 'current' && "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse", step.status === 'upcoming' && "bg-muted text-muted-foreground")}>
                    {step.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>

                  {/* Step content */}
                  <div className={cn("flex-1 pb-4", step.status === 'upcoming' && "opacity-50")}>
                    <p className={cn("font-medium text-sm text-card-foreground", step.status === 'current' && "text-primary")}>
                      {step.title}
                    </p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </CardContent>
    </Card>;
};