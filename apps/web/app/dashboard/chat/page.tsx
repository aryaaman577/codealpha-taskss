'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth.store';

export default function DashboardChatPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState('Loading conversation channels...');

  useEffect(() => {
    api.get('/health')
      .then(() => setSummary('Real-time channels available for meetings, direct messages, and teams.'))
      .catch(() => setSummary('Unable to reach chat services.'));
  }, []);

  return (
    <main className="min-h-screen bg-bg-base text-text-primary px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-[32px] border border-border-default bg-bg-surface/90 p-8 shadow-card backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-accent-primary/80">Chat</p>
              <h1 className="mt-3 text-3xl font-semibold">Instant messaging</h1>
              <p className="mt-2 max-w-2xl text-text-secondary">
                Stay in sync across meetings with secure team channels, direct messages, and live typing presence.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[28px] border border-border-default bg-bg-base/80 p-6">
              <h2 className="text-xl font-semibold">Current status</h2>
              <p className="mt-3 text-text-secondary">{summary}</p>
            </div>
            <div className="rounded-[28px] border border-border-default bg-bg-base/80 p-6">
              <h2 className="text-xl font-semibold">Where to start</h2>
              <ul className="mt-4 space-y-3 text-text-secondary">
                <li>• Open team channels from within a live meeting.</li>
                <li>• Send secure direct messages to colleagues.</li>
                <li>• Share files, reactions, and topic threads in one workspace.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-border-default bg-bg-surface/90 p-8 shadow-card backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Chat preview</h2>
          <div className="mt-6 rounded-[28px] border border-border-default bg-bg-base/80 p-6">
            <p className="text-sm text-text-secondary">Use the live meeting room to open the full chat experience. This space will sync with your meetings, direct threads, and group channels.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
