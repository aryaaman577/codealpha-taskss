'use client';

import React from 'react';

interface SectionBadgeProps {
  label: string;
  className?: string;
}

export default function SectionBadge({ label, className = '' }: SectionBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-2 rounded-full
        border border-accent-sage/25 bg-accent-sage/[0.06]
        px-4 py-1.5 text-[11px] font-semibold tracking-[0.15em]
        text-text-secondary uppercase select-none
        ${className}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-sage/60 animate-pulse motion-reduce:animate-none" />
      {label}
    </span>
  );
}
