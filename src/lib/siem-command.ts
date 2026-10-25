import type { SIEMLevel } from '@/lib/siem-feed'
import {
  collectToolCommands,
  type ToolCommandEnvelope,
  type ToolCommandMessageLike,
} from './ui-command'

/**
 * Contrato del control Chat-to-UI del panel SIEM.
 *
 * El copilot puede filtrar el stream de eventos por severidad —el caso típico
 * es «filtra el SIEM por amenazas críticas»— y quitar el filtro. Igual que en
 * el mapa, la tool del servidor valida el nivel contra los niveles reales del
 * feed y solo entonces se emite un comando. El panel conserva sus conteos
 * globales: el filtro afecta a la ventana de eventos, no a las métricas.
 */

/** Evento de ventana con el que el chat manda órdenes al panel SIEM. */
export const SIEM_COMMAND_EVENT = 'ask-ai:siem-command'

/** Nombre de la tool que el modelo invoca. */
export const SIEM_CONTROL_TOOL_NAME = 'controlSiemView'

/** Niveles reales del feed, en el orden en que se muestran. */
export const SIEM_COMMAND_LEVELS = [
  'CRITICAL',
  'ALERT',
  'WARN',
  'INFO',
] as const satisfies readonly SIEMLevel[]

export type SiemCommandLevel = (typeof SIEM_COMMAND_LEVELS)[number]

export type SiemCommand =
  | { action: 'filter-severity'; level: SiemCommandLevel }
  | { action: 'clear-filter' }

/** Valida en runtime un comando recibido por evento o por tool output. */
export function isSiemCommand(value: unknown): value is SiemCommand {
  if (!value || typeof value !== 'object') return false
  const action = (value as { action?: unknown }).action
  if (action === 'clear-filter') return true
  if (action !== 'filter-severity') return false
  const level = (value as { level?: unknown }).level
  return (
    typeof level === 'string' &&
    (SIEM_COMMAND_LEVELS as readonly string[]).includes(level)
  )
}

/** Forma mínima de un mensaje del chat (misma que el extractor genérico). */
export type SiemCommandMessageLike = ToolCommandMessageLike

export type SiemCommandEnvelope = ToolCommandEnvelope<SiemCommand>

/**
 * Extrae los comandos del SIEM ya ejecutados por la tool en una conversación.
 * La lectura real vive en `ui-command.ts`, compartida con el canal del mapa.
 */
export function collectSiemCommands(
  messages: ReadonlyArray<SiemCommandMessageLike>,
): SiemCommandEnvelope[] {
  return collectToolCommands(messages, {
    toolName: SIEM_CONTROL_TOOL_NAME,
    isCommand: isSiemCommand,
  })
}
