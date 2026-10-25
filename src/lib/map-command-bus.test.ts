import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MAP_COMMAND_EVENT, type MapCommand } from './map-command'
import {
  deliverMapCommands,
  getLastMapCommand,
  resetMapCommandBus,
} from './map-command-bus'

function messageWith(toolCallId: string, command: unknown) {
  return [
    {
      role: 'assistant',
      parts: [
        {
          type: 'tool-controlMapView',
          toolCallId,
          state: 'output-available',
          output: { applied: true, command },
        },
      ],
    },
  ]
}

let received: MapCommand[] = []

function listener(event: Event) {
  received.push((event as CustomEvent<MapCommand>).detail)
}

beforeEach(() => {
  resetMapCommandBus()
  received = []
  window.addEventListener(MAP_COMMAND_EVENT, listener)
})

afterEach(() => {
  window.removeEventListener(MAP_COMMAND_EVENT, listener)
})

describe('deliverMapCommands', () => {
  it('dispatches a new command once and remembers it for late-mounting maps', () => {
    const processed = new Set<string>()
    const messages = messageWith('call-1', { action: 'focus-country', country: 'China' })

    expect(deliverMapCommands(messages, processed)).toEqual([
      { action: 'focus-country', country: 'China' },
    ])
    expect(received).toHaveLength(1)
    expect(getLastMapCommand()).toEqual({ action: 'focus-country', country: 'China' })
  })

  it('does not deliver the same tool call twice', () => {
    const processed = new Set<string>()
    const messages = messageWith('call-1', { action: 'clear-filter' })

    deliverMapCommands(messages, processed)
    expect(deliverMapCommands(messages, processed)).toEqual([])
    expect(received).toHaveLength(1)
  })

  it('skips commands from a restored conversation that were already applied', () => {
    // El hook siembra este set al cargar el historial de localStorage.
    const processed = new Set(['restored-call'])
    const messages = messageWith('restored-call', { action: 'clear-filter' })

    expect(deliverMapCommands(messages, processed)).toEqual([])
    expect(received).toEqual([])
  })

  it('ignores invalid commands without touching the map', () => {
    const processed = new Set<string>()

    expect(
      deliverMapCommands(
        messageWith('call-bad', { action: 'focus-country' }),
        processed,
      ),
    ).toEqual([])
    expect(received).toEqual([])
  })
})
