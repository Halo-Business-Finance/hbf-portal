import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, FileText, User, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LoanProgressBar } from '@/components/LoanProgressBar';
import { LoanTimeline } from '@/components/LoanTimeline';
interface LoanApplication {
  id: string;
  loan_type: string;
  amount_requested: number;
  application_number: string;
  status: string;
  first_name: string;
  last_name: string;
  business_name: string;
  application_started_date: string;
  application_submitted_date: string;
  created_at: string;
}
interface ApplicationsListProps {
  statusFilter?: string | null;
  applications?: LoanApplication[];
}
const ApplicationsList = ({
  statusFilter = null,
  applications: externalApplications
}: ApplicationsListProps) => {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const toggleCard = (id: string) => {
    setCollapsedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  useEffect(() => {
    if (externalApplications) {
      setApplications(externalApplications);
      setIsLoading(false);
      return;
    }
    fetchApplications();
  }, [externalApplications]);
  const fetchApplications = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('loan_applications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        throw error;
      }
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load your applications.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (!externalApplications) {
      fetchApplications();
    }
  }, [user, externalApplications]);
  const getLoanTypeDisplay = (loanType: string) => {
    const types = {
      refinance: 'Refinance of Property',
      bridge_loan: 'Bridge Loan',
      purchase: 'Purchase of Property',
      franchise: 'Franchise Loan',
      factoring: 'Factoring Loan',
      working_capital: 'Working Capital'
    };
    return types[loanType as keyof typeof types] || loanType;
  };
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'border-slate-300 text-slate-700 bg-slate-50',
      submitted: 'border-slate-400 text-slate-800 bg-slate-50',
      under_review: 'border-amber-400 text-amber-800 bg-amber-50',
      approved: 'border-emerald-400 text-emerald-800 bg-emerald-50',
      rejected: 'border-red-400 text-red-800 bg-red-50',
      funded: 'border-indigo-400 text-indigo-800 bg-indigo-50'
    };
    return colors[status as keyof typeof colors] || 'border-slate-300 text-slate-700 bg-slate-50';
  };

  // Map DB loan_type to Index page loan program id
  const getProgramIdForLoanType = (loanType: string): number | null => {
    const map: Record<string, number> = {
      refinance: 11,
      bridge_loan: 4,
      working_capital: 7,
      factoring: 10
    };
    return map[loanType] ?? null;
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  if (isLoading) {
    return <div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(j => <div key={j} className="h-12 bg-muted rounded"></div>)}
                </div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (applications.length === 0) {
    return <div>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't submitted any loan applications. Select a loan type below to get started.
            </p>
          </CardContent>
        </Card>
      </div>;
  }

  // Filter applications based on statusFilter prop
  const filteredApplications = statusFilter ? applications.filter(app => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return app.status === 'under_review' || app.status === 'submitted';
    if (statusFilter === 'approved') return app.status === 'approved' || app.status === 'funded';
    return app.status === statusFilter;
  }) : applications;
  if (filteredApplications.length === 0 && statusFilter) {
    return <div>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">
              No applications match the selected filter.
            </p>
          </CardContent>
        </Card>
      </div>;
  }
  const getStatusMessage = (status: string) => {
    const messages = {
      draft: {
        text: 'Draft - Continue Application',
        color: 'text-slate-700'
      },
      submitted: {
        text: 'Application Submitted',
        color: 'text-foreground'
      },
      under_review: {
        text: 'Under Review',
        color: 'text-amber-700'
      },
      approved: {
        text: 'Approved',
        color: 'text-emerald-700'
      },
      rejected: {
        text: 'Application Declined',
        color: 'text-red-700'
      },
      funded: {
        text: 'Funded',
        color: 'text-indigo-700'
      }
    };
    return messages[status as keyof typeof messages] || messages.draft;
  };
  return (
    <div>
      <div className="space-y-4">
        {filteredApplications.map(application => {
          const statusInfo = getStatusMessage(application.status);
          const isCollapsed = collapsedCards.has(application.id);
          const programId = getProgramIdForLoanType(application.loan_type);
          
          return (
            <Collapsible 
              key={application.id} 
              open={!isCollapsed} 
              onOpenChange={() => toggleCard(application.id)}
            >
              <Card className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {application.business_name || 'New Application'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {getLoanTypeDisplay(application.loan_type)} • {application.application_number || 'Draft'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className={getStatusColor(application.status)}>
                        {application.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <p className="font-bold text-foreground text-lg hidden sm:block">
                        {formatCurrency(application.amount_requested || 0)}
                      </p>
                      {application.status === 'draft' ? (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const pid = getProgramIdForLoanType(application.loan_type);
                            if (pid) {
                              navigate(`/?program=${pid}&applicationId=${application.id}`);
                            }
                          }}
                        >
                          Continue Application
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCard(application.id);
                          }}
                        >
                          View Details
                        </Button>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <LoanProgressBar status={application.status} />

                  {/* Collapsible Content */}
                  <CollapsibleContent className="mt-4">
                    <Separator className="mb-4" />
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Applicant</p>
                          <p className="text-sm font-medium">
                            {application.first_name} {application.last_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(application.amount_requested || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Started</p>
                          <p className="text-sm font-medium">
                            {application.application_started_date 
                              ? format(new Date(application.application_started_date), 'MMM d, yyyy')
                              : format(new Date(application.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-sm font-medium">
                            {application.application_submitted_date 
                              ? format(new Date(application.application_submitted_date), 'MMM d, yyyy')
                              : 'Not submitted'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <LoanTimeline 
                      loanApplicationId={application.id} 
                      currentStatus={application.status} 
                    />

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      {application.status === 'draft' && programId && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => navigate(`/?program=${programId}&applicationId=${application.id}`)}
                        >
                          Continue Application
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationsList;