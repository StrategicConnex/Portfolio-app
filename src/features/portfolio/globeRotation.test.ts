import { describe, expect, it } from 'vitest'
import { Matrix4, Vector3 } from 'three'
import { COUNTRY_COORDS, latLngToVector3 } from '@/data/countryCoords'
import {
  normalizeAngle,
  rotationForLongitude,
  shortestAngularDelta,
} from './globeRotation'

/** Radio del globo (ver `CyberAttackMap3D`). */
const GLOBE_RADIUS = 2

describe('rotationForLongitude', () => {
  it('leaves the longitude that already faces the camera unrotated', () => {
    // La cámara mira desde +z y latLngToVector3 usa theta = lng + 180.
    expect(rotationForLongitude(-90)).toBeCloseTo(0, 10)
  })

  it('brings every country of the dataset to the front of the globe', () => {
    for (const country of ['China', 'Russia', 'Brazil', 'United States', 'Argentina']) {
      const [lat, lng] = COUNTRY_COORDS[country]
      const point = new Vector3(...latLngToVector3(lat, lng, GLOBE_RADIUS))
      const rotated = point.applyMatrix4(
        new Matrix4().makeRotationY(rotationForLongitude(lng)),
      )

      // Frente a la cámara: sin desplazamiento en X y en el hemisferio +z.
      expect(Math.abs(rotated.x), country).toBeLessThan(1e-9)
      expect(rotated.z, country).toBeGreaterThan(0)
    }
  })

  it('normalizes the result to (-π, π]', () => {
    for (const lng of [-180, -90, 0, 90, 180, 270]) {
      const angle = rotationForLongitude(lng)
      expect(angle).toBeGreaterThan(-Math.PI)
      expect(angle).toBeLessThanOrEqual(Math.PI)
    }
  })
})

describe('shortestAngularDelta', () => {
  it('returns the direct difference for a small turn', () => {
    expect(shortestAngularDelta(0, 0.1)).toBeCloseTo(0.1, 10)
  })

  it('crosses the ±π seam the short way instead of going around', () => {
    // De 0 a 359°: lo corto es -1°, no +359°.
    expect(shortestAngularDelta(0, Math.PI * 2 - 0.1)).toBeCloseTo(-0.1, 10)
  })

  it('never returns more than half a turn', () => {
    const delta = shortestAngularDelta(3, -3)
    expect(Math.abs(delta)).toBeLessThanOrEqual(Math.PI)
    expect(delta).toBeCloseTo(Math.PI * 2 - 6, 10)
  })

  it('normalizes -π to π and keeps equivalent angles equivalent', () => {
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 10)
    expect(shortestAngularDelta(0.5, 0.5 + Math.PI * 4)).toBeCloseTo(0, 10)
  })
})
