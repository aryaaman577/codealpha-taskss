'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Video, MessageSquare, PenTool, Folder } from 'lucide-react';
import SectionBadge from './SectionBadge';
import { fadeUp, staggerContainer, useReveal } from './motion';

interface BentoItem {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
  span: string;
}

const bentoItems: BentoItem[] = [
  {
    icon: Video,
    title: 'HD Video Meetings',
    description:
      'Crystal-clear WebRTC calls with screen sharing, recording, and rooms for up to 100.',
    accent: 'var(--accent-warm)',
    span: 'sm:col-span-2 sm:row-span-2',
  },
  {
    icon: MessageSquare,
    title: 'Team Chat',
    description: 'Channels, DMs, threads, reactions — persistent and real-time.',
    accent: 'var(--accent-sage)',
    span: 'sm:col-span-1',
  },
  {
    icon: PenTool,
    title: 'Live Whiteboard',
    description: 'Draw, sketch, and annotate together with live cursor tracking.',
    accent: 'var(--accent-bronze)',
    span: 'sm:col-span-1',
  },
  {
    icon: Folder,
    title: 'Secure File Vault',
    description: 'Upload, share, and manage documents with end-to-end encryption.',
    accent: 'var(--accent-warm)',
    span: 'sm:col-span-2',
  },
];

/* Mini visual for hero card: video grid */
function VideoGridMini() {
  return (
    <div className="mt-5 grid grid-cols-3 gap-1.5 max-w-[200px]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="aspect-video rounded-md bg-bg-surface border border-border-subtle flex items-center justify-center"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor:
                i % 3 === 0
                  ? 'var(--accent-warm)'
                  : i % 3 === 1
                  ? 'var(--accent-sage)'
                  : 'var(--accent-bronze)',
              opacity: 0.4,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* Mini visual for chat card: message bubbles */
function ChatBubblesMini() {
  return (
    <div className="mt-4 space-y-1.5 max-w-[140px]">
      <div className="flex justify-start">
        <div className="rounded-lg rounded-bl-none bg-bg-surface border border-border-subtle px-2 py-1 text-[8px] text-text-tertiary">
          Ready?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-lg rounded-br-none bg-accent-sage/10 border border-accent-sage/15 px-2 py-1 text-[8px] text-text-tertiary">
          Let&apos;s go
        </div>
      </div>
      <div className="flex justify-start items-center gap-0.5 pl-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-text-tertiary/40"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

/* Mini visual for whiteboard: drawing path */
function DrawPathMini() {
  return (
    <div className="mt-4 rounded-lg border border-border-subtle bg-bg-deep/40 h-16 relative overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 140 64">
        <motion.path
          d="M 10 40 Q 35 10 60 35 T 110 25"
          fill="none"
          stroke="var(--accent-bronze)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
        <motion.circle
          cx="110"
          cy="25"
          r="2"
          fill="var(--accent-bronze)"
          opacity="0.6"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </svg>
    </div>
  );
}

/* Mini visual for files: stacked thumbnails */
function FileStackMini() {
  return (
    <div className="mt-4 flex items-end gap-2">
      {['proposal.pdf', 'design.fig', 'notes.md'].map((name, i) => (
        <div
          key={name}
          className="flex-1 rounded-md border border-border-subtle bg-bg-surface p-1.5"
          style={{ transform: `translateY(${-i * 2}px)` }}
        >
          <div
            className="h-1 w-full rounded-sm mb-1"
            style={{
              backgroundColor:
                i === 0
                  ? 'var(--accent-warm)'
                  : i === 1
                  ? 'var(--accent-sage)'
                  : 'var(--accent-bronze)',
              opacity: 0.3,
            }}
          />
          <div className="text-[7px] text-text-tertiary truncate">{name}</div>
        </div>
      ))}
    </div>
  );
}

const miniVisuals = [VideoGridMini, ChatBubblesMini, DrawPathMini, FileStackMini];

export default function MagicBento() {
  const { ref, inView } = useReveal('-60px');

  return (
    <section
      id="features"
      className="relative py-28 md:py-36 overflow-hidden bg-bg-primary"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent-sage/[0.03] rounded-full blur-[140px] pointer-events-none"
      />

      <div ref={ref} className="relative mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          className="text-center"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUp}>
            <SectionBadge label="Feature Suite" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-8 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary"
          >
            Everything you need.{' '}
            <span className="font-serif italic text-accent-warm font-normal">
              Nothing you don&apos;t.
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-lg text-base text-text-secondary"
          >
            Four integrated modules, one seamless experience.
          </motion.p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          className="mt-16 grid gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {bentoItems.map((item, i) => {
            const Icon = item.icon;
            const MiniVisual = miniVisuals[i];
            const isHero = i === 0;

            return (
              <motion.div
                key={i}
                className={`group relative rounded-2xl border border-border-subtle bg-bg-elevated/40 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-border-default hover:-translate-y-0.5 ${item.span}`}
                variants={fadeUp}
              >
                {/* Hover spotlight glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{
                    background: `radial-gradient(280px circle at 50% 30%, color-mix(in srgb, ${item.accent} 8%, transparent), transparent 70%)`,
                  }}
                />

                {/* Top edge highlight on hover */}
                <div
                  className="absolute top-0 left-[10%] right-[10%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${item.accent} 40%, transparent), transparent)`,
                  }}
                />

                <div
                  className={`relative ${
                    isHero ? 'p-7 sm:p-9' : 'p-6 sm:p-7'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center border border-border-subtle mb-5 transition-transform duration-300 group-hover:scale-105"
                    style={{
                      background: `color-mix(in srgb, ${item.accent} 10%, transparent)`,
                    }}
                  >
                    <Icon
                      size={isHero ? 20 : 18}
                      style={{ color: item.accent }}
                    />
                  </div>

                  <h3
                    className={`font-display font-semibold text-text-primary ${
                      isHero ? 'text-xl' : 'text-base'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`mt-2 text-text-secondary leading-relaxed ${
                      isHero ? 'text-sm max-w-sm' : 'text-[13px]'
                    }`}
                  >
                    {item.description}
                  </p>

                  {/* Mini visual inside the card */}
                  <MiniVisual />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
