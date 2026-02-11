import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { PremiumCard, PremiumCardHeader, PremiumCardTitle, PremiumCardContent } from '@/components/ui/premium-card';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, CheckCircle, Clock, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { restQuery } from '@/services/supabaseHttp';
import { useToast } from '@/hooks/use-toast';
import { EnhancedAreaChart, EnhancedBarChart, EnhancedPieChart, EnhancedLineChart } from '@/components/ui/charts';
import { AnimatedCounter, AnimatedCurrency, AnimatedPercentage } from '@/components/ui/animated-counter';
import { exportAnalyticsToCSV, exportAnalyticsToPDF } from '@/utils/analyticsExport';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  totalApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  pendingApplications: number;
  fundedApplications: number;
  totalAmountRequested: number;
  totalAmountFunded: number;
  averageLoanAmount: number;
  applicationsByType: { name: string; value: number }[];
  applicationsByStatus: { name: string; value: number; color: string }[];
  monthlyTrend: { month: string; applications: number; funded: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': 'hsl(222 20% 65%)',
  'Submitted': 'hsl(213 94% 50%)',
  'Under Review': 'hsl(38 92% 50%)',
  'Approved': 'hsl(152 82% 40%)',
  'Rejected': 'hsl(0 84% 60%)',
  'Funded': 'hsl(152 76% 35%)',
};

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: applications } = await restQuery<any[]>('loan_applications');

      const data = applications || [];
      
      // Calculate metrics
      const totalApplications = data.length;
      const approvedApplications = data.filter(app => app.status === 'approved').length;
      const rejectedApplications = data.filter(app => app.status === 'rejected').length;
      const pendingApplications = data.filter(app => ['submitted', 'under_review', 'draft'].includes(app.status)).length;
      const fundedApplications = data.filter(app => app.status === 'funded').length;
      
      const totalAmountRequested = data.reduce((sum, app) => sum + (app.amount_requested || 0), 0);
      const totalAmountFunded = data
        .filter(app => app.status === 'funded')
        .reduce((sum, app) => sum + (app.amount_requested || 0), 0);
      const averageLoanAmount = totalApplications > 0 ? totalAmountRequested / totalApplications : 0;

      // Applications by type
      const typeCount: Record<string, number> = {};
      data.forEach(app => {
        const type = app.loan_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      const applicationsByType = Object.entries(typeCount).map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
      }));

      // Applications by status with colors
      const statusCount: Record<string, number> = {};
      data.forEach(app => {
        const status = app.status || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      const applicationsByStatus = Object.entries(statusCount).map(([name, value]) => {
        const formattedName = name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return {
          name: formattedName,
          value,
          color: STATUS_COLORS[formattedName] || 'hsl(222 20% 50%)'
        };
      });

      // Monthly trend (last 6 months)
      const monthlyData: Record<string, { applications: number; funded: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short' });
        monthlyData[key] = { applications: 0, funded: 0 };
      }

      data.forEach(app => {
        const date = new Date(app.created_at);
        const key = date.toLocaleDateString('en-US', { month: 'short' });
        if (monthlyData[key]) {
          monthlyData[key].applications++;
          if (app.status === 'funded') {
            monthlyData[key].funded++;
          }
        }
      });

      const monthlyTrend = Object.entries(monthlyData).map(([month, values]) => ({
        month,
        ...values
      }));

      setAnalytics({
        totalApplications,
        approvedApplications,
        rejectedApplications,
        pendingApplications,
        fundedApplications,
        totalAmountRequested,
        totalAmountFunded,
        averageLoanAmount,
        applicationsByType,
        applicationsByStatus,
        monthlyTrend
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader 
          title="Analytics & Reports" 
          subtitle="View detailed analytics and generate reports"
          loading={true}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <PremiumCard key={i} variant="metric" className="animate-pulse">
                <div className="h-20 bg-muted/50 rounded" />
              </PremiumCard>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    if (analytics) {
      exportAnalyticsToCSV(analytics);
      toast({
        title: "Export Started",
        description: "Your CSV report is being downloaded"
      });
    }
  };

  const handleExportPDF = () => {
    if (analytics) {
      exportAnalyticsToPDF(analytics);
      toast({
        title: "Export Started",
        description: "Your PDF report is being generated"
      });
    }
  };

  const approvalRate = analytics?.totalApplications 
    ? (analytics.approvedApplications / analytics.totalApplications) * 100 
    : 0;

  const fundingRate = analytics?.totalApplications 
    ? (analytics.fundedApplications / analytics.totalApplications) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="View detailed analytics and generate reports"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!analytics}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button size="sm" onClick={handleExportPDF} disabled={!analytics}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Key Metrics - Premium Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumCard variant="metric">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total Applications</p>
                <AnimatedCounter 
                  value={analytics?.totalApplications || 0} 
                  className="text-3xl font-bold tracking-tight"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard variant="metric">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Approved</p>
                <div className="flex items-baseline gap-2">
                  <AnimatedCounter 
                    value={analytics?.approvedApplications || 0} 
                    className="text-3xl font-bold tracking-tight text-emerald-600"
                  />
                  <div className="flex items-center text-emerald-600 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <AnimatedPercentage value={approvalRate} decimals={0} className="font-medium" />
                  </div>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard variant="metric">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Pending Review</p>
                <AnimatedCounter 
                  value={analytics?.pendingApplications || 0} 
                  className="text-3xl font-bold tracking-tight text-amber-600"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </PremiumCard>

          <PremiumCard variant="metric">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Total Funded</p>
                <AnimatedCurrency 
                  value={analytics?.totalAmountFunded || 0} 
                  className="text-3xl font-bold tracking-tight text-primary"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Charts Row - Enhanced */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Application Trends - Enhanced Line Chart */}
          <PremiumCard variant="elevated" size="none">
            <PremiumCardHeader className="px-6 pt-6 pb-2">
              <PremiumCardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Application Trends
              </PremiumCardTitle>
              <p className="text-sm text-muted-foreground mt-1">Applications over the last 6 months</p>
            </PremiumCardHeader>
            <PremiumCardContent className="px-6 pb-6 pt-4">
              {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                <EnhancedLineChart
                  data={analytics.monthlyTrend}
                  xKey="month"
                  lines={[
                    { key: "applications", color: "hsl(213 94% 50%)", name: "Applications" },
                    { key: "funded", color: "hsl(152 82% 40%)", name: "Funded" }
                  ]}
                  height={220}
                  showLegend
                  animate
                />
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No trend data available</p>
                </div>
              )}
            </PremiumCardContent>
          </PremiumCard>

          {/* Applications by Status - Enhanced Pie Chart */}
          <PremiumCard variant="elevated" size="none">
            <PremiumCardHeader className="px-6 pt-6 pb-2">
              <PremiumCardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                Status Distribution
              </PremiumCardTitle>
              <p className="text-sm text-muted-foreground mt-1">Breakdown of application statuses</p>
            </PremiumCardHeader>
            <PremiumCardContent className="px-6 pb-6 pt-4">
              {analytics?.applicationsByStatus && analytics.applicationsByStatus.length > 0 ? (
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <EnhancedPieChart
                    data={analytics.applicationsByStatus}
                    height={180}
                    innerRadius={45}
                    outerRadius={75}
                    animate
                    centerContent={
                      <div className="text-center">
                        <span className="text-2xl font-bold">{analytics.totalApplications}</span>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    }
                  />
                  <div className="flex-1 w-full space-y-2">
                    {analytics.applicationsByStatus.map((item, index) => (
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
                            ({Math.round((item.value / analytics.totalApplications) * 100)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No status data available</p>
                </div>
              )}
            </PremiumCardContent>
          </PremiumCard>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Type - Enhanced Bar Chart */}
          <PremiumCard variant="elevated" size="none">
            <PremiumCardHeader className="px-6 pt-6 pb-2">
              <PremiumCardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                Applications by Loan Type
              </PremiumCardTitle>
              <p className="text-sm text-muted-foreground mt-1">Breakdown by loan product</p>
            </PremiumCardHeader>
            <PremiumCardContent className="px-6 pb-6 pt-4">
              {analytics?.applicationsByType && analytics.applicationsByType.length > 0 ? (
                <EnhancedBarChart
                  data={analytics.applicationsByType}
                  xKey="name"
                  yKey="value"
                  height={220}
                  layout="vertical"
                  animate
                  barRadius={4}
                  primaryColor="hsl(213 94% 50%)"
                />
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No loan type data available</p>
                </div>
              )}
            </PremiumCardContent>
          </PremiumCard>

          {/* Financial Summary - Premium Styling */}
          <PremiumCard variant="elevated" size="none">
            <PremiumCardHeader className="px-6 pt-6 pb-2">
              <PremiumCardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                Financial Summary
              </PremiumCardTitle>
              <p className="text-sm text-muted-foreground mt-1">Overview of loan amounts</p>
            </PremiumCardHeader>
            <PremiumCardContent className="px-6 pb-6 pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 transition-all hover:border-primary/20">
                  <span className="text-sm text-muted-foreground font-medium">Total Requested</span>
                  <AnimatedCurrency 
                    value={analytics?.totalAmountRequested || 0} 
                    className="font-bold text-foreground"
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-500/20 transition-all hover:border-emerald-500/40">
                  <span className="text-sm text-muted-foreground font-medium">Total Funded</span>
                  <AnimatedCurrency 
                    value={analytics?.totalAmountFunded || 0} 
                    className="font-bold text-emerald-600"
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 transition-all hover:border-primary/20">
                  <span className="text-sm text-muted-foreground font-medium">Average Loan</span>
                  <AnimatedCurrency 
                    value={analytics?.averageLoanAmount || 0} 
                    className="font-bold text-foreground"
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50 transition-all hover:border-primary/20">
                  <span className="text-sm text-muted-foreground font-medium">Approval Rate</span>
                  <AnimatedPercentage 
                    value={approvalRate} 
                    decimals={1} 
                    className="font-bold text-foreground"
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 transition-all hover:border-primary/40">
                  <span className="text-sm text-muted-foreground font-medium">Funding Rate</span>
                  <AnimatedPercentage 
                    value={fundingRate} 
                    decimals={1} 
                    className="font-bold text-primary"
                  />
                </div>
              </div>
            </PremiumCardContent>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
