'use client';

import React from 'react';
import Link from 'next/link';

export default function SecurityPage() {
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
          Security
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated: June 2026
        </p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-text-secondary">
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">End-to-End Encryption</h2>
            <p>
              All communication on SyncSpace, including video calls, chat messages, and file
              transfers, is protected with industry-standard encryption protocols. Data is
              encrypted both in transit (TLS 1.3) and at rest (AES-256).
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Infrastructure Security</h2>
            <p>
              SyncSpace infrastructure is hosted on enterprise-grade cloud providers with SOC 2
              compliance. We employ network segmentation, firewalls, and intrusion detection
              systems to safeguard our platform.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Authentication & Access Control</h2>
            <p>
              We support secure authentication mechanisms including password hashing with bcrypt,
              JWT-based session management, and OAuth 2.0 social login integration. Role-based
              access controls ensure that users only access authorized resources.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Regular Audits</h2>
            <p>
              Our security team conducts regular vulnerability assessments and penetration tests.
              We follow responsible disclosure practices and continuously monitor for threats.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Reporting Vulnerabilities</h2>
            <p>
              If you discover a security vulnerability, please report it responsibly through our
              dashboard support channel. We take all reports seriously and respond promptly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
