import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getThreatIntelSnapshot: vi.fn(),
}))

vi.mock('@/features/threat-intel/server', () => ({
  getThreatIntelSnapshot: mocks.getThreatIntelSnapshot,
}))

import { controlMapView, mapControlSchema } from './map-control'

function snapshotWith(events: unknown[]) {
  return {
    events,
    generatedAt: '2026-10-25T12:00:00.000Z',
    dataSource: 'live' as const,
    geolocatedCount: events.length,
    sourceStatus: { dshield: 'live' as const, kev: 'live' as const },
    cacheTtlSeconds: { dshield: 60, kev: 600 },
  }
}

const event = {
  id: 'event-1',
  source: 'DShield (SANS ISC)',
  type: 'Port Scan / Probe',
  originCountry: 'China',
  originIp: '198.51.100.7',
  timestamp: '2026-10-25T11:59:00.000Z',
  severity: 'medium' as const,
}

beforeEach(() => {
  mocks.getThreatIntelSnapshot.mockReset()
})

describe('controlMapView', () => {
  it('clears the filter without reading the feed', async () => {
    const result = await controlMapView({ action: 'clear-filter' })

    expect(result).toEqual({
      applied: true,
      command: { action: 'clear-filter' },
    })
    expect(mocks.getThreatIntelSnapshot).not.toHaveBeenCalled()
  })

  it('returns the canonical command and the real event count for a known country', async () => {
    mocks.getThreatIntelSnapshot.mockResolvedValue(
      snapshotWith([
        event,
        { ...event, id: 'event-2', originIp: '198.51.100.9' },
        // Sin IP real no es un origen atribuible: no cuenta.
        { ...event, id: 'event-3', originIp: undefined },
        { ...event, id: 'event-4', originCountry: 'Russia' },
      ]),
    )

    const result = await controlMapView({ action: 'focus-country', country: 'china' })

    expect(result).toEqual({
      applied: true,
      command: { action: 'focus-country', country: 'China' },
      country: 'China',
      liveEventCount: 2,
      dataSource: 'live',
    })
  })

  it('does not invent a command for a country outside the dataset', async () => {
    const result = await controlMapView({ action: 'focus-country', country: 'Narnia' })

    expect(result.applied).toBe(false)
    expect(result.reason).toBe('unknown-country')
    expect(result.command).toBeUndefined()
    expect(mocks.getThreatIntelSnapshot).not.toHaveBeenCalled()
  })

  it('asks for a country when focus-country arrives without one', async () => {
    const result = await controlMapView({ action: 'focus-country' })

    expect(result.applied).toBe(false)
    expect(result.reason).toBe('missing-country')
    expect(result.command).toBeUndefined()
  })

  it('still applies the command when the feed fails (no invented count)', async () => {
    mocks.getThreatIntelSnapshot.mockRejectedValue(new Error('feed down'))

    const result = await controlMapView({ action: 'focus-country', country: 'China' })

    expect(result).toEqual({
      applied: true,
      command: { action: 'focus-country', country: 'China' },
      country: 'China',
    })
  })

  it('bounds the country string and rejects unknown actions', () => {
    expect(mapControlSchema.safeParse({ action: 'focus-country' }).success).toBe(true)
    expect(
      mapControlSchema.safeParse({ action: 'focus-country', country: 'x'.repeat(65) })
        .success,
    ).toBe(false)
    expect(mapControlSchema.safeParse({ action: 'unknown' }).success).toBe(false)
  })
})
