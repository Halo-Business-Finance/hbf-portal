import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/services/api';
import { Wallet, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
export const DashboardOverview = () => {
  const {
    user
  } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);
  const loadDashboardData = async () => {
    try {
      const accounts = await api.bankAccounts.listBalances(user?.id ?? '');
      const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
      setTotalBalance(total);

      const scores = await api.creditScores.listScores(user?.id ?? '');
      if (scores.length > 0) {
        const avg = scores.reduce((sum, s) => sum + Number(s.score), 0) / scores.length;
        setAverageScore(Math.round(avg));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
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
  if (isLoading) {
    return <Card className="border-2 border-blue-950 bg-gradient-to-br from-blue-950 to-blue-900 shadow-lg">
        <CardContent className="p-8">
          <div className="animate-pulse flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-6 bg-white/20 rounded w-1/4"></div>
              <div className="h-10 bg-white/20 rounded w-1/2"></div>
            </div>
            <div className="space-y-3 flex-1 text-right">
              <div className="h-6 bg-white/20 rounded w-1/4 ml-auto"></div>
              <div className="h-10 bg-white/20 rounded w-1/2 ml-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="border-2 border-blue-950 bg-gradient-to-br from-blue-950 to-blue-900 shadow-lg hover:shadow-xl transition-all duration-200">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-100">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Total Balance</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatCurrency(totalBalance)}
            </div>
          </div>
          <div className="space-y-2 text-right">
            <div className="flex items-center gap-2 justify-end text-blue-100">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wide">Average Credit Score</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {averageScore !== null ? averageScore : '--'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};