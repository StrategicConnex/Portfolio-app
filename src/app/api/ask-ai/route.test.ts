import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The route's outbound call to OpenRouter happens server-side (inside the
 * Next.js process), so a browser-level `page.route` cannot intercept it. The
 * clean seam to mock the provider is the `ai` SDK: `streamText` is replaced
 * here, while the route, the RAG retrieval and the system-prompt builder run
 * for real. The assertions verify the RAG payload that reaches the model.
 */
const mocks = vi.hoisted(() => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(async (messages: unknown[]) => messages),
}))

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    streamText: mocks.streamText,
    convertToModelMessages: mocks.convertToModelMessages,
  }
})

import { POST } from './route'
import { resetRateLimit } from '@/lib/rate-limit'
import { askAiTools } from '@/lib/ask-ai/tools/registry'

const ORIGINAL_KEY = process.env.OPENROUTER_API_KEY

/** A real SSE payload so the pool's `ensureStreamStarts` validation passes. */
const MOCK_STREAM = 'data: {"type":"text-delta","delta":"mocked stream"}\n\n'

function makeRequest(
  messages: unknown[],
  lang = 'es',
  mode = 'ask',
  extraBody: Record<string, unknown> = {},
): Request {
  return new Request(`http://localhost:3000/api/ask-ai?lang=${lang}&mode=${mode}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages, ...extraBody }),
  })
}

function userMessage(text: string): unknown[] {
  return [{ role: 'user', parts: [{ type: 'text', text }] }]
}

/** The mocked model call options captured by streamText. */
function lastCall(): { system?: string; tools?: unknown; maxOutputTokens?: number } {
  const calls = mocks.streamText.mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[calls.length - 1][0] as { system?: string; tools?: unknown; maxOutputTokens?: number }
}

beforeEach(() => {
  process.env.OPENROUTER_API_KEY = 'test-key'
  resetRateLimit()
  mocks.streamText.mockReset()
  mocks.streamText.mockImplementation(() => ({
    toUIMessageStreamResponse: () => new Response(MOCK_STREAM, { status: 200 }),
  }))
})

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.OPENROUTER_API_KEY
  else process.env.OPENROUTER_API_KEY = ORIGINAL_KEY
})

describe('POST /api/ask-ai — RAG context in the system prompt', () => {
  it('injects the Spanish RAG context for a Spanish query', async () => {
    const res = await POST(makeRequest(userMessage('¿Qué es IEC 62443?')))
    expect(res.status).toBe(200)
    expect(await res.text()).toBe(MOCK_STREAM)

    const { system } = lastCall()
    expect(system).toBeDefined()
    // Language + mode header of the system prompt
    expect(system).toContain('EL USUARIO ESTÁ NAVEGANDO EN: ES')
    expect(system).toContain('MODO ACTIVO: ASK')
    // The RAG context block carries the retrieved source verbatim
    expect(system).toContain('[FUENTE: IEC 62443-4-2]')
    // The "available sources" list names the same source
    expect(system).toContain('Fuentes disponibles para esta consulta:')
    expect(system).toContain('IEC 62443-4-2')
  })

  it('injects the English RAG context for an English query', async () => {
    const res = await POST(makeRequest(userMessage('PMP certification'), 'en'))
    expect(res.status).toBe(200)

    const { system } = lastCall()
    expect(system).toContain('EL USUARIO ESTÁ NAVEGANDO EN: EN')
    expect(system).toContain('Portfolio context (use these sources as factual references):')
    // Per-locale corpus (C2): the EN query retrieves the EN certifications entry
    expect(system).toContain('[FUENTE: Main Certifications]')
    expect(system).toContain('Available sources for this query:')
    expect(system).toContain('Main Certifications')
  })

  it('omits the RAG block when the query has no retrieval signal', async () => {
    // All stop words → no query tokens → empty retrieval
    const res = await POST(makeRequest(userMessage('el la y de en')))
    expect(res.status).toBe(200)

    const { system } = lastCall()
    expect(system).toContain('EL USUARIO ESTÁ NAVEGANDO EN: ES')
    expect(system).not.toContain('[FUENTE:')
    expect(system).not.toContain('Fuentes disponibles para esta consulta:')
  })

  it('forwards the mode flag and the passive analysis tools to the model', async () => {
    await POST(makeRequest(userMessage('hola'), 'es', 'chat'))

    const call = lastCall()
    expect(call.system).toContain('MODO ACTIVO: CHAT')
    expect(call.maxOutputTokens).toBe(4096)

    const tools = call.tools as Record<string, unknown> | undefined
    expect(tools).toBeDefined()
    for (const name of ['dnsAnalyzer', 'sslChecker', 'httpHeadersAnalyzer', 'whoisLookup', 'techStackDetector', 'portAnalyzer']) {
      expect(tools![name]).toBeDefined()
    }
    expect(tools).toEqual(askAiTools)
  })

  it('enforces the free-only pool: drops paid entries from the configured pool', async () => {
    const original = process.env.OPENROUTER_MODEL_POOL
    process.env.OPENROUTER_MODEL_POOL = 'inclusionai/ling-3.0-flash:free,google/gemini-3.6-flash'
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const res = await POST(makeRequest(userMessage('hola')))
      expect(res.status).toBe(200)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('google/gemini-3.6-flash'))
    } finally {
      warn.mockRestore()
      if (original === undefined) delete process.env.OPENROUTER_MODEL_POOL
      else process.env.OPENROUTER_MODEL_POOL = original
    }
  })

  it('fails closed with 503 when every configured model is paid (never spends)', async () => {
    const original = process.env.OPENROUTER_MODEL_POOL
    process.env.OPENROUTER_MODEL_POOL = 'google/gemini-3.6-flash,anthropic/claude-sonnet-5'
    try {
      const res = await POST(makeRequest(userMessage('hola')))
      expect(res.status).toBe(503)
      expect(mocks.streamText).not.toHaveBeenCalled()
    } finally {
      if (original === undefined) delete process.env.OPENROUTER_MODEL_POOL
      else process.env.OPENROUTER_MODEL_POOL = original
    }
  })

  it('excludes skipModels from the pool so an auto-retry lands on another model', async () => {
    const original = process.env.OPENROUTER_MODEL_POOL
    process.env.OPENROUTER_MODEL_POOL =
      'inclusionai/ling-3.0-flash:free,google/gemma-4-31b-it:free'
    try {
      const res = await POST(
        makeRequest(userMessage('hola'), 'es', 'ask', {
          skipModels: ['inclusionai/ling-3.0-flash:free'],
        }),
      )
      expect(res.status).toBe(200)
    } finally {
      if (original === undefined) delete process.env.OPENROUTER_MODEL_POOL
      else process.env.OPENROUTER_MODEL_POOL = original
    }
  })

  it('returns 503 when every pool model is skipped', async () => {
    const original = process.env.OPENROUTER_MODEL_POOL
    process.env.OPENROUTER_MODEL_POOL =
      'inclusionai/ling-3.0-flash:free,google/gemma-4-31b-it:free'
    try {
      const res = await POST(
        makeRequest(userMessage('hola'), 'es', 'ask', {
          skipModels: [
            'inclusionai/ling-3.0-flash:free',
            'google/gemma-4-31b-it:free',
          ],
        }),
      )
      expect(res.status).toBe(503)
      expect(mocks.streamText).not.toHaveBeenCalled()
    } finally {
      if (original === undefined) delete process.env.OPENROUTER_MODEL_POOL
      else process.env.OPENROUTER_MODEL_POOL = original
    }
  })

  it('rejects an invalid skipModels payload with 400', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/ask-ai?lang=es', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: userMessage('hola'), skipModels: 'not-an-array' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(mocks.streamText).not.toHaveBeenCalled()
  })

  it('rejects an invalid JSON body with 400', async () => {
    const res = await POST(
      new Request('http://localhost:3000/api/ask-ai?lang=es', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid json',
      }),
    )
    expect(res.status).toBe(400)
    expect(mocks.streamText).not.toHaveBeenCalled()
  })
})

describe('POST /api/ask-ai — memory context', () => {
  it('forwards the memory context into the system prompt', async () => {
    const memoryContext = '\nConversaciones anteriores:\n- IEC 62443: El usuario preguntó: "IEC 62443".\n'
    const res = await POST(makeRequest(userMessage('¿Qué es IEC 62443?'), 'es', 'ask', { memoryContext }))
    expect(res.status).toBe(200)

    const { system } = lastCall()
    expect(system).toContain('Conversaciones anteriores:')
    expect(system).toContain('- IEC 62443: El usuario preguntó: "IEC 62443".')
    // The RAG block is still there — memory is additive background, not a replacement
    expect(system).toContain('[FUENTE: IEC 62443-4-2]')
  })

  it('accepts the memory context without messages', async () => {
    const memoryContext = '\nPast conversations:\n- PMP: User asked: "PMP certification?".\n'
    const res = await POST(
      new Request('http://localhost:3000/api/ask-ai?lang=en', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [], memoryContext }),
      }),
    )
    expect(res.status).toBe(200)

    const { system } = lastCall()
    expect(system).toContain('Past conversations:')
    expect(system).toContain('- PMP: User asked: "PMP certification?".')
  })

  it('rejects an oversized memory context with 400 (zod cap)', async () => {
    const oversized = 'x'.repeat(3001)
    const res = await POST(makeRequest(userMessage('hola'), 'es', 'ask', { memoryContext: oversized }))
    expect(res.status).toBe(400)
    expect(mocks.streamText).not.toHaveBeenCalled()
  })

  it('accepts a memory context at the cap boundary', async () => {
    const atCap = 'x'.repeat(3000)
    const res = await POST(makeRequest(userMessage('hola'), 'es', 'ask', { memoryContext: atCap }))
    expect(res.status).toBe(200)

    const { system } = lastCall()
    expect(system).toContain(atCap)
  })
})
