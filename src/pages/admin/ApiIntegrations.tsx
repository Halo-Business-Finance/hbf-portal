import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ModernTabs as Tabs, ModernTabsContent as TabsContent, ModernTabsList as TabsList, ModernTabsTrigger as TabsTrigger } from '@/components/ui/modern-tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { externalNotificationService, ExternalWebhook } from '@/services/externalNotificationService';
import { PageHeader } from '@/components/PageHeader';
import { 
  Plug, 
  Webhook, 
  Key, 
  CheckCircle, 
  XCircle, 
  Settings,
  Zap,
  CreditCard,
  Mail,
  MessageSquare,
  Database,
  Cloud,
  Plus,
  Trash2
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  isActive: boolean;
  category: 'payment' | 'communication' | 'automation' | 'data';
}

const ApiIntegrations = () => {
  const { toast } = useToast();
  const [zapierWebhook, setZapierWebhook] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webhooks, setWebhooks] = useState<ExternalWebhook[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    platform: 'slack' as 'slack' | 'discord',
    name: '',
    webhook_url: '',
    description: '',
  });

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const data = await externalNotificationService.getWebhooks();
      setWebhooks(data);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing and subscription management',
      icon: CreditCard,
      isActive: false,
      category: 'payment'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      description: 'Email delivery and marketing automation',
      icon: Mail,
      isActive: false,
      category: 'communication'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'SMS and voice communication',
      icon: MessageSquare,
      isActive: false,
      category: 'communication'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Workflow automation and app integration',
      icon: Zap,
      isActive: false,
      category: 'automation'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'CRM and customer data management',
      icon: Database,
      isActive: false,
      category: 'data'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and notifications',
      icon: MessageSquare,
      isActive: webhooks.some(w => w.platform === 'slack' && w.is_active),
      category: 'communication'
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Community and team notifications',
      icon: MessageSquare,
      isActive: webhooks.some(w => w.platform === 'discord' && w.is_active),
      category: 'communication'
    },
    {
      id: 'webhook',
      name: 'Custom Webhooks',
      description: 'Configure custom webhook endpoints',
      icon: Webhook,
      isActive: true,
      category: 'automation'
    }
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => 
      prev.map(int => 
        int.id === id ? { ...int, isActive: !int.isActive } : int
      )
    );
    toast({
      title: "Integration Updated",
      description: `Integration has been ${integrations.find(i => i.id === id)?.isActive ? 'disabled' : 'enabled'}`,
    });
  };

  const handleTriggerZapier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zapierWebhook) {
      toast({
        title: "Error",
        description: "Please enter your Zapier webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", zapierWebhook);

    try {
      const response = await fetch(zapierWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          event: "test_trigger"
        }),
      });

      toast({
        title: "Request Sent",
        description: "The request was sent to Zapier. Please check your Zap's history to confirm it was triggered.",
      });
    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Error",
        description: "Failed to trigger the Zapier webhook. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.name || !newWebhook.webhook_url) {
      toast({
        title: 'Error',
        description: 'Name and webhook URL are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await externalNotificationService.createWebhook(newWebhook);
      await loadWebhooks();
      setIsDialogOpen(false);
      setNewWebhook({ platform: 'slack', name: '', webhook_url: '', description: '' });
      toast({
        title: 'Success',
        description: `${newWebhook.platform} webhook created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWebhook = async (webhook: ExternalWebhook) => {
    setIsLoading(true);
    try {
      await externalNotificationService.testWebhook(webhook.webhook_url, webhook.platform);
      toast({
        title: 'Success',
        description: `Test notification sent to ${webhook.platform}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await externalNotificationService.deleteWebhook(id);
      await loadWebhooks();
      toast({
        title: 'Success',
        description: 'Webhook deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    try {
      await externalNotificationService.toggleWebhook(id, !isActive);
      await loadWebhooks();
      toast({
        title: 'Success',
        description: `Webhook ${!isActive ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle webhook',
        variant: 'destructive',
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      payment: 'Payment',
      communication: 'Communication',
      automation: 'Automation',
      data: 'Data'
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="API Integrations" 
        subtitle="Manage external API connections and third-party integrations"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all" count={integrations.length}>All Integrations</TabsTrigger>
            <TabsTrigger value="active" count={integrations.filter(i => i.isActive).length}>Active</TabsTrigger>
            <TabsTrigger value="webhooks" count={webhooks.length}>Webhooks</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex items-center justify-center bg-blue-50 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-900" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {getCategoryLabel(integration.category)}
                            </Badge>
                          </div>
                        </div>
                        {integration.isActive ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <Switch
                          checked={integration.isActive}
                          onCheckedChange={() => toggleIntegration(integration.id)}
                        />
                      </div>
                      <Button variant="outline" className="w-full" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {integrations.filter(int => int.isActive).map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex items-center justify-center bg-blue-50 rounded-lg">
                            <Icon className="w-6 h-6 text-blue-900" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {getCategoryLabel(integration.category)}
                            </Badge>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      <Button variant="outline" className="w-full" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        External Notification Webhooks
                      </CardTitle>
                      <CardDescription>
                        Send notifications to Slack, Discord, and other platforms
                      </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Webhook
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add External Webhook</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="platform">Platform</Label>
                            <Select
                              value={newWebhook.platform}
                              onValueChange={(value: 'slack' | 'discord') =>
                                setNewWebhook({ ...newWebhook, platform: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="slack">Slack</SelectItem>
                                <SelectItem value="discord">Discord</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                              id="name"
                              placeholder="e.g., Main Team Channel"
                              value={newWebhook.name}
                              onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="webhook_url">Webhook URL</Label>
                            <Input
                              id="webhook_url"
                              type="url"
                              placeholder={
                                newWebhook.platform === 'slack'
                                  ? 'https://hooks.slack.com/services/...'
                                  : 'https://discord.com/api/webhooks/...'
                              }
                              value={newWebhook.webhook_url}
                              onChange={(e) =>
                                setNewWebhook({ ...newWebhook, webhook_url: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                              id="description"
                              placeholder="Description of this webhook"
                              value={newWebhook.description}
                              onChange={(e) =>
                                setNewWebhook({ ...newWebhook, description: e.target.value })
                              }
                            />
                          </div>
                          <Button onClick={handleCreateWebhook} disabled={isLoading} className="w-full">
                            {isLoading ? 'Creating...' : 'Create Webhook'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {webhooks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No webhooks configured yet</p>
                        <p className="text-sm">Add your first webhook to get started</p>
                      </div>
                    ) : (
                      webhooks.map((webhook) => (
                        <div key={webhook.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{webhook.name}</span>
                                <Badge variant="outline" className="capitalize">
                                  {webhook.platform}
                                </Badge>
                                {webhook.is_active ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Inactive</Badge>
                                )}
                              </div>
                              {webhook.description && (
                                <p className="text-sm text-muted-foreground">{webhook.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                                {webhook.webhook_url}
                              </p>
                            </div>
                            <Switch
                              checked={webhook.is_active}
                              onCheckedChange={() => handleToggleWebhook(webhook.id, webhook.is_active)}
                            />
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestWebhook(webhook)}
                              disabled={!webhook.is_active}
                            >
                              Test
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteWebhook(webhook.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Zapier Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your Zapier workflows by providing your webhook URL
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTriggerZapier} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="zapierWebhook">Zapier Webhook URL</Label>
                      <Input
                        id="zapierWebhook"
                        type="url"
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        value={zapierWebhook}
                        onChange={(e) => setZapierWebhook(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Get this URL from your Zapier Webhook trigger
                      </p>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      {isLoading ? 'Sending...' : 'Test Webhook'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Key className="w-5 h-5" />
                  API Keys Management
                </CardTitle>
                <CardDescription>
                  Manage API keys for external services and integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Stripe API Key</span>
                    <Badge variant="secondary">Not Configured</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required for payment processing
                  </p>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">SendGrid API Key</span>
                    <Badge variant="secondary">Not Configured</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required for email notifications
                  </p>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Twilio API Key</span>
                    <Badge variant="secondary">Not Configured</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required for SMS notifications
                  </p>
                  <Button variant="outline" size="sm">
                    <Key className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApiIntegrations;
