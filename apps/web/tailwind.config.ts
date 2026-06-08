import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          deep: 'var(--bg-deep)',
          primary: 'var(--bg-primary)',
          elevated: 'var(--bg-elevated)',
          surface: 'var(--bg-surface)',
          /* Backward compat for existing app pages */
          base: '#0a0a0f',
          overlay: '#22222e',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
          /* Backward compat */
          focus: 'rgba(99,102,241,0.6)',
        },
        accent: {
          warm: 'var(--accent-warm)',
          'warm-hover': 'var(--accent-warm-hover)',
          sage: 'var(--accent-sage)',
          'sage-muted': 'var(--accent-sage-muted)',
          bronze: 'var(--accent-bronze)',
          /* Backward compat for existing app pages */
          primary: '#6366f1',
          hover: '#818cf8',
          glow: 'rgba(99,102,241,0.2)',
          cyan: '#06b6d4',
          purple: '#a855f7',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          /* Backward compat */
          inverted: '#0f172a',
          muted: '#475569',
        },
        /* App-level semantic colors (kept for dashboard/main app compatibility) */
        status: {
          online: '#22c55e',
          away: '#f59e0b',
          busy: '#ef4444',
          offline: '#475569',
        },
        semantic: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        display: ['var(--font-sora)', 'Sora', 'sans-serif'],
        body: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-instrument)', 'Instrument Serif', 'serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 4s ease-in-out infinite',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        /* Backward compat */
        'gradient-flow': 'gradientFlow 8s ease infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      boxShadow: {
        'glow-sm': '0 0 20px var(--glow-warm)',
        'glow-md': '0 0 40px var(--glow-warm)',
        'glow-lg': '0 0 80px rgba(196,168,122, 0.10)',
        card: '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.6)',
        elevated: '0 10px 40px rgba(0,0,0,0.4)',
        panel: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backdropBlur: {
        glass: '24px',
        'glass-strong': '40px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        /* Backward compat */
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
