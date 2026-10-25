import { z } from 'zod'
import { getSiemFeedData, type SiemFeedPayload } from '@/lib/siem-feed'
import {
  SIEM_COMMAND_LEVELS,
  type SiemCommand,
  type SiemCommandLevel,
} from '@/lib/siem-command'

/**
 * `controlSiemView` — Chat-to-UI del panel SIEM.
 *
 * El copilot filtra el stream de eventos reales por severidad o quita el
 * filtro. El nivel se valida contra los niveles que el feed publica
 * (`CRITICAL`, `ALERT`, `WARN`, `INFO`) y el conteo sale del mismo payload
 * que consume el panel, para que la respuesta y lo que se ve en pantalla no
 * se contradigan.
 *
 * El panel siempre muestra inteligencia global real (Abuse.ch Feodo +
 * DShield/SANS ISC): la tool lo recuerda para que el modelo no lo llame
 * simulación.
 */

const SUMMARY_KEY = {
  CRITICAL: 'critical',
  ALERT: 'alert',
  WARN: 'warn',
  INFO: 'info',
} as const satisfies Record<SiemCommandLevel, keyof SiemFeedPayload['summary']>

export const siemControlSchema = z.object({
  action: z
    .enum(['filter-severity', 'clear-filter'])
    .describe('filter-severity filters the SIEM event stream to one severity; clear-filter removes the active filter'),
  level: z
    .enum(SIEM_COMMAND_LEVELS)
    .optional()
    .describe('Severity to filter by. Required for filter-severity.'),
})

export type SiemControlInput = z.infer<typeof siemControlSchema>

export interface SiemControlResult {
  /** `true` solo si se devolvió un comando que el panel puede aplicar. */
  applied: boolean
  command?: SiemCommand
  level?: SiemCommandLevel
  /** Eventos de ese nivel en el payload real actual (misma ventana del panel). */
  eventCount?: number
  usingLiveData?: boolean
  feedsStatus?: SiemFeedPayload['feedsStatus']
  reason?: 'missing-level'
  hint?: string
}

export async function controlSiemView(
  input: SiemControlInput,
): Promise<SiemControlResult> {
  if (input.action === 'clear-filter') {
    return { applied: true, command: { action: 'clear-filter' } }
  }

  const level = input.level
  if (!level) {
    return {
      applied: false,
      reason: 'missing-level',
      hint: 'filter-severity needs one of CRITICAL, ALERT, WARN or INFO. Ask the user which severity to filter, or call clear-filter.',
    }
  }

  try {
    const data = await getSiemFeedData()
    return {
      applied: true,
      command: { action: 'filter-severity', level },
      level,
      eventCount: data.summary[SUMMARY_KEY[level]],
      usingLiveData: data.usingLiveData,
      feedsStatus: data.feedsStatus,
    }
  } catch {
    // El feed no respondió: el filtro se aplica igual y el panel mostrará su
    // propia ventana (posiblemente vacía) sin inventar eventos.
    return {
      applied: true,
      command: { action: 'filter-severity', level },
      level,
    }
  }
}

export interface SiemControlTool {
  description: string
  inputSchema: typeof siemControlSchema
  execute: (
    input: z.input<typeof siemControlSchema>,
    options?: unknown,
  ) => Promise<SiemControlResult>
}

export const siemControlTool: SiemControlTool = {
  description:
    'Control the on-screen SIEM dashboard (Chat-to-UI). Use it when the user asks to filter the SIEM event stream by severity — e.g. "filter the SIEM by critical threats", "show only alerts" — or to clear that filter. This really filters the dashboard the user sees (it may be below the fold: if they are not looking at it, say the filter is set). Report eventCount as the number of real events of that severity in the current feed; if it is 0, say there are no events of that severity right now. The SIEM shows real global provider intelligence (Abuse.ch Feodo + DShield/SANS ISC), never the user\'s private-network logs, and it is not a simulation.',
  inputSchema: siemControlSchema,
  execute: async (input) => controlSiemView(input),
}
