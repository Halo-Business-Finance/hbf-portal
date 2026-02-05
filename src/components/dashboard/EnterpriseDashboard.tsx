import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Calculator, CreditCard, ChevronRight, DollarSign, Clock, CheckCircle, AlertCircle, Building2, Plus, Link2, TrendingUp, ArrowRight, User, Briefcase, FileBarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AnimatedCurrency } from '@/components/ui/animated-counter';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { EnhancedDashboardCharts } from './EnhancedDashboardCharts';
import ApplicationsList from '@/components/ApplicationsList';
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

interface CreditScore {
  id: string;
  score: number;
  bureau: string;
  score_date: string;
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
  const [creditScores, setCreditScores] = useState<CreditScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPipeline: 0,
    approved: 0,
    pending: 0,
    drafts: 0,
    fundedAmount: 0,
    pendingAmount: 0
  });
  
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);
  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', user.id)
        .maybeSingle();
      setFirstName(profile?.first_name ?? null);

      const { data: apps, error } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const appData = apps || [];
      setApplications(appData);

      // Fetch credit scores
      const { data: scores, error: scoresError } = await supabase
        .from('credit_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('score_date', { ascending: false });
      if (scoresError) throw scoresError;
      setCreditScores(scores || []);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Separate personal and business credit scores
  const personalScores = creditScores.filter(s => 
    ['transunion', 'equifax', 'experian'].includes(s.bureau.toLowerCase())
  );
  const businessScores = creditScores.filter(s => 
    !['transunion', 'equifax', 'experian'].includes(s.bureau.toLowerCase())
  );
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  const quickActions = [{
    label: 'Upload Documents',
    icon: Upload,
    action: () => navigate('/my-documents'),
    chevron: true
  }, {
    label: 'Tax documents',
    icon: FileText,
    action: () => navigate('/my-documents')
  }, {
    label: 'Bank Statements',
    icon: Building2,
    action: () => navigate('/my-documents?folder=Bank Statements'),
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
        <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
          <h1 className="md:text-3xl font-bold mb-1 text-lg">
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
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 md:gap-3">
          {quickActions.map((action, index) => <Button key={index} variant="default" size="sm" className="rounded-full px-4 py-2 h-9 font-medium bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm justify-center transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 whitespace-nowrap" onClick={action.action}>
              {action.label}
              {action.chevron && <ChevronRight className="w-4 h-4 ml-1 hidden sm:inline" />}
            </Button>)}
        </div>

        {/* Main Content Grid - US Bank Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Loan Applications (like Accounts section) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl font-bold text-foreground whitespace-nowrap">Loan Applications</h2>
          </div>

          {/* Pipeline Summary Row */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground font-medium">Active applications</span>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
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
            </Card> : <ApplicationsList applications={applications.slice(0, 3).map(app => ({
              ...app,
              first_name: '',
              last_name: '',
              application_started_date: app.created_at,
              application_submitted_date: app.created_at,
              funded_date: null
            }))} />}

          {/* Link Accounts Banner */}
          <Card className="border border-border bg-muted/30 animated-gradient-border-minimal">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
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
                <div className="space-y-2 text-center sm:text-left">
                  <p className="font-semibold text-foreground text-sm sm:text-base">Link your accounts to see your full financial picture.</p>
                  <div className="flex flex-col gap-1 items-center sm:items-start">
                    <Button 
                      variant="link" 
                      className="text-primary p-0 h-auto font-medium text-sm justify-center sm:justify-start group transition-all duration-200 hover:translate-x-1" 
                      onClick={() => navigate('/my-documents?folder=Tax Documents')}
                    >
                      <FileText className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:scale-110" />
                      Connect Tax Returns
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                    <Button 
                      variant="link" 
                      className="text-primary p-0 h-auto font-medium text-sm justify-center sm:justify-start group transition-all duration-200 hover:translate-x-1" 
                      onClick={() => navigate('/credit-reports')}
                    >
                      <FileBarChart className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:scale-110" />
                      Connect Credit Reports
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                    <Button 
                      variant="link" 
                      className="text-primary p-0 h-auto font-medium text-sm justify-center sm:justify-start group transition-all duration-200 hover:translate-x-1" 
                      onClick={() => navigate('/bank-accounts')}
                    >
                      <Building2 className="w-4 h-4 mr-1.5 transition-transform duration-200 group-hover:scale-110" />
                      Connect Bank Accounts
                      <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Loan Stats & Charts */}
        <div className="space-y-5 lg:mt-[80px]">
          {/* Enhanced Charts - Monthly Trend and Linked Accounts */}
          <EnhancedDashboardCharts userId={user?.id} />

          {/* Credit Scores Widget */}
          <PremiumCard variant="elevated" size="none">
            <PremiumCardHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <PremiumCardTitle className="flex items-center gap-2 text-base">Credit Scores</PremiumCardTitle>
              </div>
            </PremiumCardHeader>
            <PremiumCardContent className="px-5 pb-5 space-y-4">
              {/* Personal Credit Scores */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="font-medium">Personal</span>
                </div>
                {personalScores.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-6">No personal scores available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {personalScores.slice(0, 2).map((score) => (
                      <div key={score.id} className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                          {score.bureau}
                        </p>
                        <p className="text-2xl font-bold text-foreground">{score.score}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Business Credit Scores */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Briefcase className="w-4 h-4" />
                  <span className="font-medium">Business</span>
                </div>
                {businessScores.length === 0 ? (
                  <p className="text-sm text-muted-foreground pl-6">No business scores available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    {businessScores.slice(0, 2).map((score) => (
                      <div key={score.id} className="text-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                          {score.bureau}
                        </p>
                        <p className="text-2xl font-bold text-foreground">{score.score}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">Scores checked daily with VantageScore 3.0</p>
              
              <Button 
                variant="outline" 
                className="w-full border-primary text-primary transition-all duration-200" 
                onClick={() => navigate('/credit-reports')}
              >
                View All Credit Reports
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </PremiumCardContent>
          </PremiumCard>

        </div>
      </div>
      </div>
    </div>;
};