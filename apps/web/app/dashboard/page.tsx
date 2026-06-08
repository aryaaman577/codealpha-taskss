'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/axios';
import AppLayout from '@/components/dashboard/AppLayout';
import { Video, MessageSquare, Folder, PenTool, Calendar, Users, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  totalMeetings: number;
  totalHours: number;
  messagesCount: number;
  filesShared: number;
}

interface MeetingFeedItem {
  _id: string;
  roomId: string;
  title: string;
  status: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMeetings, setRecentMeetings] = useState<MeetingFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, meetingsRes] = await Promise.all([
          api.get('/analytics'),
          api.get('/meetings'),
        ]);
        setStats(statsRes.data.data.stats);
        setRecentMeetings(meetingsRes.data.data.meetings?.slice(0, 4) || []);
      } catch (error: any) {
        toast.error('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-[32px] border border-border-default bg-bg-surface/80 p-8 shadow-card backdrop-blur-md">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-accent-primary/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between relative z-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan">Workspace Overview</p>
              <h1 className="mt-2 text-3xl font-bold font-display">Welcome back, {user?.displayName}!</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Coordinate meetings, draw whiteboards, and exchange messages with your team.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/meetings"
                className="rounded-2xl bg-accent-primary hover:bg-accent-hover px-5 py-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 shadow-glow-sm flex items-center gap-2"
              >
                <Video size={14} /> Start Call
              </Link>
              <Link
                href="/chat"
                className="rounded-2xl border border-border-default hover:border-border-strong px-5 py-3 text-xs font-semibold text-text-primary transition hover:bg-bg-elevated/50 flex items-center gap-2"
              >
                <MessageSquare size={14} /> Open Chat
              </Link>
            </div>
          </div>
        </section>

        {/* Analytics Statistics Grid */}
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[24px] border border-border-default bg-bg-surface/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Meetings Hosted</span>
              <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                <Video size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold font-display">{loading ? '...' : stats?.totalMeetings ?? 0}</p>
          </div>

          <div className="rounded-[24px] border border-border-default bg-bg-surface/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Meeting Hours</span>
              <div className="p-2.5 rounded-xl bg-accent-purple/10 text-accent-purple border border-accent-purple/20">
                <Clock size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold font-display">{loading ? '...' : `${stats?.totalHours ?? 0}h`}</p>
          </div>

          <div className="rounded-[24px] border border-border-default bg-bg-surface/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Messages Sent</span>
              <div className="p-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                <MessageSquare size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold font-display">{loading ? '...' : stats?.messagesCount ?? 0}</p>
          </div>

          <div className="rounded-[24px] border border-border-default bg-bg-surface/40 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Vault Files</span>
              <div className="p-2.5 rounded-xl bg-accent-primary/10 text-accent-cyan border border-accent-cyan/20">
                <Folder size={16} />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold font-display">{loading ? '...' : stats?.filesShared ?? 0}</p>
          </div>
        </section>

        {/* Dashboard Split Sections */}
        <section className="grid gap-8 lg:grid-cols-3">
          {/* Recent Meetings Feed */}
          <div className="lg:col-span-2 rounded-[28px] border border-border-default bg-bg-surface/60 p-6 shadow-card backdrop-blur-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <Calendar size={18} className="text-accent-primary" /> Recent meetings
                </h3>
                <Link href="/meetings" className="text-xs font-semibold text-accent-cyan hover:underline flex items-center gap-1">
                  View all <ArrowRight size={10} />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <div className="py-8 text-center text-sm text-text-secondary">Loading meeting history...</div>
                ) : recentMeetings.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-secondary border-2 border-dashed border-border-subtle rounded-2xl">
                    No recent meetings. Start a call above!
                  </div>
                ) : (
                  recentMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-bg-base/50 border border-border-subtle hover:border-border-default transition duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl text-xs font-bold ${meeting.status === 'active' ? 'bg-status-online/15 text-status-online' : 'bg-text-muted/15 text-text-secondary'}`}>
                          {meeting.status === 'active' ? 'LIVE' : 'ENDED'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{meeting.title}</p>
                          <span className="text-[10px] text-text-secondary">Room ID: {meeting.roomId}</span>
                        </div>
                      </div>
                      <Link
                        href={`/meeting/${meeting.roomId}`}
                        className="rounded-xl border border-border-default hover:bg-bg-elevated px-3 py-1.5 text-xs font-medium transition"
                      >
                        Enter Room
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-[28px] border border-border-default bg-bg-surface/60 p-6 shadow-card backdrop-blur-sm">
            <h3 className="text-lg font-bold font-display pb-4 border-b border-border-subtle flex items-center gap-2">
              <Users size={18} className="text-accent-purple" /> Collaboration tools
            </h3>
            <div className="mt-6 space-y-3">
              <Link
                href="/whiteboard"
                className="flex items-center gap-4 p-3.5 rounded-2xl border border-border-subtle hover:border-border-default bg-bg-base/30 hover:bg-bg-elevated/40 transition duration-200"
              >
                <div className="p-2.5 rounded-xl bg-accent-purple/10 text-accent-purple">
                  <PenTool size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">Miro Whiteboard</p>
                  <p className="text-[10px] text-text-secondary">Draw and brainstorm dynamically</p>
                </div>
              </Link>

              <Link
                href="/files"
                className="flex items-center gap-4 p-3.5 rounded-2xl border border-border-subtle hover:border-border-default bg-bg-base/30 hover:bg-bg-elevated/40 transition duration-200"
              >
                <div className="p-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan">
                  <Folder size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-text-primary">File Vault</p>
                  <p className="text-[10px] text-text-secondary">Organize and share project assets</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
