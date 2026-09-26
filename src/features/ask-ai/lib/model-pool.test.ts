import { describe, it, expect, vi, beforeEach } from 'vitest'

const streamTextMock = vi.hoisted(() => vi.fn())

vi.mock('ai', () => ({
  streamText: streamTextMock,
}))

import { streamWithFallback, ModelPoolError, sanitizeFreePool, buildFreeModelPool, DEFAULT_FREE_MODEL_POOL } from './model-pool'

const encoder = new TextEncoder()

function streamResponse(...chunks: Uint8Array[]): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk)
        controller.close()
      },
    }),
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  )
}

function sseDataResponse(...texts: string[]): Response {
  return streamResponse(...texts.map((t) => encoder.encode(t)))
}

/** A successful SSE chunk carrying a REAL text-delta event (not synthetic). */
function textDeltaEvent(text: string): Response {
  return sseDataResponse(`data: {"type":"text-delta","delta":"${text}"}\n\n`)
}

/** A stream whose read rejects — simulates an upstream failure at start. */
function errorResponse(message: string): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error(message))
      },
    }),
  )
}

/** A stream that closes before producing any data. */
function emptyResponse(): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close()
      },
    }),
  )
}

/** The ai SDK reports startup failures as a first SSE error event. */
function sseErrorResponse(): Response {
  return sseDataResponse('data: {"type":"error","error":{"message":"upstream down"}}\n\n')
}

const baseOptions = {
  model: (modelId: string) => ({ id: modelId }) as never,
  messages: [],
  tools: {},
  maxOutputTokens: 4096,
  system: 'test system',
}

beforeEach(() => {
  streamTextMock.mockReset()
})

// ─── Free-only pool configuration ───────────────────────────────────────────

describe('sanitizeFreePool — the free-only invariant', () => {
  it('keeps :free endpoints and the openrouter/free router', () => {
    const pool = sanitizeFreePool([
      'inclusionai/ling-3.0-flash:free',
      'openrouter/free',
    ])
    expect(pool).toEqual(['inclusionai/ling-3.0-flash:free', 'openrouter/free'])
  })

  it('drops any paid model with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const pool = sanitizeFreePool(['google/gemini-3.6-flash', 'inclusionai/ling-3.0-flash:free'])
    expect(pool).toEqual(['inclusionai/ling-3.0-flash:free'])
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('google/gemini-3.6-flash'),
    )
    warn.mockRestore()
  })

  it('dedupes repeated entries', () => {
    expect(sanitizeFreePool(['a:free', 'a:free'])).toEqual(['a:free'])
  })
})

describe('buildFreeModelPool', () => {
  it('returns the curated default pool when unconfigured, all free', () => {
    const pool = buildFreeModelPool()
    expect(pool.length).toBeGreaterThanOrEqual(6)
    expect(pool).toEqual(DEFAULT_FREE_MODEL_POOL.split(','))
    for (const id of pool) {
      expect(id === 'openrouter/free' || id.endsWith(':free')).toBe(true)
    }
  })

  it('parses a configured pool and trims whitespace', () => {
    expect(buildFreeModelPool(' a:free , b:free ')).toEqual(['a:free', 'b:free'])
  })

  it('throws ModelPoolError when every configured entry is paid (fails closed, never spends)', () => {
    expect(() => buildFreeModelPool('google/gemini-3.6-flash,anthropic/claude-sonnet-5')).toThrow(
      ModelPoolError,
    )
  })

  it('throws ModelPoolError for an empty string', () => {
    expect(() => buildFreeModelPool(' , ')).toThrow(ModelPoolError)
  })

  it('excludes skipped models (failed mid-stream this session)', () => {
    expect(buildFreeModelPool('a:free,b:free,c:free', { skip: ['b:free'] })).toEqual([
      'a:free',
      'c:free',
    ])
  })

  it('throws ModelPoolError when every model is skipped (auto-retry exhausts the pool → 503)', () => {
    expect(() =>
      buildFreeModelPool('a:free,b:free', { skip: ['a:free', 'b:free'] }),
    ).toThrow(ModelPoolError)
  })
})

// ─── Stream fallback ────────────────────────────────────────────────────────

