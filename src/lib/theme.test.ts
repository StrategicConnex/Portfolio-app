import { describe, it, expect } from 'vitest'
import {
  THEME_COOKIE,
  THEME_INIT_SCRIPT,
  detectThemeServer,
  detectThemeClient,
  isThemePreference,
  resolveTheme,
} from './theme'

describe('isThemePreference', () => {
  it('accepts the three preferences and rejects everything else', () => {
    expect(isThemePreference('system')).toBe(true)
    expect(isThemePreference('light')).toBe(true)
    expect(isThemePreference('dark')).toBe(true)
    expect(isThemePreference('blue')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
    expect(isThemePreference(undefined)).toBe(false)
    expect(isThemePreference(1)).toBe(false)
  })
})

describe('resolveTheme', () => {
  it('resolves explicit preferences regardless of the OS', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('light', false)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
    expect(resolveTheme('dark', true)).toBe('dark')
  })

  it('follows the OS preference for system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('detectThemeServer', () => {
  it('keeps a valid cookie preference', () => {
    expect(detectThemeServer('dark')).toBe('dark')
    expect(detectThemeServer('light')).toBe('light')
    expect(detectThemeServer('system')).toBe('system')
  })

  it('falls back to system for missing or invalid cookies', () => {
    expect(detectThemeServer(undefined)).toBe('system')
    expect(detectThemeServer(null)).toBe('system')
    expect(detectThemeServer('neon')).toBe('system')
  })
})

describe('detectThemeClient', () => {
  it('prefers the cookie over the stored value', () => {
    expect(detectThemeClient('light', 'dark')).toBe('light')
  })

  it('falls back to localStorage when the cookie is invalid', () => {
    expect(detectThemeClient(null, 'dark')).toBe('dark')
    expect(detectThemeClient('invalid', 'system')).toBe('system')
  })

  it('defaults to system when nothing is valid', () => {
    expect(detectThemeClient(undefined, undefined)).toBe('system')
    expect(detectThemeClient('junk', 'junk')).toBe('system')
  })
})

describe('THEME_INIT_SCRIPT', () => {
  it('references the cookie and never paints without a class', () => {
    expect(THEME_INIT_SCRIPT).toContain(THEME_COOKIE)
    expect(THEME_INIT_SCRIPT).toContain('prefers-color-scheme')
    // Both resolved classes are set/removed explicitly — the page always
    // carries one of the two themes.
    expect(THEME_INIT_SCRIPT).toContain("el.classList.remove('light', 'dark')")
    expect(THEME_INIT_SCRIPT).toContain("el.classList.add(cls)")
    expect(THEME_INIT_SCRIPT).toContain('color-scheme')
  })
})
