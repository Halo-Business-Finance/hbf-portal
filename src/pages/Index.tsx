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
import { ApplicationProgressTracker, QuickActions, OnboardingGuide, FloatingSupportButton, DocumentChecklist, EstimatedTimeline, DashboardCharts } from '@/components/dashboard';
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

  // Show auth forms for unauthenticated users
  if (!authenticated && !loading) {
    return <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 py-0">
          <div className="max-w-7xl mx-auto px-6 bg-white">
            <main>
          {/* Header with Stats */}
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-xl sm:text-2xl font-bold text-black my-[10px] py-0 mb-0 mt-px pb-px pt-[20px]">
               Nationwide SBA & Commercial Loan Marketplace                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

            </p>
            <h1 className="text-base sm:text-xl font-bold tracking-tight mb-4 text-black">
              Comprehensive Business Financing Solutions
            </h1>
            <p className="text-sm max-w-3xl mx-auto mb-10 leading-relaxed text-black">
              We provide credit, financing, treasury and payment solutions to help your business succeed. 
              Discover our comprehensive range of SBA-backed and conventional financing options designed to fuel your business growth.
            </p>
          </div>

          {/* Company Stats - Above Auth Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <Card className="p-6 border-0">
              <div className="text-2xl font-bold mb-1 text-white">$1 Billion+</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Funding Provided</div>
            </Card>
            <Card className="p-6 border-0">
              <div className="text-2xl font-bold mb-1 text-white">95%</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Loan Approval Rate</div>
            </Card>
            <Card className="p-6 border-0">
              <div className="text-2xl font-bold mb-1 text-white">24 Hours</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">Avg Loan Processing</div>
            </Card>
          </div>

          {/* Auth Card */}
          <div className="px-6 w-full flex justify-center">
          <Card className="max-w-md w-full shadow-lg">
            <CardHeader className="text-center pb-3 pt-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Welcome to Halo Business Finance
              </h2>
              <p className="text-sm text-foreground">
                Sign in to your account
              </p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <Tabs value={isLogin ? "login" : "signup"} onValueChange={switchMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="login" className="text-sm py-1">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm py-1 border-2 border-blue-500 rounded-md">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-0">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground font-normal text-sm">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={authLoading} className="h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground font-normal text-sm">Password</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={authLoading} className="h-10 pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={authLoading} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>

                    {authError && <Alert variant="destructive">
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>}

                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={authLoading}>
                      {authLoading ? "Signing in..." : "Sign In"}
                    </Button>
                    
                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-foreground tracking-wider">
                          OR CONTINUE WITH
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign in with Google">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 12.275c0-.813-.073-1.594-.21-2.347H12v4.437h6.437c-.278 1.49-1.121 2.752-2.39 3.598v2.989h3.867c2.265-2.083 3.571-5.15 3.571-8.677z" fill="#4285F4" />
                          <path d="M12 24c3.24 0 5.957-1.075 7.942-2.913l-3.867-2.99c-1.075.72-2.45 1.145-4.075 1.145-3.132 0-5.785-2.115-6.735-4.952H1.248v3.086C3.215 21.318 7.289 24 12 24z" fill="#34A853" />
                          <path d="M5.265 14.29c-.242-.72-.38-1.49-.38-2.29s.138-1.57.38-2.29V6.623H1.248C.455 8.216 0 10.054 0 12s.455 3.784 1.248 5.377l4.017-3.087z" fill="#FBBC05" />
                          <path d="M12 4.758c1.765 0 3.35.606 4.596 1.796l3.447-3.447C17.953 1.142 15.24 0 12 0 7.289 0 3.215 2.682 1.248 6.623l4.017 3.087c.95-2.837 3.603-4.952 6.735-4.952z" fill="#EA4335" />
                        </svg>
                      </Button>

                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign in with Apple">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 384 512">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                      </Button>

                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign in with X (Twitter)">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.145 12.086c.007.206.01.412.01.62 0 6.337-4.824 10.81-13.615 10.81-2.711 0-5.234-.78-7.354-2.116.375.041.756.062 1.142.062 2.244 0 4.309-.757 5.954-2.03-2.098-.038-3.868-1.416-4.478-3.307.293.056.593.086.902.086.437 0 .86-.058 1.262-.167-2.189-.439-3.838-2.364-3.838-4.673v-.061c.645.356 1.383.57 2.169.595-1.284-.853-2.128-2.313-2.128-3.963 0-.874.237-1.693.65-2.397 2.359 2.883 5.887 4.78 9.864 4.979-.082-.348-.124-.711-.124-1.084 0-2.624 2.138-4.755 4.773-4.755 1.373 0 2.613.575 3.484 1.495 1.088-.213 2.11-.61 3.034-1.155-.357 1.106-1.114 2.035-2.099 2.621.967-.115 1.887-.369 2.742-.746-.64.955-1.448 1.794-2.38 2.467z" />
                        </svg>
                      </Button>
                    </div>

                    <div className="text-center">
                      <Button type="button" variant="link" className="text-xs text-foreground" onClick={() => navigate('/forgot-password')}>
                        Forgot your password?
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-0">
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-foreground font-normal text-sm">First Name</Label>
                        <Input id="firstName" placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={authLoading} className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-foreground font-normal text-sm">Last Name</Label>
                        <Input id="lastName" placeholder="Smith" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={authLoading} className="h-10" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="business" className="text-foreground font-normal text-sm">Business Name</Label>
                      <Input id="business" placeholder="Your Business LLC" value={businessName} onChange={e => setBusinessName(e.target.value)} required disabled={authLoading} className="h-10" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-foreground font-normal text-sm">Email</Label>
                      <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={authLoading} className="h-10" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-foreground font-normal text-sm">Password</Label>
                      <div className="relative">
                        <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required disabled={authLoading} className="h-10 pr-10" />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-10 px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={authLoading} aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </div>
                    </div>

                    {authError && <Alert variant="destructive">
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>}

                    <Button type="submit" className="w-full h-11 text-base font-medium border-2 border-blue-500" disabled={authLoading}>
                      {authLoading ? "Creating Account..." : "Create Account"}
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-3 text-foreground tracking-wider">
                          OR CONTINUE WITH
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign up with Google">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 12.275c0-.813-.073-1.594-.21-2.347H12v4.437h6.437c-.278 1.49-1.121 2.752-2.39 3.598v2.989h3.867c2.265-2.083 3.571-5.15 3.571-8.677z" fill="#4285F4" />
                          <path d="M12 24c3.24 0 5.957-1.075 7.942-2.913l-3.867-2.99c-1.075.72-2.45 1.145-4.075 1.145-3.132 0-5.785-2.115-6.735-4.952H1.248v3.086C3.215 21.318 7.289 24 12 24z" fill="#34A853" />
                          <path d="M5.265 14.29c-.242-.72-.38-1.49-.38-2.29s.138-1.57.38-2.29V6.623H1.248C.455 8.216 0 10.054 0 12s.455 3.784 1.248 5.377l4.017-3.087z" fill="#FBBC05" />
                          <path d="M12 4.758c1.765 0 3.35.606 4.596 1.796l3.447-3.447C17.953 1.142 15.24 0 12 0 7.289 0 3.215 2.682 1.248 6.623l4.017 3.087c.95-2.837 3.603-4.952 6.735-4.952z" fill="#EA4335" />
                        </svg>
                      </Button>

                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign up with Apple">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 384 512">
                          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                        </svg>
                      </Button>

                      <Button type="button" variant="outline" className="w-full h-10" disabled={authLoading} aria-label="Sign up with X (Twitter)">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.145 12.086c.007.206.01.412.01.62 0 6.337-4.824 10.81-13.615 10.81-2.711 0-5.234-.78-7.354-2.116.375.041.756.062 1.142.062 2.244 0 4.309-.757 5.954-2.03-2.098-.038-3.868-1.416-4.478-3.307.293.056.593.086.902.086.437 0 .86-.058 1.262-.167-2.189-.439-3.838-2.364-3.838-4.673v-.061c.645.356 1.383.57 2.169.595-1.284-.853-2.128-2.313-2.128-3.963 0-.874.237-1.693.65-2.397 2.359 2.883 5.887 4.78 9.864 4.979-.082-.348-.124-.711-.124-1.084 0-2.624 2.138-4.755 4.773-4.755 1.373 0 2.613.575 3.484 1.495 1.088-.213 2.11-.61 3.034-1.155-.357 1.106-1.114 2.035-2.099 2.621.967-.115 1.887-.369 2.742-.746-.64.955-1.448 1.794-2.38 2.467z" />
                        </svg>
                      </Button>
                    </div>

                    <div className="text-center">
                      <Button type="button" variant="link" className="text-xs text-foreground" onClick={() => navigate('/forgot-password')}>
                        Forgot your password?
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          </div>
          
          {/* Terms text below card */}
          <p className="text-center text-sm text-foreground mt-6 max-w-xl mx-auto">
            By signing up, you agree to our{" "}
            <a href="/terms" className="hover:underline text-white">
              terms of service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="hover:underline text-white">
              privacy policy
            </a>
            .
          </p>

            </main>
          </div>
        </div>
        <Footer />
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