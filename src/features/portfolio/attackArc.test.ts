import { describe, it, expect } from 'vitest'
import { COUNTRY_COORDS, PROTECTED_HUB } from '@/data/countryCoords'
import {
  ATTACK_TYPES,
  DESTINATION_WEIGHTS,
  PROTECTED_DESTINATIONS,
  attackTypeFor,
  buildAttackArc,
  pickDestination,
} from './attackArc'

const fallbackType = ATTACK_TYPES[ATTACK_TYPES.length - 1]
const countries = Object.keys(COUNTRY_COORDS)

describe('attackTypeFor', () => {
  it('maps the event text published by the endpoint to a known attack type', () => {
    expect(attackTypeFor('Port Scan / Probe', fallbackType).type).toBe('Port Scan / Probe')
    expect(attackTypeFor('Exploit: CVE-2024-3094 (origen no atribuido)', fallbackType).type).toBe(
      'APT / Exploit',
    )
    expect(attackTypeFor('DDoS / Flood', fallbackType).type).toBe('DDoS / Flood')
  })

  it('falls back instead of inventing a type', () => {
    expect(attackTypeFor(undefined, fallbackType)).toBe(fallbackType)
    expect(attackTypeFor('algo desconocido', fallbackType)).toBe(fallbackType)
  })

  it('gives every attack type a short unique code for the stats bar', () => {
    const codes = ATTACK_TYPES.map((t) => t.code)

    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toMatch(/^[A-Z0-9]{3}$/)
  })
})

describe('pickDestination', () => {
  it('sends 5% of the arcs to Neuquén', () => {
    const destination = pickDestination(countries, 'Japan', () => 0.01)

    expect(destination.key).toBe('Neuquén')
    expect(destination.coords).toEqual([PROTECTED_HUB.lat, PROTECTED_HUB.lng])
    expect(destination.kind).toBe('hub')
  })

  it('sends the next 20% to Argentina', () => {
    const destination = pickDestination(countries, 'Japan', () => 0.1)

    expect(destination.key).toBe('Argentina')
    expect(destination.coords).toEqual(COUNTRY_COORDS['Argentina'])
    expect(destination.kind).toBe('hub')
  })

  it('sends the remaining 75% to a global destination', () => {
    const destination = pickDestination(countries, 'Japan', () => 0.9)

    expect(destination.kind).toBe('illustrative')
    expect(destination.key).not.toBe('Argentina')
    expect(destination.key).not.toBe('Neuquén')
    expect(COUNTRY_COORDS[destination.key]).toBeDefined()
  })

  it('respects the documented weights', () => {
    expect(DESTINATION_WEIGHTS.neuquen).toBe(0.05)
    expect(DESTINATION_WEIGHTS.argentina).toBe(0.2)
    expect(DESTINATION_WEIGHTS.global).toBe(0.75)
  })

  it('never draws an arc from a country to itself', () => {
    for (const roll of [0.9, 0.5, 0.26, 0.99]) {
      const destination = pickDestination(countries, 'Japan', () => roll)
      expect(destination.key).not.toBe('Japan')
    }
  })

  it('falls back to a valid destination when the global pool is empty', () => {
    const destination = pickDestination([], 'Japan', () => 0.9)

    expect(destination.coords).toBeDefined()
    expect(destination.kind).toBe('illustrative')
  })
})

describe('buildAttackArc', () => {
  it('ends the arc at the protected hub by default', () => {
    const arc = buildAttackArc(
      { originCountry: 'United States', type: 'Port Scan / Probe', source: 'DShield (SANS ISC)' },
      'Spain',
      fallbackType,
    )

    expect(arc.end).toEqual([PROTECTED_HUB.lat, PROTECTED_HUB.lng])
    expect(arc.destinationKind).toBe('hub')
  })

  it('ends the arc at the given destination', () => {
    const arc = buildAttackArc(
      { originCountry: 'United States', type: 'Port Scan / Probe' },
      'Spain',
      fallbackType,
      PROTECTED_DESTINATIONS.argentina,
    )

    expect(arc.end).toEqual(COUNTRY_COORDS['Argentina'])
    expect(arc.destinationKey).toBe('Argentina')
    expect(arc.destinationKind).toBe('hub')
  })

  it('marks an illustrative destination as such', () => {
    const arc = buildAttackArc(
      { originCountry: 'Spain', type: 'Port Scan / Probe' },
      'Japan',
      fallbackType,
      { key: 'Japan', coords: COUNTRY_COORDS['Japan'], kind: 'illustrative' },
    )

    expect(arc.destinationKind).toBe('illustrative')
    expect(arc.destinationKey).toBe('Japan')
  })

  it('starts the arc at the real origin country', () => {
    const arc = buildAttackArc(
      { originCountry: 'Spain', type: 'Port Scan / Probe', source: 'DShield (SANS ISC)' },
      'Japan',
      fallbackType,
    )

    expect(arc.start).toEqual(COUNTRY_COORDS['Spain'])
    expect(arc.illustrative).toBe(false)
    expect(arc.source).toBe('DShield (SANS ISC)')
  })

  it('marks the arc as illustrative when the event has no resolvable origin', () => {
    const arc = buildAttackArc(
      { originCountry: 'ZZ', type: 'Port Scan / Probe' },
      'Japan',
      fallbackType,
    )

    expect(arc.illustrative).toBe(true)
    expect(arc.start).toEqual(COUNTRY_COORDS['Japan'])
    expect(arc.source).toBe('Muestra')
  })

  it('uses the event type text but the mapped colour', () => {
    const arc = buildAttackArc(
      { originCountry: 'China', type: 'Exploit: CVE-2024-3094 (origen no atribuido)' },
      'Japan',
      fallbackType,
    )

    expect(arc.type).toBe('Exploit: CVE-2024-3094 (origen no atribuido)')
    expect(arc.color).toBe(ATTACK_TYPES.find((t) => t.type === 'APT / Exploit')!.color)
  })

  it('never produces an arc whose origin and destination coincide', () => {
    const arc = buildAttackArc(
      { originCountry: 'Argentina', type: 'Port Scan / Probe' },
      'Japan',
      fallbackType,
    )

    expect(arc.start).not.toEqual(arc.end)
  })
})
