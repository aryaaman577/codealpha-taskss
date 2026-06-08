'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fadeUp, staggerContainer, useReveal } from './motion';

export default function FinalCTA() {
  const { ref, inView } = useReveal('-80px');

  return (
    <section className="relative py-28 md:py-40 overflow-hidden bg-bg-deep">
      {/* Background dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none dot-grid"
      />

      {/* Intensified warm glow — strongest on the page */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-accent-warm/[0.06] rounded-full blur-[160px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[500px] h-[300px] bg-accent-sage/[0.03] rounded-full blur-[120px] pointer-events-none"
      />

      <div ref={ref} className="relative mx-auto max-w-2xl px-6 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.p
            variants={fadeUp}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-accent-warm mb-8"
          >
            Ready to begin?
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary leading-[1.12]"
          >
            Your team deserves
            <br />
            <span className="font-serif italic text-accent-warm font-normal">
              better.
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-md text-base text-text-secondary leading-relaxed"
          >
            Replace five disconnected tools with one unified workspace.
            Free forever for small teams.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2.5 rounded-full bg-accent-warm hover:bg-accent-warm-hover text-bg-deep px-8 py-4 text-sm font-semibold tracking-wide transition-all duration-300 motion-safe:hover:-translate-y-0.5 shadow-glow-sm overflow-hidden"
            >
              {/* Shimmer overlay */}
              <span className="absolute inset-0 shimmer-surface pointer-events-none" />
              <span className="relative">Start Free</span>
              <ArrowRight
                size={15}
                className="relative transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-border-subtle hover:border-border-default px-8 py-4 text-sm font-semibold tracking-wide text-text-primary transition-all duration-300 hover:bg-bg-elevated/30"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
