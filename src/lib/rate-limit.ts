/**
 * Rate limiting seam (candidate C3): one interface, two adapters.
 *
 * `checkRateLimit()` is the single entry point — it uses the Upstash Redis
 * adapter when configured and falls back to the in-memory Map otherwise, so
 * the distributed and local paths never drift. They used to be two modules
 * with the in-memory logic copied verbatim (`rate-limit.ts` + the now-deleted
 * `rate-limit-upstash.ts`): the contact route used the local sync variant
 * and ask-ai the distributed one.
 *
 * ADR-001 is respected: `getClientId()` keeps reading the LAST
 * `x-forwarded-for` entry (the one appended by the trusted edge), never the
 * first (client-spoofable).
 */

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Clean up expired entries every 60 seconds (single copy)
const intervalId = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}, 60_000);

// Prevent the interval from keeping the process alive
if (typeof intervalId === 'object' && 'unref' in intervalId) {
  intervalId.unref();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/** Clear all rate-limit entries (for tests). */
export function resetRateLimit(): void {
  memoryStore.clear();
}

/**
 * Check the rate limit for an identifier.
 *
 * Adapter 1 — Upstash Redis when configured (shared across instances).
 * Adapter 2 — in-memory Map fallback when unconfigured or on Redis errors.
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  // Upstash Redis adapter
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });

      const key = `ratelimit:${identifier}`;
      const now = Date.now();
      const windowKey = Math.floor(now / windowMs);
      const rateKey = `${key}:${windowKey}`;

      const count = await redis.incr(rateKey);

      // Set TTL on first increment
      if (count === 1) {
        await redis.expire(rateKey, Math.ceil(windowMs / 1000));
      }

      const remaining = Math.max(0, maxRequests - count);
      const resetIn = windowMs - (now % windowMs);

      return {
        allowed: count <= maxRequests,
        remaining,
        resetIn,
      };
    } catch (err) {
      console.warn('[RateLimit] Upstash Redis error, falling back to memory:', err);
      // Fall through to the in-memory adapter
    }
  }

  // In-memory adapter
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(0, entry.resetAt - now),
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.max(0, entry.resetAt - now),
  };
}

/**
 * Extracts a client identifier from a Request object.
 *
 * Security note: `x-forwarded-for` is a comma-separated list where each proxy
 * appends the address it observed. The FIRST entry is client-controlled and
 * must NOT be trusted (spoofing vector for rate-limit bypass). The LAST entry
 * is the one appended by the trusted edge (e.g. Vercel), so we read it first.
 * Falls back to a placeholder if the request is from an internal source.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const entries = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    const last = entries[entries.length - 1]
    if (last) {
      return last
    }
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  // Fallback: use a placeholder (in production, this should not happen)
  return 'internal'
}
