import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { MessageSquare, Inbox } from 'lucide-react';

const SupportTickets = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Support Tickets" 
        subtitle="Review and respond to user support requests"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Open Tickets
              </CardTitle>
              <CardDescription>Tickets awaiting response</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No open tickets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Ticket History
              </CardTitle>
              <CardDescription>Resolved and closed tickets</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ticket management coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SupportTickets;