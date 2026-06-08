import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function Logo({ className = '', size = 28, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-500 hover:rotate-12"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-warm)" />
            <stop offset="100%" stopColor="var(--accent-sage)" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="url(#logoGrad)"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* S letterform */}
        <path
          d="M 50 22
             C 35 22, 26 33, 30 44
             C 33 51, 42 54, 48 57
             C 56 61, 68 60, 68 70
             C 68 78, 56 78, 50 78
             C 42 78, 33 74, 33 74
             L 33 66
             C 33 66, 40 70, 50 70
             C 58 70, 62 64, 58 58
             C 54 52, 46 49, 42 46
             C 34 41, 22 38, 22 28
             C 22 18, 36 14, 50 14
             C 62 14, 70 20, 70 20
             L 70 28
             C 70 28, 62 22, 50 22 Z"
          fill="url(#logoGrad)"
          opacity="0.9"
        />

        {/* Top node */}
        <circle cx="50" cy="22" r="2.5" fill="var(--text-primary)" />
        {/* Bottom node */}
        <circle cx="50" cy="78" r="2.5" fill="var(--text-primary)" />
      </svg>
      {showText && (
        <span className="font-display text-lg font-bold tracking-wide text-text-primary">
          Sync<span className="text-accent-warm">Space</span>
        </span>
      )}
    </div>
  );
}
