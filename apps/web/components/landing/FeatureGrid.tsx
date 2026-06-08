import React from 'react';
import { Shield, Sparkles, MessageSquare, Video, PenTool, Database } from 'lucide-react';

export default function FeatureGrid() {
  const items = [
    {
      icon: <Video className="text-accent-primary" size={24} />,
      title: 'Ultra-HD Video Meetings',
      description: 'Crystal-clear peer-to-peer and SFU meetings featuring WebRTC screen sharing and low-latency audio.',
    },
    {
      icon: <MessageSquare className="text-accent-cyan" size={24} />,
      title: 'Real-Time Team Channels',
      description: 'Organized Discord-like channels and Slack-like direct messaging complete with typing status and reactions.',
    },
    {
      icon: <PenTool className="text-accent-purple" size={24} />,
      title: 'Collaborative Whiteboard',
      description: 'Brainstorm with your team using real-time canvas shapes, drawings, note cards, and cursor tracking.',
    },
    {
      icon: <Database className="text-accent-cyan" size={24} />,
      title: 'Secure File Manager',
      description: 'Upload files and document attachments directly inside chat boxes or meeting rooms to persist notes.',
    },
    {
      icon: <Shield className="text-accent-primary" size={24} />,
      title: 'Hardened Security Shield',
      description: 'Protected by secure HttpOnly cookies, refresh token rotations, rate limit policies, and helmet middlewares.',
    },
    {
      icon: <Sparkles className="text-accent-purple" size={24} />,
      title: 'Premium Glassmorphic UI',
      description: 'Immersive dark modes, fluid depth shadows, and interactive animations tailored for modern SaaS work.',
    },
  ];

  return (
    <section id="features" className="py-24 border-t border-border-subtle relative bg-bg-base">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-cyan">Comprehensive Suite</p>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Everything You Need, In One Place
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-text-secondary">
          No more hopping between five different tools. SyncSpace brings meetings, chat, file sharing, and whiteboards into a single tab.
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="group rounded-[28px] border border-border-default bg-bg-surface/50 p-8 text-left shadow-card hover:border-border-strong transition duration-300"
            >
              <div className="h-12 w-12 rounded-2xl bg-bg-elevated flex items-center justify-center border border-border-subtle group-hover:scale-105 transition duration-300">
                {item.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-text-primary">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
