import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { PANEL_COOKIE, verifyPanelCookie } from '@/lib/panel-auth'
import { resetRateLimit } from '@/lib/rate-limit'

const BASE = 'http://localhost:3000'

function makeReq(url: string, init: RequestInit = {}) {
  // NextRequest's RequestInit is stricter about `signal` than the DOM type.
  const { signal, ...rest } = init
  return new NextRequest(url, { ...rest, signal: signal ?? undefined })
}

describe('panel login route', () => {
  beforeEach(() => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'clave-de-prueba-larga-suficiente')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    resetRateLimit()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('404s when the auth env is not configured', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', '')
    const res = await GET(makeReq(`${BASE}/estadisticas-privadas/login?k=x`))
    expect(res.status).toBe(404)
  })

  it('rate-limits repeated failed attempts per client', async () => {
    for (let i = 0; i < 5; i++) {
      await GET(makeReq(`${BASE}/estadisticas-privadas/login?k=malo`))
    }
    const res = await GET(makeReq(`${BASE}/estadisticas-privadas/login?k=malo`))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('e=rate')
  })

  it('redirects with an error on a wrong token and sets no cookie', async () => {
    const res = await GET(makeReq(`${BASE}/estadisticas-privadas/login?k=malo`))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toContain('e=1')
    expect(res.headers.get('set-cookie') ?? '').not.toContain(PANEL_COOKIE)
  })

  it('GET ?k=<token> sets the signed httpOnly cookie and strips the token from the URL', async () => {
    const res = await GET(
      makeReq(`${BASE}/estadisticas-privadas/login?k=clave-de-prueba-larga-suficiente`),
    )
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${BASE}/estadisticas-privadas`)

    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(PANEL_COOKIE)
    expect(setCookie.toLowerCase()).toContain('httponly')

    const value = setCookie.split(';')[0].split('=')[1]
    expect(verifyPanelCookie(decodeURIComponent(value))).toBe(true)
  })

  it('POST form login works the same way', async () => {
    const form = new FormData()
    form.set('k', 'clave-de-prueba-larga-suficiente')
    const res = await POST(
      makeReq(`${BASE}/estadisticas-privadas/login`, { method: 'POST', body: form }),
    )
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe(`${BASE}/estadisticas-privadas`)
    expect(res.headers.get('set-cookie') ?? '').toContain(PANEL_COOKIE)
  })
})
