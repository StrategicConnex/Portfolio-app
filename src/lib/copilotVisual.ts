'use client'

import { useSyncExternalStore } from 'react'

/**
 * Event bus visual del Copilot (SPEC §14 / IMPLEMENTATION_PLAN Fase 7):
 * el 3D OBSERVA el estado del Copilot; nunca lo controla.
 *
 * `AskAIPanel` publica el estado derivado (read-only, efecto aditivo) y los
 * componentes 3D (CopilotNode) reaccionan con pulso/color. Mismo patrón de
 * store a nivel de módulo que `activeScene` / `useWebGLContextManager`.
 */

export type CopilotVisualStatus = 'idle' | 'thinking' | 'streaming' | 'error' | 'complete'

let status: CopilotVisualStatus = 'idle'
const listeners = new Set<() => void>()

/** Publicación desde AskAIPanel — idempotente, notifica solo si cambia. */
export function publishCopilotStatus(next: CopilotVisualStatus): void {
  if (next === status) return
  status = next
  for (const l of listeners) l()
}

export function getCopilotStatus(): CopilotVisualStatus {
  return status
}

export function subscribeCopilotStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Hook para componentes 3D: re-render solo cuando cambia el estado del Copilot. */
export function useCopilotVisualState(): CopilotVisualStatus {
  return useSyncExternalStore(subscribeCopilotStatus, getCopilotStatus)
}
