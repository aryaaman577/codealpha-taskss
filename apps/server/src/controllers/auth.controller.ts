import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { sendSuccess, sendError } from '../utils/apiResponse';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendOtpSchema,
} from '../validators/auth.validator';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';
import { signAccessToken, signRefreshToken } from '../services/token.service';
import { compareOtp, generateOtp, getOtpExpiry, hashOtp } from '../utils/otp';
import { env } from '../config/env';
import { AuthRequest } from '../middleware/auth.middleware';


const setTokenCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = env.NODE_ENV === 'production';
  const common: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  };

  res.cookie('access_token', accessToken, {
    ...common,
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
  res.cookie('refresh_token', refreshToken, {
    ...common,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

const clearTokenCookies = (res: Response) => {
  const isProduction = env.NODE_ENV === 'production';
  const clearOpts: { path: string; httpOnly: boolean; secure: boolean; sameSite: 'lax' } = {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  };
  res.clearCookie('access_token', clearOpts);
  res.clearCookie('refresh_token', clearOpts);
};

const stripUser = (user: any) => {
  const {
    password,
    refreshTokens,
    __v,
    emailVerificationOtp,
    emailVerificationOtpExpires,
    passwordResetOtp,
    passwordResetOtpExpires,
    emailVerifyToken,
    emailVerifyExpiry,
    passwordResetToken,
    passwordResetExpiry,
    ...safe
  } = user.toObject ? user.toObject() : user;
  return safe;
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await User.findOne({ email: data.email });
    if (existingEmail) throw new AppError('Email already registered', 409);

    const existingUsername = await User.findOne({ username: data.username });
    if (existingUsername) throw new AppError('Username already taken', 409);

    const user = await User.create({
      username: data.username,
      email: data.email,
      password: data.password,
      displayName: data.displayName,
    });

    const otp = generateOtp();
    user.emailVerificationOtp = await hashOtp(otp);
    user.emailVerificationOtpExpires = getOtpExpiry(15);
    await user.save({ validateBeforeSave: false });
    sendVerificationEmail(user.email, otp).catch(console.error);

    return sendSuccess(res, { user: stripUser(user) }, 'Registration successful. Verification OTP sent.', 201);
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email }).select('+password');
    if (!user || !(await user.comparePassword(data.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.emailVerified) {
      // Send a new OTP and inform them to verify
      const otp = generateOtp();
      user.emailVerificationOtp = await hashOtp(otp);
      user.emailVerificationOtpExpires = getOtpExpiry(15);
      await user.save({ validateBeforeSave: false });
      sendVerificationEmail(user.email, otp).catch(console.error);

      throw new AppError('Please verify your email address. A new verification code has been sent.', 403);
    }

    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokens.push(refreshToken);
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { user: stripUser(user) }, 'Login successful');
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldRefreshToken = req.cookies?.refresh_token;
    console.log("Refresh cookie presence: refresh=" + Boolean(oldRefreshToken));
    if (!oldRefreshToken) throw new AppError('No refresh token provided', 401);

    let decoded: any;
    try {
      decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await User.findById(decoded.id).select('+refreshTokens +emailVerificationOtp +emailVerificationOtpExpires');
    if (!user || !user.refreshTokens.includes(oldRefreshToken)) {
      throw new AppError('Token reuse detected', 401);
    }

    user.refreshTokens = user.refreshTokens.filter((t) => t !== oldRefreshToken);
    const accessToken = signAccessToken(user._id.toString());
    const refreshToken = signRefreshToken(user._id.toString());
    user.refreshTokens.push(refreshToken);
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, refreshToken);
    return sendSuccess(res, { message: 'Tokens refreshed' });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken && req.user) {
      const user = await User.findById(req.user._id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    }
    clearTokenCookies(res);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const genericMessage = 'If that email exists, an OTP has been sent.';
    const user = await User.findOne({ email });

    if (!user) {
      return sendSuccess(res, null, genericMessage);
    }

    const otp = generateOtp();
    user.passwordResetOtp = await hashOtp(otp);
    user.passwordResetOtpExpires = getOtpExpiry(15);

    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, otp);

    return sendSuccess(res, null, genericMessage);
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);

    const user = await User.findOne({ email })
      .select('+password +passwordResetOtp +passwordResetOtpExpires +refreshTokens');

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpires || user.passwordResetOtpExpires < new Date()) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const otpValid = await compareOtp(otp, user.passwordResetOtp);
    if (!otpValid) throw new AppError('Invalid or expired OTP', 400);

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    user.refreshTokens = [];
    await user.save();

    clearTokenCookies(res);

    return sendSuccess(res, null, 'Password reset successful');
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user?._id).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    clearTokenCookies(res);
    return sendSuccess(res, { user: stripUser(user) }, 'Password changed successfully');
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = verifyEmailSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+emailVerificationOtp +emailVerificationOtpExpires');

    if (
      !user ||
      !user.emailVerificationOtp ||
      !user.emailVerificationOtpExpires ||
      user.emailVerificationOtpExpires < new Date()
    ) {
      throw new AppError('Invalid or expired OTP', 400);
    }

    const otpValid = await compareOtp(otp, user.emailVerificationOtp);
    if (!otpValid) throw new AppError('Invalid or expired OTP', 400);

    user.emailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return sendSuccess(res, { user: stripUser(user) }, 'Email verified');
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const resendOTP = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resendOtpSchema.parse(req.body);

    const genericMessage = 'If that email exists, an OTP has been sent.';

    const user = await User.findOne({ email: data.email });
    if (!user) {
      return sendSuccess(res, null, genericMessage);
    }

    const purpose = data.purpose ?? 'email_verification';

    if (purpose === 'email_verification') {
      if (!user.emailVerified) {
        const otp = generateOtp();
        user.emailVerificationOtp = await hashOtp(otp);
        user.emailVerificationOtpExpires = getOtpExpiry(15);
        await user.save({ validateBeforeSave: false });
        await sendVerificationEmail(user.email, otp);
      }
      return sendSuccess(res, null, genericMessage);
    }

    if (purpose === 'password_reset') {
      const otp = generateOtp();
      user.passwordResetOtp = await hashOtp(otp);
      user.passwordResetOtpExpires = getOtpExpiry(15);
      await user.save({ validateBeforeSave: false });
      await sendPasswordResetEmail(user.email, otp);
      return sendSuccess(res, null, genericMessage);
    }

    return sendSuccess(res, null, genericMessage);
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('-refreshTokens');
    if (!user) throw new AppError('User not found', 404);
    return sendSuccess(res, { user: stripUser(user) });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found', 404);

    // Allowed fields update
    if (data.displayName !== undefined) user.displayName = data.displayName;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.bio !== undefined) user.bio = data.bio;
    if (data.customStatus !== undefined) user.customStatus = data.customStatus;
    if (data.status !== undefined) user.status = data.status;
    if (data.username !== undefined) {
      // ensure unique username
      const existing = await User.findOne({ username: data.username, _id: { $ne: user._id } });
      if (existing) throw new AppError('Username already taken', 409);
      user.username = data.username;
    }
    if (data.settings !== undefined) user.settings = data.settings as any;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, { user: stripUser(user) }, 'Profile updated');
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', err);
    next(err);
  }
};