describe('streamWithFallback', () => {
  it('returns the first model stream that starts cleanly, preserving all chunks', async () => {
    const parts = ['data: {"type":"text-delta","delta":"Hola"}\n\n', 'data: [DONE]\n\n']
    streamTextMock.mockImplementation(() => ({
      toUIMessageStreamResponse: () => sseDataResponse(parts[0], parts[1]),
    }))

    const seen: string[] = []
    const result = await streamWithFallback(['model-a', 'model-b'], {
      ...baseOptions,
      model: (modelId) => {
        seen.push(modelId)
        return { id: modelId } as never
      },
    })

    expect(seen).toEqual(['model-a'])
    expect(result.modelId).toBe('model-a')
    expect(await result.response.text()).toBe(parts.join(''))
    expect(streamTextMock).toHaveBeenCalledTimes(1)

    const call = streamTextMock.mock.calls[0][0] as {
      model: unknown
      messages: unknown
      tools: unknown
      maxOutputTokens: number
      system: string
    }
    expect(call.model).toEqual({ id: 'model-a' })
    expect(call.messages).toEqual([])
    expect(call.tools).toEqual({})
    expect(call.maxOutputTokens).toBe(4096)
    expect(call.system).toBe('test system')
  })

  it('sends the winning model id and its pool index as stream metadata', async () => {
    const metadataEvents: unknown[] = []
    streamTextMock.mockImplementation(() => ({
      toUIMessageStreamResponse: (options?: { messageMetadata?: () => unknown }) => {
        metadataEvents.push(options?.messageMetadata?.())
        return textDeltaEvent('ok')
      },
    }))

    const result = await streamWithFallback(['model-a'], {
      ...baseOptions,
      messageMetadata: (modelId, attemptIndex) => ({ modelId, attemptIndex }),
    })

    expect(result.modelId).toBe('model-a')
    expect(result.attemptIndex).toBe(1)
    expect(metadataEvents).toEqual([{ modelId: 'model-a', attemptIndex: 1 }])
  })

  it('reports a later pool index when the first model failed (fallback)', async () => {
    const metadataEvents: unknown[] = []
    streamTextMock
      .mockImplementationOnce(() => ({
        toUIMessageStreamResponse: () => errorResponse('boom'),
      }))
      .mockImplementationOnce(() => ({
        toUIMessageStreamResponse: (options?: { messageMetadata?: () => unknown }) => {
          metadataEvents.push(options?.messageMetadata?.())
          return textDeltaEvent('recovered')
        },
      }))

    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      messageMetadata: (modelId, attemptIndex) => ({ modelId, attemptIndex }),
    })

    expect(result.modelId).toBe('b')
    expect(result.attemptIndex).toBe(2)
    expect(metadataEvents).toEqual([{ modelId: 'b', attemptIndex: 2 }])
  })

  it('falls back to the next model when the first stream rejects on read', async () => {
    streamTextMock
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => errorResponse('auth failed') }))
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => textDeltaEvent('recovered') }))

    const seen: string[] = []
    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      model: (modelId) => {
        seen.push(modelId)
        return { id: modelId } as never
      },
    })

    expect(seen).toEqual(['a', 'b'])
    expect(result.modelId).toBe('b')
    expect(await result.response.text()).toBe('data: {"type":"text-delta","delta":"recovered"}\n\n')
  })

  it('falls through when the error arrives AFTER the synthetic start events (dead model)', async () => {
    // The SDK emits start/start-step/text-start synchronously; a delisted
    // (404) or rate-limited (429) model fails in the NEXT event. Reading
    // only the first chunk used to commit the pool to a model that never
    // answers — this is the regression test for that bug.
    const syntheticThenError = streamResponse(
      encoder.encode('data: {"type":"start","messageMetadata":{"modelId":"a"}}\n\n'),
      encoder.encode('data: {"type":"error","errorText":"An error occurred."}\n\n'),
    )
    streamTextMock
      .mockImplementationOnce(() => ({
        toUIMessageStreamResponse: () => syntheticThenError,
      }))
      .mockImplementationOnce(() => ({
        toUIMessageStreamResponse: () => textDeltaEvent('recovered'),
      }))

    const seen: string[] = []
    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      model: (modelId) => {
        seen.push(modelId)
        return { id: modelId } as never
      },
    })

    expect(seen).toEqual(['a', 'b'])
    expect(result.modelId).toBe('b')
  })

  it('commits and re-emits everything when real content follows the synthetic start events', async () => {
    const syntheticThenText = streamResponse(
      encoder.encode('data: {"type":"start","messageMetadata":{"modelId":"a"}}\n\n'),
      encoder.encode('data: {"type":"text-delta","delta":"Hola"}\n\n'),
      encoder.encode('data: {"type":"text-delta","delta":" mundo"}\n\n'),
    )
    streamTextMock.mockImplementation(() => ({
      toUIMessageStreamResponse: () => syntheticThenText,
    }))

    const result = await streamWithFallback(['a'], baseOptions)
    expect(result.modelId).toBe('a')
    expect(await result.response.text()).toBe(
      'data: {"type":"start","messageMetadata":{"modelId":"a"}}\n\n' +
        'data: {"type":"text-delta","delta":"Hola"}\n\n' +
        'data: {"type":"text-delta","delta":" mundo"}\n\n',
    )
  })

  it('treats a first-chunk SSE error event as a failed model', async () => {
    streamTextMock
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => sseErrorResponse() }))
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => textDeltaEvent('recovered') }))

    const seen: string[] = []
    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      model: (modelId) => {
        seen.push(modelId)
        return { id: modelId } as never
      },
    })

    expect(seen).toEqual(['a', 'b'])
    expect(await result.response.text()).toBe('data: {"type":"text-delta","delta":"recovered"}\n\n')
  })

  it('falls back when the stream ends before producing any data', async () => {
    streamTextMock
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => emptyResponse() }))
      .mockImplementationOnce(() => ({ toUIMessageStreamResponse: () => textDeltaEvent('fine') }))

    const seen: string[] = []
    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      model: (modelId) => {
        seen.push(modelId)
        return { id: modelId } as never
      },
    })

    expect(seen).toEqual(['a', 'b'])
    expect(await result.response.text()).toBe('data: {"type":"text-delta","delta":"fine"}\n\n')
  })

  it('retries a rate-limited model with backoff before advancing', async () => {
    vi.useFakeTimers()
    try {
      streamTextMock
        .mockImplementationOnce(() => ({
          toUIMessageStreamResponse: () => errorResponse('429 Too Many Requests'),
        }))
        .mockImplementationOnce(() => ({
          toUIMessageStreamResponse: () => textDeltaEvent('ok after backoff'),
        }))

      const seen: string[] = []
      const promise = streamWithFallback(['a', 'b'], {
        ...baseOptions,
        model: (modelId) => {
          seen.push(modelId)
          return { id: modelId } as never
        },
      })
      // First backoff (600ms base, ±50% jitter) elapses → same model retried.
      await vi.advanceTimersByTimeAsync(1000)
      const result = await promise

      expect(seen).toEqual(['a', 'a'])
      expect(result.modelId).toBe('a')
      expect(await result.response.text()).toBe('data: {"type":"text-delta","delta":"ok after backoff"}\n\n')
    } finally {
      vi.useRealTimers()
    }
  })

  it('advances to the next model after exhausting rate-limit retries', async () => {
    vi.useFakeTimers()
    try {
      streamTextMock.mockImplementation(() => ({
        toUIMessageStreamResponse: () => errorResponse('429 rate limit'),
      }))
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const seen: string[] = []
      const promise = streamWithFallback(['a', 'b'], {
        ...baseOptions,
        model: (modelId) => {
          seen.push(modelId)
          return { id: modelId } as never
        },
      })
      // Attach the rejection handler BEFORE advancing so the final throw
      // is not reported as unhandled, then let all backoffs (≤ 1.8s per
      // model, budget 5s) elapse.
      const assertion = expect(promise).rejects.toBeInstanceOf(ModelPoolError)
      await vi.advanceTimersByTimeAsync(6000)
      await assertion

      // 1 initial + 2 backoff retries per model, then the pool advances.
      expect(seen).toEqual(['a', 'a', 'a', 'b', 'b', 'b'])
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('retrying in'))
      warn.mockRestore()
    } finally {
      vi.useRealTimers()
    }
  })

  it('throws ModelPoolError with the last error when every model fails', async () => {
    streamTextMock.mockImplementation(() => ({
      toUIMessageStreamResponse: () => errorResponse('boom'),
    }))

    try {
      await streamWithFallback(['a', 'b'], baseOptions)
      expect.unreachable('should have thrown ModelPoolError')
    } catch (error) {
      expect(error).toBeInstanceOf(ModelPoolError)
      expect((error as ModelPoolError).cause).toBeInstanceOf(Error)
    }
    expect(streamTextMock).toHaveBeenCalledTimes(2)
  })

  it('throws ModelPoolError for an empty pool', async () => {
    await expect(streamWithFallback([], baseOptions)).rejects.toBeInstanceOf(ModelPoolError)
    expect(streamTextMock).not.toHaveBeenCalled()
  })

  it('forwards the onFinish hook with the winning model and its usage', async () => {
    streamTextMock.mockImplementation((opts: { onFinish?: (event: unknown) => void }) => {
      queueMicrotask(() =>
        opts.onFinish?.({
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
          finishReason: 'stop',
        }),
      )
      return { toUIMessageStreamResponse: () => textDeltaEvent('ok') }
    })

    const onFinish = vi.fn()
    const result = await streamWithFallback(['a', 'b'], {
      ...baseOptions,
      model: (modelId) => ({ id: modelId }) as never,
      onFinish,
    })

    expect(result.modelId).toBe('a')
    expect(result.attemptIndex).toBe(1)
    await vi.waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1))
    expect(onFinish.mock.calls[0][0]).toMatchObject({
      modelId: 'a',
      attemptIndex: 1,
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      finishReason: 'stop',
    })
  })
})
