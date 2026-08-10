'use client'

import { useCallback, useEffect, useState } from 'react'

type Listener = () => void

// Estado a nivel de módulo: un único registry para toda la app (ADR-003 §1).
let activeContexts = 0
let suspended = false
let contextLost = false
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l())
}

/** Registra un contexto WebGL; devuelve el unregister. */
export function registerContext(): () => void {
  activeContexts += 1
  // Un contexto nuevo es un estado limpio: el flag de context-lost solo tiene
  // sentido mientras existe un contexto vivo. Fix: el poster quedaba atascado
  // tras desmontar/re-montar el canvas (el lost disparado por el dispose del
  // renderer anterior dejaba contextLost=true para siempre).
  contextLost = false
  emit()
  return () => {
    activeContexts = Math.max(0, activeContexts - 1)
    if (activeContexts === 0) contextLost = false
    emit()
  }
}

export type WebGLContextManager = {
  activeContexts: number
  suspended: boolean
  contextLost: boolean
  setSuspended: (value: boolean) => void
  reportContextLost: () => void
  resetContextLost: () => void
}

/**
 * Política "un solo contexto WebGL activo" (ADR-003):
 * máximo 2 montados (datacenter + modal case study), nunca 2 renderizando.
 * `suspended` permite pausar el render del datacenter cuando otro contexto
 * (ej. modal) está activo. `webglcontextlost` ⇒ la app cae a StaticPoster.
 */
export function useWebGLContextManager(): WebGLContextManager {
  const [, force] = useState(0)

  useEffect(() => {
    const l: Listener = () => force((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])

  // Funciones estables: los consumidores las usan como deps de efectos
  // (DatacenterCanvas). Identidades inestables provocaban un bucle
  // registerContext → emit → re-render → efecto → registerContext.
  const setSuspended = useCallback((value: boolean) => {
    suspended = value
    emit()
  }, [])

  const reportContextLost = useCallback(() => {
    // Un lost disparado por el dispose de un renderer (0 contextos registrados)
    // es ruido: el flag solo tiene sentido con un contexto vivo. Ignorarlo
    // evita que el poster quede atascado al re-montar (QA Fase 8).
    if (activeContexts === 0) return
    contextLost = true
    emit()
  }, [])

  const resetContextLost = useCallback(() => {
    contextLost = false
    emit()
  }, [])

  return {
    activeContexts,
    suspended,
    contextLost,
    setSuspended,
    reportContextLost,
    resetContextLost,
  }
}
