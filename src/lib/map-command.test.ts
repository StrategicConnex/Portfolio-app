import { describe, expect, it } from 'vitest'
import {
  collectMapCommands,
  isMapCommand,
  resolveMapCountry,
  MAP_COMMAND_EVENT,
} from './map-command'

describe('resolveMapCountry', () => {
  it('resolves the English dataset name case-insensitively', () => {
    expect(resolveMapCountry('china')).toBe('China')
    expect(resolveMapCountry('RUSSIA')).toBe('Russia')
    expect(resolveMapCountry('  Brazil  ')).toBe('Brazil')
  })

  it('accepts the ISO-3166 alpha-2 code', () => {
    expect(resolveMapCountry('CN')).toBe('China')
    expect(resolveMapCountry('us')).toBe('United States')
  })

  it('ignores accents so a Spanish name still matches the dataset', () => {
    expect(resolveMapCountry('México')).toBe('Mexico')
  })

  it('returns undefined for a country the map does not know', () => {
    expect(resolveMapCountry('Narnia')).toBeUndefined()
    expect(resolveMapCountry('Atlantis')).toBeUndefined()
    expect(resolveMapCountry('')).toBeUndefined()
    expect(resolveMapCountry(undefined)).toBeUndefined()
  })
})

describe('isMapCommand', () => {
  it('accepts the two valid commands', () => {
    expect(isMapCommand({ action: 'clear-filter' })).toBe(true)
    expect(isMapCommand({ action: 'focus-country', country: 'China' })).toBe(true)
  })

  it('rejects a focus without a country and unknown actions', () => {
    expect(isMapCommand({ action: 'focus-country' })).toBe(false)
    expect(isMapCommand({ action: 'focus-country', country: '   ' })).toBe(false)
    expect(isMapCommand({ action: 'delete-everything' })).toBe(false)
    expect(isMapCommand(null)).toBe(false)
    expect(isMapCommand('focus-country')).toBe(false)
  })
})

describe('collectMapCommands', () => {
  const focusChina = { action: 'focus-country', country: 'China' } as const

  it('reads a completed tool part in the current SDK shape', () => {
    const commands = collectMapCommands([
      {
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Filtrando el mapa…' },
          {
            type: 'tool-controlMapView',
            toolCallId: 'call-1',
            state: 'output-available',
            output: { applied: true, command: focusChina },
          },
        ],
      },
    ])

    expect(commands).toEqual([{ toolCallId: 'call-1', command: focusChina }])
    expect(MAP_COMMAND_EVENT).toBe('ask-ai:map-command')
  })

  it('reads the legacy tool-invocation shape', () => {
    const commands = collectMapCommands([
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-invocation',
            toolInvocation: {
              toolName: 'controlMapView',
              toolCallId: 'call-2',
              state: 'result',
              result: { applied: true, command: { action: 'clear-filter' } },
            },
          },
        ],
      },
    ])

    expect(commands).toEqual([
      { toolCallId: 'call-2', command: { action: 'clear-filter' } },
    ])
  })

  it('ignores unfinished calls, other tools, user parts and invalid commands', () => {
    const commands = collectMapCommands([
      {
        role: 'assistant',
        parts: [
          {
            type: 'tool-controlMapView',
            toolCallId: 'pending',
            state: 'input-available',
            input: { action: 'focus-country', country: 'China' },
          },
          {
            type: 'tool-controlMapView',
            toolCallId: 'failed',
            state: 'output-error',
            errorText: 'boom',
          },
          {
            type: 'tool-dnsAnalyzer',
            toolCallId: 'other',
            state: 'output-available',
            output: { command: focusChina },
          },
          {
            type: 'tool-controlMapView',
            toolCallId: 'invalid',
            state: 'output-available',
            output: { applied: false, reason: 'unknown-country' },
          },
          {
            type: 'tool-controlMapView',
            toolCallId: 'unknown-shape',
            state: 'output-available',
            output: { applied: true, command: { action: 'focus-country' } },
          },
        ],
      },
      {
        role: 'user',
        parts: [
          {
            type: 'tool-controlMapView',
            toolCallId: 'user-part',
            state: 'output-available',
            output: { command: focusChina },
          },
        ],
      },
    ])

    expect(commands).toEqual([])
  })
})
