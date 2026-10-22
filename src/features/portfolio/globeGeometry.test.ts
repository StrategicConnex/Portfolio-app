import { describe, it, expect } from 'vitest'
import { Vector3, Matrix4, SphereGeometry } from 'three'
import { COUNTRY_BY_ISO, PROTECTED_HUB, latLngToVector3 } from '@/data/countryCoords'
import {
  EARTH_ROTATION_RAD_PER_SEC,
  MAX_FRAME_DELTA_SEC,
  advanceEarthRotation,
} from './globeRotation'

/**
 * Pruebas geométricas del mapa de ciberataques.
 *
 * El defecto que se corrigió era visual e invisible en los tests: el globo
 * rotaba por su cuenta mientras los marcadores de país se quedaban quietos en
 * el espacio, así que los puntos acababan flotando sobre países que no les
 * correspondían.
 *
 * Aquí se comprueba la geometría, no la escena:
 *  1. `latLngToVector3` sitúa el marcador EXACTAMENTE sobre el punto de la
 *     esfera donde la textura equirectangular dibuja ese país.
 *  2. Rotar la tierra (la rotación del grupo que envuelve globo, marcadores,
 *     hub y arcos) traslada cada marcador un ángulo en longitud exacto y
 *     conserva su latitud: el marcador nunca resbala de su país.
 *  3. La velocidad de giro es la misma con cualquier tasa de refresco, así
 *     que el mundo no puede girar más rápido que los puntos.
 */

/** Radio de la esfera del globo (ver `CyberAttackMap3D`). */
const GLOBE_RADIUS = 2

/** Tolerancia angular de las aserciones geométricas (grados). */
const TOLERANCE_DEG = 0.5

/** Discretización de la malla del globo: 128 segmentos en cada eje. */
const MESH_LAT_STEP_DEG = 180 / 128
const MESH_LON_STEP_DEG = 360 / 128

/** Convierte un punto 3D de la esfera a `[latitud, longitud]` en grados. */
function vectorToLatLng(v: Vector3): { lat: number; lng: number } {
  const r = v.length()
  const lat = 90 - (Math.acos(v.y / r) * 180) / Math.PI
  // `latLngToVector3` usa theta = (lng + 180) en radianes, con
  // x = -r·sin(phi)·cos(theta) y z = r·sin(phi)·sin(theta).
  const theta = Math.atan2(v.z, -v.x)
  let lng = (theta * 180) / Math.PI - 180
  if (lng < -180) lng += 360
  if (lng > 180) lng -= 360
  return { lat, lng }
}

/** Rota un punto alrededor del eje Y con la misma matriz que usa three.js. */
function rotateY(v: Vector3, angle: number): Vector3 {
  return new Vector3(v.x, v.y, v.z).applyMatrix4(new Matrix4().makeRotationY(angle))
}

/** Normaliza una longitud a (-180, 180]. */
function normalizeLng(lng: number): number {
  let value = lng
  while (value > 180) value -= 360
  while (value <= -180) value += 360
  return value
}

