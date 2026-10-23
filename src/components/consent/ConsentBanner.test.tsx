import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es', t: (key: string) => key }),
}))

import { ConsentBanner } from './ConsentBanner'
import { CONSENT_COOKIE, openConsentPreferences } from '@/lib/consent'

const regionName = 'shell.consent.aria'

function clearConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0`
}

describe('ConsentBanner', () => {
  beforeEach(() => {
    clearConsentCookie()
  })

  it('shows both choices before a decision and persists acceptance', async () => {
    render(<ConsentBanner />)

    const region = await screen.findByRole('region', { name: regionName })
    expect(region).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'shell.consent.accept' }))

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=granted`)
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: regionName })).toBeNull()
    })
  })

  it('hides after rejection and can be reopened from preferences', async () => {
    render(<ConsentBanner />)

    await screen.findByRole('region', { name: regionName })
    fireEvent.click(screen.getByRole('button', { name: 'shell.consent.reject' }))

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=denied`)
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: regionName })).toBeNull()
    })

    act(() => openConsentPreferences())
    expect(await screen.findByRole('region', { name: regionName })).toBeTruthy()
  })
})
