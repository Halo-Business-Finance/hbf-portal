import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SecurityAuditLog } from '@/components/SecurityAuditLog';
import { PageHeader } from '@/components/PageHeader';
import { Shield } from 'lucide-react';

const SecurityAudit = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Security & Audit Logs" 
        subtitle="Monitor security events and audit logs"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityAuditLog />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Security dashboard coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;