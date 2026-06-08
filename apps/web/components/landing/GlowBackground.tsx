'use client';

import React from 'react';

interface GlowBackgroundProps {
  position?: 'top' | 'center' | 'bottom';
  intensity?: 'subtle' | 'medium' | 'strong';
  className?: string;
}

const positionMap = {
  top: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/3',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3',
};

const intensityMap = {
  subtle: { size: 'h-[400px] w-[500px]', opacity: 'opacity-[0.04]' },
  medium: { size: 'h-[500px] w-[700px]', opacity: 'opacity-[0.06]' },
  strong: { size: 'h-[600px] w-[900px]', opacity: 'opacity-[0.10]' },
};

export default function GlowBackground({
  position = 'top',
  intensity = 'subtle',
  className = '',
}: GlowBackgroundProps) {
  const pos = positionMap[position];
  const int = intensityMap[intensity];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className={`absolute ${pos} ${int.size} ${int.opacity} rounded-full blur-[120px]`}
        style={{ backgroundColor: 'var(--accent-warm)' }}
      />
      <div
        className={`absolute ${pos} ${int.size} ${int.opacity} rounded-full blur-[160px] translate-x-[15%] -translate-y-[10%] scale-75`}
        style={{ backgroundColor: 'var(--accent-sage)' }}
      />
    </div>
  );
}
