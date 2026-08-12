import type { Response } from 'express';
import type { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema.js';
import type { ValidatedRequest } from '../middleware/validate.js';
import type { AuthService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/response.js';

/**
 * HTTP layer — delegates to AuthService and formats the response.
 * Express 5 forwards rejected promises from async handlers to the global
 * error handler automatically, so controllers stay free of try/catch noise.
 *
 * Handlers are typed against `ValidatedRequest<Schema>` — `req.body` is
 * inferred from the route schema via z.infer, no casts needed.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (
    req: ValidatedRequest<typeof registerSchema>,
    res: Response,
  ): Promise<void> => {
    const result = await this.authService.register(req.body);
    sendSuccess(res, result, 'User registered successfully', 201);
  };

  login = async (
    req: ValidatedRequest<typeof loginSchema>,
    res: Response,
  ): Promise<void> => {
    const result = await this.authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  };

  refresh = async (
    req: ValidatedRequest<typeof refreshSchema>,
    res: Response,
  ): Promise<void> => {
    const result = await this.authService.refresh(req.body.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  };
}
