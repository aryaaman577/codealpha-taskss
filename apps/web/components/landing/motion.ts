'use client';

import { useInView } from 'framer-motion';
import { useRef } from 'react';
import type { Variants } from 'framer-motion';

/* ── Easing ────────────────────────────────────────────────────────── */
export const ease = {
  smooth: [0.16, 1, 0.3, 1] as const,
  out: [0.33, 1, 0.68, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

/* ── Shared Variants ───────────────────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: ease.smooth },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: ease.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: ease.smooth },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: ease.smooth },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: ease.smooth },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

/* ── Reveal Hook ───────────────────────────────────────────────────── */
export function useReveal(margin = '-80px') {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: margin as `${number}px` });
  return { ref, inView };
}
