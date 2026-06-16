'use client';

import React, { useEffect } from 'react';
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

  // Show error toast if redirected back from failed Google login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'google_auth_failed') {
      toast.error('Google login failed. Please try again.');
      // Clean the URL without reloading
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const onSubmit = async (values: LoginForm) => {
    try {
      await login(values);
      toast.success('Logged in successfully');
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
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

      {/* ── Separator ── */}
      <motion.div
        className="flex items-center gap-3 my-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex-1 h-px bg-border-default" />
        <span className="text-xs text-text-muted font-medium">or</span>
        <div className="flex-1 h-px bg-border-default" />
      </motion.div>

      {/* ── Google Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <button
          type="button"
          onClick={handleGoogleLogin}
          id="google-login-button"
          className="w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-text-primary transition-all duration-300 hover:bg-bg-elevated hover:border-border-hover motion-safe:hover:-translate-y-0.5 flex items-center justify-center gap-3"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.1 24.1 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>
        <p className="text-xs text-text-muted text-center mt-3">
          Google login gives instant access without email OTP.
        </p>
      </motion.div>
    </AuthShell>
  );
}
