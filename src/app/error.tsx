'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Root error boundary (Next.js `error.tsx` convention).
 * Catches runtime errors from client sections (SIEM dashboard, copilot,
 * WebGL maps, …) and renders a fallback in the site's visual identity
 * instead of the bare default error page. Language-aware via the root
 * layout's LanguageProvider.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    console.error('[App] Error boundary caught:', error)
  }, [error])

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="max-w-md w-full text-center">
        <div
          className="mx-auto mb-6 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(217,164,65,0.1)',
            border: '1px solid rgba(217,164,65,0.35)',
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <p
          className="text-[11px] font-mono tracking-[0.3em] uppercase mb-3"
          style={{ color: 'var(--gold)' }}
        >
          {t('shell.error.eyebrow')}
        </p>
        <h1 className="text-2xl font-bold mb-3 text-white">
          {t('shell.error.title')}
        </h1>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
          {t('shell.error.description')}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={retry}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            style={{
              background: 'var(--gold)',
              color: '#0a0d12',
            }}
          >
            {t('shell.error.retry')}
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
            }}
          >
            {t('shell.error.back')}
          </Link>
        </div>

        {error?.digest ? (
          <p
            className="mt-8 font-mono text-[10px] tracking-wider"
            style={{ color: 'var(--muted)' }}
          >
            DIGEST {error.digest}
          </p>
        ) : null}
      </div>
    </main>
  )
}
