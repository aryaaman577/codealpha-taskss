'use client';

import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/dashboard/AppLayout';
import { api } from '@/lib/axios';
import { Calendar, Clock, Eye, VideoOff } from 'lucide-react';
import { toast } from 'sonner';

interface MeetingHistoryItem {
  _id: string;
  roomId: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  participants: Array<{
    user: string;
    role: string;
    duration: number;
  }>;
}

export default function HistoryPage() {
  const [meetings, setMeetings] = useState<MeetingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/meetings');
        setMeetings(response.data.data.meetings || []);
      } catch {
        toast.error('Failed to load meeting history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="pb-4 border-b border-border-subtle text-left">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <Clock size={22} className="text-accent-primary" /> Meeting History logs
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Browse and rejoin past meetings you hosted or participated in.
          </p>
        </div>

        {/* Meeting list */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center text-sm text-text-secondary">Loading meeting history logs...</div>
          ) : meetings.length === 0 ? (
            <div className="py-32 text-center text-sm text-text-secondary border-2 border-dashed border-border-subtle rounded-[28px] bg-bg-surface/20">
              <VideoOff className="mx-auto text-text-muted mb-4" size={44} />
              <h3 className="text-sm font-semibold">No past meetings</h3>
              <p className="text-xs text-text-muted mt-1">Create or schedule a meeting call in the meetings page.</p>
            </div>
          ) : (
            meetings.map((meeting) => {
              const date = new Date(meeting.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const time = new Date(meeting.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={meeting._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-[22px] border border-border-subtle bg-bg-surface/40 hover:bg-bg-surface/75 hover:border-border-default transition duration-300 gap-4"
                >
                  <div className="flex gap-4 items-start text-left">
                    <div className="p-3 rounded-xl border border-border-subtle bg-bg-elevated/40 text-accent-cyan">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">{meeting.title}</h4>
                      {meeting.description && (
                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{meeting.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-[10px] text-text-muted">
                        <span>Date: {date}</span>
                        <span>• Time: {time}</span>
                        <span className="font-mono uppercase text-accent-primary">Room ID: {meeting.roomId}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/meeting/${meeting.roomId}`}
                    className="w-full sm:w-auto rounded-xl border border-border-default hover:bg-bg-elevated/50 hover:border-border-strong px-4 py-2.5 text-xs font-semibold text-text-primary transition flex items-center justify-center gap-2"
                  >
                    <Eye size={12} /> Enter Room
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
