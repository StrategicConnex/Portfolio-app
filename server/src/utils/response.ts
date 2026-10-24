import type { Response } from 'express';

/**
 * Standardized response envelope — every handler responds through these
 * helpers so the API shape stays consistent across all endpoints.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200,
): Response {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown,
): Response {
  return res.status(statusCode).json({
    status: 'error',
    message,
    ...(details !== undefined && { details }),
  });
}
