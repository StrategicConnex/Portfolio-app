'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  readConsent,
  subscribeConsent,
  type ConsentState,
} from '@/lib/consent'

interface RumScriptProps {
  src: string
  projectId: string
  apiUrl: string
  /** sha384 SRI hash of the deployed script (see CONTEXT.md → Consent seam). */
  integrity: string
}

/**
 * SCAudit RUM loader, gated by analytics consent (M-05).
 *
 * Before consent the component renders nothing, so no request ever reaches the
 * third-party origin. After the visitor accepts (or on a later visit with a
 * persisted `granted` cookie) the script is injected with Subresource
 * Integrity: if the remote file changes without updating the hash, the browser
 * blocks it (fail-closed) and the rest of the site is unaffected.
 */
export function RumScript({ src, projectId, apiUrl, integrity }: RumScriptProps) {
  const [consent, setConsent] = useState<ConsentState>('unknown')

  useEffect(() => {
    // Client-only cookie read: one-shot, not a render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(readConsent())
    return subscribeConsent(setConsent)
  }, [])

  if (consent !== 'granted') return null

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      integrity={integrity}
      crossOrigin="anonymous"
      data-project-id={projectId}
      data-api-url={apiUrl}
      data-sampling="1.0"
      data-spa-tracking="true"
      data-batch-size="10"
      data-flush-interval="15000"
    />
  )
}
