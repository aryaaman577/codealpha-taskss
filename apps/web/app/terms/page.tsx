'use client';

import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link
          href="/"
          className="text-xs font-semibold text-accent-cyan hover:text-accent-primary transition-colors"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-8 text-3xl font-bold font-display tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated: June 2026
        </p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-text-secondary">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SyncSpace, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, you may not use the platform.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">2. Account Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You must notify us immediately
              of any unauthorized use.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">3. Acceptable Use</h2>
            <p>
              You agree to use SyncSpace only for lawful purposes. You may not use the service
              to transmit harmful, offensive, or illegal content, or to interfere with other
              users' experience.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">4. Intellectual Property</h2>
            <p>
              All content, features, and functionality of SyncSpace are owned by SyncSpace and
              are protected by copyright, trademark, and other intellectual property laws.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">5. Limitation of Liability</h2>
            <p>
              SyncSpace is provided on an "as is" basis. We make no warranties regarding
              uninterrupted service or error-free operation. Our liability is limited to the
              maximum extent permitted by applicable law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">6. Modifications</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of SyncSpace
              after changes constitutes acceptance of the updated terms.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
