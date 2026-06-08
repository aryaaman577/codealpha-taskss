'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/landing/Logo';
import { Shield, Radio, PenTool, Lock, Layers } from 'lucide-react';

/* ─── Floating feature chips for visual panel ────────────────────────── */
const visualChips = [
  { icon: Shield, label: 'Secure Rooms', accent: '#6366f1', x: '12%', y: '22%' },
  { icon: Radio, label: 'Live Sync', accent: '#06b6d4', x: '62%', y: '16%' },
  { icon: PenTool, label: 'Shared Canvas', accent: '#a855f7', x: '8%', y: '68%' },
  { icon: Lock, label: 'Encrypted', accent: '#818cf8', x: '58%', y: '72%' },
  { icon: Layers, label: 'Unified', accent: '#06b6d4', x: '35%', y: '46%' },
];

/* ─── SVG Sync trail paths ───────────────────────────────────────────── */
function AuthTrails() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="authTrail1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="authTrail2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <motion.path
        d="M 50 80 C 120 150, 300 100, 350 250 S 280 400, 200 500"
        fill="none" stroke="url(#authTrail1)" strokeWidth="0.8"
        strokeDasharray="6 4" strokeLinecap="round"
        animate={{ strokeDashoffset: [-20, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
      />
      <motion.path
        d="M 350 50 C 280 130, 100 180, 60 320 S 150 450, 300 550"
        fill="none" stroke="url(#authTrail2)" strokeWidth="0.6"
        strokeDasharray="4 6" strokeLinecap="round"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
      />
    </svg>
  );
}

/* ─── Visual Side Panel ──────────────────────────────────────────────── */
function AuthVisual() {
  return (
    <div className="hidden lg:flex relative flex-1 items-center justify-center overflow-hidden rounded-[32px] bg-bg-surface/30 border border-border-subtle">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-accent-primary/[0.06] blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-[200px] w-[200px] rounded-full bg-accent-cyan/[0.05] blur-[80px]" />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Sync trails */}
      <AuthTrails />

      {/* Floating chips */}
      {visualChips.map((chip, i) => {
        const Icon = chip.icon;
        return (
          <motion.div
            key={i}
            className="absolute z-10"
            style={{ left: chip.x, top: chip.y }}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="flex items-center gap-2 rounded-xl glass-panel px-3 py-2 select-none"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4 + i * 0.5, ease: 'easeInOut' }}
            >
              <Icon size={13} style={{ color: chip.accent }} />
              <span className="text-[11px] font-medium text-text-primary whitespace-nowrap">
                {chip.label}
              </span>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Central orbit rings */}
      <div className="relative h-40 w-40">
        <div className="absolute inset-0 rounded-full border border-accent-primary/15 motion-safe:animate-[spin_12s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-accent-cyan/12 motion-safe:animate-[spin_8s_linear_infinite_reverse]" />
        <div className="absolute inset-8 rounded-full border border-accent-purple/20 motion-safe:animate-spin-slow" />
        <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-primary/30 blur-sm motion-safe:animate-glow-pulse" />
        <div className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-primary/70" />
      </div>
    </div>
  );
}

/* ─── Auth Shell Props ───────────────────────────────────────────────── */
interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/* ─── Auth Shell Layout ──────────────────────────────────────────────── */
export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[700px] rounded-full bg-accent-primary/[0.05] blur-[150px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl flex gap-6 items-stretch">
        {/* Left: Visual panel (desktop only) */}
        <AuthVisual />

        {/* Right: Auth form card */}
        <motion.div
          className="w-full lg:w-[480px] lg:flex-shrink-0"
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-[32px] glass-panel-strong glow-border p-8 md:p-10">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <Link href="/">
                <Logo showText={false} size={44} />
              </Link>
              <h1 className="text-2xl font-bold mt-5 font-display text-text-primary text-center">
                {title}
              </h1>
              <p className="text-sm text-text-secondary mt-2 text-center max-w-xs">
                {subtitle}
              </p>
            </div>

            {/* Form content (injected) */}
            {children}

            {/* Footer links (injected) */}
            {footer && (
              <div className="mt-7 pt-6 border-t border-border-subtle">
                {footer}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
