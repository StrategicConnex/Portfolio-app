/**
 * Distributed rate limiting with Upstash Redis.
 * Falls back to in-memory Map if Redis is not configured.
 */
import type { RateLimitResult } from './rate-limit';

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Clean up expired entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  const intervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt <= now) memoryStore.delete(key);
    }
  }, 60_000);
  if (typeof intervalId === 'object' && 'unref' in intervalId) {
    (intervalId as NodeJS.Timeout).unref();
  }
}

/**
 * Reset all rate limit entries (for testing).
 */
export function resetRateLimit(): void {
  memoryStore.clear();
}

/**
 * Check rate limit using Upstash Redis when available, with in-memory fallback.
 */
export async function checkRateLimitDistributed(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  // Try Upstash Redis first
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
      // Fall through to in-memory
    }
  }

  // In-memory fallback
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
