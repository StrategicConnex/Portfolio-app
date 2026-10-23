import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_COOKIE,
  openConsentPreferences,
  parseConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from './consent'

function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`
}

describe('consent seam', () => {
  beforeEach(() => {
    clearConsentCookie()
  })

  it('normalizes raw values', () => {
    expect(parseConsent('granted')).toBe('granted')
    expect(parseConsent('denied')).toBe('denied')
    expect(parseConsent('yes')).toBe('unknown')
    expect(parseConsent(undefined)).toBe('unknown')
  })

  it('reads unknown before a decision and the persisted value after', () => {
    expect(readConsent()).toBe('unknown')
    writeConsent('denied')
    expect(readConsent()).toBe('denied')
  })

  it('notifies subscribers on writeConsent', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeConsent(listener)
    writeConsent('granted')
    expect(listener).toHaveBeenCalledWith('granted')
    unsubscribe()
    writeConsent('denied')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('broadcasts the open-preferences event', () => {
    const listener = vi.fn()
    window.addEventListener('portfolio-consent-open', listener)
    openConsentPreferences()
    window.removeEventListener('portfolio-consent-open', listener)
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
