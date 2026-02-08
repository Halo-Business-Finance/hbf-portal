import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Users, Target, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { adminService } from "@/services/adminService";

interface DashboardStats {
  totalPipelineValue: number;
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  pipelineChange: number;
  leadsChange: number;
}

export default function LoanflowDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPipelineValue: 0,
    totalLeads: 0,
    activeLeads: 0,
    conversionRate: 0,
    pipelineChange: 0,
    leadsChange: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const applicationStats = await adminService.getApplicationStats();
      
      // Calculate pipeline metrics
      const totalPipelineValue = applicationStats.totalAmount || 0;
      const totalLeads = applicationStats.total || 0;
      const activeLeads = (applicationStats.byStatus?.['submitted'] || 0) + 
                         (applicationStats.byStatus?.['under_review'] || 0);
      const conversionRate = totalLeads > 0 ? 
        Math.round(((applicationStats.byStatus?.['approved'] || 0) / totalLeads) * 100) : 0;

      setStats({
        totalPipelineValue,
        totalLeads,
        activeLeads,
        conversionRate,
        pipelineChange: 0, // This would come from historical data
        leadsChange: 0,    // This would come from historical data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-muted-foreground';
  };

  const getCurrentTime = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary/20 rounded-full animate-spin border-t-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="dashboard-header">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Welcome! Here's your performance overview.</p>
              </div>
            </div>
            <Button 
              onClick={loadDashboardData}
              variant="outline" 
              className="gap-2 border-border/50 hover:border-border"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          <div className="dashboard-timestamp">
            <Clock className="w-4 h-4" />
            <span>{getCurrentTime()}</span>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pipeline Value */}
          <div className="col-span-1 md:col-span-2">
            <Card className="metric-card h-full">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <h3 className="metric-label">Total Pipeline Value</h3>
                  <div className="metric-value text-4xl lg:text-5xl">
                    {formatCurrency(stats.totalPipelineValue)}
                  </div>
                  <div className={`metric-change ${getChangeColor(stats.pipelineChange)}`}>
                    {stats.pipelineChange >= 0 ? '+' : ''}{stats.pipelineChange}% vs last month
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Leads */}
          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="space-y-3">
                <h3 className="metric-label">Total Leads</h3>
                <div className="metric-value">{stats.totalLeads}</div>
                <div className={`metric-change ${getChangeColor(stats.leadsChange)}`}>
                  {stats.leadsChange >= 0 ? '+' : ''}{stats.leadsChange}% vs last month
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Leads */}
          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="space-y-3">
                <h3 className="metric-label">Active Leads</h3>
                <div className="metric-value">{stats.activeLeads}</div>
                <div className="text-sm text-muted-foreground">
                  Currently in pipeline
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="metric-label">Conversion Rate</h3>
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="metric-value">{stats.conversionRate}%</div>
              <div className="text-sm text-muted-foreground">
                Applications to approvals
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="metric-label">Average Deal Size</h3>
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="metric-value">
                {stats.totalLeads > 0 ? formatCurrency(stats.totalPipelineValue / stats.totalLeads) : '$0'}
              </div>
              <div className="text-sm text-muted-foreground">
                Per application
              </div>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="metric-label">Lead Sources</h3>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Direct</span>
                  <span className="text-foreground">{Math.round(stats.totalLeads * 0.6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Referral</span>
                  <span className="text-foreground">{Math.round(stats.totalLeads * 0.4)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}