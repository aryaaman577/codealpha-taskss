'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionBadge from './SectionBadge';
import { fadeUp, staggerContainer, useReveal } from './motion';

const fragmentedTools = [
  { name: 'Video', color: 'var(--accent-warm)' },
  { name: 'Chat', color: 'var(--accent-sage)' },
  { name: 'Board', color: 'var(--accent-bronze)' },
  { name: 'Files', color: 'var(--accent-warm)' },
  { name: 'Tasks', color: 'var(--accent-sage)' },
];

const unifiedFeatures = ['Meetings', 'Chat', 'Whiteboard', 'Files', 'Workflow'];

export default function ProductStory() {
  const { ref, inView } = useReveal('-80px');

  return (
    <section className="relative py-28 md:py-36 overflow-hidden bg-bg-deep">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent-warm/[0.03] rounded-full blur-[140px] pointer-events-none"
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
            <SectionBadge label="The Problem" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-8 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary leading-[1.15]"
          >
            Five tools.{' '}
            <span className="font-serif italic text-accent-warm font-normal">
              Zero flow.
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-base text-text-secondary leading-relaxed"
          >
            Your team switches between disconnected apps dozens of times a day.
            Context breaks. Momentum dies.
          </motion.p>
        </motion.div>

        {/* Visual transformation: chaos → order */}
        <motion.div
          className="mt-20 grid gap-8 lg:grid-cols-[1fr_auto_1fr] items-center"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Left: Fragmented chaos */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-2xl border border-border-subtle bg-bg-elevated/30 p-8 min-h-[220px] flex flex-col items-center justify-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-text-tertiary mb-6">
              Before SyncSpace
            </p>
            <div className="relative w-full max-w-[260px] h-[140px]">
              {/* Scattered tool boxes */}
              {fragmentedTools.map((tool, i) => {
                const positions = [
                  { top: '5%', left: '5%', rotate: -8 },
                  { top: '0%', left: '55%', rotate: 5 },
                  { top: '45%', left: '15%', rotate: -3 },
                  { top: '50%', left: '60%', rotate: 7 },
                  { top: '25%', left: '35%', rotate: -5 },
                ];
                const pos = positions[i];
                return (
                  <motion.div
                    key={tool.name}
                    className="absolute rounded-lg border border-border-subtle bg-bg-surface/60 px-3 py-2 text-[10px] font-medium text-text-secondary"
                    style={{
                      top: pos.top,
                      left: pos.left,
                      rotate: pos.rotate,
                      borderLeftColor: tool.color,
                      borderLeftWidth: 2,
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      inView
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0, scale: 0.8 }
                    }
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                  >
                    {tool.name}
                  </motion.div>
                );
              })}

              {/* Tangled connection lines */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 260 140"
              >
                <path
                  d="M 30 25 Q 80 70 160 20"
                  fill="none"
                  stroke="var(--border-default)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.4"
                />
                <path
                  d="M 50 80 Q 120 30 180 90"
                  fill="none"
                  stroke="var(--border-default)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.3"
                />
                <path
                  d="M 100 60 Q 140 100 200 50"
                  fill="none"
                  stroke="var(--border-default)"
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0.35"
                />
              </svg>
            </div>
          </motion.div>

          {/* Center arrow */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center py-4 lg:py-0"
          >
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-accent-warm/30" />
              <div className="h-9 w-9 rounded-full border border-accent-warm/25 bg-accent-warm/5 flex items-center justify-center">
                <ArrowRight size={14} className="text-accent-warm" />
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-accent-warm/30 to-transparent" />
            </div>
          </motion.div>

          {/* Right: Unified order */}
          <motion.div
            variants={fadeUp}
            className="relative rounded-2xl border border-accent-warm/15 bg-bg-elevated/50 p-8 min-h-[220px] flex flex-col items-center justify-center"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-warm mb-6">
              With SyncSpace
            </p>

            {/* Clean unified block */}
            <div className="w-full max-w-[240px] rounded-xl border border-border-default bg-bg-primary/80 p-4 relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-lg bg-accent-warm/15 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-accent-warm">S</span>
                </div>
                <span className="text-[11px] font-semibold text-text-primary">
                  SyncSpace
                </span>
              </div>

              <div className="space-y-1.5">
                {unifiedFeatures.map((feature, i) => (
                  <motion.div
                    key={feature}
                    className="flex items-center gap-2 px-2 py-1 rounded bg-bg-elevated/50"
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                  >
                    <div className="w-1 h-1 rounded-full bg-accent-sage/60" />
                    <span className="text-[10px] text-text-secondary">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Clean sync trail inside */}
              <svg
                className="absolute top-4 right-4 w-3 h-[80%] pointer-events-none"
                viewBox="0 0 12 100"
              >
                <line
                  x1="6"
                  y1="0"
                  x2="6"
                  y2="100"
                  className="sync-trail-line"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
