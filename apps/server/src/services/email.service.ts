import { Resend } from 'resend';
import { env } from '../config/env';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const logMissingProvider = (purpose: 'verification' | 'password_reset') => {
  const base = `⚠️ Email provider is not configured. (${purpose})`;
  if (env.NODE_ENV === 'development') {
    console.log(base);
  } else {
    console.error(base);
  }
};

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  if (!resend) {
    logMissingProvider('verification');
    if (env.NODE_ENV === 'development') {
      console.log(`DEV EMAIL VERIFICATION OTP for ${email}: ${otp}`);
    }
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'SyncSpace verification code',
    html: `<p>Your SyncSpace verification code is: <strong>${otp}</strong> — expires in 15 minutes.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  if (!resend) {
    logMissingProvider('password_reset');
    if (env.NODE_ENV === 'development') {
      console.log(`DEV PASSWORD RESET OTP for ${email}: ${otp}`);
    }
    return;
  }

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'SyncSpace password reset code',
    html: `<p>Your SyncSpace password reset code is: <strong>${otp}</strong> — expires in 15 minutes.</p>`,
  });
}
