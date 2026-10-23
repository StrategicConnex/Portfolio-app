'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import {
  CONSENT_OPEN_EVENT,
  readConsent,
  subscribeConsent,
  writeConsent,
  type ConsentDecision,
  type ConsentState,
} from '@/lib/consent'

/**
 * Cookie/analytics banner (M-05).
 *
 * Rendered only after hydration so a returning visitor never sees a flash of
 * the banner before their saved decision is read. Non-modal on purpose: it is
 * a small bottom-left region, it does not trap focus, and the rest of the
 * page stays usable. The same component is re-opened from the footer
 * (`openConsentPreferences()`) to change a previous decision.
 *
 * Accessibility: `role="region"` + `aria-label`, real `<button>`s, token-based
 * colors (AA in both themes), and both options are always visible.
 */
export function ConsentBanner() {
  const { t } = useLanguage()
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<ConsentState>('unknown')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Client-only cookie read: one-shot, not a render loop.
    /* eslint-disable react-hooks/set-state-in-effect */
    setState(readConsent())
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */

    const unsubscribe = subscribeConsent(setState)
    const handleOpen = () => setOpen(true)
    window.addEventListener(CONSENT_OPEN_EVENT, handleOpen)
    return () => {
      unsubscribe()
      window.removeEventListener(CONSENT_OPEN_EVENT, handleOpen)
    }
  }, [])

  const decide = (decision: ConsentDecision) => {
    writeConsent(decision)
    setState(decision)
    setOpen(false)
  }

  if (!hydrated) return null
  if (!open && state !== 'unknown') return null

  return (
    <div
      role="region"
      aria-label={t('shell.consent.aria')}
      className="fixed bottom-4 left-4 z-40 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border-interactive)',
        color: 'var(--text)',
      }}
    >
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t('shell.consent.text')}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide('granted')}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'var(--text)', color: 'var(--bg)' }}
        >
          {t('shell.consent.accept')}
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          className="cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            borderColor: 'var(--border-interactive)',
            color: 'var(--text)',
          }}
        >
          {t('shell.consent.reject')}
        </button>
      </div>
    </div>
  )
}
