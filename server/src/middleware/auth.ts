import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AuthService } from '../services/auth.service.js';
import type { TokenPayload, UserRole } from '../types/user.types.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT authentication middleware (factory — wired with the AuthService
 * through the DI container). Requires `Authorization: Bearer <token>` and
 * attaches the verified payload to `req.user`.
 */
export function authenticate(authService: AuthService): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

      if (!token) {
        throw new UnauthorizedError('Authentication token missing');
      }

      req.user = authService.verifyAccessToken(token);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Role-based authorization middleware — must run after `authenticate`. */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
}
