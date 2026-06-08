'use client';

import React, { useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, KeyRound, Lock } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import Logo from '@/components/landing/Logo';

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

type ResetForm = z.infer<typeof resetPasswordSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const inputClass =
  'w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams?.get('email') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  const onSubmit = async (values: ResetForm) => {
    try {
      await api.post('/auth/reset-password', values);
      toast.success('Password reset successfully!');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <AuthShell
      title="Create new password"
      subtitle="Enter the code from your email and choose a new password."
      footer={
        <div className="flex items-center justify-center text-xs text-text-secondary">
          <Link href="/login" className="text-accent-cyan hover:underline font-semibold">
            Back to sign in
          </Link>
        </div>
      }
    >
      <motion.form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Email Address</span>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="email" placeholder="alex@company.com" {...register('email')} className={inputClass} />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-semantic-error">{errors.email.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider text-center">6-Digit Reset Code</span>
            <div className="relative">
              <KeyRound size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                {...register('otp')}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-center tracking-[0.15em] font-mono text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            {errors.otp && <p className="mt-1.5 text-xs text-semantic-error">{errors.otp.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">New Password</span>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="password" placeholder="Min. 8 characters" {...register('newPassword')} className={inputClass} />
            </div>
            {errors.newPassword && <p className="mt-1.5 text-xs text-semantic-error">{errors.newPassword.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-accent-primary hover:bg-accent-hover px-4 py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 shadow-glow-sm hover:shadow-glow-md motion-safe:hover:-translate-y-0.5 mt-1"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Resetting password…
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base text-text-primary flex items-center justify-center">
        <div className="text-center">
          <Logo showText={false} size={44} />
          <p className="text-sm text-text-secondary mt-4">Loading reset screen...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