describe('geometría del globo · los marcadores se anclan a su país', () => {
  it('convierte las coordenadas del país en un punto exacto de la esfera', () => {
    for (const info of Object.values(COUNTRY_BY_ISO)) {
      const marker = latLngToVector3(info.lat, info.lng, GLOBE_RADIUS)
      const { lat, lng } = vectorToLatLng(new Vector3(marker[0], marker[1], marker[2]))

      expect(Math.abs(lat - info.lat), `latitud de ${info.name}`).toBeLessThan(1e-9)
      expect(Math.abs(normalizeLng(lng - info.lng)), `longitud de ${info.name}`).toBeLessThan(1e-9)
    }
  })

  it('coloca el marcador sobre el vértice de la esfera que dibuja ese país', () => {
    // Se construye la misma esfera que usa el componente (128 segmentos) y se
    // busca el vértice cuya UV corresponde a las coordenadas del país. La
    // malla es discreta, así que el vértice más cercano puede estar a media
    // celda; lo que importa es que el marcador caiga dentro de esa celda,
    // es decir, sobre el país que la textura dibuja ahí.
    const geometry = new SphereGeometry(GLOBE_RADIUS, 128, 128)
    const positions = geometry.getAttribute('position')
    const uvs = geometry.getAttribute('uv')

    const samples = [
      { name: 'United States', lat: 37.0902, lng: -95.7129 },
      { name: 'Spain', lat: 40.4637, lng: -3.7492 },
      { name: 'Argentina', lat: -38.4161, lng: -63.6167 },
      { name: 'Japan', lat: 36.2048, lng: 138.2529 },
      { name: 'Nigeria', lat: 9.082, lng: 8.6753 },
    ]

    for (const sample of samples) {
      // UV de un mapa equirectangular: u = (lng + 180) / 360 y
      // v = (90 + lat) / 180 (el polo norte es v = 1).
      const expectedUv = [(sample.lng + 180) / 360, (90 + sample.lat) / 180]

      let bestIndex = -1
      let bestDistance = Number.POSITIVE_INFINITY
      for (let i = 0; i < uvs.count; i++) {
        const du = uvs.getX(i) - expectedUv[0]
        const dv = uvs.getY(i) - expectedUv[1]
        const distance = du * du + dv * dv
        if (distance < bestDistance) {
          bestDistance = distance
          bestIndex = i
        }
      }

      const vertex = new Vector3(
        positions.getX(bestIndex),
        positions.getY(bestIndex),
        positions.getZ(bestIndex),
      )
      const { lat, lng } = vectorToLatLng(vertex)

      expect(Math.abs(lat - sample.lat), `latitud de ${sample.name}`).toBeLessThan(
        MESH_LAT_STEP_DEG / 2,
      )
      expect(
        Math.abs(normalizeLng(lng - sample.lng)),
        `longitud de ${sample.name}`,
      ).toBeLessThan(MESH_LON_STEP_DEG / 2)

      // El marcador tiene que caer dentro de la celda de la malla.
      const marker = new Vector3(
        ...latLngToVector3(sample.lat, sample.lng, GLOBE_RADIUS),
      )
      expect(marker.distanceTo(vertex)).toBeLessThan(GLOBE_RADIUS * 0.03)
    }
  })

  it('mantiene la latitud y desplaza la longitud exactamente lo que gira la tierra', () => {
    const angle = 0.7
    const angleDeg = (angle * 180) / Math.PI

    for (const info of Object.values(COUNTRY_BY_ISO)) {
      const before = latLngToVector3(info.lat, info.lng, GLOBE_RADIUS)
      const after = rotateY(new Vector3(before[0], before[1], before[2]), angle)
      const { lat, lng } = vectorToLatLng(after)

      expect(Math.abs(lat - info.lat), `latitud tras girar (${info.name})`).toBeLessThan(
        TOLERANCE_DEG,
      )
      expect(
        Math.abs(normalizeLng(lng - (info.lng + angleDeg))),
        `longitud tras girar (${info.name})`,
      ).toBeLessThan(TOLERANCE_DEG)
    }
  })

  it('mantiene el hub protegido en la superficie durante la rotación', () => {
    const angle = 1.9
    const angleDeg = (angle * 180) / Math.PI
    const hub = latLngToVector3(PROTECTED_HUB.lat, PROTECTED_HUB.lng, GLOBE_RADIUS)
    const rotated = rotateY(new Vector3(hub[0], hub[1], hub[2]), angle)
    const { lat, lng } = vectorToLatLng(rotated)

    expect(Math.abs(lat - PROTECTED_HUB.lat)).toBeLessThan(TOLERANCE_DEG)
    expect(Math.abs(normalizeLng(lng - (PROTECTED_HUB.lng + angleDeg)))).toBeLessThan(TOLERANCE_DEG)
    expect(rotated.length()).toBeCloseTo(GLOBE_RADIUS, 5)
  })
})

describe('velocidad de giro · el mundo no puede adelantarse a los puntos', () => {
  it('gira lo mismo con 30 frames a 30 FPS que con 60 frames a 60 FPS', () => {
    let slow = 0
    for (let i = 0; i < 30; i++) slow = advanceEarthRotation(slow, 1 / 30)

    let fast = 0
    for (let i = 0; i < 60; i++) fast = advanceEarthRotation(fast, 1 / 60)

    expect(slow).toBeCloseTo(fast, 10)
    expect(slow).toBeCloseTo(EARTH_ROTATION_RAD_PER_SEC, 10)
  })

  it('acota los frames larguísimos para que el globo no salte al volver del segundo plano', () => {
    const jumped = advanceEarthRotation(0, 5)
    const clamped = advanceEarthRotation(0, MAX_FRAME_DELTA_SEC)

    expect(jumped).toBeCloseTo(clamped, 10)
    expect(jumped).toBeCloseTo(EARTH_ROTATION_RAD_PER_SEC * MAX_FRAME_DELTA_SEC, 10)
  })

  it('nunca gira hacia atrás con un delta negativo', () => {
    expect(advanceEarthRotation(1, -0.5)).toBeCloseTo(1, 10)
  })
})
