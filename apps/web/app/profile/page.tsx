'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import AppLayout from '@/components/dashboard/AppLayout';
import { api } from '@/lib/axios';
import { User, Shield, PenTool, Check } from 'lucide-react';
import { toast } from 'sonner';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  bio: z.string().max(200, 'Biography must not exceed 200 characters').optional(),
  customStatus: z.string().max(100, 'Status must not exceed 100 characters').optional(),
  avatarUrl: z.string().url('Invalid image URL').or(z.literal('')).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      customStatus: user?.customStatus || '',
      avatarUrl: user?.avatar || '',
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    try {
      // Update all safe profile fields in one call
      const response = await api.patch('/auth/profile', {
        displayName: values.displayName,
        username: values.username,
        avatar: values.avatarUrl || undefined,
        bio: values.bio,
        customStatus: values.customStatus,
      });

      setUser(response.data.data.user);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="pb-4 border-b border-border-subtle text-left">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <User size={22} className="text-accent-primary" /> Profile Settings
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Customize how your identity appears across rooms and channels.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Avatar preview block */}
          <div className="md:col-span-1 flex flex-col items-center justify-center p-6 rounded-3xl border border-border-default bg-bg-surface/50 h-fit text-center">
            <div className="h-24 w-24 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-3xl border-2 border-accent-primary/35 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
              ) : (
                user?.displayName.charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="text-sm font-semibold text-text-primary mt-4">{user?.displayName}</h3>
            <span className="text-[10px] text-text-muted mt-0.5">@{user?.username}</span>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-status-online border border-status-online/25 px-2.5 py-1 rounded-full bg-status-online/10">
              <div className="h-1.5 w-1.5 rounded-full bg-status-online" />
              <span>Active Online</span>
            </div>
          </div>

          {/* Profile form block */}
          <div className="md:col-span-2 rounded-3xl border border-border-default bg-bg-surface/80 p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Display Name</span>
                <input
                  type="text"
                  {...register('displayName')}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
                {errors.displayName && <p className="mt-1.5 text-xs text-semantic-error">{errors.displayName.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Username</span>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sm text-text-secondary select-none">@</span>
                  <input
                    type="text"
                    {...register('username')}
                    className="w-full rounded-2xl border border-border-default bg-bg-base pl-8 pr-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary font-mono"
                  />
                </div>
                {errors.username && <p className="mt-1.5 text-xs text-semantic-error">{errors.username.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Biography</span>
                <textarea
                  placeholder="Tell your team about yourself"
                  rows={3}
                  {...register('bio')}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary resize-none"
                />
                {errors.bio && <p className="mt-1.5 text-xs text-semantic-error">{errors.bio.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Custom Status Message</span>
                <input
                  type="text"
                  placeholder="What's your status? e.g. Coding sync tools"
                  {...register('customStatus')}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                />
                {errors.customStatus && <p className="mt-1.5 text-xs text-semantic-error">{errors.customStatus.message}</p>}
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Avatar Image URL</span>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  {...register('avatarUrl')}
                  className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary font-mono"
                />
                {errors.avatarUrl && <p className="mt-1.5 text-xs text-semantic-error">{errors.avatarUrl.message}</p>}
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-accent-primary hover:bg-accent-hover px-6 py-3 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-glow-sm flex items-center gap-1.5 ml-auto mt-6"
              >
                <Check size={14} /> {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
