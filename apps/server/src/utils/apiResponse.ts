import { Response } from 'express';

interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

export function sendSuccess<T>(res: Response, data: T, message = 'Success', statusCode = 200, pagination?: ApiSuccess['pagination']) {
  const response: ApiSuccess<T> = { success: true, data, message };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode: number, code: string, details?: unknown) {
  const response: ApiError = { success: false, error, code };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
}
