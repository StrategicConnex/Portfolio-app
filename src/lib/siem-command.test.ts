import { describe, expect, it } from 'vitest'
import {
  SIEM_COMMAND_EVENT,
  collectSiemCommands,
  isSiemCommand,
} from './siem-command'
import { siem } from '@/context/translations/siem'

describe('isSiemCommand', () => {
  it('accepts the four real severities and the clear action', () => {
    for (const level of ['CRITICAL', 'ALERT', 'WARN', 'INFO'] as const) {
      expect(isSiemCommand({ action: 'filter-severity', level })).toBe(true)
    }
    expect(isSiemCommand({ action: 'clear-filter' })).toBe(true)
  })

  it('rejects unknown severities, missing levels and unknown actions', () => {
    expect(isSiemCommand({ action: 'filter-severity', level: 'DEBUG' })).toBe(false)
    expect(isSiemCommand({ action: 'filter-severity' })).toBe(false)
    expect(isSiemCommand({ action: 'filter-severity', level: 'critical' })).toBe(false)
    expect(isSiemCommand({ action: 'clear-all' })).toBe(false)
    expect(isSiemCommand(null)).toBe(false)
    expect(isSiemCommand('filter-severity')).toBe(false)
  })

  it('uses its own window event', () => {
    expect(SIEM_COMMAND_EVENT).toBe('ask-ai:siem-command')
  })
})

describe('SIEM filter copy', () => {
  it('is present in both languages', () => {
    const keys = [
      'siem.ui.filter.active',
      'siem.ui.filter.active_one',
      'siem.ui.filter.empty',
      'siem.ui.filter.clear',
    ] as const

    for (const key of keys) {
      expect(siem.es[key], `falta en español: ${key}`).toBeTruthy()
      expect(siem.en[key], `falta en inglés: ${key}`).toBeTruthy()
    }
  })
})

describe('collectSiemCommands', () => {
  const command = { action: 'filter-severity', level: 'WARN' } as const

  it('reads a completed controlSiemView part', () => {
    const commands = collectSiemCommands([
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-controlSiemView',
            toolCallId: 'siem-1',
            state: 'output-available',
            output: { applied: true, command },
          },
        ],
      },
    ])

    expect(commands).toEqual([{ toolCallId: 'siem-1', command }])
  })

  it('ignores other tools, unfinished calls and invalid levels', () => {
    const commands = collectSiemCommands([
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-controlMapView',
            toolCallId: 'map-1',
            state: 'output-available',
            output: { command },
          },
          {
            type: 'tool-controlSiemView',
            toolCallId: 'pending',
            state: 'input-available',
            input: command,
          },
          {
            type: 'tool-controlSiemView',
            toolCallId: 'invalid',
            state: 'output-available',
            output: { command: { action: 'filter-severity', level: 'DEBUG' } },
          },
        ],
      },
    ])

    expect(commands).toEqual([])
  })
})
