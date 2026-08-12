/**
 * Nodos focales por sección DOM (audit CREATIVE-AUDIT §5, gap G2):
 * sección activa → ancla 3D iluminada. Data-driven, sin `if section === …`
 * dispersos (SPEC §20): cada entrada declara el ancla en el mundo 3D, la
 * escena a la que pertenece y la clave i18n del label diegético.
 *
 * Los anchors referencian objetos REALES del layout (`datacenter.layout.ts`):
 * racks del corredor, holograma Purdue, storage de S4, nodo central. La baliza
 * flota ~0.7-1.2u sobre el objeto (lenguaje del `CopilotNode` en [0,3.05,-2.4]).
 * Color = temperatura de la escena (DATACENTER_TOKENS: BLUE → CYAN → AMBER → GOLD).
 */

import { DATACENTER_TOKENS } from './datacenter.tokens'

export type FocusNodeConfig = {
  sectionId: string
  sceneIndex: number
  position: [number, number, number]
  color: string
  labelKey: string
  /** De dónde sale la posición — para mantener el mapa honesto y rastreable. */
  anchorNote: string
}

const { secondaryBlue, dataCyan, securityAmber, gold } = DATACENTER_TOKENS.colors

export const FOCUS_NODES: FocusNodeConfig[] = [
  // S1 · Boot — rack hero (HERO_RACK, top y=2.4)
  { sectionId: 'home', sceneIndex: 0, position: [0, 3.1, 0], color: secondaryBlue, labelKey: 'dc.focus.home', anchorNote: 'sobre el rack hero (HERO_RACK top 2.4)' },
  // S2 · Core — holograma Purdue ([0,3.4,-2.2]) y corredor simétrico
  { sectionId: 'perfil', sceneIndex: 1, position: [0, 4.6, -2.2], color: secondaryBlue, labelKey: 'dc.focus.perfil', anchorNote: 'sobre PurdueHologram ([0,3.4,-2.2])' },
  { sectionId: 'arquitectura', sceneIndex: 1, position: [0, 6.2, -1.5], color: secondaryBlue, labelKey: 'dc.focus.arquitectura', anchorNote: 'eje del corredor bajo el título HUD ([0,5.4,-1.5])' },
  { sectionId: 'stack', sceneIndex: 1, position: [2.6, 3.2, -2.5], color: secondaryBlue, labelKey: 'dc.focus.stack', anchorNote: 'rack del corredor derecho (CORRIDOR_RACKS[0])' },
  { sectionId: 'confianza', sceneIndex: 1, position: [-2.6, 3.2, -2.5], color: secondaryBlue, labelKey: 'dc.focus.confianza', anchorNote: 'rack del corredor izquierdo (CORRIDOR_RACKS[1])' },
  // S3 · Data in Motion — origen de streams y nodos de red
  { sectionId: 'experiencia', sceneIndex: 2, position: [-2.6, 3.1, -2.5], color: dataCyan, labelKey: 'dc.focus.experiencia', anchorNote: 'origen de streams (STREAM_PATHS[0] en [-2.6,1.7,-2.5])' },
  { sectionId: 'proyecto', sceneIndex: 2, position: [2.6, 3.1, -6.9], color: dataCyan, labelKey: 'dc.focus.proyecto', anchorNote: 'rack profundo derecho (CORRIDOR_RACKS z=-6.9)' },
  { sectionId: 'certificaciones', sceneIndex: 2, position: [0, 3.7, -4.7], color: dataCyan, labelKey: 'dc.focus.certificaciones', anchorNote: 'nodo de red entre filas (corredor z=-4.7)' },
  { sectionId: 'siem', sceneIndex: 2, position: [0, 2.3, -2.2], color: dataCyan, labelKey: 'dc.focus.siem', anchorNote: 'nodo de seguridad — slot display SIEM S3 (ASSET-SCENE-MAP §5)' },
  // S4 · Resilience — storage protagonista y backup units (BACKUP_UNITS)
  { sectionId: 'audit-hub', sceneIndex: 3, position: [0, -1.1, -4.0], color: securityAmber, labelKey: 'dc.focus.audit-hub', anchorNote: 'sobre el storage protagonista (BACKUP_UNITS[0], top y=-1.9)' },
  { sectionId: 'scaudit', sceneIndex: 3, position: [3.2, -1.1, -6.0], color: securityAmber, labelKey: 'dc.focus.scaudit', anchorNote: 'sobre la backup unit 2 (BACKUP_UNITS[1])' },
  { sectionId: 'blog', sceneIndex: 3, position: [-3.2, -1.1, -6.0], color: securityAmber, labelKey: 'dc.focus.blog', anchorNote: 'sobre la backup unit 3 (BACKUP_UNITS[2])' },
  // S5 · Connection — nodo central (pull-back final)
  { sectionId: 'contacto', sceneIndex: 4, position: [0, 3.6, -3.0], color: gold, labelKey: 'dc.focus.contacto', anchorNote: 'sobre el nodo central (CopilotNode [0,3.05,-2.4]), visible en el pull-back' },
]

/** Resuelve el nodo focal de una sección DOM (null si no está mapeada). */
export function getFocusNodeForSection(sectionId: string): FocusNodeConfig | null {
  return FOCUS_NODES.find((n) => n.sectionId === sectionId) ?? null
}
