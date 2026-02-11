import { invokeEdgeFunction } from './supabaseHttp';

export interface NotificationData {
  type: 'email' | 'sms' | 'system';
  recipient: string;
  template: string;
  data: any;
  applicationId?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class NotificationService {
  async sendNotification(notificationData: NotificationData) {
    try {
      return await invokeEdgeFunction('notification-service', {
        action: 'send',
        notificationData,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }

  async sendBulkNotifications(notifications: NotificationData[]) {
    try {
      return await invokeEdgeFunction('notification-service', {
        action: 'send-bulk',
        notificationData: { notifications },
      });
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw new Error('Failed to send bulk notifications');
    }
  }

  async getEmailTemplates() {
    try {
      const data = await invokeEdgeFunction('notification-service', {
        action: 'get-templates',
      });
      return data.templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch email templates');
    }
  }

  async notifyApplicationStatusChange(
    applicationId: string,
    newStatus: string,
    applicantEmail: string,
    applicantName: string,
    applicationNumber: string,
  ) {
    try {
      return await invokeEdgeFunction('notification-service', {
        action: 'application-status-change',
        notificationData: { applicationId, newStatus, applicantEmail, applicantName, applicationNumber },
      });
    } catch (error) {
      console.error('Error sending status change notification:', error);
      throw new Error('Failed to send status change notification');
    }
  }

  async sendApplicationSubmittedNotification(
    applicantEmail: string,
    applicantName: string,
    applicationNumber: string,
    applicationId: string,
  ) {
    const emailNotification: NotificationData = {
      type: 'email',
      recipient: applicantEmail,
      template: 'application_submitted',
      data: { applicantName, applicationNumber },
      applicationId,
    };
    const smsNotification: NotificationData = {
      type: 'sms',
      recipient: '+1234567890',
      template: 'application_submitted',
      data: { applicantName, applicationNumber },
      applicationId,
    };
    return await this.sendBulkNotifications([emailNotification, smsNotification]);
  }

  async sendWelcomeEmail(userEmail: string, userName: string) {
    return await this.sendNotification({
      type: 'email',
      recipient: userEmail,
      template: 'welcome',
      data: { userName, loginUrl: `${window.location.origin}/` },
    });
  }

  async sendApplicationReminderEmail(userEmail: string, userName: string, applicationId: string, daysAgo: number) {
    return await this.sendNotification({
      type: 'email',
      recipient: userEmail,
      template: 'application_reminder',
      data: { userName, daysAgo, continueUrl: `${window.location.origin}/?continue=${applicationId}` },
      applicationId,
    });
  }
}

export const notificationService = new NotificationService();
