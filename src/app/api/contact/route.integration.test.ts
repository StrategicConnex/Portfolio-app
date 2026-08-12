import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'

import { resetRateLimit } from '@/lib/rate-limit-upstash'

const mockEmailsSend = vi.fn()
function ResendMock() {
  return { emails: { send: mockEmailsSend } }
}

vi.mock('resend', () => ({
  Resend: vi.fn(ResendMock),
}))

let POST: typeof import('./route').POST
beforeAll(async () => { POST = (await import('./route')).POST })

beforeEach(() => {
  // Force the in-memory fallback so the test is hermetic (no real Redis calls)
  delete process.env.UPSTASH_REDIS_REST_URL
  delete process.env.UPSTASH_REDIS_REST_TOKEN
  resetRateLimit()
})

function mockRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/contact integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_test_key_123'
    process.env.CONTACT_TO_EMAIL = 'juan@palacios.com'
    process.env.CONTACT_FROM_EMAIL = 'portfolio@juanpalacios.vercel.app'
  })

  describe('successful email sending', () => {
    it('should return 200 with success when all fields are valid', async () => {
      mockEmailsSend.mockResolvedValueOnce({ data: { id: 'email_abc' }, error: null })
      const res = await POST(mockRequest({
        name: 'Carlos', email: 'c@e.com', company: 'YPF',
        type: 'contact.type.audit', message: 'Auditoria OT',
      }))
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.success).toBe(true)
      expect(body.id).toBe('email_abc')
    })

    it('should call Resend with correct parameters', async () => {
      mockEmailsSend.mockResolvedValueOnce({ data: { id: 'xyz' }, error: null })
      await POST(mockRequest({
        name: 'Maria', email: 'maria@t.com', company: 'PAE',
        type: 'contact.type.siem', message: 'SIEM inquiry',
      }))
      const args = mockEmailsSend.mock.calls[0][0]
      expect(args.from).toBe('portfolio@juanpalacios.vercel.app')
      expect(args.to).toEqual(['juan@palacios.com'])
      expect(args.replyTo).toBe('maria@t.com')
      expect(args.subject).toContain('Maria')
      expect(args.subject).toContain('PAE')
      expect(args.html).toContain('Maria')
      expect(args.html).toContain('maria@t.com')
      expect(args.html).toContain('PAE')
      expect(args.html).toContain('SIEM inquiry')
    })

    it('should handle optional fields (no company, no type)', async () => {
      mockEmailsSend.mockResolvedValueOnce({ data: { id: 'm' }, error: null })
      await POST(mockRequest({
        name: 'Juan Simple', email: 'simple@example.com', message: 'Hola',
      }))
      const args = mockEmailsSend.mock.calls[0][0]
      expect(args.subject).toContain('Sin empresa')
      expect(args.html).not.toContain('Tipo de Proyecto')
    })
  })

  describe('validation errors', () => {
    it('should return 400 when name is empty', async () => {
      const res = await POST(mockRequest({ name: '', email: 't@t.com', message: 'Hi' }))
      expect(res.status).toBe(400)
      expect(mockEmailsSend).not.toHaveBeenCalled()
    })

    it('should return 400 when email is invalid', async () => {
      const res = await POST(mockRequest({ name: 'John', email: 'bad', message: 'Hi' }))
      expect(res.status).toBe(400)
    })

    it('should return 400 when message is empty', async () => {
      const res = await POST(mockRequest({ name: 'John', email: 'j@t.com', message: '' }))
      expect(res.status).toBe(400)
    })

    it('should return 400 with details when fields are missing', async () => {
      const res = await POST(mockRequest({}))
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.details).toBeDefined()
    })
  })

  describe('env config errors', () => {
    it('should return 500 when RESEND_API_KEY is missing', async () => {
      delete process.env.RESEND_API_KEY
      const res = await POST(mockRequest({ name: 'J', email: 'j@t.com', message: 'T' }))
      expect(res.status).toBe(500)
      expect(mockEmailsSend).not.toHaveBeenCalled()
    })

    it('should return 500 when CONTACT_TO_EMAIL is missing', async () => {
      delete process.env.CONTACT_TO_EMAIL
      const res = await POST(mockRequest({ name: 'J', email: 'j@t.com', message: 'T' }))
      expect(res.status).toBe(500)
    })

    it('should return 500 when CONTACT_FROM_EMAIL is missing', async () => {
      delete process.env.CONTACT_FROM_EMAIL
      const res = await POST(mockRequest({ name: 'J', email: 'j@t.com', message: 'T' }))
      expect(res.status).toBe(500)
    })
  })

  describe('Resend API errors', () => {
    it('should return 500 when Resend returns an error', async () => {
      mockEmailsSend.mockResolvedValueOnce({ data: null, error: { name: 'err', message: 'Err' } })
      const res = await POST(mockRequest({ name: 'J', email: 'j@t.com', message: 'T' }))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('Error al enviar el email')
    })

    it('should return 500 when Resend throws', async () => {
      mockEmailsSend.mockRejectedValueOnce(new Error('Network failure'))
      const res = await POST(mockRequest({ name: 'J', email: 'j@t.com', message: 'T' }))
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error).toBe('Error interno del servidor')
    })
  })
})
