import { createApp } from './app.js';
import { env } from './config/env.js';
import { createContainer } from './di/container.js';
import type { AuthService } from './services/auth.service.js';
import { logger } from './utils/logger.js';

const container = createContainer();
const authService = container.resolve<AuthService>('authService');

// Bootstrap an admin account when ADMIN_EMAIL/ADMIN_PASSWORD are configured.
if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
  await authService.ensureAdmin(env.ADMIN_EMAIL, env.ADMIN_PASSWORD);
  logger.info({ email: env.ADMIN_EMAIL }, 'Admin user ensured');
}

const app = createApp(container);

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
    'API server started',
  );
});

// Surface bind failures (e.g. port already in use) instead of failing silently.
server.on('error', (error) => {
  if (error instanceof Error && 'code' in error && error.code === 'EADDRINUSE') {
    logger.fatal({ port: env.PORT }, 'Port already in use');
  } else {
    logger.fatal({ err: error }, 'Failed to start server');
  }
  process.exit(1);
});

// ─── Graceful shutdown (skill best practice 11) ──────────────────────────────
let shuttingDown = false;

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down gracefully…');

  // Hard kill if close hangs (e.g. a stuck connection).
  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await container.close(); // releases singletons (e.g. DB pool)
      logger.flush();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// Log async failures without taking the process down (they may be transient).
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

// An uncaught exception leaves the process in an undefined state — log and die.
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});
