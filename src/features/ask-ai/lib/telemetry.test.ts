import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ToolSet } from 'ai'

const captureErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/observability/sentry', () => ({
  captureError: captureErrorMock,
}))

import {
  emitAskAiEvent,
  setTelemetryTransport,
  hashQuery,
  withToolTelemetry,
  messageOf,
  type AskAiTelemetryTransport,
} from './telemetry'

beforeEach(() => {
  captureErrorMock.mockReset()
  setTelemetryTransport(null)
})

afterEach(() => {
  setTelemetryTransport(null)
})

describe('default transport', () => {
  it('logs a structured JSON line for every event', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    emitAskAiEvent('ask_ai_stream_started', { modelId: 'a:free', locale: 'es' })
    expect(logSpy).toHaveBeenCalledTimes(1)
    const line = JSON.parse(logSpy.mock.calls[0][0] as string)
    expect(line.event).toBe('ask_ai_stream_started')
    expect(line.modelId).toBe('a:free')
    expect(typeof line.ts).toBe('number')
    logSpy.mockRestore()
  })

  it('captures errors to Sentry only for ask_ai_error events', () => {
    emitAskAiEvent('ask_ai_stream_completed', { modelId: 'a' })
    expect(captureErrorMock).not.toHaveBeenCalled()

    emitAskAiEvent('ask_ai_error', { stage: 'model-pool', status: 503, providerError: 'upstream down' })
    expect(captureErrorMock).toHaveBeenCalledTimes(1)
    const [error, context] = captureErrorMock.mock.calls[0] as [Error, Record<string, unknown>]
    expect(error.message).toContain('upstream down')
    expect(context.stage).toBe('model-pool')
    expect(context.status).toBe(503)
  })
})

describe('injectable transport', () => {
  it('routes events to the injected transport', () => {
    const received: Array<[string, Record<string, unknown>]> = []
    const transport: AskAiTelemetryTransport = {
      emit: (name, props) => received.push([name, props]),
    }
    setTelemetryTransport(transport)

    emitAskAiEvent('ask_ai_rag_retrieved', { queryHash: 'abc', topK: 5 })
    expect(received).toEqual([
      ['ask_ai_rag_retrieved', { queryHash: 'abc', topK: 5 }],
    ])
  })

  it('falls back to the default transport when the injected one throws', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setTelemetryTransport({
      emit: () => {
        throw new Error('broken transport')
      },
    })
    emitAskAiEvent('ask_ai_stream_completed', { modelId: 'a' })
    expect(logSpy).toHaveBeenCalledTimes(1)
    logSpy.mockRestore()
  })

  it('restores the default transport with null', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    setTelemetryTransport({ emit: () => {} })
    setTelemetryTransport(null)
    emitAskAiEvent('ask_ai_stream_started', {})
    expect(logSpy).toHaveBeenCalledTimes(1)
    logSpy.mockRestore()
  })
})

describe('hashQuery', () => {
  it('is stable and case/space insensitive', () => {
    expect(hashQuery('¿Qué es IEC 62443?')).toBe(hashQuery('  ¿qué es iec 62443?  '))
  })

  it('produces distinct hashes for different queries', () => {
    expect(hashQuery('security onion')).not.toBe(hashQuery('purdue model'))
  })
})

describe('messageOf', () => {
  it('extracts the message from errors and strings other shapes', () => {
    expect(messageOf(new Error('boom'))).toBe('boom')
    expect(messageOf('raw string')).toBe('raw string')
    expect(messageOf(undefined)).toBe('undefined')
  })
})

describe('withToolTelemetry', () => {
  const toolSet = {
    dnsAnalyzer: {
      description: 'Analyze DNS',
      inputSchema: { type: 'object' },
      execute: async () => ({ records: [] }),
    },
    failing: {
      description: 'Always fails with an error-shaped result',
      inputSchema: {},
      execute: async () => ({ error: 'upstream timeout' }),
    },
    throwing: {
      description: 'Throws',
      inputSchema: {},
      execute: async () => {
        throw new Error('kaboom')
      },
    },
  }

  it('emits ok events with latency for successful executions and keeps the surface', async () => {
    const events: Array<[string, Record<string, unknown>]> = []
    setTelemetryTransport({ emit: (name, props) => events.push([name, props]) })

    const wrapped = withToolTelemetry(toolSet as unknown as ToolSet)
    expect(Object.keys(wrapped)).toEqual(['dnsAnalyzer', 'failing', 'throwing'])
    expect((wrapped as Record<string, { description?: string }>).dnsAnalyzer.description).toBe('Analyze DNS')

    const result = await (wrapped as unknown as Record<string, { execute: () => Promise<unknown> }>).dnsAnalyzer.execute()
    expect(result).toEqual({ records: [] })
    expect(events).toHaveLength(1)
    const [name, props] = events[0]
    expect(name).toBe('ask_ai_tool_called')
    expect(props.toolName).toBe('dnsAnalyzer')
    expect(props.status).toBe('ok')
    expect(typeof props.latencyMs).toBe('number')
    expect(props.latencyMs).toBeGreaterThanOrEqual(0)
  })

  it('reports error-shaped results as failures with the error code', async () => {
    const events: Array<[string, Record<string, unknown>]> = []
    setTelemetryTransport({ emit: (name, props) => events.push([name, props]) })

    const wrapped = withToolTelemetry(toolSet as unknown as ToolSet)
    const result = await (wrapped as unknown as Record<string, { execute: () => Promise<unknown> }>).failing.execute()
    expect(result).toEqual({ error: 'upstream timeout' })
    expect(events[0][1]).toMatchObject({ toolName: 'failing', status: 'error', errorCode: 'upstream timeout' })
  })

  it('rethrows tool exceptions and still emits the failure event', async () => {
    const events: Array<[string, Record<string, unknown>]> = []
    setTelemetryTransport({ emit: (name, props) => events.push([name, props]) })

    const wrapped = withToolTelemetry(toolSet as unknown as ToolSet)
    await expect(
      (wrapped as unknown as Record<string, { execute: () => Promise<unknown> }>).throwing.execute(),
    ).rejects.toThrow('kaboom')
    expect(events[0][1]).toMatchObject({ toolName: 'throwing', status: 'error', errorCode: 'kaboom' })
  })
})
