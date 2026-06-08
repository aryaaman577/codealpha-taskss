'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

interface MeetingItem {
  _id: string;
  roomId: string;
  title: string;
  status: string;
  inviteLink: string;
  schedule?: {
    startTime?: string;
  };
}

const initialForm = {
  title: '',
  description: '',
  type: 'instant',
  startTime: '',
  maxParticipants: 16,
  passcode: '',
};

export default function MeetingsDashboardPage() {
  const { user } = useAuthStore();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const response = await api.get('/meetings');
        setMeetings(response.data.data.meetings || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadMeetings();
  }, []);

  const onChange = (key: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createMeeting = async () => {
    if (!form.title) {
      toast.error('Please add a meeting title');
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        type: form.type,
        schedule: form.startTime ? { startTime: new Date(form.startTime).toISOString() } : undefined,
        maxParticipants: form.maxParticipants,
        passcode: form.passcode || undefined,
      };
      const response = await api.post('/meetings', payload);
      setMeetings((current) => [response.data.data.meeting, ...current]);
      setForm(initialForm);
      toast.success('Meeting created successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Unable to create meeting');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg-base text-text-primary px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-border-default bg-bg-surface/90 p-8 shadow-card backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-primary/80">Meetings</p>
              <h1 className="mt-3 text-3xl font-semibold">Workspace meeting hub</h1>
              <p className="mt-2 max-w-2xl text-text-secondary">
                Create instant or scheduled sessions, then share secure room links with teammates.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-5 rounded-[28px] border border-border-default bg-bg-base/80 p-6">
              <h2 className="text-xl font-semibold">Start a new meeting</h2>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-text-secondary">Meeting title</span>
                  <input
                    value={form.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-text-secondary">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(e) => onChange('description', e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-text-secondary">Meeting type</span>
                    <select
                      value={form.type}
                      onChange={(e) => onChange('type', e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                    >
                      <option value="instant">Instant</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="recurring">Recurring</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm text-text-secondary">Start time</span>
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => onChange('startTime', e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-text-secondary">Max participants</span>
                    <input
                      type="number"
                      min={2}
                      max={200}
                      value={form.maxParticipants}
                      onChange={(e) => onChange('maxParticipants', parseInt(e.target.value, 10) || 2)}
                      className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm text-text-secondary">Passcode</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={form.passcode}
                      onChange={(e) => onChange('passcode', e.target.value)}
                      className="mt-2 w-full rounded-3xl border border-border-default bg-bg-surface px-4 py-3 text-text-primary outline-none focus:border-accent-primary"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={createMeeting}
                  disabled={creating}
                  className="inline-flex items-center justify-center rounded-3xl bg-accent-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create meeting'}
                </button>
              </div>
            </div>

            <div className="space-y-5 rounded-[28px] border border-border-default bg-bg-base/80 p-6">
              <h2 className="text-xl font-semibold">Upcoming sessions</h2>
              {loading ? (
                <p className="text-text-secondary">Loading meetings…</p>
              ) : meetings.length === 0 ? (
                <p className="text-text-secondary">No meetings yet. Create a room to start collaborating.</p>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div key={meeting._id} className="rounded-3xl border border-border-default bg-bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-accent-primary/80">{meeting.status}</p>
                          <h3 className="mt-2 text-lg font-semibold">{meeting.title}</h3>
                        </div>
                        <button
                          onClick={() => (window.location.href = `/meeting/${meeting.roomId}`)}
                          className="rounded-3xl bg-accent-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
                        >
                          Join
                        </button>
                      </div>
                      <p className="mt-3 text-sm text-text-secondary">Room ID: {meeting.roomId}</p>
                      {meeting.schedule?.startTime && (
                        <p className="mt-2 text-sm text-text-secondary">Starts: {new Date(meeting.schedule.startTime).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
