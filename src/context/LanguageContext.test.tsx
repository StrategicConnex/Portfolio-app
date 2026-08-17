import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, renderHook } from '@testing-library/react'
import { LanguageProvider, useLanguage } from './LanguageContext'
import type { ReactNode } from 'react'

const STORAGE_KEY = 'portfolio_lang'
// Mock localStorage for jsdom
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
  const mock = createMockStorage()
  vi.stubGlobal('localStorage', mock)
  // Stub navigator.language to 'es-AR' so auto-detection defaults to Spanish
  Object.defineProperty(navigator, 'language', { value: 'es-AR', configurable: true })
  // Start each test with a clean document.cookie
  document.cookie.split(';').forEach((part) => {
    const name = part.split('=')[0].trim()
    if (name) document.cookie = `${name}=;max-age=0`
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  // Restore navigator.language
  Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
})

function renderWithProvider(ui: ReactNode) {
  return render(<LanguageProvider>{ui}</LanguageProvider>)
}

describe('LanguageProvider', () => {
  it('should render children', () => {
    renderWithProvider(<div data-testid="child">Hello</div>)
    expect(screen.getByTestId('child')).toBeDefined()
    expect(screen.getByText('Hello')).toBeDefined()
  })

  it('should default to Spanish when no localStorage value', () => {
    let lang: string | undefined
    function Consumer() {
      const { language } = useLanguage()
      lang = language
      return null
    }
    renderWithProvider(<Consumer />)
    expect(lang).toBe('es')
  })

  it('keeps the default render when a stored preference diverges (no flash)', () => {
    // Cookie absent + localStorage "en" + browser es: the SSR agreement channel
    // wins for the first paint ("es"), the stored choice is only re-established
    // for the next request — never rendered over the first paint.
    localStorage.setItem(STORAGE_KEY, 'en')
    let lang: string | undefined
    function Consumer() {
      const { language } = useLanguage()
      lang = language
      return null
    }
    renderWithProvider(<Consumer />)
    expect(lang).toBe('es')
    // The stored preference is preserved, not overwritten…
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
    // …but the cookie is re-established from it so the next SSR honors "en".
    expect(document.cookie).toContain(`${STORAGE_KEY}=en`)
  })

  it('renders the cookie language on hydration (SSR agreement)', () => {
    // The proxy guarantees the cookie on every response, so the client sees
    // the same value SSR used and hydrates without flipping.
    document.cookie = `${STORAGE_KEY}=en;path=/`
    let lang: string | undefined
    function Consumer() {
      const { language } = useLanguage()
      lang = language
      return null
    }
    renderWithProvider(<Consumer />)
    expect(lang).toBe('en')
  })

  it('should fallback to Spanish for invalid localStorage values', () => {
    localStorage.setItem(STORAGE_KEY, 'fr')
    let lang: string | undefined
    function Consumer() {
      const { language } = useLanguage()
      lang = language
      return null
    }
    renderWithProvider(<Consumer />)
    expect(lang).toBe('es')
  })

  it('should persist language to localStorage after setLanguage', () => {
    let setLanguageFn: ((l: 'es' | 'en') => void) | undefined
    function Consumer() {
      const { language, setLanguage } = useLanguage()
      setLanguageFn = setLanguage
      return <span>{language}</span>
    }
    renderWithProvider(<Consumer />)
    act(() => { setLanguageFn!('en') })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en')
  })

  it('should update localStorage language after switching back to Spanish', () => {
    let setLanguageFn: ((l: 'es' | 'en') => void) | undefined
    function Consumer() {
      const { language, setLanguage } = useLanguage()
      setLanguageFn = setLanguage
      return <span>{language}</span>
    }
    renderWithProvider(<Consumer />)
    // After hydration, default 'es' is saved
    // Switch to English then back to Spanish
    act(() => { setLanguageFn!('en') })
    act(() => { setLanguageFn!('es') })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('es')
  })

  it('should update translations after language change', () => {
    let setLanguageFn: ((l: 'es' | 'en') => void) | undefined
    let translateFn: ((k: string) => string) | undefined
    function Consumer() {
      const { t, setLanguage } = useLanguage()
      setLanguageFn = setLanguage
      translateFn = t
      return null
    }
    renderWithProvider(<Consumer />)
    expect(translateFn!('hero.cta.history')).toBe('Historial Crítico')
    act(() => { setLanguageFn!('en') })
    expect(translateFn!('hero.cta.history')).toBe('Critical History')
  })

  it('should return the key itself when translation is missing', () => {
    function Consumer() {
      const { t } = useLanguage()
      return <span>{t('nonexistent.key')}</span>
    }
    renderWithProvider(<Consumer />)
    expect(screen.getByText('nonexistent.key')).toBeDefined()
  })

})

describe('useLanguage hook', () => {
  it('should return language context when used inside provider', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    })
    expect(result.current.language).toBe('es')
    expect(typeof result.current.setLanguage).toBe('function')
    expect(typeof result.current.t).toBe('function')
  })

  it('should throw error when used outside provider', () => {
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within a LanguageProvider'
    )
  })

  it('should update language via setLanguage', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    })
    act(() => { result.current.setLanguage('en') })
    expect(result.current.language).toBe('en')
  })

  it('should provide correct translations for each language', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    })
    expect(result.current.t('nav.profile')).toBe('Perfil')
    expect(result.current.t('contact.form.send')).toBe('Enviar Protocolo de Contacto')
    expect(result.current.t('siem.kpi.uptime')).toBe('Uptime Red Industrial')
    act(() => { result.current.setLanguage('en') })
    expect(result.current.t('nav.profile')).toBe('Profile')
    expect(result.current.t('contact.form.send')).toBe('Send Contact Protocol')
    expect(result.current.t('siem.kpi.uptime')).toBe('Industrial Network Uptime')
  })

  it('should handle independent language switches', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider,
    })
    act(() => { result.current.setLanguage('en') })
    expect(result.current.language).toBe('en')
    act(() => { result.current.setLanguage('es') })
    expect(result.current.language).toBe('es')
    act(() => { result.current.setLanguage('en') })
    expect(result.current.language).toBe('en')
  })
})
