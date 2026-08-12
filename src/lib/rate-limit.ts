export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
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
