import { authProvider } from '@/services/auth';
import { callRpc, restQuery } from './supabaseHttp';

export interface NotificationPreference {
  email: boolean;
  in_app: boolean;
  sms: boolean;
}

export interface NotificationPreferences {
  loan_funded: NotificationPreference;
  application_submitted: NotificationPreference;
  application_approved: NotificationPreference;
  application_rejected: NotificationPreference;
  application_under_review: NotificationPreference;
  document_required: NotificationPreference;
  payment_reminder: NotificationPreference;
  payment_received: NotificationPreference;
  status_update: NotificationPreference;
}

export const notificationEventLabels: Record<keyof NotificationPreferences, string> = {
  loan_funded: 'Loan Funded',
  application_submitted: 'Application Submitted',
  application_approved: 'Application Approved',
  application_rejected: 'Application Rejected',
  application_under_review: 'Application Under Review',
  document_required: 'Document Required',
  payment_reminder: 'Payment Reminder',
  payment_received: 'Payment Received',
  status_update: 'Status Update',
};

export const notificationEventDescriptions: Record<keyof NotificationPreferences, string> = {
  loan_funded: 'When your loan application is approved and funded',
  application_submitted: 'When you submit a new loan application',
  application_approved: 'When your loan application is approved',
  application_rejected: 'When your loan application is rejected',
  application_under_review: 'When your application moves to review status',
  document_required: 'When additional documents are needed',
  payment_reminder: 'Reminders for upcoming loan payments',
  payment_received: 'Confirmation when payments are processed',
  status_update: 'General status updates on your applications',
};

class NotificationPreferencesService {
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data: authData, error: authError } = await authProvider.getUser();
      const user = authData?.user;
      if (authError || !user) throw new Error('User not authenticated');
      const data = await callRpc<NotificationPreferences>('get_user_notification_preferences', { _user_id: user.id });
      return data;
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      throw new Error('Failed to fetch notification preferences');
    }
  }

  async updatePreferences(preferences: NotificationPreferences) {
    try {
      const { data: authData, error: authError } = await authProvider.getUser();
      const user = authData?.user;
      if (authError || !user) throw new Error('User not authenticated');

      const p = new URLSearchParams();
      p.set('on_conflict', 'user_id');
      const { data } = await restQuery('notification_preferences', {
        method: 'POST',
        params: p,
        body: { user_id: user.id, preferences, updated_at: new Date().toISOString() },
        returnData: true,
        single: true,
      });
      return data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  async updateEventPreference(eventType: keyof NotificationPreferences, channel: 'email' | 'in_app' | 'sms', enabled: boolean) {
    try {
      const preferences = await this.getPreferences();
      if (!preferences) throw new Error('Failed to load preferences');
      preferences[eventType][channel] = enabled;
      return await this.updatePreferences(preferences);
    } catch (error) {
      console.error('Error updating event preference:', error);
      throw new Error('Failed to update event preference');
    }
  }

  async toggleChannel(channel: 'email' | 'in_app' | 'sms', enabled: boolean) {
    try {
      const preferences = await this.getPreferences();
      if (!preferences) throw new Error('Failed to load preferences');
      Object.keys(preferences).forEach((key) => { preferences[key as keyof NotificationPreferences][channel] = enabled; });
      return await this.updatePreferences(preferences);
    } catch (error) {
      console.error('Error toggling channel:', error);
      throw new Error('Failed to toggle channel');
    }
  }
}

export const notificationPreferencesService = new NotificationPreferencesService();
