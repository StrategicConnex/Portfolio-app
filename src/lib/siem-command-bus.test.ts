import { beforeEach, describe, expect, it } from 'vitest'
import { SIEM_COMMAND_EVENT, type SiemCommand } from './siem-command'
import {
  deliverSiemCommands,
  dispatchSiemCommand,
  getLastSiemCommand,
  resetSiemCommandBus,
} from './siem-command-bus'

beforeEach(() => {
  resetSiemCommandBus()
})

describe('siem command bus', () => {
  it('dispatches a valid command and remembers it for a late-mounting panel', () => {
    const received: SiemCommand[] = []
    const listener = (event: Event) => {
      received.push((event as CustomEvent<SiemCommand>).detail)
    }
    window.addEventListener(SIEM_COMMAND_EVENT, listener)

    try {
      expect(dispatchSiemCommand({ action: 'filter-severity', level: 'ALERT' })).toBe(true)
      expect(received).toEqual([{ action: 'filter-severity', level: 'ALERT' }])
      expect(getLastSiemCommand()).toEqual({ action: 'filter-severity', level: 'ALERT' })
    } finally {
      window.removeEventListener(SIEM_COMMAND_EVENT, listener)
    }
  })

  it('refuses a command that does not match the contract', () => {
    expect(dispatchSiemCommand({ action: 'filter-severity', level: 'DEBUG' })).toBe(false)
    expect(getLastSiemCommand()).toBeNull()
  })

  it('delivers each tool call once and skips restored history', () => {
    const messages = [
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-controlSiemView',
            toolCallId: 'siem-1',
            state: 'output-available',
            output: { command: { action: 'clear-filter' } },
          },
        ],
      },
    ]
    const processed = new Set<string>()

    expect(deliverSiemCommands(messages, processed)).toEqual([{ action: 'clear-filter' }])
    expect(deliverSiemCommands(messages, processed)).toEqual([])

    const restored = new Set(['siem-1'])
    expect(deliverSiemCommands(messages, restored)).toEqual([])
  })
})
