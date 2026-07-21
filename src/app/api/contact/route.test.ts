import { describe, it, expect } from 'vitest'
import { escapeHtml, buildEmailHtml, contactSchema } from './route'

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })
  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })
  it('should escape double quotes', () => {
    expect(escapeHtml('he said "hello"')).toBe('he said &quot;hello&quot;')
  })
  it('should return empty for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })
  it('should not modify safe text', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })
})

describe('contactSchema validation', () => {
  it('should accept valid contact data', () => {
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      company: 'ACME Corp',
      type: 'contact.type.audit',
      message: 'Hello',
    })
    expect(result.success).toBe(true)
  })
  it('should accept minimal valid data', () => {
    const result = contactSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBe('')
      expect(result.data.type).toBe('')
    }
  })
  it('should reject empty name', () => {
    const r = contactSchema.safeParse({ name: '', email: 'john@example.com', message: 'Hi' })
    expect(r.success).toBe(false)
  })
  it('should reject invalid email', () => {
    const r = contactSchema.safeParse({ name: 'John', email: 'not-email', message: 'Hi' })
    expect(r.success).toBe(false)
  })
  it('should reject empty message', () => {
    const r = contactSchema.safeParse({ name: 'John', email: 'john@example.com', message: '' })
    expect(r.success).toBe(false)
  })
  it('should reject name exceeding 100 chars', () => {
    const r = contactSchema.safeParse({ name: 'A'.repeat(101), email: 'john@example.com', message: 'Hi' })
    expect(r.success).toBe(false)
  })
  it('should reject message exceeding 2000 chars', () => {
    const r = contactSchema.safeParse({ name: 'John', email: 'john@example.com', message: 'A'.repeat(2001) })
    expect(r.success).toBe(false)
  })
  it('should reject email exceeding 150 chars', () => {
    const r = contactSchema.safeParse({ name: 'John', email: 'a'.repeat(151) + '@b.com', message: 'Hi' })
    expect(r.success).toBe(false)
  })
})

describe('buildEmailHtml', () => {
  const base = {
    name: 'Juan Pérez',
    email: 'juan@test.com',
    company: '',
    type: '',
    message: 'Consulta sobre ciberseguridad OT',
  }

  it('should include the name, email and message in the HTML', () => {
    const html = buildEmailHtml(base)
    expect(html).toContain('Juan Pérez')
    expect(html).toContain('juan@test.com')
    expect(html).toContain('Consulta sobre ciberseguridad OT')
  })

  it('should include company section when provided', () => {
    const html = buildEmailHtml({ ...base, company: 'YPF' })
    expect(html).toContain('YPF')
  })

  it('should NOT include company section when not provided', () => {
    const html = buildEmailHtml(base)
    expect(html).not.toContain('Empresa / Organización')
  })

  it('should include type section when provided', () => {
    const html = buildEmailHtml({ ...base, type: 'contact.type.audit' })
    expect(html).toContain('Tipo de Proyecto')
    expect(html).toContain('Audit')
  })

  it('should NOT include type section when not provided', () => {
    const html = buildEmailHtml(base)
    expect(html).not.toContain('Tipo de Proyecto')
  })

  it('should escape XSS in name', () => {
    const html = buildEmailHtml({ ...base, name: '<script>alert("xss")</script>' })
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('should escape XSS in message by encoding angle brackets', () => {
    const html = buildEmailHtml({ ...base, message: '<img src=x onerror=alert(1)>' })
    expect(html).toContain('&lt;img')
    expect(html).not.toContain('<img')
    expect(html).toContain('&gt;')
  })

  it('should produce a complete HTML document structure', () => {
    const html = buildEmailHtml({ ...base, company: 'Empresa SRL', type: 'contact.type.arch' })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('<head>')
    expect(html).toContain('<body>')
  })

  it('should format type label from translation key', () => {
    const html = buildEmailHtml({ ...base, type: 'contact.type.siem' })
    expect(html).toContain('Siem')
  })

  it('should include footer with location', () => {
    const html = buildEmailHtml(base)
    expect(html).toContain('Neuquén')
    expect(html).toContain('Argentina')
  })
})
