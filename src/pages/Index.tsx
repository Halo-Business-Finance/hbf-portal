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
import { ArrowLeft, HelpCircle, LogIn, Home, Building2, CreditCard, Store, Banknote, TrendingUp, Sparkles, CheckCircle, ArrowRight, Shield, Building, Settings, HardHat, Handshake, FileText, RotateCcw, Zap, DollarSign, Clock, Eye, EyeOff } from "lucide-react";
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
  const dashboardSections = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-4">
          <QuickActions />
          <DashboardOverview />
          <DashboardCharts userId={user?.id} />
        </div>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      content: (
        <div className="space-y-4">
          <ApplicationProgressTracker currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <EstimatedTimeline currentStatus={stats.pendingReview > 0 ? 'under_review' : stats.totalApplications > 0 ? 'submitted' : 'draft'} />
          <DocumentChecklist userId={user?.id} />
        </div>
      ),
    },
    {
      id: 'financial',
      label: 'Financial',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Bank Accounts</h2>
            <BankBalanceWidget />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Credit Scores</h2>
            <CreditScoreWidget />
          </div>
        </div>
      ),
    },
    {
      id: 'applications',
      label: 'Applications',
      content: (
        <div className="space-y-4">
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
      ),
    },
  ];

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
        // Sign in
        const {
          error
        } = await signIn(email, password);
        if (error) {
          if (error.message?.includes("Invalid login credentials")) {
            setAuthError("Invalid email or password. Please check your credentials and try again.");
          } else if (error.message?.includes("Email not confirmed")) {
            setAuthError("Please check your email and click the confirmation link before signing in.");
          } else {
            setAuthError(error.message || "Failed to sign in");
          }
        } else {
          toast({
            title: "Welcome!",
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
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Blue accent bar at top */}
        <div className="h-1 bg-primary w-full" />
        
        {/* Header with logo */}
        <header className="px-6 py-4 border-b border-border/30">
          <div className="max-w-7xl mx-auto">
            <a href="https://halobusinessfinance.com" className="text-xl font-bold text-foreground tracking-tight whitespace-nowrap hover:opacity-80 transition-opacity">Halo Business Finance</a>
          </div>
        </header>

        {/* Main content - two column layout */}
        <main className="flex-1 flex">
          <div className="flex w-full max-w-7xl mx-auto">
            {/* Left side - Login form */}
            <div className="w-full lg:w-[45%] px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
              <div className="max-w-md">
                <h1 className="text-base sm:text-lg lg:text-xl font-light text-foreground mb-2 whitespace-nowrap">
                  Log in to your account
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(false)}
                    className="text-primary hover:underline font-medium"
                  >
                    Create an account
                  </button>
                </p>

                <div className="h-px bg-border mb-8" />

                {isLogin ? (
                  <form onSubmit={handleAuthSubmit} className="space-y-6">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={authLoading}
                        className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={authLoading}
                          className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 pr-12 focus-visible:ring-0 focus-visible:border-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={authLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {authError && (
                      <Alert variant="destructive" className="rounded-none">
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-normal text-base flex items-center justify-between px-4"
                      disabled={authLoading}
                    >
                      <span>{authLoading ? "Signing in..." : "Continue"}</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <Label htmlFor="remember" className="text-sm font-normal text-foreground cursor-pointer">
                        Remember me
                      </Label>
                      <button type="button" className="ml-1 text-muted-foreground hover:text-foreground">
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="h-px bg-border my-6" />

                    <div className="space-y-3">
                      <p className="text-xs font-normal text-muted-foreground">Alternative login</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-none border-2 border-border bg-white hover:bg-muted/20 text-primary font-normal justify-between px-4"
                        onClick={handleGoogleSignIn}
                        disabled={authLoading}
                      >
                        <span>Continue with Google</span>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-none border-2 border-border bg-white hover:bg-muted/20 text-foreground font-normal justify-between px-4"
                        onClick={handleMicrosoftSignIn}
                        disabled={authLoading}
                      >
                        <span>Continue with Microsoft</span>
                        <svg className="w-5 h-5" viewBox="0 0 23 23">
                          <path fill="#f35325" d="M1 1h10v10H1z"/>
                          <path fill="#81bc06" d="M12 1h10v10H12z"/>
                          <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                          <path fill="#ffba08" d="M12 12h10v10H12z"/>
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-none border-2 border-border bg-white hover:bg-muted/20 text-foreground font-normal justify-between px-4"
                        onClick={handleAppleSignIn}
                        disabled={authLoading}
                      >
                        <span>Continue with Apple</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 384 512">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                        </svg>
                      </Button>
                    </div>

                    <div className="h-px bg-border my-6" />

                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="firstName" className="text-xs font-normal text-muted-foreground">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          disabled={authLoading}
                          className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 focus-visible:ring-0 focus-visible:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="lastName" className="text-xs font-normal text-muted-foreground">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          disabled={authLoading}
                          className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 focus-visible:ring-0 focus-visible:border-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="business" className="text-xs font-normal text-muted-foreground">
                        Business Name
                      </Label>
                      <Input
                        id="business"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        disabled={authLoading}
                        className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-email" className="text-xs font-normal text-muted-foreground">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={authLoading}
                        className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 focus-visible:ring-0 focus-visible:border-primary"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="signup-password" className="text-xs font-normal text-muted-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={authLoading}
                          className="h-12 rounded-none border-0 border-b-2 border-border bg-muted/30 px-3 pr-12 focus-visible:ring-0 focus-visible:border-primary"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={authLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <Eye className="h-5 w-5 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {authError && (
                      <Alert variant="destructive" className="rounded-none">
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-normal text-base flex items-center justify-between px-4"
                      disabled={authLoading}
                    >
                      <span>{authLoading ? "Creating account..." : "Create Account"}</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>

                    <p className="text-sm text-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Right side - Decorative illustration */}
            <div className="hidden lg:flex lg:w-[55%] items-center justify-center p-12 relative overflow-hidden">
              {/* Abstract geometric pattern inspired by IBM */}
              <svg
                className="w-full h-full max-w-2xl"
                viewBox="0 0 600 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Grid dots */}
                {Array.from({ length: 15 }).map((_, row) =>
                  Array.from({ length: 12 }).map((_, col) => (
                    <circle
                      key={`dot-${row}-${col}`}
                      cx={50 + col * 45}
                      cy={30 + row * 35}
                      r="1.5"
                      fill="hsl(var(--muted-foreground) / 0.2)"
                    />
                  ))
                )}
                
                {/* Large circle outline */}
                <circle cx="400" cy="250" r="120" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" fill="none" />
                <circle cx="400" cy="250" r="80" stroke="hsl(var(--muted-foreground) / 0.1)" strokeWidth="1" fill="none" />
                
                {/* Vertical lines */}
                <line x1="180" y1="80" x2="180" y2="420" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" />
                <line x1="320" y1="50" x2="320" y2="450" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" />
                <line x1="500" y1="100" x2="500" y2="400" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" />
                
                {/* Horizontal lines */}
                <line x1="100" y1="180" x2="550" y2="180" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" />
                <line x1="150" y1="320" x2="520" y2="320" stroke="hsl(var(--muted-foreground) / 0.15)" strokeWidth="1" />
                
                {/* Blue accent shapes */}
                <rect x="130" y="165" width="60" height="10" rx="2" fill="hsl(199 89% 70%)" />
                <circle cx="210" cy="170" r="12" fill="hsl(199 89% 60%)" />
                
                {/* Purple diamonds */}
                <rect x="295" y="215" width="30" height="30" rx="2" transform="rotate(45 310 230)" fill="hsl(270 70% 75%)" />
                <rect x="330" y="205" width="40" height="40" rx="2" transform="rotate(45 350 225)" fill="hsl(270 70% 65%)" />
                <rect x="375" y="215" width="30" height="30" rx="2" transform="rotate(45 390 230)" fill="hsl(270 70% 55%)" />
                <circle cx="420" cy="230" r="8" fill="white" stroke="hsl(270 70% 55%)" strokeWidth="2" />
                
                {/* Gray filled circle */}
                <circle cx="240" cy="280" r="20" fill="hsl(var(--muted-foreground) / 0.2)" />
                <circle cx="280" cy="280" r="8" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" fill="none" />
                
                {/* Bottom blue bar */}
                <rect x="290" y="380" width="50" height="10" rx="2" fill="hsl(199 89% 70%)" />
                <circle cx="360" y="385" r="12" fill="hsl(199 89% 60%)" />
                
                {/* Purple vertical bar */}
                <rect x="530" y="120" width="8" height="80" rx="2" fill="hsl(270 70% 65%)" />
                
                {/* Accent dots */}
                <circle cx="180" cy="100" r="6" fill="hsl(270 70% 45%)" />
                <circle cx="180" y="270" r="8" fill="hsl(var(--muted-foreground) / 0.15)" />
                <circle cx="210" cy="380" r="6" stroke="hsl(270 70% 65%)" strokeWidth="1" fill="none" />
                
                {/* Bottom gray circle */}
                <circle cx="290" cy="420" r="16" fill="hsl(var(--muted-foreground) / 0.15)" />
                <circle cx="370" cy="430" r="10" stroke="hsl(270 70% 65%)" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
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