import { describe, it, expect } from 'vitest'
import {
  buildFlatArcPath,
  projectToFlat,
  wrapFlatLongitude,
} from './flatProjection'

describe('proyección plana · coordenadas', () => {
  it('mapea el centro del mundo al centro del viewBox', () => {
    expect(projectToFlat(0, 0)).toEqual({ x: 180, y: 90 })
  })

  it('mapea los extremos a las esquinas del viewBox', () => {
    expect(projectToFlat(90, -180)).toEqual({ x: 0, y: 0 })
    expect(projectToFlat(-90, 180)).toEqual({ x: 360, y: 180 })
  })

  it('conserva el ecuador en la mitad vertical', () => {
    expect(projectToFlat(0, -63.6).y).toBe(90)
  })
})

describe('proyección plana · antimeridiano', () => {
  it('cruza el Pacífico en vez de dar la vuelta al mapa', () => {
    // Japón (lng 138) → EE. UU. (lng -95).
    const start = projectToFlat(0, 138).x
    const end = projectToFlat(0, -95).x

    expect(wrapFlatLongitude(start, end)).toBe(end + 360)
  })

  it('deja intactos los arcos que no cruzan el antimeridiano', () => {
    const start = projectToFlat(0, -10).x
    const end = projectToFlat(0, 20).x

    expect(wrapFlatLongitude(start, end)).toBe(end)
  })
})

describe('proyección plana · trazado de arcos', () => {
  it('empieza y termina en las coordenadas proyectadas', () => {
    const path = buildFlatArcPath([0, 0], [0, 10])

    expect(path).toBe('M 180 90 Q 185 92.8 190 90')
  })

  it('traza el arco a través del borde cuando cruza el antimeridiano', () => {
    const path = buildFlatArcPath([0, 170], [0, -170])

    // El destino se desplaza a 370 para salir por la derecha del mapa; las
    // copias desplazadas del SVG lo hacen aparecer por la izquierda.
    expect(path.endsWith('370 90')).toBe(true)
  })
})
