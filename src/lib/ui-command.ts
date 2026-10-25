/**
 * Lectura de comandos Chat-to-UI desde una conversación del copilot.
 *
 * Las tools de control (`controlMapView`, `controlSiemView`) devuelven un
 * comando estructurado dentro de su output. El navegador tiene que
 * encontrarlo y aplicarlo; esta función es la única implementación de esa
 * lectura, compartida por todos los canales de interfaz.
 *
 * Soporta las dos formas de partes del SDK: `tool-<nombre>` con `output`
 * (formato actual) y `tool-invocation` con `toolInvocation.result` (formato
 * heredado que puede venir de conversaciones guardadas). Solo se aceptan
 * resultados completados: un `input-available` todavía no tiene comando.
 */

/** Forma mínima de una parte de mensaje del chat. */
export interface ToolCommandPartLike {
  type?: string
  toolCallId?: string
  state?: string
  output?: unknown
  toolInvocation?: {
    toolName?: string
    toolCallId?: string
    state?: string
    result?: unknown
  }
}

/** Forma mínima de un mensaje del chat. */
export interface ToolCommandMessageLike {
  role?: string
  parts?: ReadonlyArray<unknown>
}

export interface ToolCommandEnvelope<T> {
  toolCallId: string
  command: T
}

export interface CollectToolCommandsOptions<T> {
  /** Nombre de la tool que produce el comando. */
  toolName: string
  /** Validador en runtime del comando (nunca confiar en el output). */
  isCommand: (value: unknown) => value is T
}

/**
 * Extrae los comandos ya ejecutados por una tool en una conversación.
 * Descarta estados incompletos, outputs inválidos y mensajes que no son del
 * asistente.
 */
export function collectToolCommands<T>(
  messages: ReadonlyArray<ToolCommandMessageLike>,
  options: CollectToolCommandsOptions<T>,
): Array<ToolCommandEnvelope<T>> {
  const found: Array<ToolCommandEnvelope<T>> = []

  for (const message of messages) {
    if (message.role !== 'assistant') continue
    for (const raw of message.parts ?? []) {
      if (!raw || typeof raw !== 'object') continue
      const part = raw as ToolCommandPartLike
      const legacy = part.type === 'tool-invocation' ? part.toolInvocation : undefined

      const isTargetTool =
        part.type === `tool-${options.toolName}` || legacy?.toolName === options.toolName
      if (!isTargetTool) continue

      const state = part.state ?? legacy?.state
      if (state !== 'output-available' && state !== 'result') continue

      const output = part.output ?? legacy?.result
      const command = (output as { command?: unknown } | undefined)?.command
      if (!options.isCommand(command)) continue

      const toolCallId = part.toolCallId ?? legacy?.toolCallId
      if (!toolCallId) continue

      found.push({ toolCallId, command })
    }
  }

  return found
}
