import { AuthController } from '../controllers/auth.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { InMemoryUserRepository } from '../repositories/user.repository.js';
import type { IUserRepository } from '../repositories/user.repository.js';
import { AuthService } from '../services/auth.service.js';
import { UserService } from '../services/user.service.js';

/**
 * Minimal DI container (skill pattern 2). Factories are lazy; `singleton`
 * instances are resolved once and reused. Repositories/services/controllers
 * are wired here, so swapping the data layer is a single-line change.
 */
export class Container {
  private readonly factories = new Map<string, { factory: () => unknown; singleton: boolean }>();
  private readonly instances = new Map<string, unknown>();

  register<T>(key: string, factory: () => T): void {
    this.factories.set(key, { factory: factory as () => unknown, singleton: false });
  }

  singleton<T>(key: string, factory: () => T): void {
    this.factories.set(key, { factory: factory as () => unknown, singleton: true });
  }

  resolve<T>(key: string): T {
    const entry = this.factories.get(key);
    if (!entry) {
      throw new Error(`No factory registered for "${key}"`);
    }

    if (entry.singleton) {
      let instance = this.instances.get(key);
      if (!instance) {
        instance = entry.factory();
        this.instances.set(key, instance);
      }
      return instance as T;
    }

    return entry.factory() as T;
  }

  /** Release singletons (e.g. connection pools) on graceful shutdown. */
  async close(): Promise<void> {
    for (const instance of this.instances.values()) {
      const closeable = instance as { close?: () => Promise<void> | void };
      if (typeof closeable.close === 'function') {
        await closeable.close();
      }
    }
    this.instances.clear();
  }
}

export function createContainer(): Container {
  const container = new Container();

  // Data access (singleton — swap InMemoryUserRepository for a pg-backed
  // implementation here to move to PostgreSQL).
  container.singleton<IUserRepository>('userRepository', () => new InMemoryUserRepository());

  // Services
  container.singleton('userService', () => new UserService(container.resolve<IUserRepository>('userRepository')));
  container.singleton('authService', () => new AuthService(container.resolve<IUserRepository>('userRepository')));

  // Controllers (registered per-request, stateless after construction)
  container.register('authController', () => new AuthController(container.resolve<AuthService>('authService')));
  container.register('userController', () => new UserController(container.resolve<UserService>('userService')));

  return container;
}
