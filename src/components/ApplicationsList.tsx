import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, FileText, ChevronDown, ChevronUp, Trash2, Pause, Play, ArrowRight, Headphones, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { LoanProgressBar } from '@/components/LoanProgressBar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  funded_date: string | null;
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
  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const {
        error
      } = await supabase.from('loan_applications').delete().eq('id', applicationId);
      if (error) throw error;
      setApplications(prev => prev.filter(app => app.id !== applicationId));
      toast({
        title: "Application Deleted",
        description: "Your loan application has been permanently deleted."
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete the application. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handlePauseApplication = async (applicationId: string) => {
    try {
      const {
        error
      } = await supabase.from('loan_applications').update({
        status: 'paused'
      }).eq('id', applicationId);
      if (error) throw error;
      setApplications(prev => prev.map(app => app.id === applicationId ? {
        ...app,
        status: 'paused'
      } : app));
      toast({
        title: "Application Paused",
        description: "Your loan application has been paused. You can resume it anytime within 90 days."
      });
    } catch (error) {
      console.error('Error pausing application:', error);
      toast({
        title: "Error",
        description: "Failed to pause the application. Please try again.",
        variant: "destructive"
      });
    }
  };
  const handleResumeApplication = async (applicationId: string) => {
    try {
      const {
        error
      } = await supabase.from('loan_applications').update({
        status: 'draft'
      }).eq('id', applicationId);
      if (error) throw error;
      setApplications(prev => prev.map(app => app.id === applicationId ? {
        ...app,
        status: 'draft'
      } : app));
      toast({
        title: "Application Resumed",
        description: "Your loan application has been resumed. You can continue where you left off."
      });
    } catch (error) {
      console.error('Error resuming application:', error);
      toast({
        title: "Error",
        description: "Failed to resume the application. Please try again.",
        variant: "destructive"
      });
    }
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
  const getLoanStage = (status: string) => {
    const stages: Record<string, {
      label: string;
      step: number;
    }> = {
      draft: {
        label: 'Not Submitted',
        step: 0
      },
      submitted: {
        label: 'Loan Submitted',
        step: 1
      },
      under_review: {
        label: 'Loan Processing',
        step: 2
      },
      approved: {
        label: 'Loan Closing',
        step: 4
      },
      funded: {
        label: 'Loan Funded',
        step: 5
      },
      paused: {
        label: 'Paused',
        step: 0
      },
      rejected: {
        label: 'Application Declined',
        step: 0
      }
    };
    return stages[status] || {
      label: 'Unknown',
      step: 0
    };
  };
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'border-slate-300 text-slate-700 bg-slate-50',
      submitted: 'border-slate-400 text-slate-800 bg-slate-50',
      under_review: 'border-amber-400 text-amber-800 bg-amber-50',
      approved: 'border-emerald-400 text-emerald-800 bg-emerald-50',
      rejected: 'border-red-400 text-red-800 bg-red-50',
      funded: 'border-indigo-400 text-indigo-800 bg-indigo-50',
      paused: 'border-orange-400 text-orange-800 bg-orange-50'
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
      },
      paused: {
        text: 'Paused - Resume Anytime',
        color: 'text-orange-700'
      }
    };
    return messages[status as keyof typeof messages] || messages.draft;
  };
  return <div>
      <div className="space-y-4">
        {filteredApplications.map(application => {
        const statusInfo = getStatusMessage(application.status);
        const isCollapsed = collapsedCards.has(application.id);
        const programId = getProgramIdForLoanType(application.loan_type);
        return <Collapsible key={application.id} open={!isCollapsed} onOpenChange={() => toggleCard(application.id)}>
              <Card className="border border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {application.business_name || 'New Application'}
                        </p>
                        
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {application.status === 'draft' ? <Button variant="default" size="sm" onClick={e => {
                    e.stopPropagation();
                    const pid = getProgramIdForLoanType(application.loan_type);
                    if (pid) {
                      navigate(`/?program=${pid}&applicationId=${application.id}`);
                    }
                  }}>
                          Continue Application
                        </Button> : <Button variant="outline" size="sm" onClick={e => {
                    e.stopPropagation();
                    toggleCard(application.id);
                  }}>
                          View Details
                        </Button>}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <LoanProgressBar status={application.status} startDate={application.application_started_date || application.created_at} />

                  {/* Collapsible Content */}
                  <CollapsibleContent className="mt-4">
                    <Separator className="mb-4" />
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Program</p>
                          <p className="text-sm font-medium">
                            {getLoanTypeDisplay(application.loan_type)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Stage</p>
                          <p className="text-sm font-medium">
                            {getLoanStage(application.status).label}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Amount</p>
                          <p className="text-sm font-medium">
                            {formatCurrency(application.amount_requested || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Started</p>
                          <p className="text-sm font-medium">
                            {format(new Date(application.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Loan Funded</p>
                          <p className="text-sm font-medium">
                            {application.status === 'funded' && application.funded_date ? format(new Date(application.funded_date), 'MMM d, yyyy') : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                                      <Button variant="outline" onClick={() => {
                    const pid = getProgramIdForLoanType(application.loan_type);
                    if (pid) {
                      navigate(`/?program=${pid}&applicationId=${application.id}`);
                    } else {
                      navigate(`/loan-applications?id=${application.id}`);
                    }
                  }}>
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Continue Application
                                      </Button>
                                      <Button variant="outline" onClick={() => navigate('/support')}>
                                        <Headphones className="w-4 h-4 mr-2" />
                                        Contact Support
                                      </Button>
                      
                      {/* Pause/Resume Application - show for draft, submitted, or under_review */}
                      {(application.status === 'draft' || application.status === 'submitted' || application.status === 'under_review') && <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <Pause className="w-4 h-4 mr-2" />
                              Pause Loan
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Pause Loan Application?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Pausing your application will prevent it from timing out. You can resume it anytime within 90 days to continue where you left off.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Active</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handlePauseApplication(application.id)}>
                                Pause Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>}

                      {/* Resume Application - show for paused applications */}
                      {application.status === 'paused' && <Button variant="outline" onClick={() => handleResumeApplication(application.id)}>
                          <Play className="w-4 h-4 mr-2" />
                          Resume Loan
                        </Button>}

                      {/* Delete Application */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Loan Application?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your loan application and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteApplication(application.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete Application
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>;
      })}
      </div>
    </div>;
};
export default ApplicationsList;