import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Building,
  Building2,
  CreditCard,
  Settings,
  TrendingUp,
  Banknote,
  FileText,
  RotateCcw,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoanProgram {
  id: number;
  title: string;
  icon: any;
  description: string;
  badge: string;
  badgeColor: string;
  details: string;
}

interface LoanTypeSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
}

const loanPrograms: LoanProgram[] = [
  {
    id: 1,
    title: "SBA 7(a) Loans",
    icon: Shield,
    description: "Versatile financing for working capital, equipment, and real estate purchases",
    badge: "Prime + 2.75%",
    badgeColor: "bg-primary",
    details: "Up to $5 million | Long-term financing | Most popular SBA program"
  },
  {
    id: 2,
    title: "SBA 504 Loans",
    icon: Building,
    description: "Fixed-rate financing for real estate and major equipment purchases",
    badge: "Fixed Rate",
    badgeColor: "bg-primary",
    details: "Up to $5.5 million | 10% down payment | Long-term fixed rates"
  },
  {
    id: 3,
    title: "USDA B&I Loans",
    icon: Shield,
    description: "Rural business development financing backed by USDA guarantee",
    badge: "Prime + 2%",
    badgeColor: "bg-primary",
    details: "Up to $25 million | Rural area focus | Job creation requirements"
  },
  {
    id: 4,
    title: "Bridge Loans",
    icon: Building2,
    description: "Short-term financing to bridge cash flow gaps while securing permanent financing",
    badge: "8.5% APR",
    badgeColor: "bg-accent",
    details: "Fast 7-day closing | Up to $10 million | Quick access to capital"
  },
  {
    id: 5,
    title: "Conventional Loans",
    icon: CreditCard,
    description: "Traditional commercial financing for established businesses with strong credit profiles",
    badge: "5.25% APR",
    badgeColor: "bg-accent",
    details: "No government guarantee | Faster approval | Flexible terms"
  },
  {
    id: 6,
    title: "Equipment Financing",
    icon: Settings,
    description: "Fund new or used equipment purchases with competitive terms",
    badge: "6.25% APR",
    badgeColor: "bg-accent",
    details: "100% financing available | Fast approval | Equipment as collateral"
  },
  {
    id: 7,
    title: "Working Capital Loan",
    icon: TrendingUp,
    description: "Bridge cash flow gaps and fund day-to-day business operations",
    badge: "Prime + 1%",
    badgeColor: "bg-accent",
    details: "Revolving credit line | Quick access | Fund daily operations"
  },
  {
    id: 8,
    title: "Business Line of Credit",
    icon: CreditCard,
    description: "Flexible access to capital when you need it with revolving credit lines",
    badge: "Prime + 2%",
    badgeColor: "bg-accent",
    details: "Draw as needed | Pay interest only on used funds | Revolving credit"
  },
  {
    id: 9,
    title: "Term Loans",
    icon: Banknote,
    description: "Fixed-rate business loans for major investments and growth initiatives",
    badge: "5.75% APR",
    badgeColor: "bg-accent",
    details: "Fixed monthly payments | Competitive rates | Major investments"
  },
  {
    id: 10,
    title: "Invoice Factoring",
    icon: FileText,
    description: "Convert outstanding invoices into immediate cash flow for your business",
    badge: "1.5% Factor",
    badgeColor: "bg-accent",
    details: "90% advance rate | Same-day funding | No debt on balance sheet"
  },
  {
    id: 11,
    title: "Refinance Loans",
    icon: RotateCcw,
    description: "Refinance existing debt to improve cash flow and reduce monthly payments",
    badge: "4.5% APR",
    badgeColor: "bg-accent",
    details: "Lower payments | Improved terms | Debt consolidation"
  },
  {
    id: 12,
    title: "SBA Express Loans",
    icon: Zap,
    description: "Fast-track SBA financing with expedited approval process",
    badge: "Prime + 4.5%",
    badgeColor: "bg-primary",
    details: "Up to $500K | 36-hour approval | Express processing"
  }
];

export const LoanTypeSelector = ({ open, onClose, onSelect }: LoanTypeSelectorProps) => {
  const navigate = useNavigate();

  const handleSelect = (id: number) => {
    onSelect(id);
    onClose();
    navigate(`/?id=${id}`);
  };

  const handleSkip = () => {
    // Mark that user has seen the selector
    localStorage.setItem('hbf_loan_selector_seen', 'true');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold">
              What type of loan are you applying for?
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Select the financing solution that best fits your business needs to get started.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loanPrograms.map((program) => {
              const IconComponent = program.icon;
              return (
                <Card 
                  key={program.id} 
                  className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] group"
                  onClick={() => handleSelect(program.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 text-foreground group-hover:text-primary transition-colors">
                          {program.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {program.badge}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {program.description}
                    </p>
                    <div className="flex items-center text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Apply Now
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Not sure which loan is right for you?
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip for now
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                onClose();
                navigate('/support');
              }}
            >
              Talk to an advisor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanTypeSelector;
