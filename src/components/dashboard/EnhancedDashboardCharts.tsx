import { useState, useEffect } from "react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from "recharts";
import { TrendingUp, PieChartIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from "@/components/ui/premium-card";
import { ProgressRing } from "@/components/ui/progress-ring";

interface EnhancedDashboardChartsProps {
  userId?: string;
  className?: string;
}

export const EnhancedDashboardCharts = ({
  userId,
  className
}: EnhancedDashboardChartsProps) => {
  const [statusData, setStatusData] = useState<{
    name: string;
    value: number;
    color: string;
  }[]>([]);
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
        const { data: applications } = await supabase
          .from('loan_applications')
          .select('status, created_at, amount_requested')
          .eq('user_id', userId);

        if (applications) {
          // Status distribution
          const statusCounts: Record<string, number> = {};
          applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          });

          const statusColors: Record<string, string> = {
            draft: 'hsl(222 20% 65%)',
            submitted: 'hsl(213 94% 50%)',
            under_review: 'hsl(38 92% 50%)',
            approved: 'hsl(152 82% 40%)',
            rejected: 'hsl(0 84% 60%)',
            funded: 'hsl(152 76% 35%)'
          };

          const statusLabels: Record<string, string> = {
            draft: 'Draft',
            submitted: 'Submitted',
            under_review: 'Under Review',
            approved: 'Approved',
            rejected: 'Rejected',
            funded: 'Funded'
          };

          setStatusData(
            Object.entries(statusCounts).map(([status, count]) => ({
              name: statusLabels[status] || status,
              value: count,
              color: statusColors[status] || 'hsl(222 20% 50%)'
            }))
          );

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

  const hasData = statusData.length > 0;
  const totalApplications = statusData.reduce((sum, item) => sum + item.value, 0);

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
      {/* Application Status Distribution */}
      <PremiumCard variant="elevated" size="none">
        <PremiumCardHeader className="px-5 pt-5 pb-0">
          <PremiumCardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
            Application Status
          </PremiumCardTitle>
        </PremiumCardHeader>
        <PremiumCardContent className="px-5 pb-5 pt-4">
          {hasData ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <ProgressRing
                  value={statusData.find(s => s.name === 'Approved' || s.name === 'Funded')?.value || 0}
                  max={totalApplications}
                  size={120}
                  strokeWidth={12}
                  color="hsl(152 82% 40%)"
                >
                  <div className="text-center">
                    <span className="text-2xl font-bold">{totalApplications}</span>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </ProgressRing>
              </div>
              <div className="flex-1 w-full space-y-2.5">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-3 h-3 rounded-full transition-transform group-hover:scale-110" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-sm text-foreground font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({Math.round((item.value / totalApplications) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
              No application data available
            </div>
          )}
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
