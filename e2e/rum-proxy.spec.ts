import { test, expect } from '@playwright/test'

const PROJECT_ID = '7c9945ad-c235-484d-98fa-1d8fe7e9ee40'

function telemetryPayload(projectId = PROJECT_ID) {
  return {
    projectId,
    sessionId: '6f3d3d3e-6a3a-4c1e-9b1b-1f1f1f1f1f1f',
    timestamp: new Date().toISOString(),
    url: 'https://juanpalacios.vercel.app/',
    path: '/',
    vitals: {
      LCP: { value: 2500, rating: 'good' },
      CLS: { value: 0.1, rating: 'good' },
    },
    isFinal: true,
  }
}

test.describe('RUM proxy (/api/rum)', () => {
  test('rechaza un projectId ajeno sin llamar al upstream', async ({ request }) => {
    const res = await request.post('/api/rum', {
      data: telemetryPayload('00000000-0000-4000-8000-000000000000'),
    })

    expect(res.status()).toBe(400)
  })

  test('rechaza bodies que no son JSON', async ({ request }) => {
    const res = await request.post('/api/rum', {
      data: 'no es json',
      headers: { 'content-type': 'application/json' },
    })

    expect(res.status()).toBe(400)
  })

  test('rechaza content-types no JSON con 415', async ({ request }) => {
    const res = await request.post('/api/rum', {
      data: JSON.stringify(telemetryPayload()),
      headers: { 'content-type': 'text/plain' },
    })

    expect(res.status()).toBe(415)
  })

  test('rechaza payloads de más de 32 KB con 413', async ({ request }) => {
    const res = await request.post('/api/rum', {
      data: JSON.stringify({
        ...telemetryPayload(),
        events: [{ type: 'noise', data: 'x'.repeat(40 * 1024) }],
      }),
      headers: { 'content-type': 'application/json' },
    })

    expect(res.status()).toBe(413)
  })

  test('la CSP del sitio envía la telemetría a self, no a SCAudit', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy']
    expect(csp).toBeTruthy()

    const connectSrc = csp
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('connect-src '))

    expect(connectSrc).toContain("'self'")
    expect(connectSrc).not.toContain('scaudit.vercel.app')
  })
})
