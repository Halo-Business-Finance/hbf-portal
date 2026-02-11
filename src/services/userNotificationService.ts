import { restQuery, callRpc } from './supabaseHttp';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string | null;
  metadata: any;
  created_at: string;
  read_at: string | null;
}

class UserNotificationService {
  async getUserNotifications(limit: number = 50, unreadOnly: boolean = false) {
    try {
      const p = new URLSearchParams();
      p.set('order', 'created_at.desc');
      p.set('limit', String(limit));
      if (unreadOnly) p.set('read', 'eq.false');
      const { data } = await restQuery<Notification[]>('notifications', { params: p });
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  async getUnreadCount() {
    try {
      const p = new URLSearchParams();
      p.set('read', 'eq.false');
      p.set('select', '*');
      const { count } = await restQuery('notifications', { method: 'GET', params: p, countOnly: true });
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await callRpc('mark_notification_read', { notification_id: notificationId });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead() {
    try {
      await callRpc('mark_all_notifications_read');
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Subscribe to new notifications.
   * NOTE: Realtime subscriptions require the Supabase client.
   * This is a polling fallback until Supabase is fully removed.
   */
  subscribeToNotifications(callback: (notification: Notification) => void) {
    let lastChecked = new Date().toISOString();
    const interval = setInterval(async () => {
      try {
        const p = new URLSearchParams();
        p.set('created_at', `gt.${lastChecked}`);
        p.set('order', 'created_at.desc');
        const { data } = await restQuery<Notification[]>('notifications', { params: p });
        if (data && data.length > 0) {
          lastChecked = data[0].created_at;
          data.forEach(callback);
        }
      } catch { /* silent */ }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }
}

export const userNotificationService = new UserNotificationService();
