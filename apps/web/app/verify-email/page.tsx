'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { useSearchParams } from 'next/navigation';

const verifySchema = z.object({
  otp: z.string().length(6, 'Verification code must be exactly 6 digits').regex(/^[0-9]+$/, 'Must be numbers only'),
});

type VerifyForm = z.infer<typeof verifySchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function VerifyEmailForm() {
  const [resending, setResending] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams ? searchParams.get('email') || '' : '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyForm>({ resolver: zodResolver(verifySchema) });

  const onSubmit = async (values: VerifyForm) => {
    if (!email) {
      toast.error('Email address is missing. Please sign up again.');
      return;
    }
    try {
      await api.post('/auth/verify-email', { email, otp: values.otp });
      toast.success('Email verified successfully! Please sign in.');
      window.location.href = '/login';
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Email address is missing.');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('A new verification code has been sent.');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your email to activate your account."
      footer={
        <div className="flex flex-col items-center gap-3 text-xs">
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-accent-cyan hover:underline font-semibold disabled:opacity-50 transition-opacity"
          >
            {resending ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                Resending…
              </span>
            ) : (
              'Resend verification code'
            )}
          </button>
          <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors">
            Back to sign in
          </Link>
        </div>
      }
    >
      <motion.form
        className="space-y-6"
        onSubmit={handleSubmit(onSubmit)}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">
              6-Digit Code
            </span>
            <div className="relative">
              <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                {...register('otp')}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-4 text-center text-2xl tracking-[0.25em] font-mono text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            {errors.otp && <p className="mt-1.5 text-xs text-semantic-error text-center">{errors.otp.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-accent-primary hover:bg-accent-hover px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 shadow-glow-sm hover:shadow-glow-md motion-safe:hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </span>
            ) : (
              'Verify Account'
            )}
          </button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}

import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-text-secondary">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
