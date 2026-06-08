import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): Response => {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.status === 'fail' ? 'FAIL' : 'ERROR');
  }

  // Mongoose duplicate key error
  if ((err as NodeJS.ErrnoException).code === '11000') {
    return sendError(res, 'Duplicate field value', 409, 'DUPLICATE_KEY');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return sendError(res, err.message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
  }

  console.error('💥 UNHANDLED ERROR:', err);
  return sendError(res, 'Internal server error', 500, 'INTERNAL_ERROR');
};
