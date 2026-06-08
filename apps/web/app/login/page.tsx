'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  const { login } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values);
      toast.success('Logged in successfully');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Login failed');
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your SyncSpace workspace."
      footer={
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <Link href="/forgot-password" className="hover:text-text-primary transition-colors">
            Forgot password?
          </Link>
          <Link href="/register" className="text-accent-primary hover:underline font-semibold">
            Create account
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
              Email
            </span>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-semantic-error">{errors.email.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Password
            </span>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="password"
                placeholder="Min. 8 characters"
                {...register('password')}
                className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-semantic-error">{errors.password.message}</p>}
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
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
