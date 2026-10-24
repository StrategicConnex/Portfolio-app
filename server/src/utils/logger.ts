import { pino } from 'pino';
import { env } from '../config/env.js';

// Best practice #5: structured logging. Pretty output in development,
// plain JSON in test/production (so log pipelines can parse it).
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  base: { service: 'portfolio-api' },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});
