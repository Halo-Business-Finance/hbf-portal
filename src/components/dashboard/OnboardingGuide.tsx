import { useState, useEffect } from "react";
import { X, ChevronRight, CheckCircle, FileText, CreditCard, Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: string;
  completed: boolean;
}
interface OnboardingGuideProps {
  userId?: string;
  onDismiss?: () => void;
  className?: string;
}
export const OnboardingGuide = ({
  userId,
  onDismiss,
  className
}: OnboardingGuideProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>([{
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your business information',
    icon: FileText,
    action: '/borrower-portal',
    completed: false
  }, {
    id: 'credit',
    title: 'Link Credit Report',
    description: 'Connect your credit bureau',
    icon: CreditCard,
    action: '/credit-reports',
    completed: false
  }, {
    id: 'bank',
    title: 'Connect Bank Account',
    description: 'Link your business bank account',
    icon: Building2,
    action: '/bank-accounts',
    completed: false
  }, {
    id: 'documents',
    title: 'Upload Documents',
    description: 'Submit required business documents',
    icon: Upload,
    action: '/my-documents',
    completed: false
  }]);
  useEffect(() => {
    // Check if user has dismissed onboarding
    const dismissed = localStorage.getItem(`onboarding-dismissed-${userId}`);
    const isNewUser = !localStorage.getItem(`returning-user-${userId}`);
    if (!dismissed && isNewUser) {
      setIsVisible(true);
    }

    // Mark as returning user after first visit
    if (userId) {
      localStorage.setItem(`returning-user-${userId}`, 'true');
    }
  }, [userId]);
  const handleDismiss = () => {
    setIsVisible(false);
    if (userId) {
      localStorage.setItem(`onboarding-dismissed-${userId}`, 'true');
    }
    onDismiss?.();
  };
  const completedCount = steps.filter(s => s.completed).length;
  const progress = completedCount / steps.length * 100;
  if (!isVisible) return null;
  return <Card className={cn("border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 animate-fade-in", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Welcome! Let's get you started 🎉
            </h3>
            <p className="text-sm text-muted-foreground">
              Complete these steps to unlock the full potential of your account
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-white">{completedCount}/{steps.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {steps.map(step => {
          const Icon = step.icon;
          return <button key={step.id} className={cn("flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200", "border border-border hover:border-primary/30 hover:bg-background", step.completed && "bg-green-50 border-green-200 dark:bg-green-900/20")} onClick={() => window.location.href = step.action}>
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", step.completed ? "bg-green-500 text-white" : "bg-primary/10 text-primary")}>
                  {step.completed ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-medium text-sm", step.completed && "line-through text-muted-foreground")}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {!step.completed && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>;
        })}
        </div>
      </CardContent>
    </Card>;
};