'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Wifi, Monitor, Clock } from 'lucide-react';
import { fadeUp, useReveal } from './motion';

/* ─── Animated count-up hook ────────────────────────────────────────── */
function useCountUp(end: number, duration: number, start: boolean, suffix = '') {
  const [value, setValue] = useState('0' + suffix);

  useEffect(() => {
    if (!start) return;
    let frame: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);
      setValue(current + suffix);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration, start, suffix]);

  return value;
}

interface MetricData {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  accent: string;
}

const metricsData: MetricData[] = [
  {
    icon: Wifi,
    value: 50,
    suffix: 'ms',
    label: 'Sync Latency',
    accent: 'var(--accent-warm)',
  },
  {
    icon: Clock,
    value: 99,
    suffix: '.9%',
    label: 'Uptime SLA',
    accent: 'var(--accent-sage)',
  },
  {
    icon: Monitor,
    value: 4,
    suffix: 'K',
    label: 'Video Ready',
    accent: 'var(--accent-bronze)',
  },
  {
    icon: Shield,
    value: 256,
    suffix: '-bit',
    label: 'Encrypted',
    accent: 'var(--accent-warm)',
  },
];

function MetricItem({
  metric,
  inView,
  delay,
}: {
  metric: MetricData;
  inView: boolean;
  delay: number;
}) {
  const Icon = metric.icon;
  const displayValue = useCountUp(metric.value, 1.8, inView, metric.suffix);

  return (
    <motion.div
      className="flex flex-col items-center text-center py-4 sm:py-0"
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center border border-border-subtle mb-3"
        style={{
          background: `color-mix(in srgb, ${metric.accent} 8%, transparent)`,
        }}
      >
        <Icon size={18} style={{ color: metric.accent }} />
      </div>
      <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
        {displayValue}
      </p>
      <p className="mt-1 text-[12px] font-medium text-text-secondary tracking-wide">
        {metric.label}
      </p>
    </motion.div>
  );
}

export default function MetricsShowcase() {
  const { ref, inView } = useReveal('-100px');

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-bg-deep">
      {/* Background dot grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none dot-grid"
      />

      <div ref={ref} className="relative mx-auto max-w-4xl px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          variants={fadeUp}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
            Built for{' '}
            <span className="font-serif italic text-accent-warm font-normal">
              speed and trust
            </span>
          </h2>
        </motion.div>

        {/* Metrics strip */}
        <div className="perspective-section">
          <motion.div
            className="rounded-2xl border border-border-subtle bg-bg-elevated/40 backdrop-blur-sm px-6 sm:px-10 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-border-subtle"
            initial={{ opacity: 0, rotateX: 3 }}
            animate={inView ? { opacity: 1, rotateX: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {metricsData.map((metric, i) => (
              <div
                key={i}
                className="lg:px-6 first:lg:pl-0 last:lg:pr-0"
              >
                <MetricItem
                  metric={metric}
                  inView={inView}
                  delay={0.15 * i}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
