import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Landmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
      const {
        data,
        error
      } = await supabase.from('bank_accounts').select('*').eq('user_id', user?.id).eq('status', 'active').order('balance', {
        ascending: false
      });
      if (error) throw error;
      setAccounts(data || []);
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
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-12 bg-muted rounded-xl mx-auto"></div>
            <div className="h-5 bg-muted rounded w-2/3 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>;
  }
  if (accounts.length === 0) {
    return <Card className="border border-border cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate('/bank-accounts')}>
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <p className="text-lg font-semibold text-card-foreground mb-1">No Bank Accounts</p>
          <p className="text-sm text-muted-foreground">Connect your first bank account to get started</p>
        </CardContent>
      </Card>;
  }
  return <Card className="border border-border cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate('/bank-accounts')}>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-2xl font-bold text-card-foreground">{formatCurrency(totalBalance)}</p>
          </div>
        </div>
        <div className="space-y-2">
          {accounts.slice(0, 3).map(account => <div key={account.id} className="flex justify-between items-center py-2 border-t border-border">
              <div>
                <p className="text-sm font-medium text-card-foreground">{account.account_name}</p>
                <p className="text-xs text-muted-foreground">{account.institution}</p>
              </div>
              <p className="text-sm font-semibold text-card-foreground">{formatCurrency(Number(account.balance))}</p>
            </div>)}
          {accounts.length > 3 && <p className="text-xs text-muted-foreground text-center pt-2">+{accounts.length - 3} more accounts</p>}
        </div>
      </CardContent>
    </Card>;
};