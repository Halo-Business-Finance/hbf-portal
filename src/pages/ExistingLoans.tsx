import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from '@/components/ui/modern-tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { restQuery } from '@/services/supabaseHttp';
import { authProvider } from '@/services/auth';
import { toast } from 'sonner';
import { 
  Wallet, 
  Building2, 
  DollarSign, 
  Calendar, 
  Percent, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';

interface ExistingLoan {
  id: string;
  loanType: 'commercial' | 'business';
  loanName: string;
  lender: string;
  loanBalance: number;
  originalAmount: number;
  monthlyPayment: number;
  interestRate: number;
  termMonths: number;
  remainingMonths: number;
  maturityDate: string;
  originationDate: string;
  hasPrepaymentPenalty: boolean;
  prepaymentPeriodEndDate?: string;
  status: 'current' | 'funded_by_us' | 'partner_funded';
  loanPurpose: string;
}

const ExistingLoans = () => {
  const { authenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingData, setLoadingData] = useState(true);
  const [commercialLoans, setCommercialLoans] = useState<ExistingLoan[]>([]);
  const [businessLoans, setBusinessLoans] = useState<ExistingLoan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('balance_desc');

  useEffect(() => {
    if (!loading && !authenticated) {
      navigate('/');
      return;
    }

    if (authenticated) {
      loadExistingLoans();
    }
  }, [authenticated, loading, navigate]);

  const loadExistingLoans = async () => {
    try {
      const { data, error: authError } = await authProvider.getUser();
      const user = data?.user;
      
      if (!user) {
        toast.error('Please log in to view your loans');
        return;
      }

      // Fetch funded loan applications
      const params = new URLSearchParams();
      params.set('user_id', `eq.${user.id}`);
      params.set('status', 'eq.funded');
      params.set('order', 'funded_date.desc');
      const { data: fundedApplications } = await restQuery<any[]>('loan_applications', { params });

      // Transform funded applications to ExistingLoan format
      const transformedLoans: ExistingLoan[] = (fundedApplications || []).map(app => {
        const loanDetails = app.loan_details as any || {};
        return {
          id: app.id,
          loanType: 'commercial' as 'commercial' | 'business',
          loanName: `${app.loan_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} - ${app.business_name || 'Business Loan'}`,
          lender: 'Halo Business Finance',
          loanBalance: Number(app.amount_requested || 0),
          originalAmount: Number(app.amount_requested || 0),
          monthlyPayment: Number(loanDetails.monthly_payment || 0),
          interestRate: Number(loanDetails.interest_rate || 0),
          termMonths: Number(loanDetails.term_months || 0),
          remainingMonths: Number(loanDetails.term_months || 0),
          maturityDate: loanDetails.maturity_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          originationDate: app.funded_date || app.created_at,
          hasPrepaymentPenalty: loanDetails.has_prepayment_penalty || false,
          prepaymentPeriodEndDate: loanDetails.prepayment_period_end_date,
          status: 'funded_by_us' as 'current' | 'funded_by_us' | 'partner_funded',
          loanPurpose: app.loan_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Business Loan'
        };
      });

      // For now, all funded loans go to commercial (can be expanded later)
      setCommercialLoans(transformedLoans);
      setBusinessLoans([]);
    } catch (error) {
      console.error('Error loading existing loans:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoadingData(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      current: { variant: 'secondary' as const, label: 'Current', className: 'bg-blue-100 text-blue-800' },
      funded_by_us: { variant: 'default' as const, label: 'Funded by Us', className: 'bg-green-100 text-green-800' },
      partner_funded: { variant: 'default' as const, label: 'Partner Funded', className: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.current;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculatePayoffPercentage = (balance: number, original: number) => {
    return ((original - balance) / original) * 100;
  };

  const calculateTotalBalance = (loans: ExistingLoan[]) => {
    return loans.reduce((sum, loan) => sum + loan.loanBalance, 0);
  };

  const calculateTotalMonthlyPayment = (loans: ExistingLoan[]) => {
    return loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  };

  const filterAndSortLoans = (loans: ExistingLoan[]) => {
    let filtered = [...loans];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(loan =>
        loan.loanName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loanPurpose.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(loan => loan.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'balance_desc':
          return b.loanBalance - a.loanBalance;
        case 'balance_asc':
          return a.loanBalance - b.loanBalance;
        case 'payment_desc':
          return b.monthlyPayment - a.monthlyPayment;
        case 'payment_asc':
          return a.monthlyPayment - b.monthlyPayment;
        case 'maturity_asc':
          return new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
        case 'maturity_desc':
          return new Date(b.maturityDate).getTime() - new Date(a.maturityDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredCommercialLoans = useMemo(() => 
    filterAndSortLoans(commercialLoans), 
    [commercialLoans, searchTerm, statusFilter, sortBy]
  );
  
  const filteredBusinessLoans = useMemo(() => 
    filterAndSortLoans(businessLoans), 
    [businessLoans, searchTerm, statusFilter, sortBy]
  );

  const renderLoanCard = (loan: ExistingLoan) => {
    const payoffPercentage = calculatePayoffPercentage(loan.loanBalance, loan.originalAmount);

    return (
      <Card key={loan.id} className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                {loan.loanName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {loan.lender}
              </CardDescription>
            </div>
            {getStatusBadge(loan.status)}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Loan Balance Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(loan.loanBalance)}</span>
            </div>
            <Progress value={payoffPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Original: {formatCurrency(loan.originalAmount)}</span>
              <span>{payoffPercentage.toFixed(1)}% paid off</span>
            </div>
          </div>

          {/* Payment Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Monthly Payment
              </div>
              <p className="text-lg font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Percent className="w-4 h-4" />
                Interest Rate
              </div>
              <p className="text-lg font-semibold">{loan.interestRate}%</p>
            </div>
          </div>

          {/* Term Details Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Term
              </div>
              <p className="font-semibold">{loan.termMonths} months</p>
              <p className="text-xs text-muted-foreground">{loan.remainingMonths} remaining</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Maturity Date
              </div>
              <p className="font-semibold">{formatDate(loan.maturityDate)}</p>
            </div>
          </div>

          {/* Prepayment Penalty Section */}
          <div className="pt-4 border-t">
            {loan.hasPrepaymentPenalty ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">Prepayment Penalty Period</p>
                  <p className="text-xs text-amber-700">
                    Ends: {loan.prepaymentPeriodEndDate ? formatDate(loan.prepaymentPeriodEndDate) : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">No Prepayment Penalty</p>
              </div>
            )}
          </div>

          {/* Additional Details */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Loan Purpose</span>
              <span className="font-medium">{loan.loanPurpose}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Origination Date</span>
              <span className="font-medium">{formatDate(loan.originationDate)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading skeleton with banner */}
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 animate-pulse">
          <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
            <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-72"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-center">Loading existing loans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Existing Loans" 
        subtitle="View your commercial and business loans funded by us, partners, or third parties"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Tabs defaultValue="commercial" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="commercial" count={filteredCommercialLoans.length}>Commercial Loans</TabsTrigger>
            <TabsTrigger value="business" count={filteredBusinessLoans.length}>Business Loans</TabsTrigger>
          </TabsList>

          <Card className="p-4 my-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search loans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="funded_by_us">Funded by Us</SelectItem>
                  <SelectItem value="partner_funded">Partner Funded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance_desc">Balance (Highest First)</SelectItem>
                  <SelectItem value="balance_asc">Balance (Lowest First)</SelectItem>
                  <SelectItem value="payment_desc">Payment (Highest First)</SelectItem>
                  <SelectItem value="payment_asc">Payment (Lowest First)</SelectItem>
                  <SelectItem value="maturity_asc">Maturity (Soonest First)</SelectItem>
                  <SelectItem value="maturity_desc">Maturity (Latest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <TabsContent value="commercial" className="space-y-6">
            {filteredCommercialLoans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Commercial Loans</h3>
                  <p className="text-muted-foreground">You don't have any commercial loans yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <TrendingUp className="w-8 h-8 text-muted-foreground" />
                          Total Balance
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotalBalance(filteredCommercialLoans))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <DollarSign className="w-8 h-8 text-muted-foreground" />
                          Total Monthly Payment
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(calculateTotalMonthlyPayment(filteredCommercialLoans))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {filteredCommercialLoans.map((loan) => renderLoanCard(loan))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            {filteredBusinessLoans.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Business Loans</h3>
                  <p className="text-muted-foreground">You don't have any business loans yet</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <TrendingUp className="w-8 h-8 text-muted-foreground" />
                          Total Balance
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotalBalance(filteredBusinessLoans))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <DollarSign className="w-8 h-8 text-muted-foreground" />
                          Total Monthly Payment
                        </div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(calculateTotalMonthlyPayment(filteredBusinessLoans))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {filteredBusinessLoans.map((loan) => renderLoanCard(loan))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExistingLoans;
