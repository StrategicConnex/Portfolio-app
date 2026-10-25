import { createUiCommandChannel } from './ui-command-channel'
import {
  SIEM_COMMAND_EVENT,
  SIEM_CONTROL_TOOL_NAME,
  isSiemCommand,
  type SiemCommand,
  type SiemCommandMessageLike,
} from './siem-command'

/**
 * Puente de comandos del chat hacia el panel SIEM.
 *
 * El panel puede estar más abajo en la página (o montarse después de que el
 * usuario preguntara): el canal guarda el último comando y el panel lo aplica
 * al suscribirse. La mecánica común vive en `ui-command-channel.ts`.
 */

const channel = createUiCommandChannel<SiemCommand>({
  eventName: SIEM_COMMAND_EVENT,
  toolName: SIEM_CONTROL_TOOL_NAME,
  isCommand: isSiemCommand,
})

/** Valida y entrega un comando al panel SIEM. */
export function dispatchSiemCommand(command: unknown): boolean {
  return channel.dispatch(command)
}

/** Último comando válido, para que un panel que monta tarde lo recupere. */
export function getLastSiemCommand(): SiemCommand | null {
  return channel.getLast()
}

/**
 * Entrega los comandos completados que todavía no se procesaron y marca sus
 * `toolCallId` como vistos. El set lo comparte el hook para sembrar los
 * comandos de una conversación restaurada.
 */
export function deliverSiemCommands(
  messages: ReadonlyArray<SiemCommandMessageLike>,
  processed: Set<string>,
): SiemCommand[] {
  return channel.deliver(messages, processed)
}

/** Seam de test: olvida el último comando. */
export function resetSiemCommandBus(): void {
  channel.reset()
}
