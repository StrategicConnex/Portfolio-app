import { describe, it, expect } from 'vitest'
import {
  FLAT_MAX_SCALE,
  FLAT_MIN_SCALE,
  MANUAL_ROTATION_STEP_RAD,
  MAX_CAMERA_DISTANCE,
  MIN_CAMERA_DISTANCE,
  flatPanLimit,
  manualRotationDelta,
  nextCameraDistance,
  nextFlatPan,
  nextFlatScale,
} from './mapControls'

describe('controles del mapa · zoom 3D', () => {
  it('acerca la cámara sin pasar del mínimo', () => {
    const closer = nextCameraDistance(5.5, 'in')
    expect(closer).toBeLessThan(5.5)

    let distance = 5.5
    for (let i = 0; i < 20; i++) distance = nextCameraDistance(distance, 'in')
    expect(distance).toBe(MIN_CAMERA_DISTANCE)
  })

  it('aleja la cámara sin pasar del máximo', () => {
    const farther = nextCameraDistance(5.5, 'out')
    expect(farther).toBeGreaterThan(5.5)

    let distance = 5.5
    for (let i = 0; i < 20; i++) distance = nextCameraDistance(distance, 'out')
    expect(distance).toBe(MAX_CAMERA_DISTANCE)
  })
})

describe('controles del mapa · giro manual', () => {
  it('gira a la derecha en positivo y a la izquierda en negativo', () => {
    expect(manualRotationDelta('right')).toBe(MANUAL_ROTATION_STEP_RAD)
    expect(manualRotationDelta('left')).toBe(-MANUAL_ROTATION_STEP_RAD)
  })
})

describe('controles del mapa · vista plana', () => {
  it('escala el mapa plano dentro de sus límites', () => {
    let scale = FLAT_MIN_SCALE
    for (let i = 0; i < 10; i++) scale = nextFlatScale(scale, 'in')
    expect(scale).toBe(FLAT_MAX_SCALE)

    for (let i = 0; i < 10; i++) scale = nextFlatScale(scale, 'out')
    expect(scale).toBe(FLAT_MIN_SCALE)
  })

  it('calcula el pan disponible a partir de la escala', () => {
    expect(flatPanLimit(FLAT_MIN_SCALE)).toBe(0)
    expect(flatPanLimit(2)).toBe(25)
    expect(flatPanLimit(FLAT_MAX_SCALE)).toBe(31)
  })

  it('desplaza el encuadre sin salirse del mapa', () => {
    const limit = flatPanLimit(2)
    let pan = 0
    for (let i = 0; i < 10; i++) pan = nextFlatPan(pan, 'right', limit)
    expect(pan).toBe(limit)

    for (let i = 0; i < 20; i++) pan = nextFlatPan(pan, 'left', limit)
    expect(pan).toBe(-limit)
  })
})
