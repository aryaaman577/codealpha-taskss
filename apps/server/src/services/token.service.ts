import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES as any,
  });
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ id: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES as any,
  });
};
