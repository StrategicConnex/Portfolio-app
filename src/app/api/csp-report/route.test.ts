import { describe, expect, it, vi } from 'vitest'
import { GET, POST } from './route'

const cspBody = JSON.stringify({
  'csp-report': {
    'document-uri': 'https://juanpalacios.vercel.app/',
    referrer: '',
    'blocked-uri': 'inline',
    'violated-directive': 'script-src',
    'effective-directive': 'script-src',
    'original-policy': "default-src 'self'",
    disposition: 'report',
    'status-code': 200,
    'script-sample': '',
  },
})

function cspRequest(body: string): Request {
  return new Request('http://localhost:3000/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  })
}

describe('POST /api/csp-report', () => {
  it('returns 204 with an empty body', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const res = await POST(cspRequest(cspBody))
      expect(res.status).toBe(204)
      expect(await res.text()).toBe('')
    } finally {
      warn.mockRestore()
    }
  })

  it('returns 204 (never 500) on malformed JSON', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const res = await POST(cspRequest('{not json'))
      expect(res.status).toBe(204)
      expect(await res.text()).toBe('')
    } finally {
      error.mockRestore()
    }
  })
})

describe('GET /api/csp-report', () => {
  it('returns 204 with an empty body', async () => {
    const res = await GET()
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
  })
})
