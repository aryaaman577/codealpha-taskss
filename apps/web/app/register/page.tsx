'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, AtSign, Mail, Lock } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterForm) => {
    try {
      await registerUser(values);
      toast.success('Account created! Verification code sent to email.');
      window.location.href = `/verify-email?email=${encodeURIComponent(values.email)}`;
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Registration failed');
    }
  };

  const inputClass =
    'w-full rounded-2xl border border-border-default bg-bg-elevated/50 backdrop-blur-sm pl-11 pr-4 py-3.5 text-sm text-text-primary outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]';

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Connect and collaborate with your team."
      footer={
        <div className="flex items-center justify-center text-xs text-text-secondary">
          <span>Already have an account?</span>
          <Link href="/login" className="text-accent-primary hover:underline ml-1.5 font-semibold">
            Sign in
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
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Username</span>
            <div className="relative">
              <AtSign size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="text" placeholder="e.g. alex_mercer" {...register('username')} className={inputClass} />
            </div>
            {errors.username && <p className="mt-1.5 text-xs text-semantic-error">{errors.username.message}</p>}
          </label>
        </motion.div>

        <motion.div variants={fieldVariants} transition={{ duration: 0.5 }}>
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Display Name</span>
            <div className="relative">
              <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="text" placeholder="e.g. Alex Mercer" {...register('displayName')} className={inputClass} />
            </div>
            {errors.displayName && <p className="mt-1.5 text-xs text-semantic-error">{errors.displayName.message}</p>}
          </label>
        </motion.div>

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
            <span className="mb-2 block text-xs font-semibold text-text-secondary uppercase tracking-wider">Password</span>
            <div className="relative">
              <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input type="password" placeholder="Min. 8 characters" {...register('password')} className={inputClass} />
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
                Creating account…
              </span>
            ) : (
              'Create workspace'
            )}
          </button>
        </motion.div>
      </motion.form>
    </AuthShell>
  );
}
