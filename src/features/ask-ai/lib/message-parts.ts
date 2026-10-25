/**
 * Normalización de las partes de tool de un mensaje del copilot.
 *
 * El SDK actual emite partes `tool-<nombre>` con `state` y `input`/`output`
 * (`output-available`, `output-error`, `input-available`…). Las versiones
 * anteriores emitían `tool-invocation` con un objeto `toolInvocation`. Las
 * conversaciones guardadas en localStorage pueden traer cualquiera de las dos
 * formas, así que la vista del chat normaliza aquí, en un único lugar.
 *
 * La normalización es pura y defensiva: nunca lanza y devuelve `null` para
 * cualquier parte que no sea una invocación de tool reconocible.
 */

/** Forma mínima que consume `ToolCallCard`. */
export interface ToolInvocationView {
  toolName: string
  state: 'call' | 'result'
  args?: Record<string, unknown>
  result?: Record<string, unknown>
}

const TOOL_PART_PREFIX = 'tool-'
const LEGACY_TOOL_PART = 'tool-invocation'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function errorResult(errorText: unknown): Record<string, unknown> {
  return {
    error:
      typeof errorText === 'string' && errorText.length > 0
        ? errorText
        : 'Tool execution failed',
  }
}

/**
 * Convierte una parte del mensaje en la vista de invocación que usa la UI.
 *
 * Estados del SDK actual:
 * - `output-available` → resultado disponible (`state: 'result'`).
 * - `output-error` → resultado con `{ error }` para que la tarjeta lo muestre.
 * - `input-available` / `input-streaming` → tool en ejecución (`state: 'call'`).
 */
export function toolInvocationFromPart(part: unknown): ToolInvocationView | null {
  const record = asRecord(part)
  if (!record) return null

  const type = typeof record.type === 'string' ? record.type : ''
  if (!type) return null

  // Forma heredada: { type: 'tool-invocation', toolInvocation: { ... } }.
  if (type === LEGACY_TOOL_PART) {
    const legacy = asRecord(record.toolInvocation)
    if (!legacy) return null
    const toolName = typeof legacy.toolName === 'string' ? legacy.toolName : ''
    if (!toolName) return null
    const legacyState = legacy.state
    if (legacyState === 'result') {
      return {
        toolName,
        state: 'result',
        args: asRecord(legacy.args),
        result: asRecord(legacy.result),
      }
    }
    if (legacyState === 'call') {
      return {
        toolName,
        state: 'call',
        args: asRecord(legacy.args),
      }
    }
    return null
  }

  // Forma actual: { type: 'tool-<nombre>', state, input, output }.
  if (!type.startsWith(TOOL_PART_PREFIX)) return null
  const toolName = type.slice(TOOL_PART_PREFIX.length)
  if (!toolName) return null

  const args = asRecord(record.input)

  if (record.state === 'output-available') {
    return {
      toolName,
      state: 'result',
      args,
      result: asRecord(record.output),
    }
  }

  if (record.state === 'output-error') {
    return {
      toolName,
      state: 'result',
      args,
      result: errorResult(record.errorText),
    }
  }

  if (record.state === 'input-available' || record.state === 'input-streaming') {
    return {
      toolName,
      state: 'call',
      args,
    }
  }

  return null
}

/** `true` si el mensaje trae al menos una invocación de tool reconocible. */
export function hasToolInvocations(
  parts: ReadonlyArray<unknown> | undefined,
): boolean {
  return (parts ?? []).some((part) => toolInvocationFromPart(part) !== null)
}
