import { describe, it, expect, vi } from 'vitest'
import { cachedData } from './next-cache'

/**
 * `unstable_cache` solo tiene caché de datos dentro de un contexto de petición
 * de Next. En vitest no existe ese contexto, así que estos tests ejercitan la
 * ruta de reserva: el cálculo se ejecuta y se devuelve igual, pero sin repetir
 * trabajo caro ni tragarse errores reales.
 */
describe('cachedData', () => {
  it('returns the computed value when there is no Next request context', async () => {
    const fn = vi.fn(async () => ({ ok: true }))
    const cached = cachedData(fn, 'probe:valor', { revalidate: 60 })

    await expect(cached()).resolves.toEqual({ ok: true })
  })

  it('runs the expensive function only once per call when the cache is unavailable', async () => {
    const fn = vi.fn(async () => 'valor')
    const cached = cachedData(fn, 'probe:una-vez')

    await cached()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('propagates real errors instead of swallowing them', async () => {
    const fn = vi.fn(async () => {
      throw new Error('boom')
    })
    const cached = cachedData(fn, 'probe:error')

    await expect(cached()).rejects.toThrow('boom')
  })
})
