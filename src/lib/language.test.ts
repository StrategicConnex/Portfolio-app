import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE,
  detectLanguageClient,
  detectLanguageServer,
  isLanguage,
  persistLanguage,
  readLanguageCookie,
  readStoredPreference,
  resolveHydrationLanguage,
  type Language,
} from './language'

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

function setNavigatorLanguage(value: string | undefined) {
  Object.defineProperty(navigator, 'language', {
    value,
    configurable: true,
  })
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMockStorage())
  // Start each test with a clean document.cookie
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0].trim()
    if (name) document.cookie = `${name}=;max-age=0`
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  setNavigatorLanguage('en-US')
})

describe('detectLanguageServer (cookie → Accept-Language → default)', () => {
  it('uses the cookie when it is "en"', () => {
    expect(detectLanguageServer('en', 'es-AR,es;q=0.9')).toBe('en')
  })

  it('uses the cookie when it is "es", even over an English header', () => {
    expect(detectLanguageServer('es', 'en-US,en;q=0.9')).toBe('es')
  })

  it('falls back to the Accept-Language header when there is no cookie', () => {
    expect(detectLanguageServer(undefined, 'en-US,en;q=0.9')).toBe('en')
    expect(detectLanguageServer(null, 'en')).toBe('en')
  })

  it('defaults to Spanish when there is no cookie and the header is not English', () => {
    expect(detectLanguageServer(undefined, 'es-AR,es;q=0.9')).toBe(DEFAULT_LANGUAGE)
    expect(detectLanguageServer(undefined, undefined)).toBe(DEFAULT_LANGUAGE)
    expect(detectLanguageServer(undefined, null)).toBe(DEFAULT_LANGUAGE)
  })

  it('treats an unsupported cookie value as the default and skips the header', () => {
    // A garbage cookie must not let the header override it — the user "chose".
    expect(detectLanguageServer('fr', 'en-US,en;q=0.9')).toBe(DEFAULT_LANGUAGE)
  })
})

describe('detectLanguageClient (cookie → navigator → default)', () => {
  it('uses the cookie when it is "en", ignoring the browser hint', () => {
    setNavigatorLanguage('es-AR')
    expect(detectLanguageClient('en')).toBe('en')
  })

  it('uses the cookie when it is "es"', () => {
    setNavigatorLanguage('en-US')
    expect(detectLanguageClient('es')).toBe('es')
  })

  it('does NOT consult localStorage — it is the deferred-preference channel', () => {
    // localStorage says "en" but the cookie (the SSR agreement channel) says "es":
    // the client must agree with SSR, so it resolves to "es" without a flash.
    localStorage.setItem(LANGUAGE_COOKIE, 'en')
    setNavigatorLanguage('es-AR')
    expect(detectLanguageClient('es')).toBe('es')
  })

  it('falls back to navigator.language when there is no cookie', () => {
    setNavigatorLanguage('en-US')
    expect(detectLanguageClient(null)).toBe('en')
    setNavigatorLanguage('en-GB')
    expect(detectLanguageClient(undefined)).toBe('en')
  })

  it('defaults to Spanish when neither the cookie nor navigator hint English', () => {
    setNavigatorLanguage('es-AR')
    expect(detectLanguageClient(null)).toBe(DEFAULT_LANGUAGE)
  })

  it('defaults to Spanish when navigator.language is missing', () => {
    setNavigatorLanguage(undefined)
    expect(detectLanguageClient(null)).toBe(DEFAULT_LANGUAGE)
  })

  it('defaults to Spanish for an unsupported cookie value', () => {
    setNavigatorLanguage('en-US')
    expect(detectLanguageClient('fr')).toBe('en')
    setNavigatorLanguage('es-AR')
    expect(detectLanguageClient('fr')).toBe(DEFAULT_LANGUAGE)
  })

  it('survives navigator failures', () => {
    Object.defineProperty(navigator, 'language', {
      get() { throw new Error('navigator unavailable') },
      configurable: true,
    })
    expect(detectLanguageClient(null)).toBe(DEFAULT_LANGUAGE)
  })
})

describe('readLanguageCookie', () => {
  it('reads the language cookie from document.cookie', () => {
    document.cookie = `${LANGUAGE_COOKIE}=en;path=/`
    expect(readLanguageCookie()).toBe('en')
  })

  it('returns null when the cookie is absent or another cookie exists', () => {
    document.cookie = 'other=value;path=/'
    expect(readLanguageCookie()).toBe(null)
  })

  it('returns null outside the browser', () => {
    vi.stubGlobal('document', undefined)
    expect(readLanguageCookie()).toBe(null)
  })
})

describe('readStoredPreference', () => {
  it('returns the stored language when valid', () => {
    localStorage.setItem(LANGUAGE_COOKIE, 'en')
    expect(readStoredPreference()).toBe('en')
  })

  it('returns null when nothing is stored or the value is invalid', () => {
    expect(readStoredPreference()).toBe(null)
    localStorage.setItem(LANGUAGE_COOKIE, 'fr')
    expect(readStoredPreference()).toBe(null)
  })

  it('survives storage failures', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('SecurityError') },
    })
    expect(readStoredPreference()).toBe(null)
  })
})

describe('resolveHydrationLanguage (flash-free hydration)', () => {
  it('first visit (no stored preference): adopts the resolved language', () => {
    expect(resolveHydrationLanguage('es', null)).toEqual({ language: 'es', persist: 'es' })
    expect(resolveHydrationLanguage('en', undefined)).toEqual({ language: 'en', persist: 'en' })
  })

  it('stored preference agrees with the cookie: nothing to persist', () => {
    expect(resolveHydrationLanguage('en', 'en')).toEqual({ language: 'en', persist: null })
    expect(resolveHydrationLanguage('es', 'es')).toEqual({ language: 'es', persist: null })
  })

  it('divergence: keeps the SSR first paint and re-establishes the stored choice for the next request', () => {
    // Cookie expired/cleared while the choice persisted: SSR rendered "es"
    // (from the header), localStorage still says "en". No flash on this
    // visit — render "es" — but re-establish the cookie so the NEXT request
    // honors "en".
    expect(resolveHydrationLanguage('es', 'en')).toEqual({ language: 'es', persist: 'en' })
    expect(resolveHydrationLanguage('en', 'es')).toEqual({ language: 'en', persist: 'es' })
  })

  it('ignores an invalid stored preference like a missing one', () => {
    expect(resolveHydrationLanguage('es', 'fr')).toEqual({ language: 'es', persist: 'es' })
    expect(resolveHydrationLanguage('en', '')).toEqual({ language: 'en', persist: 'en' })
  })
})

describe('isLanguage', () => {
  it('accepts only supported languages', () => {
    expect(isLanguage('es')).toBe(true)
    expect(isLanguage('en')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
    expect(isLanguage(undefined)).toBe(false)
    expect(isLanguage(null)).toBe(false)
    expect(isLanguage('')).toBe(false)
  })
})

describe('persistLanguage', () => {
  it('writes both localStorage and the SSR cookie', () => {
    persistLanguage('en' as Language)
    expect(localStorage.getItem(LANGUAGE_COOKIE)).toBe('en')
    // jsdom's document.cookie keeps only name=value (attributes are not readable)
    expect(document.cookie).toBe(`${LANGUAGE_COOKIE}=en`)
  })

  it('survives storage failures', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new Error('QuotaExceededError') },
    })
    expect(() => persistLanguage('es' as Language)).not.toThrow()
  })
})
