'use client';

import React, { useEffect } from 'react';
import AppLayout from '@/components/dashboard/AppLayout';
import { useNotificationStore } from '@/stores/notification.store';
import { Bell, BellOff, CheckCheck, Calendar, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?._id) return;

    if (!socket.connected) socket.connect();

    const onNotificationNew = (n: any) => {
      addNotification({
        _id: n._id,
        type: (n.type === 'meeting_invite' ? 'meeting_invite' : n.type) as any,
        title: n.title,
        message: n.message,
        read: Boolean(n.read),
        link: n.link,
        createdAt: n.createdAt,
      });
    };

    socket.on('notification:new', onNotificationNew);

    return () => {
      socket.off('notification:new', onNotificationNew);
    };
  }, [user?._id, addNotification]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    toast.success('Notification marked as read');
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    await markAllAsRead();
    toast.success('All notifications marked as read');
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header toolbar banner */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div>
            <h1 className="text-2xl font-bold font-display flex items-center gap-2">
              <Bell size={22} className="text-accent-primary" /> Notifications Inbox
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              You have {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface border border-border-default hover:border-border-strong text-xs font-semibold text-text-primary transition"
            >
              <CheckCheck size={14} className="text-accent-cyan" /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications feed listing */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-24 text-center text-sm text-text-secondary">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-32 text-center text-sm text-text-secondary border-2 border-dashed border-border-subtle rounded-[28px] bg-bg-surface/20">
              <BellOff className="mx-auto text-text-muted mb-4" size={44} />
              <h3 className="text-sm font-semibold">Your inbox is clear</h3>
              <p className="text-xs text-text-muted mt-1">We will alert you when something active happens.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start justify-between p-5 rounded-[22px] border transition duration-300 ${
                  n.read
                    ? 'border-border-subtle bg-bg-surface/30 opacity-70'
                    : 'border-accent-primary/30 bg-bg-surface/90 shadow-glow-sm'
                }`}
              >
                <div className="flex gap-4 items-start text-left">
                  <div className={`p-2.5 rounded-xl border ${n.read ? 'border-border-subtle bg-bg-elevated/40 text-text-muted' : 'border-accent-primary/20 bg-accent-primary/10 text-accent-primary'}`}>
                    <Bell size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{n.title}</h4>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-2 mt-3 text-[10px] text-text-muted">
                      <Calendar size={10} />
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                      {n.link && (
                        <a href={n.link} className="text-accent-cyan hover:underline flex items-center gap-0.5 ml-2">
                          <LinkIcon size={8} /> Go to resource
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n._id)}
                    className="p-2 rounded-lg hover:bg-bg-elevated text-text-secondary hover:text-accent-cyan transition"
                    title="Mark as read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
