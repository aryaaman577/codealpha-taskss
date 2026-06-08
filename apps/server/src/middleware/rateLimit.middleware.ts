import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.', code: 'RATE_LIMIT' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many authentication attempts, please try again later.', code: 'AUTH_RATE_LIMIT' },
});

export const emailLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many OTP requests, please wait.', code: 'EMAIL_RATE_LIMIT' },
});

export const fileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'File upload limit reached, try again later.', code: 'FILE_RATE_LIMIT' },
});
