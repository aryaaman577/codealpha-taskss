'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-2xl border border-border-default
              bg-bg-elevated/50 backdrop-blur-sm
              px-4 py-3 text-sm text-text-primary
              outline-none transition-all duration-200
              placeholder:text-text-muted
              focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
              ${icon ? 'pl-11' : ''}
              ${error ? 'border-semantic-error focus:border-semantic-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-semantic-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
