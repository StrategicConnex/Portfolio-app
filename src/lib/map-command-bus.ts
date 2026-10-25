import { createUiCommandChannel } from './ui-command-channel'
import {
  MAP_COMMAND_EVENT,
  MAP_CONTROL_TOOL_NAME,
  isMapCommand,
  type MapCommand,
  type MapCommandMessageLike,
} from './map-command'

/**
 * Puente de comandos del chat hacia el mapa.
 *
 * El chat vive en un panel flotante montado en todo el sitio, mientras que el
 * mapa puede no estar montado todavía (el chunk de three.js se carga al
 * acercarse al viewport). El canal guarda el último comando: si el mapa
 * aparece después, lo aplica al montarse en vez de perderlo.
 *
 * La mecánica (validar, emitir, deduplicar) vive en el canal genérico
 * `ui-command-channel.ts`; aquí solo se parametriza para el mapa.
 */

const channel = createUiCommandChannel<MapCommand>({
  eventName: MAP_COMMAND_EVENT,
  toolName: MAP_CONTROL_TOOL_NAME,
  isCommand: isMapCommand,
})

/** Valida y entrega un comando al mapa. */
export function dispatchMapCommand(command: unknown): boolean {
  return channel.dispatch(command)
}

/** Último comando válido, para que un mapa que monta tarde lo recupere. */
export function getLastMapCommand(): MapCommand | null {
  return channel.getLast()
}

/**
 * Entrega los comandos completados que todavía no se procesaron y marca sus
 * `toolCallId` como vistos. El set lo comparte quien llama: el hook lo
 * siembra con los comandos de la conversación restaurada, de modo que abrir
 * el panel o recargar la página no vuelva a mover el mapa con una orden
 * vieja. Devuelve los comandos entregados.
 */
export function deliverMapCommands(
  messages: ReadonlyArray<MapCommandMessageLike>,
  processed: Set<string>,
): MapCommand[] {
  return channel.deliver(messages, processed)
}

/** Seam de test: olvida el último comando. */
export function resetMapCommandBus(): void {
  channel.reset()
}
