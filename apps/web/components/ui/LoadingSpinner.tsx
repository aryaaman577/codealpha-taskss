'use client';

import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, { ring: string; border: string }> = {
  sm: { ring: 'h-5 w-5', border: 'border-2' },
  md: { ring: 'h-8 w-8', border: 'border-[3px]' },
  lg: { ring: 'h-12 w-12', border: 'border-4' },
};

export default function LoadingSpinner({
  size = 'md',
  label,
  className = '',
}: LoadingSpinnerProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`
          ${s.ring} ${s.border}
          rounded-full border-accent-primary border-t-transparent
          animate-spin motion-reduce:animate-pulse
        `}
      />
      {label && (
        <p className="text-xs text-text-secondary tracking-widest uppercase select-none">
          {label}
        </p>
      )}
    </div>
  );
}
