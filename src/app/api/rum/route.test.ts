import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { SITE } from '@/lib/constants'
import { resetRateLimit } from '@/lib/rate-limit'

const reportRouteError = vi.hoisted(() => vi.fn())
vi.mock('@/lib/observability/route-errors', () => ({ reportRouteError }))

const fetchMock = vi.fn()

const validPayload = {
  projectId: SITE.scaudit.projectId,
  sessionId: '6f3d3d3e-6a3a-4c1e-9b1b-1f1f1f1f1f1f',
  timestamp: '2026-10-23T12:00:00.000Z',
  url: 'https://juanpalacios.vercel.app/',
  path: '/',
  referrer: 'https://www.google.com/',
  vitals: {
    LCP: { value: 2500, rating: 'good', delta: 2500, id: 'v1' },
    CLS: { value: 0.1, rating: 'good', delta: 0.1, id: 'v2' },
    INP: { value: 120, rating: 'good', delta: 120, id: 'v3' },
  },
  isFinal: true,
}

function makeRequest(
  body: unknown,
  headers: Record<string, string> = {},
) {
  return new NextRequest('http://localhost:3000/api/rum', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.9, 10.0.0.1',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  resetRateLimit()
  reportRouteError.mockClear()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/rum', () => {
  it('reenvía el payload real de vitals.js al upstream', async () => {
    const res = await POST(makeRequest(validPayload))

    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(SITE.scaudit.apiUrl)
    expect(init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Origin: SITE.url,
        'User-Agent': 'Portfolio-RUM-Proxy/1.0',
        // Última entrada de x-forwarded-for (la del edge), no la primera.
        'X-Forwarded-For': '10.0.0.1',
      },
    })
    expect(JSON.parse(init.body)).toEqual(validPayload)
  })

  it('omite beaconToken:null del script y conserva el resto del payload', async () => {
    const scriptPayload = {
      ...validPayload,
      beaconToken: null,
      device: { deviceType: 'desktop', browser: 'Chrome' },
      connection: { effectiveType: '4g' },
      vitals: { fid: 26.8, fidRating: 'good', fcp: 864, fcpRating: 'good' },
      resources: [{ name: '/_next/static/chunk.js', type: 'script', duration: 157 }],
      events: [{ type: 'pageview', data: { url: '/' }, ts: 1 }],
    }

    const res = await POST(makeRequest(scriptPayload))

    expect(res.status).toBe(204)
    const forwarded = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(forwarded).not.toHaveProperty('beaconToken')
    expect(forwarded).toMatchObject({
      projectId: SITE.scaudit.projectId,
      sessionId: validPayload.sessionId,
      device: { deviceType: 'desktop', browser: 'Chrome' },
      vitals: { fid: 26.8, fidRating: 'good' },
      resources: [{ name: '/_next/static/chunk.js', type: 'script', duration: 157 }],
      events: [{ type: 'pageview', data: { url: '/' }, ts: 1 }],
    })
  })

  it('conserva beaconToken cuando el script sí lo envía', async () => {
    const res = await POST(
      makeRequest({ ...validPayload, beaconToken: 'beacon-secret' }),
    )

    expect(res.status).toBe(204)
    const forwarded = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(forwarded.beaconToken).toBe('beacon-secret')
  })

  it('acepta el formato plano real de vitals.js v2', async () => {
    const res = await POST(
      makeRequest({
        ...validPayload,
        vitals: {
          fid: 26.8,
          fidRating: 'good',
          fcp: 864,
          fcpRating: 'good',
          ttfb: 425.4,
          ttfbRating: 'good',
        },
      }),
    )

    expect(res.status).toBe(204)
  })

  it('acepta métricas con campos extra del script', async () => {
    const payload = {
      ...validPayload,
      vitals: {
        LCP: {
          value: 1800,
          rating: 'good',
          entries: [{ name: 'largest-contentful-paint' }],
          attribution: { element: 'main' },
        },
      },
      events: [{ type: 'click', data: { target: 'cta' }, ts: 1 }],
    }

    const res = await POST(makeRequest(payload))
    expect(res.status).toBe(204)
  })

  it('rechaza JSON inválido', async () => {
    const res = await POST(makeRequest('{not-json'))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza un payload sin métricas válidas', async () => {
    const res = await POST(
      makeRequest({
        ...validPayload,
        vitals: { INVALID: { rating: 'good' } },
      }),
    )
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza un projectId ajeno', async () => {
    const res = await POST(
      makeRequest({
        ...validPayload,
        projectId: '00000000-0000-4000-8000-000000000000',
      }),
    )
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza content-types distintos de application/json', async () => {
    const res = await POST(
      makeRequest(validPayload, { 'content-type': 'text/plain' }),
    )
    expect(res.status).toBe(415)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('acepta application/json con charset', async () => {
    const res = await POST(
      makeRequest(validPayload, { 'content-type': 'application/json; charset=utf-8' }),
    )
    expect(res.status).toBe(204)
  })

  it('rechaza bodies por encima de 32 KB', async () => {
    const huge = {
      ...validPayload,
      events: [{ type: 'noise', data: 'x'.repeat(40 * 1024) }],
    }
    const res = await POST(makeRequest(huge))
    expect(res.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('devuelve 502 cuando el upstream responde con error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"error":"Invalid payload"}', { status: 500 }),
    )

    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(502)
    expect(reportRouteError).toHaveBeenCalledWith(
      '/api/rum',
      expect.any(Error),
      expect.objectContaining({ status: 502, stage: 'upstream' }),
    )
  })

  it('devuelve 503 cuando el upstream no es alcanzable', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(503)
    expect(reportRouteError).toHaveBeenCalledWith(
      '/api/rum',
      expect.any(Error),
      expect.objectContaining({ status: 503 }),
    )
  })

  it('devuelve 504 cuando el upstream agota el timeout', async () => {
    fetchMock.mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted'), {
        name: 'TimeoutError',
      }),
    )

    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(504)
  })

  it('limita a 60 peticiones por minuto e IP de edge', async () => {
    for (let i = 0; i < 60; i++) {
      const res = await POST(makeRequest(validPayload))
      expect(res.status, `iteración ${i}`).toBe(204)
    }

    const blocked = await POST(makeRequest(validPayload))
    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(fetchMock).toHaveBeenCalledTimes(60)

    // Otra IP de edge no comparte la ventana.
    const other = await POST(
      makeRequest(validPayload, { 'x-forwarded-for': '198.51.100.1, 10.0.0.2' }),
    )
    expect(other.status).toBe(204)
  })
})
