import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      // Minimal env for tests — the full schema is validated in config/env.ts
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      JWT_SECRET: 'test-only-jwt-secret-that-is-at-least-32-chars-long!!',
      JWT_REFRESH_SECRET: 'test-only-refresh-secret-also-at-least-32-chars-long!!',
      JWT_ACCESS_TTL: '15m',
      JWT_REFRESH_TTL: '7d',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      TRUST_PROXY: '0',
    },
  },
});
