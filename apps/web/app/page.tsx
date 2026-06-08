'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import HeroProductVisual from '@/components/landing/HeroProductVisual';
import ProductStory from '@/components/landing/ProductStory';
import WorkflowShowcase from '@/components/landing/WorkflowShowcase';
import MagicBento from '@/components/landing/MagicBento';
import MetricsShowcase from '@/components/landing/MetricsShowcase';
import Pricing from '@/components/landing/Pricing';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/landing/Footer';

/* ─── Shared hero animation variants ─────────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

/* ─── Hero Metrics Strip ──────────────────────────────────────────── */
function HeroMetrics() {
  const metrics = [
    { value: '50ms', label: 'Sync' },
    { value: '4K', label: 'Rooms' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'Secure', label: 'E2E' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-5 sm:gap-7">
      {metrics.map((m, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div className="hidden sm:block h-5 w-px bg-border-subtle" />
          )}
          <div className="text-left">
            <p className="text-sm font-bold text-text-primary tracking-tight font-mono">
              {m.value}
            </p>
            <p className="text-[9px] text-text-tertiary uppercase tracking-wider font-medium mt-0.5">
              {m.label}
            </p>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────── */
export default function Home() {
  return (
    <main className="relative min-h-screen bg-bg-deep text-text-primary overflow-x-hidden">
      <Navbar />

      {/* ── Cinematic Hero ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-8">
        {/* Ambient background glow */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-accent-warm/[0.04] rounded-full blur-[180px] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-[20%] w-[400px] h-[300px] bg-accent-sage/[0.03] rounded-full blur-[140px] pointer-events-none"
        />

        {/* Dot grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none dot-grid"
        />

        {/* Content — centered column layout */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 w-full text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-sage/25 bg-accent-sage/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-text-secondary uppercase select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-sage animate-pulse motion-reduce:animate-none" />
                Unified Workspace
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="mt-8 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-[1.1]"
            >
              Where teams move
              <br />
              <span className="font-serif italic font-normal text-accent-warm">
                as one.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={fadeUp}
              className="mt-6 text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed"
            >
              Meetings, chat, whiteboard, and files — one calm space for your entire team.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-col sm:flex-row gap-4 items-center"
            >
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-accent-warm hover:bg-accent-warm-hover text-bg-deep px-7 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 motion-safe:hover:-translate-y-0.5 shadow-glow-sm"
              >
                Start Free
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>

              <a
                href="#demo"
                className="group inline-flex items-center gap-2 rounded-full border border-border-subtle hover:border-border-default px-7 py-3.5 text-sm font-semibold tracking-wide text-text-primary transition-all duration-300 hover:bg-bg-elevated/30"
              >
                <Play size={11} className="text-accent-warm" />
                See How It Works
              </a>
            </motion.div>

            {/* Metrics strip */}
            <motion.div variants={fadeUp} className="mt-10">
              <HeroMetrics />
            </motion.div>
          </motion.div>
        </div>

        {/* Product Visual — below the text, centered */}
        <motion.div
          className="relative z-10 w-full max-w-5xl mx-auto px-6 mt-12 sm:mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.5,
          }}
        >
          <HeroProductVisual />
        </motion.div>
      </section>

      {/* ── Product Story ─── */}
      <ProductStory />

      {/* ── Workflow Showcase ─── */}
      <WorkflowShowcase />

      {/* ── Feature Bento ─── */}
      <MagicBento />

      {/* ── Metrics / Trust ─── */}
      <MetricsShowcase />

      {/* ── Pricing ─── */}
      <Pricing />

      {/* ── Final CTA ─── */}
      <FinalCTA />

      {/* ── Footer ─── */}
      <Footer />
    </main>
  );
}