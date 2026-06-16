import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.access_token;
    console.log("Auth cookie presence: access=" + Boolean(token));
    if (!token) {
      throw new AppError('You are not logged in. Please log in.', 401);
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { id: string };
    const user = await User.findById(decoded.id).select('-refreshTokens');
    if (!user) {
      throw new AppError('User belonging to this token no longer exists.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Authentication failed', 401));
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
