import { useState, useEffect } from "react";
import { 
  AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import { TrendingUp, Building2, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from "@/components/ui/premium-card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AnimatedCurrency } from "@/components/ui/animated-counter";

interface BankAccount {
  id: string;
  account_name: string;
  account_type: string;
  institution: string;
  balance: number;
  is_business: boolean;
}

interface EnhancedDashboardChartsProps {
  userId?: string;
  className?: string;
}

export const EnhancedDashboardCharts = ({
  userId,
  className
}: EnhancedDashboardChartsProps) => {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [monthlyData, setMonthlyData] = useState<{
    month: string;
    applications: number;
    amount: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // Fetch bank accounts
        const { data: accounts, error: accountsError } = await supabase
          .from('bank_accounts')
          .select('id, account_name, account_type, institution, balance, is_business')
          .eq('user_id', userId);
        
        if (accountsError) throw accountsError;
        setBankAccounts(accounts || []);

        // Fetch applications for monthly trend
        const { data: applications } = await supabase
          .from('loan_applications')
          .select('created_at, amount_requested')
          .eq('user_id', userId);

        if (applications) {
          // Monthly applications with amounts (last 6 months)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyCounts: Record<string, { count: number; amount: number }> = {};
          const now = new Date();
          
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[key] = { count: 0, amount: 0 };
          }

          applications.forEach(app => {
            const date = new Date(app.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyCounts.hasOwnProperty(key)) {
              monthlyCounts[key].count++;
              monthlyCounts[key].amount += app.amount_requested || 0;
            }
          });

          setMonthlyData(
            Object.entries(monthlyCounts).map(([key, data]) => {
              const [year, month] = key.split('-');
              return {
                month: monthNames[parseInt(month) - 1],
                applications: data.count,
                amount: data.amount / 1000 // Convert to thousands
              };
            })
          );
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-5", className)}>
        {[1, 2].map(i => (
          <PremiumCard key={i} variant="glass" className="animate-pulse">
            <div className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-44 bg-muted/50 rounded-lg" />
            </div>
          </PremiumCard>
        ))}
      </div>
    );
  }

  // Separate personal and business accounts
  const personalAccounts = bankAccounts.filter(a => !a.is_business);
  const businessAccounts = bankAccounts.filter(a => a.is_business);
  const personalTotal = personalAccounts.reduce((sum, a) => sum + a.balance, 0);
  const businessTotal = businessAccounts.reduce((sum, a) => sum + a.balance, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-semibold text-foreground">
                {entry.name === 'amount' ? `$${entry.value}K` : entry.value}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("grid grid-cols-1 gap-5", className)}>
      {/* Bank Accounts Widget */}
      <PremiumCard variant="elevated" size="none">
        <PremiumCardHeader className="px-5 pt-5 pb-0">
          <PremiumCardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            Linked Accounts
          </PremiumCardTitle>
        </PremiumCardHeader>
        <PremiumCardContent className="px-5 pb-5 pt-4 space-y-4">
          {/* Personal Accounts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="font-medium">Personal</span>
            </div>
            {personalAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">No personal accounts linked</p>
            ) : (
              <div className="pl-6 space-y-2">
                {personalAccounts.slice(0, 2).map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{account.account_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{account.institution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        <AnimatedCurrency value={account.balance} />
                      </p>
                    </div>
                  </div>
                ))}
                {personalAccounts.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{personalAccounts.length - 2} more account(s)</p>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">Total Personal</span>
                  <span className="text-sm font-bold text-foreground">
                    <AnimatedCurrency value={personalTotal} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Business Accounts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Business</span>
            </div>
            {businessAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-6">No business accounts linked</p>
            ) : (
              <div className="pl-6 space-y-2">
                {businessAccounts.slice(0, 2).map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{account.account_name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{account.institution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        <AnimatedCurrency value={account.balance} />
                      </p>
                    </div>
                  </div>
                ))}
                {businessAccounts.length > 2 && (
                  <p className="text-xs text-muted-foreground">+{businessAccounts.length - 2} more account(s)</p>
                )}
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">Total Business</span>
                  <span className="text-sm font-bold text-foreground">
                    <AnimatedCurrency value={businessTotal} />
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full border-primary text-primary transition-all duration-200" 
            onClick={() => navigate('/bank-accounts')}
          >
            Manage Bank Accounts
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </PremiumCardContent>
      </PremiumCard>

      {/* Monthly Applications Trend - Enhanced Area Chart */}
      <PremiumCard variant="elevated" size="none">
        <PremiumCardHeader className="px-5 pt-5 pb-0">
          <PremiumCardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            Monthly Trend
          </PremiumCardTitle>
        </PremiumCardHeader>
        <PremiumCardContent className="px-5 pb-5 pt-4">
          {monthlyData.some(d => d.applications > 0) ? (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(213 94% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(213 94% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="hsl(var(--border))" 
                    strokeOpacity={0.5}
                  />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    hide 
                    domain={[0, 'dataMax + 1']} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    name="Applications"
                    stroke="hsl(213 94% 50%)"
                    strokeWidth={2.5}
                    fill="url(#colorApplications)"
                    dot={{ fill: 'hsl(213 94% 50%)', strokeWidth: 2, r: 4, stroke: 'white' }}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No application history yet
            </div>
          )}
        </PremiumCardContent>
      </PremiumCard>
    </div>
  );
};
