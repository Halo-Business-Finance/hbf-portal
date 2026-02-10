/**
 * MY DASHBOARD PAGE (Route: /)
 * Main dashboard displaying:
 * - Credit scores and bank balances widgets
 * - Loan application statistics
 * - User's loan applications list
 * - New loan application forms
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { api } from '@/services/api';
import Layout from "@/components/Layout";
import Navbar from "@/components/Navbar";
import { CreditScoreWidget } from '@/components/CreditScoreWidget';
import { BankBalanceWidget } from '@/components/BankBalanceWidget';
import { DashboardOverview } from '@/components/DashboardOverview';
import { Footer } from '@/components/Footer';
import { ApplicationProgressTracker, QuickActions, OnboardingGuide, FloatingSupportButton, DocumentChecklist, EstimatedTimeline, DashboardCharts, SwipeableDashboard, LoanTypeSelector, EnterpriseDashboard } from '@/components/dashboard';
const MAX_LOGIN_ATTEMPTS = 5;
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
      const data = await api.loanApplications.listByStatus(userId, ['funded', 'approved']);
      setFundedLoans(data);
      setIsLoading(false);
    };
    fetchFundedLoans();
  }, [userId]);
  const getLoanTypeDisplay = (loanType: string) => {
    const types = {
      refinance: 'Refinance',
      bridge_loan: 'Bridge Loan',
      working_capital: 'Working Capital Loan',
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
  const navigate = useNavigate();
  const [showLoanSelector, setShowLoanSelector] = useState(false);
  const {
    user
  } = useAuth();
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) return;
      const hasApps = await api.loanApplications.hasAny(user.id);
      const hasSeenSelector = localStorage.getItem('hbf_loan_selector_seen');
      if (!hasApps && !hasSeenSelector) {
        setShowLoanSelector(true);
      }
    };
    checkFirstTimeUser();
  }, [user]);
  const handleLoanTypeSelect = (id: number) => {
    localStorage.setItem('hbf_loan_selector_seen', 'true');
  };
  const handleNewApplication = () => {
    setShowLoanSelector(true);
  };
  return <div className="space-y-4 sm:space-y-5 mb-12">
      {/* Loan Type Selector for first-time borrowers */}
      <LoanTypeSelector open={showLoanSelector} onClose={() => setShowLoanSelector(false)} onSelect={handleLoanTypeSelect} />

      {/* Onboarding Guide for new users */}
      <OnboardingGuide userId={user?.id} />

      {/* Enterprise Dashboard */}
      <EnterpriseDashboard onNewApplication={handleNewApplication} />

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
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
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

  // iOS Safari can auto-focus/autofill an input on load which triggers a page zoom.
  // Minimal safeguard: blur any focused form field and reset scroll position after auth loads.
  useEffect(() => {
    if (loading || authenticated) return;
    const ua = navigator.userAgent ?? '';
    const isIOS = /iP(hone|od|ad)/.test(ua);
    if (!isIOS) return;
    const resetViewport = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        el.blur();
      }
    };
    requestAnimationFrame(() => {
      resetViewport();
      // Some iOS versions apply focus/zoom a moment later (e.g., after autofill).
      setTimeout(resetViewport, 250);
    });
  }, [authenticated, loading]);

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
    title: "Working Capital Loan",
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

          // Lock out after MAX_LOGIN_ATTEMPTS failed attempts (2 minutes)
          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            const lockoutTime = Date.now() + 2 * 60 * 1000; // 2 minutes
            setLockoutUntil(lockoutTime);
            localStorage.setItem('hbf_lockout_until', lockoutTime.toString());
            setAuthError(`Too many failed attempts. Please try again in 2 minutes.`);
          } else if (error.message?.includes("Invalid login credentials")) {
            setAuthError(`Invalid email or password. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`);
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


  // Show auth forms for unauthenticated users - Wells Fargo style
  if (!authenticated) {
    return <div className="min-h-screen flex flex-col overflow-x-hidden" style={{
      touchAction: 'pan-y'
    }}>
        {/* Header Bar */}
        <header className="bg-black px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center">
            <a href="https://halobusinessfinance.com" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-xl sm:text-2xl font-semibold text-white uppercase tracking-wide">Halo Business Finance</span>
            </a>
          </div>
        </header>

        {/* Main Content - Background Image with Centered Card (hidden on mobile) */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 bg-white relative" style={{
        backgroundImage: 'none'
      }}>
          {/* Background image - only on md and above */}
          <div className="absolute inset-0 hidden md:block bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: "url('/login-background.jpg?v=2')"
        }} />
          {/* Overlay for better readability - hidden on mobile */}
          <div className="absolute inset-0 bg-black/10 hidden md:block" />
          
          {/* Login Card - no shadow on mobile for cleaner look */}
          <div className="relative z-10 w-full max-w-lg bg-white md:rounded-2xl md:shadow-2xl p-6 sm:p-8 md:p-10">


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

            <form onSubmit={handleAuthSubmit} className="space-y-5" aria-label={isLogin ? "Sign in form" : "Create account form"}>
              {!isLogin && <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input id="firstName" type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)} required disabled={authLoading || isLockedOut} aria-label="First name" aria-required="true" autoComplete="given-name" className="h-14 bg-white border border-gray-300 rounded-xl px-5 focus:border-gray-400 focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700" />
                  </div>
                  <div>
                    <Input id="lastName" type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)} required disabled={authLoading || isLockedOut} aria-label="Last name" aria-required="true" autoComplete="family-name" className="h-14 bg-white border border-gray-300 rounded-xl px-5 focus:border-gray-400 focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700" />
                  </div>
                </div>}

              {/* Email/User ID Input */}
              <div className="relative">
                <Input id="email" type="email" placeholder="User ID" value={email} onChange={e => setEmail(e.target.value)} required disabled={authLoading || isLockedOut} aria-label="Email address or User ID" aria-required="true" autoComplete="email" className="h-14 bg-white border border-black rounded-xl px-5 pr-12 focus:border-black focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700" />
                {email && <button type="button" onClick={() => setEmail("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full" tabIndex={-1} aria-label="Clear email field">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                      <path strokeWidth="1.5" d="M15 9l-6 6m0-6l6 6" />
                    </svg>
                  </button>}
              </div>

              {/* Password Input */}
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  key={showPassword ? "pw-text" : "pw-password"}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={authLoading || isLockedOut}
                  aria-label="Password"
                  aria-required="true"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="h-14 bg-white border border-black rounded-xl px-5 pr-16 focus:border-black focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    // Some browsers can drop the click if pointer/touch handlers call preventDefault.
                    // Keep this logic in a single onClick for maximum reliability.
                    e.preventDefault();

                    // iOS Safari can ignore password->text toggles while focused.
                    // Blur first, then toggle, then refocus after remount.
                    passwordInputRef.current?.blur();

                    const newShowState = !showPassword;
                    setShowPassword(newShowState);

                    // Track anonymous telemetry (no PII)
                    import('@/services/telemetryService').then(({ telemetryService }) => {
                      telemetryService.trackPasswordToggle(newShowState);
                    });

                    window.setTimeout(() => {
                      const el = passwordInputRef.current;
                      if (!el) return;
                      try {
                        (el as any).focus?.({ preventScroll: true });
                        const len = el.value?.length ?? 0;
                        el.setSelectionRange?.(len, len);
                      } catch {
                        // no-op
                      }
                    }, 0);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-gray-500 hover:text-gray-700 text-sm font-medium focus:outline-none focus:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
                  disabled={authLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Remember Me Checkbox */}
              {isLogin && <div className="flex items-center gap-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:border-black"
                    aria-label="Remember me"
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>}
              
              {/* Welcome back message for returning users - aligned under Remember me */}
              {isLogin && returningUser && (
                <div className="flex items-center gap-2 -mt-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex items-center gap-1 text-sm">
                    <span className="font-medium text-blue-900">Welcome back!</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      Last login: {new Date(returningUser).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {!isLogin && <div className="relative">
                  <Input id="confirmPassword" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={authLoading || isLockedOut} aria-label="Confirm password" aria-required="true" autoComplete="new-password" className="h-14 bg-white border border-gray-300 rounded-xl px-5 focus:border-gray-400 focus:ring-0 transition-colors placeholder:text-gray-400 text-gray-700" />
                </div>}

              {/* Rate limit warning */}
              {loginAttempts > 0 && loginAttempts < 5 && !isLockedOut && <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{5 - loginAttempts} login attempts remaining</span>
                </div>}

              {authError && <Alert variant="destructive">
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>}

              {/* Sign On Button */}
              <Button type="submit" variant="outline" className="w-full h-12 border-2 border-black rounded-full font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed" disabled={authLoading || isLockedOut || !email || !password}>
                {authLoading ? <span className="flex items-center gap-2 justify-center text-black font-bold">
                    <Loader2 className="h-5 w-5 animate-spin text-black" />
                    Signing in...
                  </span> : <>
                    <Lock className="h-5 w-5 text-black" strokeWidth={2.5} />
                    <span className="text-black font-bold">{isLogin ? "Sign In" : "Create account"}</span>
                  </>}
              </Button>

              {/* Divider */}
              <div className="text-center text-gray-500 text-sm">
                or continue with
              </div>

              {/* Social Login Icon Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button type="button" variant="outline" className="h-12 w-12 border-2 border-black rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleGoogleSignIn} disabled={authLoading} aria-label="Sign in with Google">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M23.498 12.275c0-.813-.073-1.594-.21-2.347H12v4.437h6.437c-.278 1.49-1.121 2.752-2.39 3.598v2.989h3.867c2.265-2.083 3.571-5.15 3.571-8.677z" fill="#4285F4" />
                    <path d="M12 24c3.24 0 5.957-1.075 7.942-2.913l-3.867-2.99c-1.075.72-2.45 1.145-4.075 1.145-3.132 0-5.785-2.115-6.735-4.952H1.248v3.086C3.215 21.318 7.289 24 12 24z" fill="#34A853" />
                    <path d="M5.265 14.29c-.242-.72-.38-1.49-.38-2.29s.138-1.57.38-2.29V6.623H1.248C.455 8.216 0 10.054 0 12s.455 3.784 1.248 5.377l4.017-3.087z" fill="#FBBC05" />
                    <path d="M12 4.758c1.765 0 3.35.606 4.596 1.796l3.447-3.447C17.953 1.142 15.24 0 12 0 7.289 0 3.215 2.682 1.248 6.623l4.017 3.087c.95-2.837 3.603-4.952 6.735-4.952z" fill="#EA4335" />
                  </svg>
                </Button>

                <Button type="button" variant="outline" className="h-12 w-12 border-2 border-black rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleAppleSignIn} disabled={authLoading} aria-label="Sign in with Apple">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black" aria-hidden="true">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </Button>

                <Button type="button" variant="outline" className="h-12 w-12 border-2 border-black rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleMicrosoftSignIn} disabled={authLoading} aria-label="Sign in with Microsoft">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#F25022" d="M1 1h10v10H1z" />
                    <path fill="#00A4EF" d="M1 13h10v10H1z" />
                    <path fill="#7FBA00" d="M13 1h10v10H13z" />
                    <path fill="#FFB900" d="M13 13h10v10H13z" />
                  </svg>
                </Button>

                <Button type="button" variant="outline" className="h-12 w-12 border-2 border-black rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" onClick={handleLinkedInSignIn} disabled={authLoading} aria-label="Sign in with LinkedIn">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </Button>
              </div>

              {/* Sign up / Sign in toggle */}
              <div className="text-center text-sm text-black pt-2 px-4">
                {isLogin ? <>
                    Don't have an account?{" "}
                    <button type="button" onClick={() => switchMode("signup")} className="text-black hover:text-gray-700 font-medium hover:underline focus:outline-none">
                      Create one
                    </button>
                  </> : <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => switchMode("login")} className="text-black hover:text-gray-700 font-medium hover:underline focus:outline-none">
                      Sign in
                    </button>
                  </>}
              </div>
            </form>

            {/* Forgot Password Link */}
            {isLogin && <div className="mt-8 text-center px-4">
                <button type="button" onClick={() => navigate('/forgot-password')} className="inline-flex items-center gap-2 text-black hover:text-gray-700 text-sm font-medium hover:underline focus:outline-none">
                  <ArrowRight className="w-4 h-4" />
                  Forgot User ID or Password?
                </button>
              </div>}
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-20 bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between text-xs sm:text-sm text-black">
            <span className="text-center order-2 sm:order-1 sm:text-left">
              © {new Date().getFullYear()} Halo Business Finance. All rights reserved.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 order-1 sm:order-2">
              <a href="https://halobusinessfinance.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Privacy</a>
              <a href="https://halobusinessfinance.com/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Terms</a>
              <a href="https://halobusinessfinance.com/technical-support" target="_blank" rel="noopener noreferrer" className="text-black hover:underline transition-colors">Support</a>
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                <span>Secured</span>
              </div>
            </div>
          </div>
        </footer>
      </div>;
  }
  return <Layout>
      <div className="bg-background">
        <div className="max-w-7xl mx-auto bg-white border-0 px-0 py-0">
        <main>
        {/* Dashboard for Authenticated Users */}
        {!selectedLoanType && <DashboardView />}

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