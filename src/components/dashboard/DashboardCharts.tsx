import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
interface DashboardChartsProps {
  userId?: string;
  className?: string;
}
export const DashboardCharts = ({
  userId,
  className
}: DashboardChartsProps) => {
  const [statusData, setStatusData] = useState<{
    name: string;
    value: number;
    color: string;
  }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{
    month: string;
    applications: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchChartData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      try {
        const {
          data: applications
        } = await supabase.from('loan_applications').select('status, created_at, amount_requested').eq('user_id', userId);
        if (applications) {
          // Status distribution
          const statusCounts: Record<string, number> = {};
          applications.forEach(app => {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
          });
          const statusColors: Record<string, string> = {
            draft: '#94a3b8',
            submitted: '#3b82f6',
            under_review: '#f59e0b',
            approved: '#22c55e',
            rejected: '#ef4444',
            funded: '#10b981'
          };
          const statusLabels: Record<string, string> = {
            draft: 'Draft',
            submitted: 'Submitted',
            under_review: 'Under Review',
            approved: 'Approved',
            rejected: 'Rejected',
            funded: 'Funded'
          };
          setStatusData(Object.entries(statusCounts).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count,
            color: statusColors[status] || '#6b7280'
          })));

          // Monthly applications (last 6 months)
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthlyCounts: Record<string, number> = {};
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyCounts[key] = 0;
          }
          applications.forEach(app => {
            const date = new Date(app.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyCounts.hasOwnProperty(key)) {
              monthlyCounts[key]++;
            }
          });
          setMonthlyData(Object.entries(monthlyCounts).map(([key, count]) => {
            const [year, month] = key.split('-');
            return {
              month: monthNames[parseInt(month) - 1],
              applications: count
            };
          }));
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
    return <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
        {[1, 2].map(i => <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4" />
              <div className="h-40 bg-muted rounded" />
            </CardContent>
          </Card>)}
      </div>;
  }
  const hasData = statusData.length > 0;
  return <div className={cn("grid grid-cols-1 gap-4 sm:gap-5", className)}>
      {/* Application Status Distribution */}
      <Card className="border border-border">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {hasData ? <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={20} outerRadius={45} dataKey="value" strokeWidth={2}>
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2">
                {statusData.map((item, index) => <div key={index} className="text-sm flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
                  backgroundColor: item.color
                }} />
                      <span className="text-card-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-card-foreground">{item.value}</span>
                  </div>)}
              </div>
            </div> : <div className="h-28 sm:h-32 flex items-center justify-center text-muted-foreground text-sm">
              No application data available
            </div>}
        </CardContent>
      </Card>

      {/* Monthly Applications Trend */}
      <Card className="border border-border">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            Monthly Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          {monthlyData.some(d => d.applications > 0) ? <div className="h-28 sm:h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{
                fontSize: 11,
                fill: 'hsl(var(--muted-foreground))'
              }} />
                  <YAxis hide domain={[0, 'dataMax + 1']} />
                  <Tooltip contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--card-foreground))'
              }} formatter={(value: number) => [`${value} application(s)`, 'Count']} />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div> : <div className="h-28 sm:h-32 flex items-center justify-center text-muted-foreground text-sm">
              No application history yet
            </div>}
        </CardContent>
      </Card>
    </div>;
};