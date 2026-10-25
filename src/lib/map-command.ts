import {
  COUNTRY_COORDS,
  countryNameFromIso,
} from '@/data/countryCoords'
import {
  collectToolCommands,
  type ToolCommandEnvelope,
  type ToolCommandMessageLike,
} from './ui-command'

/**
 * Contrato del control Chat-to-UI del mapa de ciberataques.
 *
 * El copilot no "describe" el mapa: lo controla. La tool del servidor valida
 * el comando (`controlMapView`), el chat lo entrega al navegador y el mapa lo
 * aplica. Los tres lados comparten este módulo para que el contrato no se
 * duplique y para que un país inexistente nunca se convierta en un filtro
 * inventado.
 */

/** Evento de ventana con el que el chat manda órdenes al mapa. */
export const MAP_COMMAND_EVENT = 'ask-ai:map-command'

/** Nombre de la tool que el modelo invoca. */
export const MAP_CONTROL_TOOL_NAME = 'controlMapView'

export type MapCommand =
  | { action: 'focus-country'; country: string }
  | { action: 'clear-filter' }

/** Valida en runtime un comando recibido por evento o por tool output. */
export function isMapCommand(value: unknown): value is MapCommand {
  if (!value || typeof value !== 'object') return false
  const action = (value as { action?: unknown }).action
  if (action === 'clear-filter') return true
  if (action !== 'focus-country') return false
  const country = (value as { country?: unknown }).country
  return typeof country === 'string' && country.trim().length > 0
}

/** Normaliza un nombre de país para compararlo sin acentos ni mayúsculas. */
function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    // Marcas diacríticas separadas por NFD: "méxico" → "mexico".
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Resuelve el país que el modelo nombró al nombre canónico del dataset del
 * mapa (el inglés que usa `COUNTRY_COORDS`). Acepta el nombre en inglés
 * (sin distinguir mayúsculas/acentos) o el código ISO de dos letras.
 *
 * Devuelve `undefined` si el país no está en la tabla: el mapa no puede
 * enfocar un origen que no conoce, y este sitio no inventa coordenadas.
 */
export function resolveMapCountry(input: string | undefined): string | undefined {
  if (!input) return undefined
  const raw = input.trim()
  if (!raw) return undefined

  if (/^[A-Za-z]{2}$/.test(raw)) {
    const fromIso = countryNameFromIso(raw)
    if (fromIso && COUNTRY_COORDS[fromIso]) return fromIso
  }

  const target = normalizeName(raw)
  for (const name of Object.keys(COUNTRY_COORDS)) {
    if (normalizeName(name) === target) return name
  }
  return undefined
}

/** Forma mínima de un mensaje del chat (misma que el extractor genérico). */
export type MapCommandMessageLike = ToolCommandMessageLike

export type MapCommandEnvelope = ToolCommandEnvelope<MapCommand>

/**
 * Extrae los comandos de mapa ya ejecutados por la tool en una conversación.
 * La lectura real vive en `ui-command.ts`, compartida con el canal del SIEM.
 */
export function collectMapCommands(
  messages: ReadonlyArray<MapCommandMessageLike>,
): MapCommandEnvelope[] {
  return collectToolCommands(messages, {
    toolName: MAP_CONTROL_TOOL_NAME,
    isCommand: isMapCommand,
  })
}
