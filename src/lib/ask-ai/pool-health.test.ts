import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  loadFailedModels,
  persistFailedModels,
  FAILED_MODELS_KEY,
  FAILED_MODELS_TTL_MS,
} from './pool-health'

/** Minimal in-memory Storage substitute — no DOM needed. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data: Record<string, string> = { ...initial }
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value
    },
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('loadFailedModels', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadFailedModels(fakeStorage())).toEqual([])
  })

  it('returns an empty list on corrupt JSON', () => {
    const storage = fakeStorage({ [FAILED_MODELS_KEY]: '{not json' })
    expect(loadFailedModels(storage)).toEqual([])
  })

  it('returns an empty list on an unexpected shape', () => {
    const storage = fakeStorage({ [FAILED_MODELS_KEY]: JSON.stringify({ models: 'nope' }) })
    expect(loadFailedModels(storage)).toEqual([])
  })

  it('returns the models stored within the TTL window', () => {
    const storage = fakeStorage({
      [FAILED_MODELS_KEY]: JSON.stringify({
        models: ['google/gemma-4-31b-it:free'],
        savedAt: Date.now() - 60_000,
      }),
    })
    expect(loadFailedModels(storage)).toEqual(['google/gemma-4-31b-it:free'])
  })

  it('drops models older than the TTL (self-healing skip)', () => {
    vi.useFakeTimers()
    const savedAt = Date.now()
    const storage = fakeStorage({
      [FAILED_MODELS_KEY]: JSON.stringify({
        models: ['google/gemma-4-31b-it:free'],
        savedAt,
      }),
    })

    // Just inside the TTL → still skipped.
    vi.setSystemTime(savedAt + FAILED_MODELS_TTL_MS - 1)
    expect(loadFailedModels(storage)).toEqual(['google/gemma-4-31b-it:free'])

    // Just past the TTL → tried again.
    vi.setSystemTime(savedAt + FAILED_MODELS_TTL_MS + 1)
    expect(loadFailedModels(storage)).toEqual([])
  })
})

describe('persistFailedModels', () => {
  it('writes the { models, savedAt } record', () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_700_000_000_000)
    const storage = fakeStorage()

    persistFailedModels(['a:free', 'b:free'], storage)

    expect(JSON.parse(storage.getItem(FAILED_MODELS_KEY)!)).toEqual({
      models: ['a:free', 'b:free'],
      savedAt: 1_700_000_000_000,
    })
  })

  it('round-trips: persist then load returns the same models', () => {
    const storage = fakeStorage()
    persistFailedModels(['a:free', 'b:free'], storage)
    expect(loadFailedModels(storage)).toEqual(['a:free', 'b:free'])
  })
})
