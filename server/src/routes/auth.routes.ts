import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import type { Container } from '../di/container.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, refreshSchema, registerSchema } from '../schemas/auth.schema.js';

export function createAuthRouter(container: Container): Router {
  const router = Router();
  const authController = container.resolve<AuthController>('authController');

  // Stricter limiter for credential endpoints (5 req / 15 min per IP).
  router.use(authLimiter);

  router.post('/register', validate(registerSchema), authController.register);
  router.post('/login', validate(loginSchema), authController.login);
  router.post('/refresh', validate(refreshSchema), authController.refresh);

  return router;
}
