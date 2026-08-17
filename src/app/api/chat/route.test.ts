import { describe, it, expect, vi, afterEach } from 'vitest'
import { POST } from './route'
import { getClientId } from '@/lib/rate-limit'

/**
 * H2 remediation: the fallback forwards the platform-set XFF so the rate
 * limiter in /api/ask-ai keys on the real client instead of the global
 * "internal" bucket. The outbound fetch is mocked; the route itself runs
 * for real.
 */

type FetchInit = { method?: string; headers?: Record<string, string>; body?: string }

const captured = vi.hoisted(() => ({
  init: null as FetchInit | null,
  url: '',
}))

afterEach(() => {
  vi.unstubAllGlobals()
  captured.init = null
  captured.url = ''
})

function mockAskAi(status = 200, body?: string) {
  vi.stubGlobal('fetch', vi.fn(async (url: string | URL, init?: FetchInit) => {
    captured.url = String(url)
    captured.init = init ?? null
    return new Response(body ?? 'mocked stream', {
      status,
      statusText: status === 200 ? 'OK' : 'Too Many Requests',
      headers: { 'content-type': status === 200 ? 'text/event-stream' : 'text/plain' },
    })
  }))
}

function chatRequest(headers: Record<string, string> = {}, body = { messages: [{ role: 'user', content: 'hola' }] }): Request {
  return new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat — H2: XFF propagation to the internal fetch', () => {
  it('forwards the original x-forwarded-for to /api/ask-ai verbatim', async () => {
    mockAskAi()
    await POST(chatRequest({ 'x-forwarded-for': '203.0.113.9' }))

    expect(captured.url).toBe('http://localhost:3000/api/ask-ai')
    expect(captured.init?.headers?.['x-forwarded-for']).toBe('203.0.113.9')
  })

  it('forwards a multi-hop XFF list verbatim (getClientId keeps reading the last entry)', async () => {
    mockAskAi()
    await POST(chatRequest({ 'x-forwarded-for': '198.51.100.4, 203.0.113.9' }))

    const forwarded = captured.init?.headers?.['x-forwarded-for']
    expect(forwarded).toBe('198.51.100.4, 203.0.113.9')

    // The rate-limit identifier at /api/ask-ai resolves to the edge-appended IP
    const askAiRequest = new Request(captured.url, { headers: captured.init!.headers })
    expect(getClientId(askAiRequest)).toBe('203.0.113.9')
  })

  it('forwards x-real-ip when present', async () => {
    mockAskAi()
    await POST(chatRequest({ 'x-real-ip': '203.0.113.9' }))

    expect(captured.init?.headers?.['x-real-ip']).toBe('203.0.113.9')
  })

  it('forwards the request body untouched', async () => {
    mockAskAi()
    const body = { messages: [{ role: 'user', content: '¿qué es IEC 62443?' }], mode: 'ask' }
    await POST(chatRequest({ 'x-forwarded-for': '203.0.113.9' }, body))

    expect(JSON.parse(captured.init?.body ?? '{}')).toEqual(body)
  })

  it('does not invent client headers when none arrived (falls back to "internal" downstream)', async () => {
    mockAskAi()
    await POST(chatRequest())

    expect(captured.init?.headers?.['x-forwarded-for']).toBeUndefined()
    expect(captured.init?.headers?.['x-real-ip']).toBeUndefined()
  })

  it('passes through the status of the upstream response', async () => {
    mockAskAi(429)
    const res = await POST(chatRequest({ 'x-forwarded-for': '203.0.113.9' }))

    expect(res.status).toBe(429)
    expect(await res.text()).toBe('Too Many Requests')
  })

  it('streams the upstream body back as text/event-stream', async () => {
    mockAskAi(200, 'data: {"text":"hola"}\n\n')
    const res = await POST(chatRequest({ 'x-forwarded-for': '203.0.113.9' }))

    expect(res.headers.get('content-type')).toBe('text/event-stream')
    expect(await res.text()).toBe('data: {"text":"hola"}\n\n')
  })
})
