import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryUserRepository } from '../repositories/user.repository.js';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { AuthService } from './auth.service.js';

const USER = { name: 'Ana', email: 'ana@example.com', password: 'password123' };

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    auth = new AuthService(new InMemoryUserRepository());
  });

  describe('register', () => {
    it('creates a user and returns a safe user + both tokens', async () => {
      const result = await auth.register(USER);

      expect(result.user.email).toBe(USER.email);
      expect(result.user.name).toBe(USER.name);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(result.tokens.expiresIn).toBeGreaterThan(0);
    });

    it('rejects duplicate emails with a ConflictError', async () => {
      await auth.register(USER);
      await expect(auth.register({ ...USER, name: 'Other' })).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    it('succeeds with valid credentials', async () => {
      await auth.register(USER);
      const result = await auth.login({ email: USER.email, password: USER.password });

      expect(result.user.email).toBe(USER.email);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.tokens.accessToken).toBeTruthy();
    });

    it('throws UnauthorizedError for a wrong password', async () => {
      await auth.register(USER);
      await expect(
        auth.login({ email: USER.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('throws UnauthorizedError for an unknown email', async () => {
      await expect(
        auth.login({ email: 'nobody@example.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('refresh', () => {
    it('mints a new access token from a valid refresh token', async () => {
      const { tokens, user } = await auth.register(USER);
      const result = await auth.refresh(tokens.refreshToken);

      expect(result.accessToken).toBeTruthy();
      // The new token decodes to the same user.
      const payload = auth.verifyAccessToken(result.accessToken);
      expect(payload.sub).toBe(user.id);
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('rejects an invalid refresh token', async () => {
      await expect(auth.refresh('not-a-token')).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('verifyAccessToken', () => {
    it('returns the payload for a valid access token', async () => {
      const { tokens } = await auth.register(USER);
      const payload = auth.verifyAccessToken(tokens.accessToken);

      expect(payload.sub).toBeTruthy();
      expect(payload.email).toBe(USER.email);
      expect(payload.role).toBe('user');
    });

    it('rejects an expired/garbage token', () => {
      // verifyAccessToken is synchronous — assert the throw directly.
      expect(() => auth.verifyAccessToken('garbage')).toThrow(UnauthorizedError);
    });
  });
});
