'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';
import SectionBadge from './SectionBadge';
import { fadeUp, staggerContainer, useReveal } from './motion';

interface Plan {
  name: string;
  price: { monthly: string; yearly: string };
  period?: string;
  description: string;
  features: string[];
  cta: string;
  link: string;
  popular: boolean;
  accent: string;
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: { monthly: '$0', yearly: '$0' },
    description: 'For small teams getting started.',
    features: [
      'Up to 10 participants',
      '40-minute meetings',
      'Basic chat channels',
      '1 GB file storage',
      'Shared whiteboard',
    ],
    cta: 'Get Started',
    link: '/register',
    popular: false,
    accent: 'var(--accent-sage)',
  },
  {
    name: 'Pro',
    price: { monthly: '$15', yearly: '$12' },
    period: '/ user / mo',
    description: 'For teams that need more power.',
    features: [
      'Up to 100 participants',
      '24-hour meetings',
      'Unlimited channels & DMs',
      '50 GB secure storage',
      'Unlimited whiteboards',
      'HD recording & sharing',
    ],
    cta: 'Go Pro',
    link: '/register',
    popular: true,
    accent: 'var(--accent-warm)',
  },
  {
    name: 'Enterprise',
    price: { monthly: 'Custom', yearly: 'Custom' },
    description: 'For organizations with advanced needs.',
    features: [
      'Unlimited participants',
      'Dedicated infrastructure',
      'SSO & SAML integration',
      '1 TB secure storage',
      'Admin roles & policies',
      '24/7 priority support',
    ],
    cta: 'Contact Sales',
    link: '/register',
    popular: false,
    accent: 'var(--accent-bronze)',
  },
];

export default function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const { ref, inView } = useReveal('-80px');

  return (
    <section
      id="pricing"
      className="relative py-28 md:py-36 overflow-hidden bg-bg-primary"
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[400px] bg-accent-warm/[0.03] rounded-full blur-[140px] pointer-events-none"
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
            <SectionBadge label="Pricing" />
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-8 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary"
          >
            Simple,{' '}
            <span className="font-serif italic text-accent-warm font-normal">
              transparent
            </span>{' '}
            pricing
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-md text-base text-text-secondary"
          >
            Start free. Upgrade when your team grows.
          </motion.p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <span
            className={`text-sm transition-colors duration-200 ${
              billing === 'monthly'
                ? 'text-text-primary font-semibold'
                : 'text-text-tertiary'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBilling(billing === 'monthly' ? 'yearly' : 'monthly')
            }
            className="relative h-7 w-12 rounded-full bg-bg-elevated border border-border-subtle transition duration-300 focus:outline-none focus:ring-2 focus:ring-accent-warm/40"
            aria-label="Toggle billing period"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 h-[22px] w-[22px] rounded-full bg-accent-warm"
              animate={{ x: billing === 'yearly' ? 20 : 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </button>
          <span
            className={`text-sm transition-colors duration-200 ${
              billing === 'yearly'
                ? 'text-text-primary font-semibold'
                : 'text-text-tertiary'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-[10px] bg-accent-sage/15 text-text-secondary px-2 py-0.5 rounded-full font-semibold">
              -20%
            </span>
          </span>
        </motion.div>

        {/* Plans grid */}
        <motion.div
          className="mt-14 grid gap-5 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              className={`group relative rounded-2xl border p-7 overflow-hidden transition-all duration-500 ${
                plan.popular
                  ? 'border-accent-warm/30 bg-bg-elevated/60 shadow-glow-sm scale-[1.02] lg:scale-[1.03]'
                  : 'border-border-subtle bg-bg-elevated/25 hover:border-border-default hover:-translate-y-0.5'
              }`}
              variants={fadeUp}
            >
              {/* Hover spotlight */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600 pointer-events-none"
                style={{
                  background: `radial-gradient(200px circle at 50% 20%, color-mix(in srgb, ${plan.accent} 6%, transparent), transparent 70%)`,
                }}
              />

              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b-lg bg-accent-warm px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-bg-deep">
                  Recommended
                </span>
              )}

              <div className="relative">
                <h3 className="text-lg font-semibold text-text-primary font-display">
                  {plan.name}
                </h3>
                <p className="mt-1 text-[13px] text-text-secondary">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-text-primary font-display">
                    {plan.price[billing]}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-text-tertiary">
                      {plan.period}
                    </span>
                  )}
                </div>

                <Link
                  href={plan.link}
                  className={`mt-7 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-accent-warm hover:bg-accent-warm-hover text-bg-deep shadow-sm motion-safe:hover:-translate-y-0.5'
                      : 'bg-bg-surface border border-border-subtle hover:border-border-default text-text-primary'
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="mt-7 space-y-3 border-t border-border-subtle pt-7 text-[13px] text-text-secondary">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-3">
                      <Check
                        size={14}
                        style={{ color: plan.accent }}
                        className="flex-shrink-0"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
