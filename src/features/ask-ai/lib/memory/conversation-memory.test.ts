import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadMemory,
  saveMemory,
  addSummary,
  updatePreferences,
  buildMemoryContext,
  summarizeConversation,
  type MemoryState,
  type ConversationSummary,
} from './conversation-memory'

const STORAGE_KEY = 'ask-ai-memory'

function message(role: string, text: string) {
  return { role, parts: [{ type: 'text', text }] }
}

// Mock localStorage for jsdom (project convention, see LanguageContext.test.tsx)
function createMockStorage() {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
    get length() { return Object.keys(store).length },
    key: (i: number) => Object.keys(store)[i] ?? null,
  }
}

function summary(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'conv-1',
    title: 'IEC 62443',
    summary: 'El usuario preguntó: "IEC 62443".',
    messageCount: 2,
    lastUpdated: '2026-08-16T00:00:00.000Z',
    topics: ['IEC', '62443'],
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMockStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadMemory / saveMemory', () => {
  it('returns the default memory when nothing is stored', () => {
    const memory = loadMemory()
    expect(memory.summaries).toEqual([])
    expect(memory.preferences).toEqual({ language: 'es', mode: 'ask' })
    expect(memory.currentTopics).toEqual([])
  })

  it('returns the default memory when the stored value is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadMemory().summaries).toEqual([])
  })

  it('round-trips a saved memory state', () => {
    const memory: MemoryState = {
      summaries: [summary()],
      preferences: { language: 'en', mode: 'osint' },
      currentTopics: ['IEC'],
    }
    saveMemory(memory)
    expect(loadMemory()).toEqual(memory)
  })
})

describe('addSummary', () => {
  it('unshifts the summary and assigns id + lastUpdated', () => {
    const before = new Date('2026-01-01T00:00:00.000Z')
    vi.setSystemTime(before)
    const memory = addSummary({
      title: 'PMP',
      summary: 'User asked about PMP.',
      messageCount: 1,
      topics: ['PMP'],
    })
    expect(memory.summaries).toHaveLength(1)
    expect(memory.summaries[0].title).toBe('PMP')
    expect(memory.summaries[0].id).toMatch(/^conv-/)
    expect(memory.summaries[0].lastUpdated).toBe(before.toISOString())
    vi.useRealTimers()
  })

  it('caps the stored summaries at 20 (newest first)', () => {
    for (let i = 0; i < 25; i++) {
      addSummary({ title: `conv-${i}`, summary: 'x', messageCount: 1, topics: [] })
    }
    const memory = loadMemory()
    expect(memory.summaries).toHaveLength(20)
    expect(memory.summaries[0].title).toBe('conv-24')
    expect(memory.summaries[19].title).toBe('conv-5')
  })
})

describe('updatePreferences', () => {
  it('merges partial preferences and persists', () => {
    updatePreferences({ language: 'en' })
    const memory = loadMemory()
    expect(memory.preferences).toEqual({ language: 'en', mode: 'ask' })
    updatePreferences({ mode: 'analyze' })
    expect(loadMemory().preferences).toEqual({ language: 'en', mode: 'analyze' })
  })
})

describe('buildMemoryContext', () => {
  it('returns an empty string when there are no summaries', () => {
    expect(buildMemoryContext()).toBe('')
    expect(buildMemoryContext(loadMemory(), 'es')).toBe('')
  })

  it('formats the last 3 summaries in Spanish', () => {
    const memory = loadMemory()
    memory.summaries = [summary({ title: 'A' }), summary({ title: 'B' }), summary({ title: 'C' }), summary({ title: 'D' })]
    const context = buildMemoryContext(memory, 'es')
    expect(context).toContain('Conversaciones anteriores:')
    expect(context).toContain('- A:')
    expect(context).toContain('- B:')
    expect(context).toContain('- C:')
    expect(context).not.toContain('- D:')
  })

  it('formats in English with the last 3 summaries', () => {
    const memory = loadMemory()
    memory.summaries = [summary({ title: 'PMP' })]
    expect(buildMemoryContext(memory, 'en')).toContain('Past conversations:')
    expect(buildMemoryContext(memory, 'en')).toContain('- PMP:')
  })
})

describe('summarizeConversation', () => {
  it('derives title, question/answer summary, count and topics', () => {
    const result = summarizeConversation(
      [
        message('user', '¿Qué cubre IEC 62443 en seguridad industrial?'),
        message('assistant', 'IEC 62443 cubre la ciberseguridad de los sistemas de control industrial.'),
      ],
      'es',
    )
    expect(result).not.toBeNull()
    expect(result!.title).toBe('¿Qué cubre IEC 62443 en seguridad industrial?')
    expect(result!.summary).toContain('El usuario preguntó:')
    expect(result!.summary).toContain('El asistente respondió:')
    expect(result!.messageCount).toBe(1)
    expect(result!.topics).toContain('IEC')
    expect(result!.topics).toContain('62443')
  })

  it('renders the English phrasing for en', () => {
    const result = summarizeConversation([message('user', 'PMP certification?')], 'en')
    expect(result!.summary).toContain('User asked:')
    expect(result!.summary).toContain('No assistant response yet.')
  })

  it('truncates a long title and long excerpts', () => {
    const long = 'x'.repeat(200)
    const result = summarizeConversation(
      [message('user', long), message('assistant', 'y'.repeat(400))],
      'es',
      { maxTitleLength: 20, maxSummaryLength: 50 },
    )
    expect(result!.title.length).toBeLessThanOrEqual(20)
    expect(result!.title.endsWith('…')).toBe(true)
    // Each excerpt is capped at maxSummaryLength (plus ellipsis) — the total
    // also carries the ES boilerplate, so assert the cap per excerpt.
    expect(result!.summary).not.toContain('y'.repeat(400))
    expect(result!.summary.split('"').length).toBeGreaterThan(3)
    expect(result!.summary.length).toBeLessThan(160)
  })

  it('counts all user messages, not only the first', () => {
    const result = summarizeConversation(
      [message('user', 'hola'), message('assistant', 'Hola'), message('user', 'cuéntame del SIEM'), message('assistant', 'El SIEM...')],
      'es',
    )
    expect(result!.messageCount).toBe(2)
    expect(result!.title).toBe('hola')
  })

  it('ignores non-text parts (e.g. tool invocations)', () => {
    const withTool = [
      { role: 'user', parts: [{ type: 'text', text: 'analiza el puerto 443' }] },
      {
        role: 'assistant',
        parts: [
          { type: 'tool-invocation', toolInvocation: {} },
          { type: 'text', text: 'El puerto 443 está abierto.' },
        ],
      },
    ]
    const result = summarizeConversation(withTool as never, 'es')
    expect(result).not.toBeNull()
    expect(result!.summary).toContain('El puerto 443 está abierto.')
  })

  it('returns null when there are no user messages or no text at all', () => {
    expect(summarizeConversation([], 'es')).toBeNull()
    expect(summarizeConversation([message('assistant', 'hola')], 'es')).toBeNull()
  })

  it('extracts deduplicated technical topics, max 5', () => {
    // Order matters: with 6+ candidates, the max-5 cap fills from first match,
    // so put the asserted topics early in the prompt.
    const result = summarizeConversation(
      [message('user', 'SIEM SIEM con 62443, NIST CSF e ISO 27001, además de OSINT y PMP')],
      'es',
    )
    expect(result!.topics.length).toBeLessThanOrEqual(5)
    expect(new Set(result!.topics).size).toBe(result!.topics.length)
    expect(result!.topics).toContain('SIEM')
    expect(result!.topics).toContain('62443')
  })
})
