import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';

/**
 * Request logging middleware (pino-http).
 * Authorization headers are redacted by the logger config.
 * Health checks are ignored to keep monitors from polluting the log stream.
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
  customLogLevel: (req, res) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
