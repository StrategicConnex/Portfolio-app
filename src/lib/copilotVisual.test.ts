import { describe, it, expect, vi } from 'vitest'
import { publishCopilotStatus, getCopilotStatus, subscribeCopilotStatus } from './copilotVisual'

describe('copilotVisual event bus (Fase 7 — observa, nunca controla)', () => {
  it('defaults to idle', () => {
    expect(getCopilotStatus()).toBe('idle')
  })

  it('notifies subscribers only when the status changes', () => {
    const listener = vi.fn()
    const unsub = subscribeCopilotStatus(listener)

    publishCopilotStatus('streaming')
    expect(getCopilotStatus()).toBe('streaming')
    expect(listener).toHaveBeenCalledTimes(1)

    // Idempotente: mismo estado no notifica (evita re-renders 3D innecesarios)
    publishCopilotStatus('streaming')
    expect(listener).toHaveBeenCalledTimes(1)

    publishCopilotStatus('error')
    expect(listener).toHaveBeenCalledTimes(2)
    unsub()
  })

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn()
    const unsub = subscribeCopilotStatus(listener)
    unsub()
    publishCopilotStatus('complete')
    expect(listener).not.toHaveBeenCalled()
  })
})
