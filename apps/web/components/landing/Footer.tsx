'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from './Logo';
import { fadeIn, useReveal } from './motion';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#features' },
    { label: 'Roadmap', href: '#features' },
  ],
  Platform: [
    { label: 'Meetings', href: '#features' },
    { label: 'Chat', href: '#features' },
    { label: 'Whiteboard', href: '#features' },
    { label: 'File Vault', href: '#features' },
  ],
  Account: [
    { label: 'Sign In', href: '/login' },
    { label: 'Register', href: '/register' },
    { label: 'Dashboard', href: '/dashboard' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Security', href: '/security' },
  ],
};

export default function Footer() {
  const { ref, inView } = useReveal('-40px');

  return (
    <motion.footer
      ref={ref}
      className="relative border-t border-border-subtle bg-bg-deep overflow-hidden"
      variants={fadeIn}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {/* Subtle top glow line */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-accent-warm/10 to-transparent"
      />

      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        {/* Top row: logo + link columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-text-secondary max-w-xs leading-relaxed">
              The premium unified workspace for teams who refuse to compromise.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-tertiary mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-text-secondary transition-colors duration-200 hover:text-text-primary"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-border-subtle" />

        {/* Bottom row */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} SyncSpace. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-sage animate-pulse motion-reduce:animate-none" />
              <span className="text-xs text-text-tertiary">
                All systems operational
              </span>
            </div>
            <span className="text-xs text-text-tertiary/60">
              Crafted by Aman Gupta
            </span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
