import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Building2, Plus } from 'lucide-react';

const LoanProducts = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Loan Products" 
        subtitle="Manage available loan products and configurations"
      >
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Active Loan Products
            </CardTitle>
            <CardDescription>Configure and manage loan product offerings</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Loan product management coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoanProducts;