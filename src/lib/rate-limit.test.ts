import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { checkRateLimit, getClientId, resetRateLimit } from '@/lib/rate-limit'

const ORIGINAL_URL = process.env.UPSTASH_REDIS_REST_URL
const ORIGINAL_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

beforeEach(() => {
  resetRateLimit()
})

afterEach(() => {
  // Restore env so the in-memory adapter is the default for other suites
  if (ORIGINAL_URL === undefined) delete process.env.UPSTASH_REDIS_REST_URL
  else process.env.UPSTASH_REDIS_REST_URL = ORIGINAL_URL
  if (ORIGINAL_TOKEN === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN
  else process.env.UPSTASH_REDIS_REST_TOKEN = ORIGINAL_TOKEN
  vi.doUnmock('@upstash/redis')
  vi.restoreAllMocks()
})

describe('checkRateLimit — in-memory adapter (default)', () => {
  it('allows requests up to the max and rejects beyond it', async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await checkRateLimit('ip-a', 5, 60_000)
      expect(res.allowed).toBe(true)
      expect(res.remaining).toBe(5 - i)
    }
    const blocked = await checkRateLimit('ip-a', 5, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.resetIn).toBeGreaterThan(0)
  })

  it('tracks identifiers independently', async () => {
    await checkRateLimit('ip-a', 1, 60_000)
    const res = await checkRateLimit('ip-b', 1, 60_000)
    expect(res.allowed).toBe(true)
  })

  it('resets after the window elapses', async () => {
    vi.useFakeTimers()
    try {
      await checkRateLimit('ip-c', 1, 60_000)
      expect((await checkRateLimit('ip-c', 1, 60_000)).allowed).toBe(false)
      vi.advanceTimersByTime(60_001)
      expect((await checkRateLimit('ip-c', 1, 60_000)).allowed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('resetRateLimit clears the store', async () => {
    await checkRateLimit('ip-d', 1, 60_000)
    expect((await checkRateLimit('ip-d', 1, 60_000)).allowed).toBe(false)
    resetRateLimit()
    expect((await checkRateLimit('ip-d', 1, 60_000)).allowed).toBe(true)
  })
})

describe('checkRateLimit — Upstash adapter (when configured)', () => {
  it('uses Redis and reports counts and windows', async () => {
    const incr = vi.fn().mockResolvedValue(1)
    const expire = vi.fn().mockResolvedValue(1)
    vi.doMock('@upstash/redis', () => ({
      Redis: vi.fn().mockImplementation(function Redis() {
        return { incr, expire }
      }),
    }))
    vi.resetModules()

    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token'

    const { checkRateLimit: check } = await import('@/lib/rate-limit')
    const res = await check('ip-e', 10, 60_000)

    expect(incr).toHaveBeenCalledWith(expect.stringContaining('ratelimit:ip-e'))
    expect(expire).toHaveBeenCalled()
    expect(res.allowed).toBe(true)
    expect(res.remaining).toBe(9)
  })

  it('falls back to the in-memory adapter when Redis errors', async () => {
    vi.doMock('@upstash/redis', () => ({
      Redis: vi.fn().mockImplementation(function Redis() {
        return {
          incr: vi.fn().mockRejectedValue(new Error('connection refused')),
          expire: vi.fn().mockResolvedValue(1),
        }
      }),
    }))
    vi.resetModules()

    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token'

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { checkRateLimit: check } = await import('@/lib/rate-limit')

    const res = await check('ip-f', 2, 60_000)
    expect(warn).toHaveBeenCalled()
    expect(res.allowed).toBe(true)
    // Second request hits the memory store, not Redis again
    const second = await check('ip-f', 2, 60_000)
    expect(second.remaining).toBe(0)
  })
})

describe('getClientId — ADR-001 contract', () => {
  it('reads the LAST x-forwarded-for entry (trusted edge), never the first', () => {
    const req = new Request('http://localhost/api', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    })
    expect(getClientId(req)).toBe('5.6.7.8')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost/api', {
      headers: { 'x-real-ip': '9.9.9.9' },
    })
    expect(getClientId(req)).toBe('9.9.9.9')
  })

  it('returns the internal placeholder when no IP headers exist', () => {
    expect(getClientId(new Request('http://localhost/api'))).toBe('internal')
  })
})
