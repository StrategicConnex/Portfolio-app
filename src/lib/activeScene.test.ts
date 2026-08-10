import { describe, it, expect, vi } from 'vitest'
import { setActiveScene, getActiveScene, subscribeActiveScene } from './activeScene'

describe('activeScene store (SPEC §13)', () => {
  it('defaults to scene 0', () => {
    expect(getActiveScene()).toBe(0)
  })

  it('notifies subscribers only when the value changes', () => {
    const listener = vi.fn()
    const unsub = subscribeActiveScene(listener)

    setActiveScene(2)
    expect(getActiveScene()).toBe(2)
    expect(listener).toHaveBeenCalledTimes(1)

    // Idempotente: mismo valor no notifica (evita re-renders en el frame loop)
    setActiveScene(2)
    expect(listener).toHaveBeenCalledTimes(1)

    setActiveScene(0)
    expect(listener).toHaveBeenCalledTimes(2)
    unsub()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsub = subscribeActiveScene(listener)
    unsub()
    setActiveScene(4)
    expect(listener).not.toHaveBeenCalled()
  })
})
