import { create } from 'zustand';
import { api } from '@/lib/axios';

export interface Notification {
  _id: string;
  type: 'mention' | 'meeting_invite' | 'system' | 'direct_message';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/notifications');
      const rawNotifications = response.data.data.notifications || [];
      const notifications = rawNotifications.map((n: any) => ({
        ...n,
        link: n.link || n.actionUrl,
      }));
      const unreadCount = notifications.filter((n: Notification) => !n.read).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => {
        const updated = state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        );
        const unreadCount = updated.filter((n) => !n.read).length;
        return { notifications: updated, unreadCount };
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => {
        const updated = state.notifications.map((n) => ({ ...n, read: true }));
        return { notifications: updated, unreadCount: 0 };
      });
    } catch (err) {
      console.error(err);
    }
  },

  addNotification: (notification) => {
    set((state) => {
      // Prevent duplicates
      if (state.notifications.some((n) => n._id === notification._id)) {
        return state;
      }
      const mapped = {
        ...notification,
        link: notification.link || (notification as any).actionUrl,
      };
      const notifications = [mapped, ...state.notifications];
      const unreadCount = notifications.filter((n) => !n.read).length;
      return { notifications, unreadCount };
    });
  },
}));
