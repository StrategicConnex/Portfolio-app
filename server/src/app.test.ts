import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createApp } from './app.js';
import { createContainer, type Container } from './di/container.js';
import { AuthService } from './services/auth.service.js';

let app: Express;
let container: Container;

beforeAll(() => {
  container = createContainer();
  app = createApp(container);
});

afterAll(async () => {
  await container.close();
});

describe('GET /api/health', () => {
  it('returns ok with uptime and timestamp', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.data.timestamp).toBeTruthy();
  });
});

describe('Auth flow', () => {
  const registerBody = {
    name: 'Juan Palacios',
    email: 'juan@portfolio.dev',
    password: 'super-secret-123',
  };

  it('registers a user and exposes no password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(registerBody).expect(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(registerBody.email);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('rejects duplicate registration with 409', async () => {
    const res = await request(app).post('/api/auth/register').send(registerBody).expect(409);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('rejects invalid input with 400 and field details', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'x', email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(res.body.details).toBeDefined();
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: registerBody.email, password: registerBody.password })
      .expect(200);
    expect(res.body.data.tokens.accessToken).toBeTruthy();
  });

  it('rejects a wrong password with 401', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: registerBody.email, password: 'wrong-password' })
      .expect(401);
  });

  it('refreshes the access token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: registerBody.email, password: registerBody.password })
      .expect(200);

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.tokens.refreshToken })
      .expect(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects a malformed JSON body with 400', async () => {
    await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": broken')
      .expect(400);
  });
});

describe('Protected user routes', () => {
  const email = 'protected@portfolio.dev';
  const password = 'super-secret-123';
  let token: string;

  beforeAll(async () => {
    // Register once (409 is fine if a prior suite run left the user behind).
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Lina', email, password });
    expect([201, 409]).toContain(reg.status);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);
    token = res.body.data.tokens.accessToken as string;
  });

  it('returns 401 without a token', async () => {
    await request(app).get('/api/users/me').expect(401);
  });

  it('returns the current user with a valid token', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects a garbage token with 401', async () => {
    await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('denies non-admin users the user list with 403', async () => {
    await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});

describe('Admin access', () => {
  it('seeds an admin and allows the user list', async () => {
    const authService = container.resolve<AuthService>('authService');
    await authService.ensureAdmin('admin@portfolio.dev', 'admin-secret-123');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@portfolio.dev', password: 'admin-secret-123' })
      .expect(200);

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.data.tokens.accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Rate limiting', () => {
  it('returns 429 after the limit and exposes RateLimit headers', async () => {
    // Isolated app with a tiny limit so the real limiter is exercised.
    const miniApp = express();
    miniApp.use(
      rateLimit({
        windowMs: 60_000,
        limit: 2,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
      }),
    );
    miniApp.get('/', (_req, res) => res.json({ ok: true }));

    for (let i = 0; i < 2; i++) {
      await request(miniApp).get('/').expect(200);
    }

    const limited = await request(miniApp).get('/');
    expect(limited.status).toBe(429);
    // express-rate-limit v8 draft-8 format: combined `ratelimit` header with
    // `r` (remaining) and `ratelimit-policy`, plus Retry-After on the 429.
    expect(limited.headers['ratelimit']).toContain('r=0');
    expect(limited.headers['ratelimit-policy']).toBeDefined();
    expect(limited.headers['retry-after']).toBeDefined();
  });
});

describe('Misc', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.status).toBe('error');
  });

  it('applies security headers (helmet)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});
