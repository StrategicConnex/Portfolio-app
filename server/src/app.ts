import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { corsOrigins, env } from './config/env.js';
import type { Container } from './di/container.js';
import { errorHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';
import { requestLogger } from './middleware/request-logger.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createUserRouter } from './routes/user.routes.js';
import { sendSuccess } from './utils/response.js';

/**
 * App factory — takes the DI container so tests can build a fresh app per
 * suite while production builds it once in `index.ts`.
 */
export function createApp(container: Container): Express {
  const app = express();

  // Behind a reverse proxy, the real client IP is in X-Forwarded-For.
  app.set('trust proxy', env.TRUST_PROXY);

  // Security & middleware (skill best practices 7-9, 14)
  app.use(helmet());
  app.use(cors({ origin: corsOrigins() }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  // Structured request logging (skipped in tests to keep output clean)
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Health check (skill best practice 13) — exempt from rate limiting
  app.get('/api/health', (_req, res) => {
    sendSuccess(
      res,
      {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      undefined,
      200,
    );
  });

  // Routes
  app.use('/api', generalLimiter);
  app.use('/api/auth', createAuthRouter(container));
  app.use('/api/users', createUserRouter(container));

  // 404 for everything else
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Route not found: ${req.method} ${req.path}`,
    });
  });

  // Global error handler — must be registered last.
  app.use(errorHandler);

  return app;
}
