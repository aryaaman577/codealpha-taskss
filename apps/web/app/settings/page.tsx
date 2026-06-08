'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/components/dashboard/AppLayout';
import { api } from '@/lib/axios';
import { Settings, Shield, Video, Volume2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });

  const currentSettings = user?.settings || {
    notifications: { email: true, push: true, sound: true, mentions: true, meetingReminders: true },
    privacy: { showOnlineStatus: true, allowDirectMessages: true, showLastSeen: true },
    appearance: { theme: 'dark' as const, fontSize: 'medium' as const, compactMode: false },
    meeting: { defaultCameraOn: false, defaultMicOn: false, defaultSpeaker: 'default' },
  };

  const handleUpdateSetting = async (key: 'defaultMicOn' | 'defaultCameraOn' | 'sound', value: boolean) => {
    try {
      const updatedSettings = {
        ...currentSettings,
        notifications: {
          ...currentSettings.notifications,
          sound: key === 'sound' ? value : currentSettings.notifications.sound,
        },
        meeting: {
          ...currentSettings.meeting,
          defaultMicOn: key === 'defaultMicOn' ? value : currentSettings.meeting.defaultMicOn,
          defaultCameraOn: key === 'defaultCameraOn' ? value : currentSettings.meeting.defaultCameraOn,
        }
      };

      const response = await api.patch('/auth/profile', {
        settings: updatedSettings
      });

      setUser(response.data.data.user);
      toast.success('Setting updated successfully!');
    } catch {
      toast.error('Failed to update system setting');
    }
  };

  const onSubmitPassword = async (values: ChangePasswordForm) => {
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password changed successfully!');
      reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="pb-4 border-b border-border-subtle text-left">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Settings size={22} className="text-accent-primary" /> System Settings
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Configure default settings for video calls, notification audio, and secure credentials.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Security & Credentials */}
          <div className="rounded-3xl border border-border-default bg-bg-surface/70 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold font-display flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle text-left">
                <Lock size={16} className="text-accent-cyan" /> Account Password
              </h3>
              <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
                <label className="block text-left">
                  <span className="mb-2 block text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Current Password</span>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    {...register('currentPassword')}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-xs text-text-primary outline-none transition focus:border-accent-cyan"
                  />
                  {errors.currentPassword && <p className="mt-1.5 text-[10px] text-semantic-error">{errors.currentPassword.message}</p>}
                </label>

                <label className="block text-left">
                  <span className="mb-2 block text-[10px] font-semibold text-text-secondary uppercase tracking-wider">New Password</span>
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    {...register('newPassword')}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-xs text-text-primary outline-none transition focus:border-accent-cyan"
                  />
                  {errors.newPassword && <p className="mt-1.5 text-[10px] text-semantic-error">{errors.newPassword.message}</p>}
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-accent-cyan hover:bg-accent-cyan/80 px-5 py-3 text-xs font-semibold text-white transition disabled:opacity-50 flex items-center gap-1.5 ml-auto mt-4"
                >
                  Change Password
                </button>
              </form>
            </div>
          </div>

          {/* Meeting defaults */}
          <div className="rounded-3xl border border-border-default bg-bg-surface/70 p-6 text-left">
            <h3 className="text-sm font-bold font-display flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
              <Video size={16} className="text-accent-primary" /> Meeting defaults
            </h3>
             <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Default microphone on</p>
                  <p className="text-[10px] text-text-secondary">Turn on your microphone automatically when joining calls.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.meeting.defaultMicOn}
                  onChange={(e) => handleUpdateSetting('defaultMicOn', e.target.checked)}
                  className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-border-subtle pt-4">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Default camera on</p>
                  <p className="text-[10px] text-text-secondary">Turn on your camera automatically when joining calls.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.meeting.defaultCameraOn}
                  onChange={(e) => handleUpdateSetting('defaultCameraOn', e.target.checked)}
                  className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-border-subtle pt-4">
                <div>
                  <p className="text-xs font-semibold text-text-primary">Sound notifications</p>
                  <p className="text-[10px] text-text-secondary">Play alert sounds when receiving new direct messages or invites.</p>
                </div>
                <input
                  type="checkbox"
                  checked={currentSettings.notifications.sound}
                  onChange={(e) => handleUpdateSetting('sound', e.target.checked)}
                  className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
