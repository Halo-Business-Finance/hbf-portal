import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Bell, Plus, Send } from 'lucide-react';

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Notifications" 
        subtitle="Send system notifications and manage alerts"
      >
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Notification
        </Button>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send Notification
              </CardTitle>
              <CardDescription>Broadcast messages to users</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Send className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Notification composer coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification History
              </CardTitle>
              <CardDescription>View sent notifications</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Notification history coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Notifications;