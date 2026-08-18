'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  DEFAULT_THEME_PREFERENCE,
  persistTheme,
  readStoredTheme,
  readThemeCookie,
  resolveHydrationTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'

interface ThemeContextType {
  /** The user's preference — 'system', 'light' or 'dark'. */
  preference: ThemePreference
  /** The concrete theme applied to the document ('light' | 'dark'). */
  resolved: ResolvedTheme
  setPreference: (pref: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

/** Apply the resolved theme to <html> + the color-scheme meta (same as the inline script). */
function applyThemeClass(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.classList.remove('light', 'dark')
  el.classList.add(resolved)
  el.style.colorScheme = resolved
  const meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) meta.setAttribute('content', resolved)
}

interface ThemeProviderProps {
  children: ReactNode
  /** Initial preference from the server-side cookie read (layout). */
  initialPreference?: ThemePreference
}

export const ThemeProvider = ({
  children,
  initialPreference,
}: ThemeProviderProps) => {
  // First render uses the server-provided preference (what the inline script
  // resolved for the first paint), so hydration never flips the theme.
  const initial: ThemePreference =
    initialPreference ?? DEFAULT_THEME_PREFERENCE
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initial)
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(initial, systemPrefersDark()),
  )

  // Keep the document in sync whenever the resolved theme changes.
  useEffect(() => {
    applyThemeClass(resolved)
  }, [resolved])

  // Follow OS changes while the preference is 'system'.
  useEffect(() => {
    if (preference !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) =>
      setResolved(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [preference])

  // Post-hydration sync via the seam (flash-free, same contract as language):
  // a diverging localStorage preference re-establishes the cookie for the
  // NEXT request — it never renders over the SSR/inline-script first paint.
  const didHydrate = useRef(false)
  useEffect(() => {
    if (didHydrate.current) return
    didHydrate.current = true
    const { preference: resolvedPref, persist } = resolveHydrationTheme(
      initialPreference ?? readThemeCookie(),
      readStoredTheme(),
    )
    if (persist !== null) persistTheme(persist)
    setPreferenceState(resolvedPref)
    setResolved(resolveTheme(resolvedPref, systemPrefersDark()))
  }, [initialPreference])

  // Only an explicit user action changes the preference and persists it.
  const setPreference = useCallback((pref: ThemePreference) => {
    persistTheme(pref)
    setPreferenceState(pref)
    setResolved(resolveTheme(pref, systemPrefersDark()))
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
