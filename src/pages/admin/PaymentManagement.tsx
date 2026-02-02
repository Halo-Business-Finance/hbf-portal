import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { CreditCard, DollarSign } from 'lucide-react';

const PaymentManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Payment Management" 
        subtitle="View and manage payment transactions"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recent Transactions
              </CardTitle>
              <CardDescription>Latest payment activity</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Transaction history coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </CardTitle>
              <CardDescription>Overview of financial activity</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Payment summary coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;