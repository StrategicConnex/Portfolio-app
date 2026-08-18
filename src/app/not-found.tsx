'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

/**
 * Custom 404 page (Next.js `not-found.tsx` convention).
 * Renders when a route segment throws `notFound()` or no route matches.
 * Language-aware: rendered inside the root layout's LanguageProvider, so SSR
 * uses the cookie/header detection from the language seam.
 */
export default function NotFound() {
  const { t } = useLanguage()

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="max-w-md w-full text-center">
        <p
          className="font-mono text-[11px] tracking-[0.3em] uppercase mb-4"
          style={{ color: 'var(--gold)' }}
        >
          {t('shell.notfound.eyebrow')}
        </p>

        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="font-mono text-7xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            4
          </span>
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-xl font-bold"
            style={{
              background: 'rgba(217,164,65,0.1)',
              border: '1px solid rgba(217,164,65,0.4)',
              color: 'var(--gold)',
            }}
          >
            0
          </span>
          <span className="font-mono text-7xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            4
          </span>
        </div>

        <h1 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          {t('shell.notfound.title')}
        </h1>
        <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
          {t('shell.notfound.description')}
        </p>

        <Link
          href="/"
          className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            background: 'var(--gold)',
            color: '#0a0d12',
          }}
        >
          {t('shell.notfound.back')}
        </Link>
      </div>
    </main>
  )
}