export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const avatarUrl = req.body.avatarUrl as string | undefined;
    const user = await User.findById(req.user?._id);
    if (!user) throw new AppError('User not found', 404);
    if (!avatarUrl) throw new AppError('Avatar URL is required', 400);

    user.avatar = avatarUrl;
    await user.save({ validateBeforeSave: false });
    return sendSuccess(res, { avatar: user.avatar }, 'Avatar uploaded');
  } catch (err) {
    next(err);
  }
};

export const searchUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return sendSuccess(res, { users: [] });
    }
    const currentUserId = req.user?._id?.toString();
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: currentUserId },
    })
      .select('username displayName avatar status')
      .limit(10);

    return sendSuccess(res, { users });
  } catch (err) {
    next(err);
  }
};

// ── Google OAuth ────────────────────────────────────────────

const getGoogleClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    throw new AppError('Google OAuth is not configured', 500);
  }
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
  );
};

export const googleStart = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const client = getGoogleClient();
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'select_account',
    });
    res.redirect(authorizeUrl);
  } catch (err) {
    next(err);
  }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  const clientUrl = env.CLIENT_URL.split(',')[0].trim();
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    const client = getGoogleClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: env.GOOGLE_CLIENT_ID!,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    const googleEmail = payload.email.toLowerCase();
    const googleName = payload.name || googleEmail.split('@')[0];
    const googleAvatar = payload.picture || '';
    const googleSub = payload.sub;

    let user = await User.findOne({ email: googleEmail }).select('+refreshTokens +googleId');

    if (!user) {
      // Generate a unique username from the email prefix
      const baseUsername = googleEmail.split('@')[0].replace(/[^a-z0-9_]/g, '_').slice(0, 15);
      let username = baseUsername;
      let suffix = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername.slice(0, 14)}${suffix}`;
        suffix++;
      }

      const created = await User.create({
        username,
        email: googleEmail,
        displayName: googleName,
        avatar: googleAvatar,
        googleId: googleSub,
        provider: 'google',
        emailVerified: true,
        bio: '',
        customStatus: '',
        status: 'offline',
        role: 'user',
        settings: {
          notifications: {
            email: true,
            push: true,
            sound: true,
            mentions: true,
            meetingReminders: true,
          },
          privacy: {
            showOnlineStatus: true,
            allowDirectMessages: true,
            showLastSeen: true,
          },
          appearance: {
            theme: 'dark',
            fontSize: 'medium',
            compactMode: false,
          },
          meeting: {
            defaultCameraOn: false,
            defaultMicOn: false,
            defaultSpeaker: 'default',
          },
        },
        stats: {
          totalMeetings: 0,
          totalHours: 0,
          messagesCount: 0,
          filesShared: 0,
        },
      });
      // Re-fetch with refreshTokens selected (cast to satisfy TS)
      user = (await User.findById(created._id).select('+refreshTokens')) as typeof user;
    } else {
      // Existing user — link Google account safely (never overwrite password)
      if (!user.googleId) user.googleId = googleSub;
      if (!user.avatar && googleAvatar) user.avatar = googleAvatar;
      user.emailVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    if (!user) {
      return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
    }

    // Issue tokens using existing helpers
    const accessToken = signAccessToken(user._id.toString());
    const newRefreshToken = signRefreshToken(user._id.toString());
    user.refreshTokens.push(newRefreshToken);
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    setTokenCookies(res, accessToken, newRefreshToken);
    console.log("Google callback cookies set: access=true refresh=true");

    // Redirect to dashboard — tokens are in HttpOnly cookies, not in URL
    return res.redirect(`${clientUrl}/dashboard`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`${clientUrl}/login?error=google_auth_failed`);
  }
};

