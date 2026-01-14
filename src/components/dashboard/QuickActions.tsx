import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Upload, Calculator, MessageSquare, CreditCard, Building2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  variant?: 'default' | 'primary';
}
interface QuickActionsProps {
  onNewApplication?: () => void;
  className?: string;
}
export const QuickActions = ({
  onNewApplication,
  className
}: QuickActionsProps) => {
  const navigate = useNavigate();
  const actions: QuickAction[] = [{
    id: 'new-application',
    label: 'New Application',
    description: 'Start a new loan application',
    icon: FileText,
    action: () => {
      if (onNewApplication) {
        onNewApplication();
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }
    },
    variant: 'primary'
  }, {
    id: 'upload-docs',
    label: 'Upload Documents',
    description: 'Submit required documents',
    icon: Upload,
    action: () => navigate('/my-documents')
  }, {
    id: 'calculator',
    label: 'Loan Calculator',
    description: 'Estimate your payments',
    icon: Calculator,
    action: () => navigate('/loan-calculator')
  }, {
    id: 'credit-report',
    label: 'View Credit Report',
    description: 'Check your credit score',
    icon: CreditCard,
    action: () => navigate('/credit-reports')
  }, {
    id: 'bank-accounts',
    label: 'Bank Accounts',
    description: 'Manage linked accounts',
    icon: Building2,
    action: () => navigate('/bank-accounts')
  }, {
    id: 'support',
    label: 'Get Support',
    description: 'Contact our team',
    icon: MessageSquare,
    action: () => navigate('/support')
  }];
  return <Card className={cn("border border-border", className)}>
      <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-card-foreground">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {actions.map(action => {
          const Icon = action.icon;
          return <Button 
            key={action.id} 
            variant={action.variant === 'primary' ? 'default' : 'outline'} 
            className={cn(
              "h-auto flex-col items-center justify-center p-3 sm:p-4 gap-1.5 sm:gap-2 transition-all duration-200",
              "active:scale-[0.97] touch-manipulation min-h-[72px] sm:min-h-[80px]",
              "hover:scale-[1.02] hover:shadow-md",
              action.variant === 'primary' 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "border-border text-card-foreground hover:bg-secondary"
            )} 
            onClick={action.action}
          >
                <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
                <span className="text-[11px] sm:text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
              </Button>;
        })}
        </div>
      </CardContent>
    </Card>;
};