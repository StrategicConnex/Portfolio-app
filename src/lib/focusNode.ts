'use client'

import { useSyncExternalStore } from 'react'

/**
 * Event bus DOM→3D de nodo focal (audit CREATIVE-AUDIT §5, gap G2):
 * el DOM publica la sección activa (id real del `<section>`), y el 3D
 * (`FocusNodeLayer`) la ilumina con una baliza en su ancla.
 *
 * El DOM es la fuente de verdad; el 3D solo OBSERVA — mismo patrón de store
 * a nivel de módulo que `copilotVisual` / `activeScene` (idempotente, notifica
 * solo al cambiar). No toca lógica de secciones ni del Copilot (CONSTITUTION
 * R4): el emisor es `DatacenterCamera` (que ya calcula la sección activa con
 * `useSectionProgress`), con 3 líneas.
 */

let sectionId: string | null = null
const listeners = new Set<() => void>()

/** Publicación desde DatacenterCamera — idempotente, notifica solo si cambia. */
export function publishFocusSection(next: string | null): void {
  if (next === sectionId) return
  sectionId = next
  for (const l of listeners) l()
}

export function getFocusSection(): string | null {
  return sectionId
}

export function subscribeFocusSection(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Hook para el componente 3D: re-render solo cuando cambia la sección activa. */
export function useFocusSection(): string | null {
  return useSyncExternalStore(subscribeFocusSection, getFocusSection)
}
