import { describe, it, expect, vi, afterEach } from 'vitest'
import { publishFocusSection, getFocusSection, subscribeFocusSection } from './focusNode'

describe('focusNode — event bus DOM→3D de nodo focal (audit G2)', () => {
  afterEach(() => {
    publishFocusSection(null) // reset del store entre tests
    vi.restoreAllMocks()
  })

  it('empieza en null (sin sección activa)', () => {
    expect(getFocusSection()).toBeNull()
  })

  it('notifica a los suscriptores solo cuando la sección cambia', () => {
    const listener = vi.fn()
    const unsub = subscribeFocusSection(listener)
    publishFocusSection('perfil')
    expect(listener).toHaveBeenCalledTimes(1)
    // idempotente: misma sección → sin notificación
    publishFocusSection('perfil')
    expect(listener).toHaveBeenCalledTimes(1)
    publishFocusSection('siem')
    expect(listener).toHaveBeenCalledTimes(2)
    unsub()
  })

  it('deja de notificar tras unsubscribe', () => {
    const listener = vi.fn()
    const unsub = subscribeFocusSection(listener)
    publishFocusSection('home')
    expect(listener).toHaveBeenCalledTimes(1)
    unsub()
    publishFocusSection('contacto')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('acepta null (ninguna sección activa) y vuelve a notificar al reactivar', () => {
    const listener = vi.fn()
    subscribeFocusSection(listener)
    publishFocusSection('perfil')
    publishFocusSection(null)
    expect(listener).toHaveBeenCalledTimes(2)
    publishFocusSection('perfil')
    expect(listener).toHaveBeenCalledTimes(3)
    expect(getFocusSection()).toBe('perfil')
  })
})
