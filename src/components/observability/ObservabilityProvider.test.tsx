import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'

const initPosthog = vi.hoisted(() => vi.fn())
const initSentry = vi.hoisted(() => vi.fn())
const captureError = vi.hoisted(() => vi.fn())

vi.mock('@/lib/observability/posthog', () => ({ initPosthog }))
vi.mock('@/lib/observability/sentry', () => ({ initSentry, captureError }))

import { ObservabilityProvider } from './ObservabilityProvider'
import { CONSENT_COOKIE, writeConsent } from '@/lib/consent'

function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`
}

describe('ObservabilityProvider consent gate', () => {
  beforeEach(() => {
    clearConsentCookie()
    initPosthog.mockClear()
    initSentry.mockClear()
  })

  it('always initializes Sentry but not PostHog before consent', () => {
    render(
      <ObservabilityProvider>
        <div />
      </ObservabilityProvider>,
    )

    expect(initSentry).toHaveBeenCalledTimes(1)
    expect(initPosthog).not.toHaveBeenCalled()
  })

  it('starts PostHog when consent is granted, without a reload', () => {
    render(
      <ObservabilityProvider>
        <div />
      </ObservabilityProvider>,
    )

    act(() => writeConsent('granted'))
    expect(initPosthog).toHaveBeenCalledTimes(1)

    // Idempotent: a second grant event must not re-initialize the SDK.
    act(() => writeConsent('granted'))
    expect(initPosthog).toHaveBeenCalledTimes(1)
  })

  it('never starts PostHog after a rejection', () => {
    render(
      <ObservabilityProvider>
        <div />
      </ObservabilityProvider>,
    )

    act(() => writeConsent('denied'))
    expect(initPosthog).not.toHaveBeenCalled()
  })
})
