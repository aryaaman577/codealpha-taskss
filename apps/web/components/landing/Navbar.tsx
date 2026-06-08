'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Demo', href: '#demo' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'liquid-glass shadow-sm' : 'bg-transparent'} `}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-tertiary">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="transition-colors duration-200 hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-semibold text-text-secondary transition-colors duration-200 hover:text-text-primary"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex rounded-full bg-accent-warm hover:bg-accent-warm-hover px-5 py-2 text-sm font-semibold text-bg-deep transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              Start Free
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[64px] z-40 bg-bg-deep/95 backdrop-blur-xl border-b border-border-subtle md:hidden"
          >
            <nav className="flex flex-col px-6 py-6 gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-base font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-accent-warm text-bg-deep px-5 py-2.5 text-sm font-semibold text-center transition-colors hover:bg-accent-warm-hover"
                >
                  Start Free
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
