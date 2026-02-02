import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { NotificationCenter } from '@/components/NotificationCenter';
import { PageHeader } from '@/components/PageHeader';

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Notifications" 
        subtitle="Stay updated with all your loan application activities"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Card>
          <CardContent className="p-0">
            <NotificationCenter maxHeight="600px" showHeader={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
