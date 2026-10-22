import { describe, it, expect } from 'vitest'
import {
  COUNTRY_BY_ISO,
  COUNTRY_COORDS,
  COUNTRY_NAMES,
  ISO_BY_COUNTRY_NAME,
  PROTECTED_HUB,
  countryNameFromIso,
  coordsForCountry,
  latLngToVector3,
} from './countryCoords'

describe('countryCoords', () => {
  it('stores every country as [latitud, longitud] inside valid ranges', () => {
    for (const [iso, info] of Object.entries(COUNTRY_BY_ISO)) {
      expect(info.lat, iso).toBeGreaterThanOrEqual(-90)
      expect(info.lat, iso).toBeLessThanOrEqual(90)
      expect(info.lng, iso).toBeGreaterThanOrEqual(-180)
      expect(info.lng, iso).toBeLessThanOrEqual(180)
      // La tupla pública mantiene el mismo orden que `latLngToVector3`.
      expect(COUNTRY_COORDS[info.name], iso).toEqual([info.lat, info.lng])
    }
  })

  it('keeps the name, the ISO code and the coordinates in sync', () => {
    expect(Object.keys(COUNTRY_COORDS).length).toBe(Object.keys(COUNTRY_BY_ISO).length)
    for (const [iso, info] of Object.entries(COUNTRY_BY_ISO)) {
      expect(ISO_BY_COUNTRY_NAME[info.name], iso).toBe(iso)
    }
  })

  it('resolves ISO codes case-insensitively and rejects unknown ones', () => {
    expect(countryNameFromIso('us')).toBe('United States')
    expect(countryNameFromIso('ES')).toBe('Spain')
    expect(countryNameFromIso('sc')).toBe('Seychelles')
    expect(countryNameFromIso('ZZ')).toBeUndefined()
    expect(countryNameFromIso(undefined)).toBeUndefined()
    expect(countryNameFromIso('')).toBeUndefined()
  })

  it('exposes a sorted list of unique country names', () => {
    expect(COUNTRY_NAMES.length).toBe(new Set(COUNTRY_NAMES).size)
    expect([...COUNTRY_NAMES].sort()).toEqual(COUNTRY_NAMES)
  })

  it('returns coordinates for a known country and undefined otherwise', () => {
    expect(coordsForCountry('Spain')).toEqual([40.4637, -3.7492])
    expect(coordsForCountry('Nowhere')).toBeUndefined()
  })

  it('converts lat/lng to 3D cartesian coordinates', () => {
    const [x, y, z] = latLngToVector3(0, 0, 2)
    expect(x).toBeCloseTo(2)
    expect(y).toBeCloseTo(0)
    expect(z).toBeCloseTo(0)

    const [, northY] = latLngToVector3(90, 0, 2)
    expect(northY).toBeCloseTo(2)

    const [, southY] = latLngToVector3(-90, 0, 2)
    expect(southY).toBeCloseTo(-2)
  })

  it('keeps every converted point on the sphere of the given radius', () => {
    const radius = 2
    for (const info of Object.values(COUNTRY_BY_ISO)) {
      const [x, y, z] = latLngToVector3(info.lat, info.lng, radius)
      expect(Math.hypot(x, y, z)).toBeCloseTo(radius)
    }
  })

  it('exposes the protected hub with valid coordinates', () => {
    expect(PROTECTED_HUB.name).toBe('Vaca Muerta')
    expect(PROTECTED_HUB.region).toBe('Argentina')
    expect(PROTECTED_HUB.lat).toBeGreaterThanOrEqual(-90)
    expect(PROTECTED_HUB.lat).toBeLessThanOrEqual(90)
    expect(PROTECTED_HUB.lng).toBeGreaterThanOrEqual(-180)
    expect(PROTECTED_HUB.lng).toBeLessThanOrEqual(180)
  })

  it('keeps the hub out of the table of attacker countries', () => {
    // Si el hub entrase en la tabla, el mapa podría elegirlo como país atacante
    // al azar y un arco "real" podría partir de la infraestructura protegida.
    expect(COUNTRY_COORDS[PROTECTED_HUB.name]).toBeUndefined()
    expect(COUNTRY_NAMES).not.toContain(PROTECTED_HUB.name)
  })
})
