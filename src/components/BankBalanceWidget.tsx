import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Landmark } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
interface BankAccount {
  id: string;
  account_name: string;
  institution: string;
  balance: number;
  is_business: boolean;
  status: string;
}
export const BankBalanceWidget = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (user) {
      loadBankAccounts();
    }
  }, [user]);
  const loadBankAccounts = async () => {
    try {
      const data = await api.bankAccounts.listActive(user?.id ?? '');
      setAccounts(data);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
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
  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  if (isLoading) {
    return <Card className="border border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 sm:h-12 w-10 sm:w-12 bg-muted rounded-xl mx-auto"></div>
            <div className="h-5 bg-muted rounded w-2/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>;
  }
  if (accounts.length === 0) {
    return <Card className="border border-border cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-200 touch-manipulation" onClick={() => navigate('/bank-accounts')}>
        <CardContent className="p-4 sm:p-6 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Landmark className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <p className="text-base sm:text-lg font-semibold text-card-foreground mb-1">No Bank Accounts</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Connect your first bank account to get started</p>
        </CardContent>
      </Card>;
  }
  return <Card className="border border-border cursor-pointer hover:shadow-md active:scale-[0.99] transition-all duration-200 touch-manipulation" onClick={() => navigate('/bank-accounts')}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-card-foreground truncate">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
        <div className="space-y-2">
          {accounts.slice(0, 3).map(account => <div key={account.id} className="flex justify-between items-center py-2 border-t border-border">
              <div className="min-w-0 flex-1 mr-2">
                <p className="text-xs sm:text-sm font-medium text-card-foreground truncate">{account.account_name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{account.institution}</p>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-card-foreground flex-shrink-0">{formatCurrency(Number(account.balance))}</p>
            </div>)}
          {accounts.length > 3 && <p className="text-[10px] sm:text-xs text-muted-foreground text-center pt-2">+{accounts.length - 3} more accounts</p>}
        </div>
      </CardContent>
    </Card>;
};