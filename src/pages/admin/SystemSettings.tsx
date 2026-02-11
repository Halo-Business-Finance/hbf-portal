import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/PageHeader';
import { Bell, Mail, Database, Shield } from 'lucide-react';
import { restQuery } from '@/services/supabaseHttp';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await restQuery<any[]>('system_settings');
      
      const settingsMap = (data || []).reduce((acc: Record<string, any>, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {} as Record<string, any>);
      
      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const params = new URLSearchParams();
      params.set('setting_key', `eq.${key}`);
      await restQuery('system_settings', {
        method: 'PATCH',
        params,
        body: { setting_value: value },
      });
      
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully');
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-blue-950 animate-pulse">
          <div className="max-w-7xl mx-auto sm:px-6 md:py-[30px] lg:px-[34px] px-[30px] py-[15px]">
            <div className="h-8 bg-white/20 rounded w-48 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-72"></div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <p className="text-muted-foreground text-center">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="System Settings" 
        subtitle="Configure system-wide settings and preferences"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notification_email_enabled?.enabled ?? true}
                  onCheckedChange={(checked) => 
                    updateSetting('notification_email_enabled', { enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <Switch
                  id="sms-notifications"
                  checked={settings.notification_sms_enabled?.enabled ?? false}
                  onCheckedChange={(checked) => 
                    updateSetting('notification_sms_enabled', { enabled: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="system-notifications">System Notifications</Label>
                <Switch
                  id="system-notifications"
                  checked={settings.notification_system_enabled?.enabled ?? true}
                  onCheckedChange={(checked) => 
                    updateSetting('notification_system_enabled', { enabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Email Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Templates
              </CardTitle>
              <CardDescription>Manage welcome email template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={settings.email_template_welcome?.subject ?? ''}
                  onChange={(e) => 
                    updateSetting('email_template_welcome', {
                      ...settings.email_template_welcome,
                      subject: e.target.value
                    })
                  }
                  placeholder="Welcome to Our Platform"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Email Body</Label>
                <Textarea
                  id="email-body"
                  value={settings.email_template_welcome?.body ?? ''}
                  onChange={(e) => 
                    updateSetting('email_template_welcome', {
                      ...settings.email_template_welcome,
                      body: e.target.value
                    })
                  }
                  placeholder="Welcome {{name}}!"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Use {`{{name}}`} for user name</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Retention
              </CardTitle>
              <CardDescription>Configure data retention policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applications-retention">Applications Retention (days)</Label>
                <Input
                  id="applications-retention"
                  type="number"
                  value={settings.data_retention_days?.applications ?? 365}
                  onChange={(e) => 
                    updateSetting('data_retention_days', {
                      ...settings.data_retention_days,
                      applications: parseInt(e.target.value)
                    })
                  }
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logs-retention">Logs Retention (days)</Label>
                <Input
                  id="logs-retention"
                  type="number"
                  value={settings.data_retention_days?.logs ?? 90}
                  onChange={(e) => 
                    updateSetting('data_retention_days', {
                      ...settings.data_retention_days,
                      logs: parseInt(e.target.value)
                    })
                  }
                  min="1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage security and authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password-length">Minimum Password Length</Label>
                <Input
                  id="password-length"
                  type="number"
                  value={settings.security_password_min_length?.value ?? 8}
                  onChange={(e) => 
                    updateSetting('security_password_min_length', {
                      value: parseInt(e.target.value)
                    })
                  }
                  min="6"
                  max="20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  value={settings.security_session_timeout?.minutes ?? 60}
                  onChange={(e) => 
                    updateSetting('security_session_timeout', {
                      minutes: parseInt(e.target.value)
                    })
                  }
                  min="5"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;