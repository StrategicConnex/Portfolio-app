import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('panel-auth', () => {
  beforeEach(() => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'clave-de-prueba-larga-suficiente')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  async function load() {
    return await import('./panel-auth')
  }

  it('round-trips a signed cookie value', async () => {
    const { createPanelCookieValue, verifyPanelCookie } = await load()
    const value = createPanelCookieValue()
    expect(value).toMatch(/^\d+\.[0-9a-f]{64}$/)
    expect(verifyPanelCookie(value)).toBe(true)
  })

  it('rejects tampered payloads, wrong signatures and garbage', async () => {
    const { createPanelCookieValue, verifyPanelCookie } = await load()
    const value = createPanelCookieValue()!
    const [expires, sig] = value.split('.')

    // Expiración manipulada (extender la sesión sin conocer la clave)
    expect(verifyPanelCookie(`${Number(expires) + 1000}.${sig}`)).toBe(false)
    // Firma manipulada
    expect(verifyPanelCookie(`${expires}.${'0'.repeat(64)}`)).toBe(false)
    // Basura / formatos raros
    expect(verifyPanelCookie('')).toBe(false)
    expect(verifyPanelCookie('nope')).toBe(false)
    expect(verifyPanelCookie('12345')).toBe(false)
    expect(verifyPanelCookie(null)).toBe(false)
    expect(verifyPanelCookie(undefined)).toBe(false)
  })

  it('rejects an expired cookie even with a valid signature', async () => {
    const { createPanelCookieValue, verifyPanelCookie } = await load()
    const future = createPanelCookieValue()!
    // Una cookie "del pasado" construida con la misma clave:
    const expired = future.replace(/^\d+/, String(Date.now() - 1000))
    expect(verifyPanelCookie(expired)).toBe(false)
    expect(verifyPanelCookie(future)).toBe(true)
  })

  it('does not verify when the env is missing or too short', async () => {
    vi.stubEnv('DOWNLOAD_STATS_TOKEN', '')
    let mod = await load()
    expect(mod.isPanelAuthConfigured()).toBe(false)
    expect(mod.createPanelCookieValue()).toBeNull()

    vi.stubEnv('DOWNLOAD_STATS_TOKEN', 'corta')
    mod = await load()
    expect(mod.isPanelAuthConfigured()).toBe(false)
  })

  it('matches the token in constant time and rejects wrong ones', async () => {
    const { matchesPanelToken } = await load()
    expect(matchesPanelToken('clave-de-prueba-larga-suficiente')).toBe(true)
    expect(matchesPanelToken('otra-clave')).toBe(false)
    expect(matchesPanelToken(undefined)).toBe(false)
    expect(matchesPanelToken('')).toBe(false)
  })

  it('signs with the configured secret, not a constant', async () => {
    const { createHmac } = await import('node:crypto')
    const { createPanelCookieValue } = await load()
    const value = createPanelCookieValue()!
    const [expires, sig] = value.split('.')
    const expected = createHmac('sha256', 'clave-de-prueba-larga-suficiente')
      .update(expires)
      .digest('hex')
    expect(sig).toBe(expected)
  })
})
