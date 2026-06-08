'use client';

import React from 'react';

type CardVariant = 'surface' | 'elevated' | 'glass';

interface CardProps {
  variant?: CardVariant;
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  surface:
    'bg-bg-surface/70 border-border-default shadow-card',
  elevated:
    'bg-bg-elevated/60 border-border-default shadow-elevated',
  glass:
    'bg-bg-surface/40 border-border-default backdrop-blur-xl shadow-panel',
};

export default function Card({
  variant = 'surface',
  hover = false,
  glow = false,
  className = '',
  children,
}: CardProps) {
  return (
    <div
      className={`
        rounded-[28px] border p-6 transition-all duration-300
        ${variantStyles[variant]}
        ${hover ? 'motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] hover:border-border-strong' : ''}
        ${glow ? 'hover:shadow-glow-sm' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
