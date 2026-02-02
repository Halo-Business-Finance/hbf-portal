import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react';

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Analytics & Reports" 
        subtitle="View detailed analytics and generate reports"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Application Trends
              </CardTitle>
              <CardDescription>Track application volume over time</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Charts and trends coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Monitor financial performance</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Revenue charts coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Growth
              </CardTitle>
              <CardDescription>Track user acquisition and retention</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">User analytics coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>Generate custom reports</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Report builder coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;