'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-primary hover:bg-accent-hover text-white shadow-glow-sm hover:shadow-glow-md',
  secondary:
    'bg-bg-elevated border border-border-default hover:border-border-strong text-text-primary',
  ghost:
    'bg-transparent hover:bg-bg-elevated/50 text-text-secondary hover:text-text-primary',
  danger:
    'bg-semantic-error/10 border border-semantic-error/30 text-semantic-error hover:bg-semantic-error/20',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs rounded-xl gap-1.5',
  md: 'px-6 py-3 text-sm rounded-2xl gap-2',
  lg: 'px-8 py-4 text-sm rounded-full gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold tracking-wide
        transition-all duration-200 ease-out
        motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0
        disabled:cursor-not-allowed disabled:opacity-60
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
