'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Video, MessageSquare, PenTool, Share2 } from 'lucide-react';
import SectionBadge from './SectionBadge';
import { fadeUp, staggerContainer, useReveal } from './motion';

const steps = [
  {
    icon: Video,
    step: '01',
    title: 'Start a meeting',
    description: 'Launch HD video calls with one click. Screen share, breakout rooms, and recordings built in.',
    accent: 'var(--accent-warm)',
  },
  {
    icon: MessageSquare,
    step: '02',
    title: 'Collaborate live',
    description: 'Chat, react, and thread conversations alongside your meeting — context never leaves the room.',
    accent: 'var(--accent-sage)',
  },
  {
    icon: PenTool,
    step: '03',
    title: 'Build together',
    description: 'Sketch on the shared whiteboard, annotate documents, and see every cursor in real-time.',
    accent: 'var(--accent-bronze)',
  },
  {
    icon: Share2,
    step: '04',
    title: 'Ship decisions',
    description: 'Files, notes, and action items persist after the meeting ends. Nothing gets lost.',
    accent: 'var(--accent-warm)',
  },
];

export default function WorkflowShowcase() {
  const { ref, inView } = useReveal('-60px');

  return (
    <section id="demo" className="relative py-28 md:py-36 overflow-hidden bg-bg-primary">
      {/* Background dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none dot-grid"
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-accent-sage/[0.03] rounded-full blur-[120px] pointer-events-none"
      />

      <div ref={ref} className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeUp}>
            <SectionBadge label="How It Works" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-8 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary leading-[1.15]"
          >
            From kickoff to{' '}
            <span className="font-serif italic text-accent-warm font-normal">
              shipped
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-lg text-base text-text-secondary"
          >
            A single workspace that flows with your team — no tab switching, no context loss.
          </motion.p>
        </motion.div>

        {/* Steps grid */}
        <div className="relative">
          {/* Horizontal sync trail connecting steps (desktop only) */}
          <svg
            className="hidden lg:block absolute top-[52px] left-0 w-full h-8 pointer-events-none"
            preserveAspectRatio="none"
          >
            <line
              x1="12.5%"
              y1="50%"
              x2="87.5%"
              y2="50%"
              className="sync-trail-line"
            />
          </svg>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="group relative rounded-2xl border border-border-subtle bg-bg-elevated/40 p-6 transition-all duration-500 hover:border-border-default hover:bg-bg-elevated/70 hover:-translate-y-1"
                >
                  {/* Step number + icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center border border-border-subtle transition-all duration-300 group-hover:scale-105"
                      style={{ background: `color-mix(in srgb, ${step.accent} 10%, transparent)` }}
                    >
                      <Icon size={18} style={{ color: step.accent }} />
                    </div>
                    <span className="text-[11px] font-mono text-text-tertiary font-medium">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-semibold text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[13px] text-text-secondary leading-relaxed">
                    {step.description}
                  </p>

                  {/* Hover top edge glow */}
                  <div
                    className="absolute top-0 left-[15%] right-[15%] h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${step.accent}50, transparent)`,
                    }}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
