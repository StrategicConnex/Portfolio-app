'use client'

import { useSyncExternalStore } from 'react'

/**
 * Escena activa (0-4) compartida entre el bucle de cámara y los HUDs (SPEC §13).
 * Store a nivel de módulo: el frame loop escribe un número (sin estado React),
 * y `HudLabel` re-renderiza solo cuando la escena cambia (useSyncExternalStore).
 * Mismo patrón que `useWebGLContextManager` (listeners a nivel de módulo).
 */

let activeScene = 0
const listeners = new Set<() => void>()

/** Escritura desde el frame loop - idempotente, sin notificación si no cambia. */
export function setActiveScene(index: number): void {
  if (index === activeScene) return
  activeScene = index
  for (const l of listeners) l()
}

export function getActiveScene(): number {
  return activeScene
}

export function subscribeActiveScene(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Hook para componentes React (HUDs): re-render solo al cruzar de escena. */
export function useActiveScene(): number {
  return useSyncExternalStore(subscribeActiveScene, getActiveScene)
}
