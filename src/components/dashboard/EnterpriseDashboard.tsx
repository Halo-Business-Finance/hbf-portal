import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Calculator, CreditCard, ChevronRight, DollarSign, Clock, CheckCircle, AlertCircle, Building2, MoreHorizontal, Plus, Link2, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
interface LoanApplication {
  id: string;
  application_number: string;
  business_name: string;
  loan_type: string;
  amount_requested: number;
  status: string;
  created_at: string;
  updated_at: string;
}
interface EnterpriseDashboardProps {
  onNewApplication?: () => void;
}
export const EnterpriseDashboard = ({
  onNewApplication
}: EnterpriseDashboardProps) => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loanWidgetDays, setLoanWidgetDays] = useState<string>('30');
  const [stats, setStats] = useState({
    totalPipeline: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
    fundedAmount: 0,
    pendingAmount: 0
  });
  const [filteredStats, setFilteredStats] = useState({
    fundedAmount: 0,
    pendingAmount: 0,
    approvedCount: 0,
    pendingCount: 0,
    totalCount: 0
  });
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Calculate filtered stats based on selected days
  useEffect(() => {
    const days = parseInt(loanWidgetDays);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const filteredApps = applications.filter(app => new Date(app.created_at) >= cutoffDate);
    const approved = filteredApps.filter(a => a.status === 'approved' || a.status === 'funded');
    const pending = filteredApps.filter(a => a.status === 'submitted' || a.status === 'under_review');
    setFilteredStats({
      fundedAmount: approved.reduce((sum, a) => sum + (a.amount_requested || 0), 0),
      pendingAmount: pending.reduce((sum, a) => sum + (a.amount_requested || 0), 0),
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalCount: filteredApps.length
    });
  }, [loanWidgetDays, applications]);
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const {
        data: profile
      } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      setFirstName(profile?.first_name ?? null);
      const {
        data: apps,
        error
      } = await supabase.from('loan_applications').select('*').eq('user_id', user.id).order('updated_at', {
        ascending: false
      });
      if (error) throw error;
      const appData = apps || [];
      setApplications(appData);
      const approved = appData.filter(a => a.status === 'approved' || a.status === 'funded');
      const pending = appData.filter(a => a.status === 'submitted' || a.status === 'under_review');
      const drafts = appData.filter(a => a.status === 'draft');
      const totalPipeline = appData.reduce((sum, a) => sum + (a.amount_requested || 0), 0);
      const fundedAmount = approved.reduce((sum, a) => sum + (a.amount_requested || 0), 0);
      const pendingAmount = pending.reduce((sum, a) => sum + (a.amount_requested || 0), 0);
      setStats({
        totalPipeline,
        approved: approved.length,
        pending: pending.length,
        drafts: drafts.length,
        fundedAmount,
        pendingAmount
      });
      const stored = localStorage.getItem('hbf_last_login');
      if (stored) {
        setLastLogin(new Date(stored).toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) + ' CT');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  const getLoanTypeDisplay = (loanType: string) => {
    const types: Record<string, string> = {
      refinance: 'Refinance',
      bridge_loan: 'Bridge Loan',
      working_capital: 'Working Capital',
      sba_7a: 'SBA 7(a)',
      sba_504: 'SBA 504',
      equipment_financing: 'Equipment',
      term_loan: 'Term Loan',
      business_line_of_credit: 'Line of Credit',
      purchase: 'Purchase',
      franchise: 'Franchise',
      factoring: 'Factoring'
    };
    return types[loanType] || loanType;
  };
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, {
      label: string;
      className: string;
    }> = {
      draft: {
        label: 'Draft',
        className: 'bg-muted text-muted-foreground'
      },
      submitted: {
        label: 'Submitted',
        className: 'bg-blue-500 text-white'
      },
      under_review: {
        label: 'Under Review',
        className: 'bg-amber-500 text-white'
      },
      approved: {
        label: 'Approved',
        className: 'bg-green-500 text-white'
      },
      funded: {
        label: 'Funded',
        className: 'bg-emerald-600 text-white'
      },
      rejected: {
        label: 'Declined',
        className: 'bg-red-500 text-white'
      }
    };
    const config = statusConfig[status] || {
      label: status,
      className: 'bg-muted text-muted-foreground'
    };
    return <Badge className={cn('font-medium text-xs', config.className)}>{config.label}</Badge>;
  };
  const quickActions = [{
    label: 'Tax documents',
    icon: FileText,
    action: () => navigate('/my-documents')
  }, {
    label: 'New Application',
    icon: Plus,
    action: () => onNewApplication?.(),
    chevron: true
  }, {
    label: 'Upload Documents',
    icon: Upload,
    action: () => navigate('/my-documents'),
    chevron: true
  }, {
    label: 'Loan Calculator',
    icon: Calculator,
    action: () => navigate('/loan-calculator'),
    chevron: true
  }, {
    label: 'Credit Reports',
    icon: CreditCard,
    action: () => navigate('/credit-reports'),
    chevron: true
  }, {
    label: 'More',
    icon: MoreHorizontal,
    action: () => navigate('/loan-applications')
  }];
  if (isLoading) {
    return <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-primary/10 rounded-lg" />
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 w-32 bg-muted rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-muted rounded-lg" />
          <div className="h-80 bg-muted rounded-lg" />
        </div>
      </div>;
  }
  return <div>
      {/* Welcome Banner - Full Width US Bank Style */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-[30px] lg:px-[34px]">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome back, {firstName || 'there'}.
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base">
            We look forward to helping you today.
          </p>
        </div>
      </div>

      {/* Content with padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Quick Action Buttons - US Bank Style Pills */}
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
          {quickActions.map((action, index) => <Button key={index} variant="default" size="sm" className="rounded-full px-4 py-2 h-9 font-medium bg-primary hover:bg-primary/90 text-primary-foreground" onClick={action.action}>
              {action.label}
              {action.chevron && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>)}
        </div>

        {/* Main Content Grid - US Bank Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Loan Applications (like Accounts section) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Loan Applications</h2>
            <div className="flex items-center gap-4 text-black">
              <Button variant="link" className="text-primary p-0 h-auto font-medium text-sm" onClick={() => navigate('/loan-applications')}>
                <FileText className="w-4 h-4 mr-1" />
                Customize application list
              </Button>
              {lastLogin && <span className="text-sm text-muted-foreground hidden md:inline">
                  Last login: {lastLogin}
                </span>}
            </div>
          </div>

          {/* Pipeline Summary Row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Active applications</span>
            <span className="font-bold text-foreground">{formatCurrency(stats.totalPipeline)}</span>
          </div>

          {/* Application Cards - US Bank Account Card Style */}
          {applications.length === 0 ? <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No applications yet</p>
                <Button onClick={onNewApplication} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Your First Application
                </Button>
              </CardContent>
            </Card> : <div className="space-y-4">
              {applications.slice(0, 3).map(app => <Card key={app.id} className="border border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/loan-applications?id=${app.id}`)}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded flex items-center justify-center bg-white">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {app.business_name || 'New Application'} ...{app.application_number?.slice(-4) || '0000'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLoanTypeDisplay(app.loan_type)} • {app.application_number || 'Draft'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground text-lg">
                          {formatCurrency(app.amount_requested || 0)}
                        </p>
                        <ChevronRight className="w-5 h-5 text-muted-foreground inline" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(app.status)}
                      <Button variant="outline" size="sm" className="rounded-full text-xs" onClick={e => {
                    e.stopPropagation();
                    navigate(`/loan-applications?id=${app.id}`);
                  }}>
                        View details
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                      <Button variant="ghost" size="sm" className="ml-auto" onClick={e => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}

          {/* Link Accounts Banner */}
          <Card className="border border-border bg-muted/30">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                    <Link2 className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Link your accounts to see your full financial picture.</p>
                  <Button variant="link" className="text-primary p-0 h-auto font-medium text-sm" onClick={() => navigate('/bank-accounts')}>
                    Connect Bank Accounts
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cash Flow & Transactions */}
        <div className="space-y-6">
          {/* Cash Flow Widget - US Bank Style */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold">Loan applications</CardTitle>
                <Select value={loanWidgetDays} onValueChange={setLoanWidgetDays}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Select days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 180 days</SelectItem>
                    <SelectItem value="360">Last 360 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs font-medium">
                  {filteredStats.totalCount} application{filteredStats.totalCount !== 1 ? 's' : ''}
                </Badge>
                <span>in selected period</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Approved
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-medium">
                      {filteredStats.approvedCount}
                    </Badge>
                  </p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    +{formatCurrency(filteredStats.fundedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Pending
                    <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-medium">
                      {filteredStats.pendingCount}
                    </Badge>
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(filteredStats.pendingAmount)}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/loan-applications')}>
                Continue to Pipeline
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity / Transactions */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {applications.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p> : applications.slice(0, 5).map(app => <div key={app.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 hover:shadow-sm hover:scale-[1.01] -mx-2 px-2 rounded-lg transition-all duration-200 ease-out" onClick={() => navigate(`/loan-applications?id=${app.id}`)}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", app.status === 'approved' || app.status === 'funded' ? "bg-green-100" : app.status === 'rejected' ? "bg-red-100" : "bg-transparent")}>
                        {app.status === 'approved' || app.status === 'funded' ? <CheckCircle className="w-4 h-4 text-green-600" /> : app.status === 'rejected' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <Clock className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {app.business_name || 'New Application'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.updated_at).toLocaleDateString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(app.amount_requested || 0)}
                      </p>
                    </div>
                  </div>)}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2 hover:bg-muted" onClick={() => navigate('/my-documents')}>
                <span className="text-sm font-medium">Upload Documents</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2 hover:bg-muted" onClick={() => navigate('/credit-reports')}>
                <span className="text-sm font-medium">Credit Reports</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" className="w-full justify-between h-auto py-3 px-2 hover:bg-muted" onClick={() => navigate('/support')}>
                <span className="text-sm font-medium">Get Support</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>;
};