import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

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
  applicationsByStatus: { name: string; value: number }[];
  monthlyTrend: { month: string; applications: number; funded: number }[];
}

const COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const Analytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: applications, error } = await supabase
        .from('loan_applications')
        .select('*');

      if (error) throw error;

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

      // Applications by status
      const statusCount: Record<string, number> = {};
      data.forEach(app => {
        const status = app.status || 'Unknown';
        statusCount[status] = (statusCount[status] || 0) + 1;
      });
      const applicationsByStatus = Object.entries(statusCount).map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value
      }));

      // Monthly trend (last 6 months)
      const monthlyData: Record<string, { applications: number; funded: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[key] = { applications: 0, funded: 0 };
      }

      data.forEach(app => {
        const date = new Date(app.created_at);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-center">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="View detailed analytics and generate reports"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{analytics?.totalApplications || 0}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{analytics?.approvedApplications || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-amber-600">{analytics?.pendingApplications || 0}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Funded</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(analytics?.totalAmountFunded || 0)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Application Trends
              </CardTitle>
              <CardDescription>Applications over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.monthlyTrend && analytics.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={analytics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="applications" 
                      stroke="#1e3a5f" 
                      strokeWidth={2}
                      name="Applications"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="funded" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Funded"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Applications by Status
              </CardTitle>
              <CardDescription>Distribution of application statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.applicationsByStatus && analytics.applicationsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.applicationsByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.applicationsByStatus.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No status data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Applications by Loan Type
              </CardTitle>
              <CardDescription>Breakdown by loan product</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics?.applicationsByType && analytics.applicationsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.applicationsByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No loan type data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Summary
              </CardTitle>
              <CardDescription>Overview of loan amounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Amount Requested</span>
                  <span className="font-semibold">{formatCurrency(analytics?.totalAmountRequested || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Amount Funded</span>
                  <span className="font-semibold text-green-600">{formatCurrency(analytics?.totalAmountFunded || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Average Loan Amount</span>
                  <span className="font-semibold">{formatCurrency(analytics?.averageLoanAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Approval Rate</span>
                  <span className="font-semibold">
                    {analytics?.totalApplications 
                      ? ((analytics.approvedApplications / analytics.totalApplications) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Funding Rate</span>
                  <span className="font-semibold text-purple-600">
                    {analytics?.totalApplications 
                      ? ((analytics.fundedApplications / analytics.totalApplications) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
