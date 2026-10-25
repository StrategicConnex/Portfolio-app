import { z } from 'zod'
import { resolveMapCountry, type MapCommand } from '@/lib/map-command'
import { getThreatIntelSnapshot } from '@/features/threat-intel/server'

/**
 * `controlMapView` — Chat-to-UI del mapa de ciberataques.
 *
 * El copilot no solo describe el mapa: puede filtrarlo y girarlo. La tool
 * valida el pedido contra el dataset real de países y devuelve un comando
 * estructurado que el cliente entrega al mapa. Si el país no existe en el
 * dataset no se devuelve comando: el modelo debe decir la verdad en vez de
 * enfocar un origen inventado.
 *
 * El conteo de eventos sale del mismo snapshot real que alimenta el mapa
 * (`/api/threat-intel`), así la respuesta y lo que se ve en pantalla no se
 * contradicen. Ese snapshot es opcional: si falla, el comando se aplica
 * igual y el mapa calcula su propio conteo local.
 */

export const mapControlSchema = z.object({
  action: z
    .enum(['focus-country', 'clear-filter'])
    .describe('focus-country filters the map arcs to one origin country and rotates the globe to it; clear-filter removes the active filter'),
  country: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .optional()
    .describe('Origin country as the map dataset names it in English, e.g. "China", "Russia", "United States", "Brazil". Required for focus-country.'),
})

export type MapControlInput = z.infer<typeof mapControlSchema>

export interface MapControlResult {
  /** `true` solo si se devolvió un comando que la interfaz puede aplicar. */
  applied: boolean
  command?: MapCommand
  country?: string
  /** IPs reales del país en el feed actual (mismo snapshot que usa el mapa). */
  liveEventCount?: number
  dataSource?: 'live' | 'degraded'
  reason?: 'unknown-country' | 'missing-country'
  hint?: string
}

export async function controlMapView(input: MapControlInput): Promise<MapControlResult> {
  if (input.action === 'clear-filter') {
    return { applied: true, command: { action: 'clear-filter' } }
  }

  const requested = input.country?.trim()
  if (!requested) {
    return {
      applied: false,
      reason: 'missing-country',
      hint: 'focus-country needs the origin country. Ask the user which country to focus, or call clear-filter.',
    }
  }

  const country = resolveMapCountry(requested)
  if (!country) {
    return {
      applied: false,
      reason: 'unknown-country',
      country: requested,
      hint: 'This country is not in the map dataset, so the map cannot focus it. Use the English country name the map knows (e.g. China, Russia, United States, Brazil) and never invent coordinates or events.',
    }
  }

  try {
    const snapshot = await getThreatIntelSnapshot()
    // Mismo criterio que el mapa: solo cuentan eventos con IP real atribuible.
    const liveEventCount = snapshot.events.filter(
      (event) => Boolean(event.originIp) && event.originCountry === country,
    ).length

    return {
      applied: true,
      command: { action: 'focus-country', country },
      country,
      liveEventCount,
      dataSource: snapshot.dataSource,
    }
  } catch {
    // El feed no respondió: el comando sigue siendo válido; el mapa mostrará
    // su propio conteo (posiblemente 0) sin inventar datos.
    return {
      applied: true,
      command: { action: 'focus-country', country },
      country,
    }
  }
}

export interface MapControlTool {
  description: string
  inputSchema: typeof mapControlSchema
  execute: (
    input: z.input<typeof mapControlSchema>,
    options?: unknown,
  ) => Promise<MapControlResult>
}

export const mapControlTool: MapControlTool = {
  description:
    'Control the on-screen Cyber Attack Map (Chat-to-UI). Use it when the user asks to show, filter, focus or clear attacks from a specific origin country on the map — e.g. "show me attacks from China", "focus Russia", "clear the map filter". The command really changes the user\'s map: arcs are filtered to that origin and the globe rotates to it. The map loads lazily, so if the user is not looking at it, say the filter is set and will appear when they open the map. Only countries in the map dataset can be focused; when applied is false, tell the user honestly that the map has no data/coordinates for that origin — never invent one. Report liveEventCount as the number of real IPs from that origin in the current feed; if it is 0, say there are no live events from that origin right now.',
  inputSchema: mapControlSchema,
  execute: async (input) => controlMapView(input),
}
