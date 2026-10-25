import { describe, expect, it } from 'vitest'
import { hasToolInvocations, toolInvocationFromPart } from './message-parts'

describe('toolInvocationFromPart', () => {
  it('normalizes a completed current SDK tool part', () => {
    const view = toolInvocationFromPart({
      type: 'tool-generateReport',
      toolCallId: 'r1',
      state: 'output-available',
      input: { type: 'threat-landscape' },
      output: { data: { title: 'Panorama de amenazas' } },
    })
    expect(view).toEqual({
      toolName: 'generateReport',
      state: 'result',
      args: { type: 'threat-landscape' },
      result: { data: { title: 'Panorama de amenazas' } },
    })
  })

  it('keeps a running tool in the call state with its input', () => {
    const view = toolInvocationFromPart({
      type: 'tool-getThreatIntel',
      state: 'input-available',
      input: { summary: true },
    })
    expect(view).toEqual({
      toolName: 'getThreatIntel',
      state: 'call',
      args: { summary: true },
    })
  })

  it('turns output-error into a result the card can display', () => {
    const view = toolInvocationFromPart({
      type: 'tool-portAnalyzer',
      state: 'output-error',
      errorText: 'upstream timeout',
    })
    expect(view).toEqual({
      toolName: 'portAnalyzer',
      state: 'result',
      args: undefined,
      result: { error: 'upstream timeout' },
    })
  })

  it('falls back to a generic error when errorText is missing', () => {
    const view = toolInvocationFromPart({
      type: 'tool-portAnalyzer',
      state: 'output-error',
    })
    expect(view?.result).toEqual({ error: 'Tool execution failed' })
  })

  it('normalizes the legacy tool-invocation shape', () => {
    const view = toolInvocationFromPart({
      type: 'tool-invocation',
      toolInvocation: {
        toolName: 'generateReport',
        state: 'result',
        args: { type: 'executive-brief' },
        result: { data: { title: 'Resumen' } },
      },
    })
    expect(view).toEqual({
      toolName: 'generateReport',
      state: 'result',
      args: { type: 'executive-brief' },
      result: { data: { title: 'Resumen' } },
    })
  })

  it('ignores text parts and malformed parts', () => {
    expect(toolInvocationFromPart({ type: 'text', text: 'hola' })).toBeNull()
    expect(toolInvocationFromPart({ type: 'tool-', state: 'output-available' })).toBeNull()
    expect(toolInvocationFromPart({ type: 'tool-x' })).toBeNull()
    expect(toolInvocationFromPart({ type: 'tool-invocation' })).toBeNull()
    expect(toolInvocationFromPart(null)).toBeNull()
    expect(toolInvocationFromPart('tool-x')).toBeNull()
  })

  it('rejects non-object outputs so the card never renders a primitive', () => {
    const view = toolInvocationFromPart({
      type: 'tool-dnsAnalyzer',
      state: 'output-available',
      output: 'text',
    })
    expect(view?.state).toBe('result')
    expect(view?.result).toBeUndefined()
  })
})

describe('hasToolInvocations', () => {
  it('detects current and legacy invocations among text parts', () => {
    expect(
      hasToolInvocations([
        { type: 'text', text: 'Mirame' },
        { type: 'tool-getThreatIntel', state: 'output-available', output: {} },
      ]),
    ).toBe(true)
    expect(
      hasToolInvocations([
        { type: 'tool-invocation', toolInvocation: { toolName: 'x', state: 'call' } },
      ]),
    ).toBe(true)
  })

  it('is false for plain text messages and undefined parts', () => {
    expect(hasToolInvocations([{ type: 'text', text: 'Hola' }])).toBe(false)
    expect(hasToolInvocations(undefined)).toBe(false)
  })
})
