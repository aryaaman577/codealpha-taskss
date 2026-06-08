'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/axios';
import AppLayout from '@/components/dashboard/AppLayout';
import { Video, Calendar, Clock, Sparkles, ArrowRight, VideoOff } from 'lucide-react';
import { toast } from 'sonner';
import { useMeetingStore } from '@/stores/meeting.store';

const createMeetingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['instant', 'scheduled']).default('instant'),
  maxParticipants: z.number().min(2).max(100).default(25),
  settings: z.object({
    waitingRoomEnabled: z.boolean().default(false),
    muteOnJoin: z.boolean().default(false),
    videoOffOnJoin: z.boolean().default(false),
  }).default({}),
});

type CreateMeetingForm = z.infer<typeof createMeetingSchema>;

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinRoomId, setJoinRoomId] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<CreateMeetingForm>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'instant',
      maxParticipants: 25,
      settings: {
        waitingRoomEnabled: false,
        muteOnJoin: false,
        videoOffOnJoin: false,
      },
    },
  });

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data.data.meetings || []);
    } catch {
      toast.error('Failed to load meetings list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      toast.error('Room ID is required');
      return;
    }
    const cleanId = joinRoomId.trim();
    if (!/^[a-zA-Z0-9]{8}$/.test(cleanId)) {
      toast.error('Room ID must be exactly 8 characters');
      return;
    }
    window.location.href = `/meeting/${cleanId}`;
  };

  const onCreateMeeting = async (values: CreateMeetingForm) => {
    try {
      const response = await api.post('/meetings', values);
      const meeting = response.data.data.meeting;
      toast.success('Meeting created successfully!');
      window.location.href = `/meeting/${meeting.roomId}`;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create meeting');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Join Call & Schedule Section */}
          <div className="space-y-8">
            {/* Join Room */}
            <div className="rounded-[28px] border border-border-default bg-bg-surface/70 p-6 shadow-card backdrop-blur-sm">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-4">
                <Video size={18} className="text-accent-cyan" /> Join a meeting
              </h3>
              <form onSubmit={handleJoin} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter 8-character Room ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  maxLength={8}
                  className="flex-1 rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-cyan font-mono"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-accent-cyan hover:bg-accent-cyan/80 px-6 py-3 text-xs font-semibold text-white shadow-glow-sm transition"
                >
                  Join
                </button>
              </form>
            </div>

            {/* Schedule / Create Room */}
            <div className="rounded-[28px] border border-border-default bg-bg-surface/70 p-6 shadow-card backdrop-blur-sm">
              <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-6">
                <Calendar size={18} className="text-accent-primary" /> Start or schedule a meeting
              </h3>
              <form onSubmit={handleSubmit(onCreateMeeting)} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Title</span>
                  <input
                    type="text"
                    placeholder="e.g. Design Sync"
                    {...register('title')}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-semantic-error">{errors.title.message}</p>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Description (optional)</span>
                  <textarea
                    placeholder="Provide context for participants"
                    rows={2}
                    {...register('description')}
                    className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary resize-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Capacity</span>
                    <input
                      type="number"
                      {...register('maxParticipants', { valueAsNumber: true })}
                      className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</span>
                    <select
                      {...register('type')}
                      className="w-full rounded-2xl border border-border-default bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-accent-primary"
                    >
                      <option value="instant">Instant Call</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </label>
                </div>

                {/* Settings Toggles */}
                <div className="pt-2 space-y-2.5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('settings.waitingRoomEnabled')}
                      className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0"
                    />
                    <span className="text-xs text-text-secondary">Enable waiting room</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('settings.muteOnJoin')}
                      className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0"
                    />
                    <span className="text-xs text-text-secondary">Mute participants on join</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('settings.videoOffOnJoin')}
                      className="h-4 w-4 rounded border-border-default bg-bg-base text-accent-primary focus:ring-0"
                    />
                    <span className="text-xs text-text-secondary">Disable cameras on join</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-accent-primary hover:bg-accent-hover px-4 py-3.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 shadow-glow-sm mt-4"
                >
                  {isSubmitting ? 'Creating...' : 'Create Call'}
                </button>
              </form>
            </div>
          </div>

          {/* User Call History Feed */}
          <div className="rounded-[28px] border border-border-default bg-bg-surface/70 p-6 shadow-card backdrop-blur-sm">
            <h3 className="text-lg font-bold font-display flex items-center gap-2 mb-6">
              <Clock size={18} className="text-accent-purple" /> Call logs history
            </h3>
            
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
              {loading ? (
                <div className="py-12 text-center text-sm text-text-secondary">Loading meeting history...</div>
              ) : meetings.length === 0 ? (
                <div className="py-24 text-center text-sm text-text-secondary border-2 border-dashed border-border-subtle rounded-2xl">
                  <VideoOff className="mx-auto text-text-muted mb-3" size={36} />
                  No meetings found. Start a call above!
                </div>
              ) : (
                meetings.map((meeting) => (
                  <div
                    key={meeting._id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-bg-base/40 border border-border-subtle hover:border-border-default transition duration-200"
                  >
                    <div className="text-left leading-relaxed">
                      <h4 className="text-sm font-semibold text-text-primary">{meeting.title}</h4>
                      <p className="text-[10px] text-text-secondary font-mono">ID: {meeting.roomId}</p>
                      <span className="text-[10px] text-text-muted">
                        Created {new Date(meeting.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      href={`/meeting/${meeting.roomId}`}
                      className="rounded-xl border border-border-default bg-bg-elevated/50 hover:bg-bg-elevated px-3 py-2 text-xs font-semibold transition"
                    >
                      Rejoin
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
