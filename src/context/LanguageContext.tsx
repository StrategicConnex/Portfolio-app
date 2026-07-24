'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react'
import { translations } from './translations'

type Language = 'es' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

/** Cookie name used to persist language preference for SSR. */
const LANG_COOKIE = 'portfolio_lang'
const COOKIE_MAX_AGE = 31536000 // 1 year

// ── Reducer (avoids cascading-render lint when multiple state values change) ──

interface State {
  language: Language
  hydrated: boolean
}

type Action =
  | { type: 'HYDRATE'; language: Language }
  | { type: 'SET_LANGUAGE'; language: Language }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { language: action.language, hydrated: true }
    case 'SET_LANGUAGE':
      return { ...state, language: action.language }
  }
}

const INITIAL_STATE: State = { language: 'es', hydrated: false }

// ── Helpers ──

/**
 * Detects language from the browser, preferring localStorage then navigator.language.
 * Only intended to run on the client **after hydration**.
 */
function detectClientLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANG_COOKIE)
    if (saved === 'en') return 'en'
    if (saved === 'es') return 'es'
    if (saved === null) {
      const navLang = navigator.language?.toLowerCase() || ''
      if (navLang.startsWith('en')) return 'en'
    }
  } catch {
    // Silently ignore localStorage/navigator errors
  }
  return 'es'
}

/** Set both localStorage and a short-lived cookie so future SSR can agree. */
function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANG_COOKIE, lang)
    document.cookie = `${LANG_COOKIE}=${lang};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
  } catch {
    // Silently ignore storage errors
  }
}

// ── Provider ──

interface LanguageProviderProps {
  children: ReactNode
  /** Optional initial language from server-side cookie read. */
  initialLanguage?: Language
}

export const LanguageProvider = ({ children, initialLanguage }: LanguageProviderProps) => {
  // Use server-provided initialLanguage when available, otherwise default to 'es'.
  // This makes SSR render in the correct language when a cookie exists.
  // After hydration the effect dispatches HYDRATE to sync with localStorage / browser.
  const initialState: State = initialLanguage
    ? { language: initialLanguage, hydrated: false }
    : INITIAL_STATE
  const [{ language, hydrated }, dispatch] = useReducer(reducer, initialState)

  // After hydration: detect the real language from localStorage → browser
  useEffect(() => {
    const detected = detectClientLanguage()
    dispatch({ type: 'HYDRATE', language: detected })
  }, [])

  // Persist language preference on every change (only after hydration)
  useEffect(() => {
    if (!hydrated) return
    persistLanguage(language)
  }, [language, hydrated])

  const setLanguage = useCallback((lang: Language) => {
    dispatch({ type: 'SET_LANGUAGE', language: lang })
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
