import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWebGLContextManager, registerContext } from './useWebGLContextManager'

/**
 * Regresión (Fase 1 fix): identidades de función inestables en el retorno del
 * hook provocaban un bucle registerContext → emit → re-render → efecto.
 * Las funciones del manager deben ser estables entre renders.
 */
describe('useWebGLContextManager', () => {
  it('returns stable function identities across renders', () => {
    const { result, rerender } = renderHook(() => useWebGLContextManager())
    const first = result.current

    rerender()

    expect(result.current.setSuspended).toBe(first.setSuspended)
    expect(result.current.reportContextLost).toBe(first.reportContextLost)
    expect(result.current.resetContextLost).toBe(first.resetContextLost)
  })

  it('reports and resets context loss with a live context', () => {
    const { result } = renderHook(() => useWebGLContextManager())
    let unregister: (() => void) | null = null
    act(() => {
      unregister = registerContext()
    })

    act(() => result.current.reportContextLost())
    expect(result.current.contextLost).toBe(true)

    act(() => result.current.resetContextLost())
    expect(result.current.contextLost).toBe(false)

    act(() => unregister?.())
  })

  it('regression QA-8: ignores context-lost reported with zero active contexts (dispose noise)', () => {
    const { result } = renderHook(() => useWebGLContextManager())

    // Sin contextos registrados: un lost de dispose NO debe dejar el flag
    // seteado, o el poster queda atascado al re-montar tras reduce-motion OFF.
    act(() => result.current.reportContextLost())
    expect(result.current.contextLost).toBe(false)

    // Con un contexto registrado, el lost real sí activa el fallback.
    let unregister: (() => void) | null = null
    act(() => {
      unregister = registerContext()
    })
    act(() => result.current.reportContextLost())
    expect(result.current.contextLost).toBe(true)

    // Al liberar el contexto (dispose → unregister), el flag se resetea.
    act(() => unregister?.())
    expect(result.current.contextLost).toBe(false)
  })
})
