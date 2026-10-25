import {
  collectToolCommands,
  type ToolCommandMessageLike,
  type CollectToolCommandsOptions,
} from './ui-command'

/**
 * Canal de comandos Chat-to-UI hacia una parte de la interfaz.
 *
 * Cada canal tiene su propio evento de ventana, su validador y su memoria del
 * último comando. Esa memoria importa porque los paneles pesados (mapa 3D,
 * SIEM) pueden montar después de que el usuario hiciera el pedido: al montar
 * recuperan la orden en vez de perderla.
 *
 * El estado vive en el módulo del navegador, nunca en el servidor.
 */

export interface UiCommandChannel<T> {
  /** Nombre del evento de ventana que entrega los comandos. */
  eventName: string
  /** Valida y entrega un comando; `false` si no cumple el contrato. */
  dispatch: (command: unknown) => boolean
  /** Último comando válido, para consumidores que montan tarde. */
  getLast: () => T | null
  /**
   * Entrega los comandos completados que aún no se procesaron y marca sus
   * `toolCallId` como vistos. El set se comparte con quien llama para sembrar
   * los comandos de una conversación restaurada.
   */
  deliver: (
    messages: ReadonlyArray<ToolCommandMessageLike>,
    processed: Set<string>,
  ) => T[]
  /** Seam de test: olvida el último comando. */
  reset: () => void
}

export interface CreateUiCommandChannelOptions<T>
  extends CollectToolCommandsOptions<T> {
  /** Nombre del CustomEvent que escucha la interfaz. */
  eventName: string
}

export function createUiCommandChannel<T>({
  eventName,
  ...collectOptions
}: CreateUiCommandChannelOptions<T>): UiCommandChannel<T> {
  let lastCommand: T | null = null

  const dispatch = (command: unknown): boolean => {
    if (!collectOptions.isCommand(command)) return false
    lastCommand = command

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<T>(eventName, { detail: command }),
      )
    }
    return true
  }

  const deliver = (
    messages: ReadonlyArray<ToolCommandMessageLike>,
    processed: Set<string>,
  ): T[] => {
    const delivered: T[] = []
    for (const { toolCallId, command } of collectToolCommands(
      messages,
      collectOptions,
    )) {
      if (processed.has(toolCallId)) continue
      processed.add(toolCallId)
      if (dispatch(command)) delivered.push(command)
    }
    return delivered
  }

  return {
    eventName,
    dispatch,
    getLast: () => lastCommand,
    deliver,
    reset: () => {
      lastCommand = null
    },
  }
}
