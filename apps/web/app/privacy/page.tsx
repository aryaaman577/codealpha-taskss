'use client';

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated: June 2026
        </p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-text-secondary">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">1. Information We Collect</h2>
            <p>
              SyncSpace collects information you provide when creating an account, including your
              name, email address, and profile details. We also collect usage data such as meeting
              metadata, chat interactions, and whiteboard activity to improve service quality.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">2. How We Use Your Data</h2>
            <p>
              Your data is used to provide, maintain, and improve SyncSpace services. This includes
              enabling real-time communication, managing your account, sending service-related
              notifications, and analyzing aggregate usage patterns.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">3. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share information with trusted third-party
              service providers who assist in operating our platform, subject to strict
              confidentiality agreements.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit and
              at rest, regular security audits, and access controls to protect your information.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">5. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by contacting our support team or through your account settings.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">6. Contact</h2>
            <p>
              For privacy-related inquiries, please reach out to our team through the SyncSpace
              dashboard or visit the Help section.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
