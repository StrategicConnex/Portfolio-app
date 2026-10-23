import { describe, expect, it } from 'vitest'
import { checkSsl } from '../ssl-checker'

describe('checkSsl — SSRF guards', () => {
  it('rejects hostnames that are not valid domains', async () => {
    const result = await checkSsl({ hostname: 'not a hostname' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid hostname/)
  })

  it('rejects blocked internal hostnames without resolving DNS', async () => {
    const result = await checkSsl({ hostname: 'localhost.localdomain' })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Blocked hostname/)
  })

  it('rejects ports other than 443/8443', async () => {
    const result = await checkSsl({ hostname: 'example.com', port: 22 })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/not allowed/)
  })

  it.each([
    '127.0.0.1',
    '10.0.0.5',
    '192.168.1.10',
    '169.254.169.254',
    '100.64.0.1',
    '::1',
    'fd00::1',
    'fe80::1',
  ])('rejects a domain resolving to private space (%s)', async (address) => {
    const result = await checkSsl(
      { hostname: 'internal.example.com' },
      { resolve: async () => [address] },
    )
    expect(result.valid).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('fails closed when DNS returns no addresses', async () => {
    const result = await checkSsl(
      { hostname: 'example.com' },
      { resolve: async () => [] },
    )
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/DNS resolution failed/)
  })
})
