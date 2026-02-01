import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Upload, 
  Calculator, 
  CreditCard, 
  ChevronRight, 
  Search, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Building2,
  MoreHorizontal,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
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

export const EnterpriseDashboard = ({ onNewApplication }: EnterpriseDashboardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [recentActivity, setRecentActivity] = useState<LoanApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPipeline: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
    fundedAmount: 0,
    pendingAmount: 0
  });
  const [lastLogin, setLastLogin] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle();
      
      setFirstName(profile?.first_name ?? null);

      // Fetch applications
      const { data: apps, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const appData = apps || [];
      setApplications(appData);
      setRecentActivity(appData.slice(0, 5));

      // Calculate stats
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

      // Set last login
      const stored = localStorage.getItem('hbf_last_login');
      if (stored) {
        setLastLogin(new Date(stored).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }));
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
      submitted: { label: 'Submitted', className: 'bg-blue-100 text-blue-800' },
      under_review: { label: 'Under Review', className: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      funded: { label: 'Funded', className: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Declined', className: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={cn('font-medium', config.className)}>{config.label}</Badge>;
  };

  const quickActions = [
    { label: 'New Application', icon: Plus, action: () => onNewApplication?.(), primary: true },
    { label: 'Upload Documents', icon: Upload, action: () => navigate('/my-documents') },
    { label: 'Loan Calculator', icon: Calculator, action: () => navigate('/loan-calculator') },
    { label: 'Credit Reports', icon: CreditCard, action: () => navigate('/credit-reports') },
    { label: 'View All', icon: MoreHorizontal, action: () => navigate('/loan-applications') }
  ];

  const filteredActivity = recentActivity.filter(app => 
    !searchQuery || 
    app.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.application_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-primary/10 rounded-lg" />
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 w-32 bg-muted rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-muted rounded-lg" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Bank Enterprise Style */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2Mmgtdi0yem0tMiAyaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome{firstName ? `, ${firstName}` : ''}.
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                Thanks for choosing Halo Business Finance for your commercial lending needs.
              </p>
            </div>
            {lastLogin && (
              <div className="hidden md:block text-right text-sm text-white/70">
                <p>Last login:</p>
                <p className="font-medium text-white/90">{lastLogin}</p>
              </div>
            )}
          </div>
        </div>
        {/* Decorative underline */}
        <div className="absolute bottom-0 left-0 w-32 h-1 bg-white/30 rounded-full" />
      </div>

      {/* Quick Action Buttons - Bank Style Pills */}
      <div className="flex flex-wrap gap-2 md:gap-3">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant={action.primary ? 'default' : 'outline'}
            size="sm"
            className={cn(
              "rounded-full px-4 py-2 h-auto font-medium transition-all",
              action.primary 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" 
                : "bg-card hover:bg-secondary border-border text-foreground"
            )}
            onClick={action.action}
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
            {!action.primary && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Applications Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Applications Summary Card */}
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Loan Applications</CardTitle>
              </div>
              <Button 
                variant="link" 
                className="text-primary p-0 h-auto font-medium"
                onClick={() => navigate('/loan-applications')}
              >
                View all applications
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Summary Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pipeline</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stats.totalPipeline)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-xl font-bold text-muted-foreground">{stats.drafts}</p>
                </div>
              </div>

              {/* Applications List */}
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No applications yet</p>
                  <Button onClick={onNewApplication} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Your First Application
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div 
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/loan-applications?id=${app.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {app.business_name || 'Unnamed Business'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {getLoanTypeDisplay(app.loan_type)} • {app.application_number || 'Draft'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-semibold text-foreground">
                            {formatCurrency(app.amount_requested || 0)}
                          </p>
                          {getStatusBadge(app.status)}
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Pipeline Card */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Loan Pipeline Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Funded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.fundedAmount)}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Pending</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-2xl font-bold text-amber-600">
                      {formatCurrency(stats.pendingAmount)}
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 border-primary text-primary hover:bg-primary/10"
                onClick={() => navigate('/loan-applications')}
              >
                View Pipeline Details
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Activity & Quick Links */}
        <div className="space-y-6">
          {/* Recent Activity / Transactions Style */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>

              {/* Activity List */}
              <div className="space-y-1">
                {filteredActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  filteredActivity.map((app) => (
                    <div 
                      key={app.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors"
                      onClick={() => navigate(`/loan-applications?id=${app.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                          app.status === 'approved' || app.status === 'funded' 
                            ? "bg-green-100" 
                            : app.status === 'rejected' 
                            ? "bg-red-100"
                            : "bg-blue-100"
                        )}>
                          {app.status === 'approved' || app.status === 'funded' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : app.status === 'rejected' ? (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
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
                        <p className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {getLoanTypeDisplay(app.loan_type)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto py-3 px-3 hover:bg-secondary"
                onClick={() => navigate('/my-documents')}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Upload Documents</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto py-3 px-3 hover:bg-secondary"
                onClick={() => navigate('/credit-reports')}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Credit Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto py-3 px-3 hover:bg-secondary"
                onClick={() => navigate('/bank-accounts')}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Bank Accounts</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto py-3 px-3 hover:bg-secondary"
                onClick={() => navigate('/support')}
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Get Support</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
