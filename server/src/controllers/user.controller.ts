import type { Request, Response } from 'express';
import type { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  /** GET /api/users/me — the authenticated user (protected by `authenticate`). */
  me = async (req: Request, res: Response): Promise<void> => {
    // req.user is guaranteed by the authenticate middleware.
    const user = await this.userService.findById(req.user!.sub);
    sendSuccess(res, user);
  };

  /** GET /api/users — admin-only listing. */
  list = async (_req: Request, res: Response): Promise<void> => {
    const users = await this.userService.list();
    sendSuccess(res, users);
  };
}
