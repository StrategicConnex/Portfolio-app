import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const skipInTests = () => env.NODE_ENV === 'test';

/** General API limiter: 100 req / 15 min per IP (configurable). */
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8', // RateLimit-* + Retry-After
  legacyHeaders: false,
  skip: skipInTests,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});

/** Stricter limiter for credential endpoints: 5 req / 15 min per IP. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: { status: 'error', message: 'Too many attempts, please try again later.' },
});
