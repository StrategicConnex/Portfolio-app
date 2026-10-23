import { describe, expect, it, vi } from 'vitest'

const captureError = vi.hoisted(() => vi.fn(async () => {}))

vi.mock('./sentry', () => ({ captureError }))

import { reportRouteError } from './route-errors'

describe('reportRouteError', () => {
  it('forwards the route and extra context to Sentry', () => {
    reportRouteError('/api/contact', new Error('resend down'), { status: 500 })

    expect(captureError).toHaveBeenCalledTimes(1)
    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'resend down' }),
      { route: '/api/contact', status: 500 },
    )
  })

  it('normalizes non-Error thrown values instead of dropping them', () => {
    reportRouteError('/api/chat', 'unexpected string')

    expect(captureError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'unexpected string' }),
      { route: '/api/chat' },
    )
  })
})
