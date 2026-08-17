'use client'

import { notFound } from 'next/navigation'

/**
 * Test-only route: throws during render so the root error boundary
 * (`error.tsx`) can be exercised by e2e tests.
 *
 * Guarded so the throwing code only ships where it is needed:
 * - development builds: always throws (local `npm run dev`);
 * - CI production builds: throws only when built with
 *   `NEXT_PUBLIC_E2E_ERROR_ROUTE=1` (the GitHub Actions e2e job);
 * - real production deployments: renders a 404, the throwing code
 *   never ships. Never linked from the UI.
 */
export default function TestErrorPage() {
  const e2eRouteEnabled = process.env.NEXT_PUBLIC_E2E_ERROR_ROUTE === '1'
  if (process.env.NODE_ENV !== 'development' && !e2eRouteEnabled) {
    notFound()
  }
  throw new Error('E2E forced render error for error boundary')
}
