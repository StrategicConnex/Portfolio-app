import type { UserEntity } from '../types/user.types.js';

/**
 * Data-access contract. The rest of the app depends only on this interface,
 * so swapping the in-memory store for PostgreSQL is a drop-in change:
 *
 *   1. Implement this interface with `pg` `Pool` (see skill reference
 *      "PostgreSQL with Connection Pool").
 *   2. Register it in `di/container.ts` instead of InMemoryUserRepository.
 *
 * Note the connection pool lives in the container as a singleton and is
 * released on graceful shutdown via `close()`.
 */
export interface IUserRepository {
  create(user: UserEntity): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  delete(id: string): Promise<boolean>;
  close?(): Promise<void>;
}

/**
 * In-memory implementation — sufficient for development, demos, and the
 * test suite. Uses `crypto.randomUUID()` so it behaves like a real DB id.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, UserEntity>();

  async create(user: UserEntity): Promise<UserEntity> {
    this.store.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const user of this.store.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findAll(): Promise<UserEntity[]> {
    return [...this.store.values()];
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}
