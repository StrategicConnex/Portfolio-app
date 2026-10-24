import type { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

interface BodyParserError extends Error {
  type?: string;
  status?: number;
}

function isBodyParserError(err: unknown): err is BodyParserError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    typeof (err as BodyParserError).type === 'string'
  );
}

/**
 * Global error handler (must be registered last, after routes).
 * - AppError subclasses → their own status code + message
 * - body-parser failures → 400 (malformed JSON) / 413 (payload too large)
 * - anything else → 500, without leaking internals in production
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Malformed / oversized JSON bodies (from express.json())
  if (isBodyParserError(err)) {
    const status = err.type === 'entity.too.large' ? 413 : 400;
    req.log?.warn({ type: err.type, url: req.url }, 'Request body rejected');
    res.status(status).json({
      status: 'error',
      message: status === 413 ? 'Request body too large' : 'Invalid JSON body',
    });
    return;
  }

  if (err instanceof ValidationError) {
    req.log?.warn({ details: err.details, url: req.url }, 'Validation failed');
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  if (err instanceof AppError) {
    req.log?.warn({ statusCode: err.statusCode, message: err.message, url: req.url }, 'Operational error');
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details !== undefined && { details: err.details }),
    });
    return;
  }

  // Unknown error — log everything (with request context when available),
  // expose nothing in production.
  const log = req.log ?? logger;
  log.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}
