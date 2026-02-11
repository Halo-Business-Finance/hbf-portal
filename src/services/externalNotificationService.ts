import { restQuery } from './supabaseHttp';

export interface ExternalWebhook {
  id: string;
  platform: 'slack' | 'discord';
  webhook_url: string;
  name: string;
  description?: string;
  is_active: boolean;
  channels: string[];
  event_types: string[];
  created_at: string;
  updated_at: string;
}

export interface WebhookCreate {
  platform: 'slack' | 'discord';
  webhook_url: string;
  name: string;
  description?: string;
  channels?: string[];
  event_types?: string[];
}

class ExternalNotificationService {
  async getWebhooks(): Promise<ExternalWebhook[]> {
    const p = new URLSearchParams();
    p.set('order', 'created_at.desc');
    const { data } = await restQuery<ExternalWebhook[]>('external_notification_webhooks', { params: p });
    return data || [];
  }

  async createWebhook(webhook: WebhookCreate): Promise<ExternalWebhook> {
    const { data } = await restQuery<ExternalWebhook>('external_notification_webhooks', {
      method: 'POST',
      body: {
        platform: webhook.platform,
        webhook_url: webhook.webhook_url,
        name: webhook.name,
        description: webhook.description,
        channels: webhook.channels || [],
        event_types: webhook.event_types || ['loan_funded', 'application_submitted', 'application_approved'],
      },
      returnData: true,
      single: true,
    });
    return data;
  }

  async updateWebhook(id: string, updates: Partial<WebhookCreate>): Promise<ExternalWebhook> {
    const p = new URLSearchParams();
    p.set('id', `eq.${id}`);
    const { data } = await restQuery<ExternalWebhook>('external_notification_webhooks', { method: 'PATCH', params: p, body: updates, returnData: true, single: true });
    return data;
  }

  async toggleWebhook(id: string, isActive: boolean): Promise<void> {
    const p = new URLSearchParams();
    p.set('id', `eq.${id}`);
    await restQuery('external_notification_webhooks', { method: 'PATCH', params: p, body: { is_active: isActive } });
  }

  async deleteWebhook(id: string): Promise<void> {
    const p = new URLSearchParams();
    p.set('id', `eq.${id}`);
    await restQuery('external_notification_webhooks', { method: 'DELETE', params: p });
  }

  async testWebhook(webhookUrl: string, platform: 'slack' | 'discord'): Promise<void> {
    const message = platform === 'slack'
      ? { text: '🔔 Test notification from Heritage Business Funding', blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*Test Notification*\nYour webhook is configured correctly!' } }] }
      : { content: '🔔 **Test notification from Heritage Business Funding**\nYour webhook is configured correctly!' };
    const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    if (!response.ok) throw new Error(`Failed to send test notification: ${response.statusText}`);
  }
}

export const externalNotificationService = new ExternalNotificationService();
