import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useConversationMemory } from './use-conversation-memory'
import { loadMemory, addSummary } from './conversation-memory'

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

beforeEach(() => {
  vi.stubGlobal('localStorage', createMockStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useConversationMemory', () => {
  it('returns an empty memory context when no summaries exist', () => {
    const { result } = renderHook(() => useConversationMemory('es'))
    expect(result.current.memoryContext).toBe('')
  })

  it('builds a localized context from the stored summaries', () => {
    addSummary({ title: 'IEC 62443', summary: 'El usuario preguntó: "IEC 62443".', messageCount: 1, topics: ['IEC'] })
    const { result } = renderHook(() => useConversationMemory('es'))
    expect(result.current.memoryContext).toContain('Conversaciones anteriores:')
    expect(result.current.memoryContext).toContain('IEC 62443')
  })

  it('rebuilds the context when the language changes', () => {
    addSummary({ title: 'PMP', summary: 'User asked about PMP.', messageCount: 1, topics: ['PMP'] })
    const { result, rerender } = renderHook(
      ({ lang }: { lang: 'es' | 'en' }) => useConversationMemory(lang),
      {
        initialProps: { lang: 'es' },
      },
    )
    expect(result.current.memoryContext).toContain('Conversaciones anteriores:')
    rerender({ lang: 'en' })
    expect(result.current.memoryContext).toContain('Past conversations:')
  })

  it('persists a real summary via rememberConversation and refreshes the context', () => {
    const { result } = renderHook(() => useConversationMemory('es'))
    expect(result.current.memoryContext).toBe('')

    let persisted = false
    act(() => {
      persisted = result.current.rememberConversation([
        message('user', '¿Qué es IEC 62443?'),
        message('assistant', 'Es un estándar de ciberseguridad industrial.'),
      ])
    })

    expect(persisted).toBe(true)
    const memory = loadMemory()
    expect(memory.summaries).toHaveLength(1)
    expect(memory.summaries[0].title).toBe('¿Qué es IEC 62443?')
    expect(memory.summaries[0].topics).toContain('IEC')

    // The version bump makes the next request carry the new summary
    expect(result.current.memoryContext).toContain('Conversaciones anteriores:')
    expect(result.current.memoryContext).toContain('¿Qué es IEC 62443?')
  })

  it('does not persist when there is nothing to summarize', () => {
    const { result } = renderHook(() => useConversationMemory('es'))
    let persisted = true
    act(() => {
      persisted = result.current.rememberConversation([])
    })
    expect(persisted).toBe(false)
    expect(loadMemory().summaries).toHaveLength(0)
    expect(result.current.memoryContext).toBe('')
  })
})
