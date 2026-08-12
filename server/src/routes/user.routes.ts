import { Router } from 'express';
import type { UserController } from '../controllers/user.controller.js';
import type { Container } from '../di/container.js';
import { authenticate, authorize } from '../middleware/auth.js';
import type { AuthService } from '../services/auth.service.js';

export function createUserRouter(container: Container): Router {
  const router = Router();
  const userController = container.resolve<UserController>('userController');
  const authService = container.resolve<AuthService>('authService');

  router.get('/me', authenticate(authService), userController.me);
  router.get('/', authenticate(authService), authorize('admin'), userController.list);

  return router;
}
