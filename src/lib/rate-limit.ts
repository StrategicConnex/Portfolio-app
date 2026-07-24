interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 60 seconds
const intervalId = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}, 60_000)

// Prevent the interval from keeping the process alive
if (typeof intervalId === 'object' && 'unref' in intervalId) {
  intervalId.unref()
}

/**
 * Reset all rate limit entries. Useful for tests.
 */
export function resetRateLimit(): void {
  store.clear()
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

/**
 * Simple in-memory rate limiter.
 *
 * @param identifier - Unique identifier for the client (e.g. IP)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || entry.resetAt <= now) {
    // First request or window expired - create a new entry
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  entry.count++

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.max(0, entry.resetAt - now),
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.max(0, entry.resetAt - now),
  }
}

/**
 * Extracts a client identifier from a Request object.
 * Falls back to a random placeholder if the request is from an internal source.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  // Fallback: use a placeholder (in production, this should not happen)
  return 'internal'
}
