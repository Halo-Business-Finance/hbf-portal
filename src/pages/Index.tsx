/**
 * MY DASHBOARD PAGE (Route: /)
 * Main dashboard displaying:
 * - Credit scores and bank balances widgets
 * - Loan application statistics
 * - User's loan applications list
 * - New loan application forms
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, HelpCircle, LogIn, Home, Building2, CreditCard, Store, Banknote, TrendingUp, Sparkles, CheckCircle, ArrowRight, Shield, Building, Settings, HardHat, Handshake, FileText, RotateCcw, Zap, DollarSign, Clock, Eye, EyeOff, Lock, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from "@/components/ui/modern-tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ApplicationsList from "@/components/ApplicationsList";
import RefinanceForm from "@/components/forms/RefinanceForm";
import BridgeLoanForm from "@/components/forms/BridgeLoanForm";
import WorkingCapitalForm from "@/components/forms/WorkingCapitalForm";
import SBA7aLoanForm from "@/components/forms/SBA7aLoanForm";
import SBA504LoanForm from "@/components/forms/SBA504LoanForm";
import EquipmentFinancingForm from "@/components/forms/EquipmentFinancingForm";
import { USDABILoanForm } from "@/components/forms/USDABILoanForm";
import { ConventionalLoanForm } from "@/components/forms/ConventionalLoanForm";
import { TermLoanForm } from "@/components/forms/TermLoanForm";
import { BusinessLineOfCreditForm } from "@/components/forms/BusinessLineOfCreditForm";
import InvoiceFactoringForm from "@/components/forms/InvoiceFactoringForm";
import SBAExpressLoanForm from "@/components/forms/SBAExpressLoanForm";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import Navbar from "@/components/Navbar";
import { CreditScoreWidget } from '@/components/CreditScoreWidget';
import { BankBalanceWidget } from '@/components/BankBalanceWidget';
import { DashboardOverview } from '@/components/DashboardOverview';
import { Footer } from '@/components/Footer';
import { ApplicationProgressTracker, QuickActions, OnboardingGuide, FloatingSupportButton, DocumentChecklist, EstimatedTimeline, DashboardCharts, SwipeableDashboard } from '@/components/dashboard';
const FundedLoansView = ({
  userId
}: {
  userId?: string;
}) => {
  const [fundedLoans, setFundedLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchFundedLoans = async () => {
      if (!userId) return;
      const {
        data
      } = await supabase.from('loan_applications').select('*').eq('user_id', userId).in('status', ['funded', 'approved']).order('application_submitted_date', {
        ascending: false
      });
      setFundedLoans(data || []);
      setIsLoading(false);
    };
    fetchFundedLoans();
  }, [userId]);
  const getLoanTypeDisplay = (loanType: string) => {
    const types = {
      refinance: 'Refinance',
      bridge_loan: 'Bridge Loan',
      working_capital: 'Working Capital',
      sba_7a: 'SBA 7(a)',
      sba_504: 'SBA 504',
      equipment_financing: 'Equipment Financing',
      term_loan: 'Term Loan',
      business_line_of_credit: 'Business Line of Credit'
    };
    return types[loanType as keyof typeof types] || loanType;
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
    return <div className="space-y-4">
        {[1, 2].map(i => <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>)}
      </div>;
  }
  if (fundedLoans.length === 0) {
    return <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Funded Loans</h3>
          <p className="text-muted-foreground">You don't have any funded or closed loans yet</p>
        </CardContent>
      </Card>;
  }
  return <div>
      <div className="mb-6 flex items-start gap-3">
        <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
        <div>
          <h2 className="text-2xl font-bold mb-1">Your Funded Loans</h2>
          <p className="text-muted-foreground">
            Track your active and closed loans
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {fundedLoans.map(loan => <Card key={loan.id} className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {loan.business_name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Application #{loan.application_number}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-foreground">
                      <span className="font-semibold">Type:</span> {getLoanTypeDisplay(loan.loan_type)}
                    </span>
                    <span className="text-foreground">
                      <span className="font-semibold">Amount:</span> {formatCurrency(loan.amount_requested)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Funded: {loan.application_submitted_date ? new Date(loan.application_submitted_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {loan.status === 'funded' ? '✓ FUNDED' : '✓ APPROVED'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
};
const DashboardView = () => {
  const [stats, setStats] = useState({
    totalApplications: 0,
    approvedAmount: 0,
    pendingReview: 0,
    successRate: 0
  });
  const [activeTab, setActiveTab] = useState('applications');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const {
    user
  } = useAuth();
  const [firstName, setFirstName] = useState<string | null>(null);
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Fetch user's first name from profile
      const {
        data: profile
      } = await supabase.from('profiles').select('first_name').eq('id', user.id).maybeSingle();
      setFirstName(profile?.first_name ?? null);
      const {
        data: applications
      } = await supabase.from('loan_applications').select('*').eq('user_id', user.id);
      if (applications) {
        const total = applications.length;
        const approved = applications.filter(app => app.status === 'approved').length;
        const pending = applications.filter(app => app.status === 'under_review' || app.status === 'submitted').length;
        const approvedSum = applications.filter(app => app.status === 'approved').reduce((sum, app) => sum + (app.amount_requested || 0), 0);
        setStats({
          totalApplications: total,
          approvedAmount: approvedSum,
          pendingReview: pending,
          successRate: total > 0 ? Math.round(approved / total * 100) : 0
        });
      }
    };
    fetchStats();
  }, [user]);
  const handleMetricClick = (filter: string) => {
    setStatusFilter(filter);
    setActiveTab('applications');
  };
  // Define dashboard sections for swipeable navigation on mobile
  const dashboardSections = [{
    id: 'overview',
    label: 'Overview',
    content: <div className="space-y-4">
          <QuickActions />
          <DashboardOverview />
          <DashboardCharts userId={user?.id} />
        </div>
  }, {
    id: 'progress',
    label: 'Progress',
    content: <div className="space-y-4">
          <ApplicationProgressTracker currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <EstimatedTimeline currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <DocumentChecklist userId={user?.id} />
        </div>
  }, {
    id: 'financial',
    label: 'Financial',
    content: <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Bank Accounts</h2>
            <BankBalanceWidget />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Credit Scores</h2>
            <CreditScoreWidget />
          </div>
        </div>
  }, {
    id: 'applications',
    label: 'Applications',
    content: <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('all')}>
              <p className="stat-label">Total<br />Applications</p>
              <p className="stat-value">{stats.totalApplications}</p>
            </div>
            <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('approved')}>
              <p className="stat-label">Approved<br />Amount</p>
              <p className="stat-value">${stats.approvedAmount.toLocaleString()}</p>
            </div>
            <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('pending')}>
              <p className="stat-label">Pending<br />Review</p>
              <p className="stat-value">{stats.pendingReview}</p>
            </div>
            <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('approved')}>
              <p className="stat-label">Success Rate</p>
              <p className="stat-value">{stats.successRate}%</p>
            </div>
          </div>
          <ApplicationsList statusFilter={statusFilter} />
        </div>
  }];
  return <div className="space-y-4 sm:space-y-5 mb-12">
      {/* Onboarding Guide for new users */}
      <OnboardingGuide userId={user?.id} />

      {/* Header with bottom separator */}
      <div className="border-none rounded-none">
        <div className="flex-1">
          {firstName && <h2 className="text-lg sm:text-xl font-bold mb-3 text-black">
              Welcome, {firstName}
            </h2>}
          <p className="text-sm sm:text-base mb-4 text-black">
            Manage your loan applications and track your progress here
          </p>
        </div>
      </div>

      {/* Mobile Swipeable Dashboard */}
      <SwipeableDashboard sections={dashboardSections} />

      {/* Desktop Layout - Hidden on mobile */}
      <div className="hidden md:block space-y-4 sm:space-y-5">
        {/* Quick Actions */}
        <QuickActions />

        {/* Overview Card */}
        <DashboardOverview />

        {/* Dashboard Charts */}
        <DashboardCharts userId={user?.id} />

        {/* Progress & Timeline Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ApplicationProgressTracker currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <EstimatedTimeline currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <DocumentChecklist userId={user?.id} />
        </div>

        {/* Bank Accounts & Credit Scores Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Bank Accounts</h2>
            <BankBalanceWidget />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Credit Scores</h2>
            <CreditScoreWidget />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('all')}>
            <p className="stat-label">Total<br />Applications</p>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>

          <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('approved')}>
            <p className="stat-label">Approved<br />Amount</p>
            <p className="stat-value">${stats.approvedAmount.toLocaleString()}</p>
          </div>

          <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('pending')}>
            <p className="stat-label">Pending<br />Review</p>
            <p className="stat-value">{stats.pendingReview}</p>
          </div>

          <div className="dashboard-stat-card cursor-pointer" onClick={() => handleMetricClick('approved')}>
            <p className="stat-label">Success Rate</p>
            <p className="stat-value">{stats.successRate}%</p>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          

          <TabsContent value="applications" className="mt-6">
            {statusFilter && <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-900 text-white">
                    Filter: {statusFilter === 'all' ? 'All Applications' : statusFilter === 'pending' ? 'Pending Review' : statusFilter === 'approved' ? 'Approved/Funded' : statusFilter}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStatusFilter(null)} className="text-blue-900 hover:text-blue-700">
                  Clear Filter
                </Button>
              </div>}
            <ApplicationsList statusFilter={statusFilter} />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Recent Activity</h3>
                <p className="text-muted-foreground">Your recent application activity will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="mt-6">
            <FundedLoansView userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Support Button */}
      <FloatingSupportButton />
    </div>;
};
const Index = () => {
  const [selectedLoanType, setSelectedLoanType] = useState<number | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    authenticated,
    loading,
    signIn,
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();

  // Auth form state - must be at top level, not conditional
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [returningUser, setReturningUser] = useState<string | null>(null);

  // Check for returning user on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('hbf_remembered_email');
    const lastLogin = localStorage.getItem('hbf_last_login');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      if (lastLogin) {
        setReturningUser(lastLogin);
      }
    }
  }, []);

  // Check lockout status
  useEffect(() => {
    const storedLockout = localStorage.getItem('hbf_lockout_until');
    const storedAttempts = localStorage.getItem('hbf_login_attempts');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('hbf_lockout_until');
        localStorage.removeItem('hbf_login_attempts');
      }
    }
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const interval = setInterval(() => {
        if (lockoutUntil <= Date.now()) {
          setLockoutUntil(null);
          setLoginAttempts(0);
          localStorage.removeItem('hbf_lockout_until');
          localStorage.removeItem('hbf_login_attempts');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);
  const formatLockoutTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };
  const isLockedOut = lockoutUntil !== null && lockoutUntil > Date.now();
  const loanTypeId = searchParams.get('id');
  useEffect(() => {
    if (loanTypeId) {
      setSelectedLoanType(parseInt(loanTypeId));
    }
  }, [loanTypeId]);
  const loanPrograms = [{
    id: 1,
    title: "SBA 7(a) Loans",
    icon: Shield,
    description: "Versatile financing for working capital, equipment, and real estate purchases",
    badge: "Prime + 2.75%",
    badgeColor: "bg-primary",
    details: "Up to $5 million | Long-term financing | Most popular SBA program"
  }, {
    id: 2,
    title: "SBA 504 Loans",
    icon: Building,
    description: "Fixed-rate financing for real estate and major equipment purchases",
    badge: "Fixed Rate",
    badgeColor: "bg-primary",
    details: "Up to $5.5 million | 10% down payment | Long-term fixed rates"
  }, {
    id: 3,
    title: "USDA B&I Loans",
    icon: Shield,
    description: "Rural business development financing backed by USDA guarantee",
    badge: "Prime + 2%",
    badgeColor: "bg-primary",
    details: "Up to $25 million | Rural area focus | Job creation requirements"
  }, {
    id: 4,
    title: "Bridge Loans",
    icon: Building2,
    description: "Short-term financing to bridge cash flow gaps while securing permanent financing",
    badge: "8.5% APR",
    badgeColor: "bg-accent",
    details: "Fast 7-day closing | Up to $10 million | Quick access to capital"
  }, {
    id: 5,
    title: "Conventional Loans",
    icon: CreditCard,
    description: "Traditional commercial financing for established businesses with strong credit profiles",
    badge: "5.25% APR",
    badgeColor: "bg-accent",
    details: "No government guarantee | Faster approval | Flexible terms"
  }, {
    id: 6,
    title: "Equipment Financing",
    icon: Settings,
    description: "Fund new or used equipment purchases with competitive terms",
    badge: "6.25% APR",
    badgeColor: "bg-accent",
    details: "100% financing available | Fast approval | Equipment as collateral"
  }, {
    id: 7,
    title: "Working Capital",
    icon: TrendingUp,
    description: "Bridge cash flow gaps and fund day-to-day business operations",
    badge: "Prime + 1%",
    badgeColor: "bg-accent",
    details: "Revolving credit line | Quick access | Fund daily operations"
  }, {
    id: 8,
    title: "Business Line of Credit",
    icon: CreditCard,
    description: "Flexible access to capital when you need it with revolving credit lines",
    badge: "Prime + 2%",
    badgeColor: "bg-accent",
    details: "Draw as needed | Pay interest only on used funds | Revolving credit"
  }, {
    id: 9,
    title: "Term Loans",
    icon: Banknote,
    description: "Fixed-rate business loans for major investments and growth initiatives",
    badge: "5.75% APR",
    badgeColor: "bg-accent",
    details: "Fixed monthly payments | Competitive rates | Major investments"
  }, {
    id: 10,
    title: "Invoice Factoring",
    icon: FileText,
    description: "Convert outstanding invoices into immediate cash flow for your business",
    badge: "1.5% Factor",
    badgeColor: "bg-accent",
    details: "90% advance rate | Same-day funding | No debt on balance sheet"
  }, {
    id: 11,
    title: "Refinance Loans",
    icon: RotateCcw,
    description: "Refinance existing debt to improve cash flow and reduce monthly payments",
    badge: "4.5% APR",
    badgeColor: "bg-accent",
    details: "Lower payments | Improved terms | Debt consolidation"
  }, {
    id: 12,
    title: "SBA Express Loans",
    icon: Zap,
    description: "Fast-track SBA financing with expedited approval process",
    badge: "Prime + 4.5%",
    badgeColor: "bg-primary",
    details: "Up to $500K | 36-hour approval | Express processing"
  }];
  const handleLoanTypeSelect = (id: number) => {
    setSelectedLoanType(id);
    navigate(`/?id=${id}`);
  };
  const handleBackToHome = () => {
    navigate('/');
    setSelectedLoanType(null);
  };
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-spin border-t-primary mx-auto"></div>
            <Sparkles className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Loading Your Dashboard</h3>
          <p className="text-sm text-muted-foreground">Preparing your loan application experience...</p>
        </div>
      </div>;
  }

  // Auth form handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Check if locked out
    if (isLockedOut) {
      setAuthError(`Too many failed attempts. Please try again in ${formatLockoutTime(lockoutUntil! - Date.now())}`);
      return;
    }
    setAuthLoading(true);
    try {
      if (!isLogin) {
        // Validation for signup
        if (password !== confirmPassword) {
          setAuthError("Passwords do not match");
          setAuthLoading(false);
          return;
        }
        if (password.length < 6) {
          setAuthError("Password must be at least 6 characters long");
          setAuthLoading(false);
          return;
        }
        if (!firstName.trim() || !lastName.trim()) {
          setAuthError("First name and last name are required");
          setAuthLoading(false);
          return;
        }
        const {
          error
        } = await signUp(email, password);
        if (error) {
          if (error.message?.includes("User already registered")) {
            setAuthError("An account with this email already exists. Please sign in instead.");
          } else if (error.message?.includes("Invalid email")) {
            setAuthError("Please enter a valid email address");
          } else {
            setAuthError(error.message || "Failed to create account");
          }
        } else {
          setTimeout(() => {
            toast({
              title: "Account created successfully!",
              description: "Please check your email to verify your account, then sign in."
            });
          }, 7000);
          setIsLogin(true);
          setPassword("");
          setConfirmPassword("");
        }
      } else {
        // Sign in with rate limiting
        const {
          error
        } = await signIn(email, password);
        if (error) {
          // Track failed attempts
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          localStorage.setItem('hbf_login_attempts', newAttempts.toString());

          // Lock out after 5 failed attempts (2 minutes)
          if (newAttempts >= 5) {
            const lockoutTime = Date.now() + 2 * 60 * 1000; // 2 minutes
            setLockoutUntil(lockoutTime);
            localStorage.setItem('hbf_lockout_until', lockoutTime.toString());
            setAuthError(`Too many failed attempts. Please try again in 2 minutes.`);
          } else if (error.message?.includes("Invalid login credentials")) {
            setAuthError(`Invalid email or password. ${5 - newAttempts} attempts remaining.`);
          } else if (error.message?.includes("Email not confirmed")) {
            setAuthError("Please check your email and click the confirmation link before signing in.");
          } else {
            setAuthError(error.message || "Failed to sign in");
          }
        } else {
          // Successful login - reset attempts and save preferences
          setLoginAttempts(0);
          localStorage.removeItem('hbf_login_attempts');
          localStorage.removeItem('hbf_lockout_until');

          // Handle remember me
          if (rememberMe) {
            localStorage.setItem('hbf_remembered_email', email);
          } else {
            localStorage.removeItem('hbf_remembered_email');
          }

          // Save last login time
          localStorage.setItem('hbf_last_login', new Date().toISOString());
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in."
          });
        }
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };
  // Get safe redirect URL - only allow known production/preview domains
  const getSafeRedirectUrl = (): string => {
    const origin = window.location.origin;
    // Allow Lovable preview domains, localhost for dev, and common production patterns
    const allowedPatterns = [/^https:\/\/[a-z0-9-]+\.lovable\.app$/, /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/, /^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];
    if (allowedPatterns.some(pattern => pattern.test(origin))) {
      return `${origin}/`;
    }
    // Fallback to a safe default - the current origin if it's HTTPS
    if (origin.startsWith('https://')) {
      return `${origin}/`;
    }
    // Last resort - return empty to let Supabase use configured default
    return '';
  };
  const handleMicrosoftSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = getSafeRedirectUrl();
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: redirectTo ? {
          redirectTo
        } : undefined
      });
      if (error) {
        setAuthError(error.message || "Failed to sign in with Microsoft");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = getSafeRedirectUrl();
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? {
          redirectTo
        } : undefined
      });
      if (error) {
        setAuthError(error.message || "Failed to sign in with Google");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };
  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = getSafeRedirectUrl();
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: redirectTo ? {
          redirectTo
        } : undefined
      });
      if (error) {
        setAuthError(error.message || "Failed to sign in with Apple");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };
  const handleLinkedInSignIn = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const redirectTo = getSafeRedirectUrl();
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: redirectTo ? {
          redirectTo
        } : undefined
      });
      if (error) {
        setAuthError(error.message || "Failed to sign in with LinkedIn");
      }
    } catch (err) {
      setAuthError("An unexpected error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setAuthError("");
  };
  const switchMode = (mode: string) => {
    setIsLogin(mode === "login");
    resetForm();
  };

  // Show auth forms for unauthenticated users - IBM-style login
  if (!authenticated) {
    return <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-black px-4 sm:px-6 py-4">
          <a href="https://halobusinessfinance.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">HBF</span>
            </div>
            <span className="text-lg sm:text-xl font-semibold text-white">Halo Business Finance</span>
          </a>
        </header>

        {/* Main Content - Two Column Layout */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left Column - Login Form */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pt-8 pb-2 sm:pt-12 sm:pb-3 bg-white">
            <div className="w-full max-w-md">
              {/* Welcome back message for returning users */}
              {isLogin && returningUser && <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Welcome back!</p>
                      <p className="text-xs text-blue-700">
                        Last login: {new Date(returningUser).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                      </p>
                    </div>
                  </div>
                </div>}

              {/* Lockout warning */}
              {isLockedOut && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Account temporarily locked</p>
                      <p className="text-xs text-red-700">
                        Try again in {formatLockoutTime(lockoutUntil! - Date.now())}
                      </p>
                    </div>
                  </div>
                </div>}

              {/* Header with title and signup link */}
              <div className="mb-8">
                <h1 className="text-xl font-normal text-gray-900 mb-3">
                  {isLogin ? "Log in to your account" : "Create your account"}
                </h1>
                <p className="text-gray-600">
                  {isLogin ? <>
                      Don't have an account?{" "}
                      <button type="button" onClick={() => switchMode("signup")} className="text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                        Create an account
                      </button>
                    </> : <>
                      Already have an account?{" "}
                      <button type="button" onClick={() => switchMode("login")} className="text-blue-600 hover:text-blue-700 font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                        Sign in
                      </button>
                    </>}
                </p>
              </div>

              {/* Separator line */}
              <div className="border-t border-gray-200 mb-8" />

              <form onSubmit={handleAuthSubmit} className="space-y-6">
                {!isLogin && <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm text-blue-600 mb-2 block">
                        First name
                      </Label>
                      <Input id="firstName" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={authLoading || isLockedOut} className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-0 transition-colors" />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm text-blue-600 mb-2 block">
                        Last name
                      </Label>
                      <Input id="lastName" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={authLoading || isLockedOut} className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-0 transition-colors" />
                    </div>
                  </div>}

                <div className="max-w-sm">
                  <Label htmlFor="email" className="text-sm text-blue-600 mb-2 block">
                    Email
                  </Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={authLoading || isLockedOut} className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-0 transition-colors" />
                </div>

                <div className="max-w-sm">
                  <Label htmlFor="password" className="text-sm text-blue-600 mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required disabled={authLoading || isLockedOut} className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-0 pr-12 transition-colors" />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded" onClick={() => setShowPassword(!showPassword)} disabled={authLoading}>
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-500" /> : <Eye className="h-5 w-5 text-gray-500" />}
                    </Button>
                  </div>
                </div>

                {!isLogin && <div className="max-w-sm">
                    <Label htmlFor="confirmPassword" className="text-sm text-blue-600 mb-2 block">
                      Confirm password
                    </Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={authLoading || isLockedOut} className="h-12 bg-white border-0 border-b-2 border-gray-300 rounded-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 px-0 transition-colors" />
                  </div>}

                {/* Continue Button with loading animation */}
                <Button type="submit" className="max-w-xs h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium justify-between px-3 rounded-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50" disabled={authLoading || isLockedOut}>
                  <span className="flex items-center gap-2">
                    {authLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {authLoading ? "Signing in..." : "Continue"}
                  </span>
                  {!authLoading && <ArrowRight className="h-4 w-4" />}
                </Button>

                {isLogin && <div className="flex items-center gap-2">
                    <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="w-4 h-4 border-2 border-gray-400 rounded-sm text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 cursor-pointer" />
                    <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer select-none">
                      Remember me
                    </label>
                    <div className="relative group">
                      <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path strokeWidth="2" d="M12 16v-4m0-4h.01" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        Stay signed in on this device for 30 days
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>}

                {/* Rate limit warning */}
                {loginAttempts > 0 && loginAttempts < 5 && !isLockedOut && <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{5 - loginAttempts} login attempts remaining</span>
                  </div>}

                {authError && <Alert variant="destructive">
                    <AlertDescription>{authError}</AlertDescription>
                  </Alert>}
              </form>

              {/* Alternative login section */}
              <div className="mt-8 text-center">
                <p className="text-sm text-blue-600 mb-3">Alternative login</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <Button type="button" variant="outline" className="h-14 w-14 sm:h-12 sm:w-12 border-gray-300 hover:bg-gray-50 active:bg-gray-100 p-0 rounded-none flex items-center justify-center touch-manipulation" onClick={handleLinkedInSignIn} disabled={authLoading} title="Continue with LinkedIn">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="#0A66C2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </Button>
                  <Button type="button" variant="outline" className="h-14 w-14 sm:h-12 sm:w-12 border-gray-300 hover:bg-gray-50 active:bg-gray-100 p-0 rounded-none flex items-center justify-center touch-manipulation" onClick={handleGoogleSignIn} disabled={authLoading} title="Continue with Google">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path d="M23.498 12.275c0-.813-.073-1.594-.21-2.347H12v4.437h6.437c-.278 1.49-1.121 2.752-2.39 3.598v2.989h3.867c2.265-2.083 3.571-5.15 3.571-8.677z" fill="#4285F4" />
                      <path d="M12 24c3.24 0 5.957-1.075 7.942-2.913l-3.867-2.99c-1.075.72-2.45 1.145-4.075 1.145-3.132 0-5.785-2.115-6.735-4.952H1.248v3.086C3.215 21.318 7.289 24 12 24z" fill="#34A853" />
                      <path d="M5.265 14.29c-.242-.72-.38-1.49-.38-2.29s.138-1.57.38-2.29V6.623H1.248C.455 8.216 0 10.054 0 12s.455 3.784 1.248 5.377l4.017-3.087z" fill="#FBBC05" />
                      <path d="M12 4.758c1.765 0 3.35.606 4.596 1.796l3.447-3.447C17.953 1.142 15.24 0 12 0 7.289 0 3.215 2.682 1.248 6.623l4.017 3.087c.95-2.837 3.603-4.952 6.735-4.952z" fill="#EA4335" />
                    </svg>
                  </Button>
                  <Button type="button" variant="outline" className="h-14 w-14 sm:h-12 sm:w-12 border-gray-300 hover:bg-gray-50 active:bg-gray-100 p-0 rounded-none flex items-center justify-center touch-manipulation" onClick={handleAppleSignIn} disabled={authLoading} title="Continue with Apple">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 384 512">
                      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                    </svg>
                  </Button>
                  <Button type="button" variant="outline" className="h-14 w-14 sm:h-12 sm:w-12 border-gray-300 hover:bg-gray-50 active:bg-gray-100 p-0 rounded-none flex items-center justify-center touch-manipulation" onClick={handleMicrosoftSignIn} disabled={authLoading} title="Continue with Microsoft">
                    <svg className="w-6 h-6 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#00A4EF" d="M1 13h10v10H1z" />
                      <path fill="#7FBA00" d="M13 1h10v10H13z" />
                      <path fill="#FFB900" d="M13 13h10v10H13z" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Footer links */}
              {isLogin && <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-700">
                    Forgot password?{" "}
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
                      Reset your password
                    </button>
                  </p>
                </div>}

              {/* Security badges */}
              <div className="mt-6 pt-4 border-t border-0 border-white py-0 my-0">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                    <span>Licensed & Regulated Lending Partners</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-green-600" />
                    <span>256-bit SSL Encryption</span>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Decorative Geometric Shapes */}
          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden items-center justify-center">
            {/* Geometric shapes */}
            <div className="absolute inset-0">
              {/* Large circle - centered */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border-2 border-white/20" />
              
              {/* Medium circle */}
              <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-white/10" />
              
              {/* Small filled circle */}
              <div className="absolute top-1/3 left-1/3 w-32 h-32 rounded-full bg-blue-400/30" />
              
              
              {/* Dots pattern */}
              <div className="absolute top-10 right-10 grid grid-cols-4 gap-4">
                {Array.from({
                length: 16
              }).map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-white/30" />)}
              </div>
              
              {/* Lines */}
              <div className="absolute bottom-20 left-20 space-y-3">
                <div className="w-32 h-0.5 bg-white/20" />
                <div className="w-24 h-0.5 bg-white/20" />
                <div className="w-16 h-0.5 bg-white/20" />
              </div>
            </div>

            {/* Center content */}
            <div className="relative z-10 text-center text-white px-12 -mt-16">
              <p className="text-2xl font-bold tracking-wider mb-2 text-white">Welcome to our</p>
              <h1 className="text-2xl font-bold mb-4 text-white">Commercial Loan Marketplace</h1>
              <div className="flex items-center justify-center gap-8 text-sm text-white mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>Fast Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>Low Rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-white" />
                  <span>Expert Support</span>
                </div>
              </div>
              <h2 className="text-base font-medium drop-shadow-md text-white">Business Financing Made Simple</h2>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <span className="text-center sm:text-left text-black">
              © {new Date().getFullYear()} Halo Business Finance.
              <span className="block sm:inline"> All rights reserved.</span>
            </span>
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors text-black">Privacy Policy</a>
              <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors text-black">Terms of Service</a>
              <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors text-black">Support</a>
            </div>
          </div>
        </footer>
      </div>;
  }
  return <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-10 bg-white border-0">
        <main>
        {/* Dashboard for Authenticated Users */}
        {authenticated && !selectedLoanType && <DashboardView />}

        {/* Back Button */}
        {selectedLoanType && <div className="mb-8 animate-slide-up">
            <Alert className="border-border bg-background">
              <AlertDescription className="flex items-center justify-between">
                <Button variant="ghost" onClick={handleBackToHome} className="p-0 h-auto text-foreground hover:text-foreground/80 font-semibold group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Return to Loan Types
                </Button>
                <span className="text-sm text-foreground">
                  Your progress will be saved as a draft
                </span>
              </AlertDescription>
            </Alert>
          </div>}

        {/* Loan Type Selection */}
        {!selectedLoanType && <Card className="mb-12 border shadow-sm animate-scale-in">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                Choose Your Financing Solution
              </CardTitle>
              <CardDescription className="text-base text-slate-50">
                Select the loan type that best fits your business needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loanPrograms.map((program, index) => {
                  const IconComponent = program.icon;
                  const isComingSoon = ![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(program.id);
                  return <Card key={program.id} className={`cursor-pointer transition-all duration-200 flex flex-col h-full border ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg hover:border-primary/50'}`} style={{
                    animationDelay: `${index * 50}ms`
                  }}>
                      <CardContent className="p-5 flex-1 flex flex-col bg-blue-950">
                        {/* Icon and Title */}
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-transparent">
                            <IconComponent className="w-6 h-6 text-slate-50" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-base mb-1 leading-tight text-slate-50">
                              {program.title}
                            </h3>
                            <p className="text-xs leading-snug line-clamp-2 text-slate-50">
                              {program.description}
                            </p>
                          </div>
                        </div>

                        {/* Rate Badge */}
                        <div className="mb-4 pb-4 border-b">
                          <div className="text-2xl font-bold mb-1 text-slate-50">
                            {program.badge}
                          </div>
                          <div className="text-xs text-slate-50">
                            Starting Rate
                          </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 mb-4 flex-1 text-slate-50">
                          <div className="text-xs text-slate-50">
                            <span className="font-medium text-slate-50">
                              {program.details?.split('|')[0]?.trim() || 'Contact for details'}
                            </span>
                          </div>
                          {program.details?.split('|').slice(1, 3).map((detail, i) => <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                              <span className="line-clamp-1 text-slate-50">{detail.trim()}</span>
                            </div>)}
                        </div>

                        {/* Apply Button */}
                        <Button className="w-full" size="sm" onClick={() => !isComingSoon && handleLoanTypeSelect(program.id)} disabled={isComingSoon}>
                          {isComingSoon ? 'Coming Soon' : 'Apply Now'}
                        </Button>
                      </CardContent>
                    </Card>;
                })}
              </div>
            </CardContent>
          </Card>}

        {/* Loan Application Forms */}
        {selectedLoanType && <div className="space-y-6 animate-fade-in">
            {/* Active Forms */}
            {selectedLoanType === 1 && <SBA7aLoanForm />}
            {selectedLoanType === 2 && <SBA504LoanForm />}
            {selectedLoanType === 3 && <USDABILoanForm />}
            {selectedLoanType === 4 && <BridgeLoanForm />}
            {selectedLoanType === 5 && <ConventionalLoanForm />}
            {selectedLoanType === 6 && <EquipmentFinancingForm />}
            {selectedLoanType === 7 && <WorkingCapitalForm />}
            {selectedLoanType === 8 && <BusinessLineOfCreditForm />}
            {selectedLoanType === 9 && <TermLoanForm />}
            {selectedLoanType === 10 && <InvoiceFactoringForm />}
            {selectedLoanType === 11 && <RefinanceForm />}
            {selectedLoanType === 12 && <SBAExpressLoanForm />}
            
            {/* Coming Soon Forms */}
            {selectedLoanType === 1 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">SBA 7(a) Loan Application</CardTitle>
                  <CardDescription className="text-lg">
                    Versatile financing for working capital, equipment, and real estate purchases
                    <br />
                    <span className="text-sm text-muted-foreground">Prime + 2.75% Starting Rate • Up to $5M • SBA Guarantee</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 2 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">SBA 504 Loan Application</CardTitle>
                  <CardDescription className="text-lg">
                    Fixed-rate financing for real estate and major equipment purchases
                    <br />
                    <span className="text-sm text-muted-foreground">Fixed Rate Long-term • Up to $5.5M • 10% Down Payment</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 3 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">USDA B&I Loan Application</CardTitle>
                  <CardDescription className="text-lg">
                    Rural business development financing backed by USDA guarantee
                    <br />
                    <span className="text-sm text-muted-foreground">Prime + 2% Starting Rate • Up to $25M • Rural Focus • Job Creation Requirements</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 5 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Conventional Loan Application</CardTitle>
                  <CardDescription className="text-lg">
                    Traditional commercial financing for established businesses
                    <br />
                    <span className="text-sm text-muted-foreground">5.25% Starting APR • No Government Guarantee • Fast Approval</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 6 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Equipment Financing Application</CardTitle>
                  <CardDescription className="text-lg">
                    Fund new or used equipment purchases with competitive terms
                    <br />
                    <span className="text-sm text-muted-foreground">6.25% Starting APR • 100% Financing Available • Fast Approval</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 8 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Business Line of Credit Application</CardTitle>
                  <CardDescription className="text-lg">
                    Flexible access to capital when you need it with revolving credit lines
                    <br />
                    <span className="text-sm text-muted-foreground">Prime + 2% Starting Rate • Draw as Needed • Revolving Credit</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
            {selectedLoanType === 9 && <Card className="shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Banknote className="w-8 h-8 text-accent" />
                  </div>
                  <CardTitle className="text-2xl">Term Loan Application</CardTitle>
                  <CardDescription className="text-lg">
                    Fixed-rate business loans for major investments and growth initiatives
                    <br />
                    <span className="text-sm text-muted-foreground">5.75% Starting APR • Fixed Monthly Payments • Quick Approval</span>
                  </CardDescription>
                </CardHeader>
              </Card>}
          </div>}

      </main>
      </div>
    </div>
    </Layout>;
};
export default Index;