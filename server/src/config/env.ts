import { existsSync } from 'node:fs';
import { z } from 'zod';

// Best practice #4: validate environment variables at startup and never
// hardcode secrets. Node 20.12+ can load `.env` natively (no dotenv dep).
if (
  typeof process.loadEnvFile === 'function' &&
  existsSync('.env')
) {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Malformed .env — fall through to process.env validation below.
  }
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  LOG_LEVEL: z.string().default('info'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Optional admin bootstrap — creates an admin on startup when both are set.
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(1),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Fail fast with a readable report instead of failing at runtime.
    console.error('❌ Invalid environment configuration:');
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    console.error('Copy server/.env.example to server/.env and fill in the values.');
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

/** Validated, typed environment singleton (fail-fast at startup). */
export const env: Env = loadEnv();

/** Comma-separated list of CORS origins, or `true` when `*` is present. */
export function corsOrigins(): true | string[] {
  const origins = env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.includes('*')) return true;
  return origins;
}
