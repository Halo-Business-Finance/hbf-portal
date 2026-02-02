import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from '@/components/ui/modern-tabs';
import { MessageSquare, Send, Ticket, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';

const Support = () => {
  const { toast } = useToast();
  const { username } = useAuth();
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; sender: 'user' | 'support' }>>([]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Here you would integrate with your backend
    toast({
      title: "Ticket Submitted",
      description: "Our team will respond within 24 hours",
    });

    setTicketSubject('');
    setTicketMessage('');
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    setChatMessages([...chatMessages, { text: chatMessage, sender: 'user' }]);
    setChatMessage('');

    // Simulate support response
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        text: "Thank you for your message. A support agent will be with you shortly.", 
        sender: 'support' 
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Support Center" 
        subtitle="Get help with your loan applications and account"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" count={chatMessages.length} className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="ticket" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Create Ticket
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <MessageSquare className="w-5 h-5" />
                  Live Chat Support
                </CardTitle>
                <CardDescription>Chat with our support team in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-muted/30">
                    {chatMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-2" />
                        <p>Start a conversation with our support team</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.sender === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card border'
                              }`}
                            >
                              <p className="text-sm">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ticket" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Ticket className="w-5 h-5" />
                  Create Support Ticket
                </CardTitle>
                <CardDescription>Submit a detailed support request</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={username || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe your issue in detail..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={8}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2">
                    <Mail className="w-4 h-4" />
                    Submit Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-900">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> support@halobusinessfinance.com
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Phone:</strong> 1-800-HALO-BIZ
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM EST
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Support;
