'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotForm) => {
    try {
      await api.post('/auth/forgot-password', values);
      toast.success('Recovery code sent to your email.');
      window.location.href = `/reset-password?email=${encodeURIComponent(values.email)}`;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to request reset');
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a recovery code."
      footer={
        <div className="flex items-center justify-center text-xs text-text-secondary">
          <Link href="/login" className="text-accent-cyan hover:underline font-semibold">
            Back to sign in
          </Link>
        </div>
      }
    >
      <motion.form
        className="space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Email Address
            </span>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email"
                placeholder="alex@company.com"
                {...register('email')}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-semantic-error">{errors.email.message}</p>}
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
                Requesting…
              </span>
            ) : (
              'Send Recovery Code'
            )}
          </button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
