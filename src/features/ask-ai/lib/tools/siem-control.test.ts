import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SiemFeedPayload } from '@/lib/siem-feed'

const mocks = vi.hoisted(() => ({
  getSiemFeedData: vi.fn(),
}))

vi.mock('@/lib/siem-feed', () => ({
  getSiemFeedData: mocks.getSiemFeedData,
}))

import { controlSiemView, siemControlSchema } from './siem-control'

function payloadWith(overrides: Partial<SiemFeedPayload> = {}): SiemFeedPayload {
  return {
    logs: [],
    lastUpdated: '2026-10-25T12:00:00.000Z',
    source: 'test',
    usingLiveData: true,
    summary: {
      critical: 7,
      alert: 5,
      warn: 4,
      info: 2,
      c2Unique: 3,
      targetedPorts: 6,
      scanReports: 0,
    },
    attackers: [],
    ports: [],
    malware: [],
    feedsStatus: { feodo: 'live', dshield: 'live' },
    cacheTtlSeconds: { feodo: 60, dshield: 300, payload: 30 },
    ...overrides,
  }
}

beforeEach(() => {
  mocks.getSiemFeedData.mockReset()
})

describe('controlSiemView', () => {
  it('clears the filter without reading the feed', async () => {
    await expect(controlSiemView({ action: 'clear-filter' })).resolves.toEqual({
      applied: true,
      command: { action: 'clear-filter' },
    })
    expect(mocks.getSiemFeedData).not.toHaveBeenCalled()
  })

  it('asks for a severity when filter-severity arrives without one', async () => {
    const result = await controlSiemView({ action: 'filter-severity' })

    expect(result.applied).toBe(false)
    expect(result.reason).toBe('missing-level')
    expect(result.command).toBeUndefined()
    expect(mocks.getSiemFeedData).not.toHaveBeenCalled()
  })

  it.each([
    ['CRITICAL', 7],
    ['ALERT', 5],
    ['WARN', 4],
    ['INFO', 2],
  ] as const)('counts the real %s events from the same payload as the panel', async (level, count) => {
    mocks.getSiemFeedData.mockResolvedValue(payloadWith())

    const result = await controlSiemView({ action: 'filter-severity', level })

    expect(result).toEqual({
      applied: true,
      command: { action: 'filter-severity', level },
      level,
      eventCount: count,
      usingLiveData: true,
      feedsStatus: { feodo: 'live', dshield: 'live' },
    })
  })

  it('still applies the filter when the feed fails (no invented count)', async () => {
    mocks.getSiemFeedData.mockRejectedValue(new Error('feed down'))

    const result = await controlSiemView({ action: 'filter-severity', level: 'CRITICAL' })

    expect(result).toEqual({
      applied: true,
      command: { action: 'filter-severity', level: 'CRITICAL' },
      level: 'CRITICAL',
    })
  })

  it('rejects severities outside the feed vocabulary', () => {
    expect(
      siemControlSchema.safeParse({ action: 'filter-severity', level: 'DEBUG' }).success,
    ).toBe(false)
    expect(
      siemControlSchema.safeParse({ action: 'filter-severity', level: 'CRITICAL' }).success,
    ).toBe(true)
  })
})
