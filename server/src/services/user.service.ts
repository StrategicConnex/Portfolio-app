import type { IUserRepository } from '../repositories/user.repository.js';
import { toSafeUser, type SafeUser } from '../types/user.types.js';
import { NotFoundError } from '../utils/errors.js';

/** Read-side business logic for users (no password hashes ever leave here). */
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUser(user);
  }

  async findByEmail(email: string): Promise<SafeUser> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toSafeUser(user);
  }

  async list(): Promise<SafeUser[]> {
    const users = await this.userRepository.findAll();
    return users.map(toSafeUser);
  }
}
