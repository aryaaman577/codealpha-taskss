import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(160).optional(),
  customStatus: z.string().max(100).optional(),
  status: z.enum(['online', 'offline', 'idle', 'dnd']).optional(),
  settings: z
    .object({
      notifications: z.object({
        email: z.boolean(),
        push: z.boolean(),
        sound: z.boolean(),
        mentions: z.boolean(),
        meetingReminders: z.boolean(),
      }),
      privacy: z.object({
        showOnlineStatus: z.boolean(),
        allowDirectMessages: z.boolean(),
        showLastSeen: z.boolean(),
      }),
      appearance: z.object({
        theme: z.enum(['dark', 'light', 'system']),
        fontSize: z.enum(['small', 'medium', 'large']),
        compactMode: z.boolean(),
      }),
      meeting: z.object({
        defaultCameraOn: z.boolean(),
        defaultMicOn: z.boolean(),
        defaultSpeaker: z.string(),
      }),
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().nonempty(),
  newPassword: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(['email_verification', 'password_reset']).optional(),
});
