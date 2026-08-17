'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useRef } from 'react'
import { translations } from './translations'
import {
  DEFAULT_LANGUAGE,
  persistLanguage,
  readLanguageCookie,
  readStoredPreference,
  resolveHydrationLanguage,
  type Language,
} from '@/lib/language'

export type { Language }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// ── Reducer (avoids cascading-render lint when multiple state values change) ──

interface State {
  language: Language
}

type Action = { type: 'HYDRATE' | 'SET_LANGUAGE'; language: Language }

function reducer(state: State, action: Action): State {
  return { language: action.language }
}

const INITIAL_STATE: State = { language: DEFAULT_LANGUAGE }

// ── Provider ──

interface LanguageProviderProps {
  children: ReactNode
  /** Optional initial language from server-side cookie read. */
  initialLanguage?: Language
}

export const LanguageProvider = ({ children, initialLanguage }: LanguageProviderProps) => {
  // First render uses the server-provided language (what SSR painted), so the
  // hydrated DOM matches the served HTML — no first-paint flip.
  const initialState: State = initialLanguage
    ? { language: initialLanguage }
    : INITIAL_STATE
  const [{ language }, dispatch] = useReducer(reducer, initialState)

  // Resolve the post-hydration language once, flash-free, via the seam. The
  // SSR language (guaranteed by the proxy cookie) is the agreement anchor —
  // using it instead of the live cookie keeps the resolution stable even
  // though the effect's own persist() rewrites the cookie. The ref guard
  // additionally absorbs Next dev's StrictMode double-invocation. A
  // diverging localStorage preference is re-established for the NEXT
  // request, never rendered over the SSR first paint.
  const didHydrate = useRef(false)
  useEffect(() => {
    if (didHydrate.current) return
    didHydrate.current = true
    const { language: resolved, persist } = resolveHydrationLanguage(
      initialLanguage ?? readLanguageCookie(),
      readStoredPreference(),
    )
    if (persist !== null) persistLanguage(persist)
    dispatch({ type: 'HYDRATE', language: resolved })
  }, [initialLanguage])

  // Only an explicit user action changes the language and persists it.
  const setLanguage = useCallback((lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', language: lang })
    persistLanguage(lang)
  }, [])

  const t = useCallback((key: string): string => {
    return translations[language][key] || key
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
