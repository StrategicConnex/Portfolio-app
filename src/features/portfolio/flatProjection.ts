/**
 * Proyección equirectangular de la vista plana del mapa.
 *
 * El viewBox del SVG es 360 × 180: un grado de longitud es una unidad de ancho
 * y un grado de latitud una unidad de alto. La textura del globo
 * (`/textures/earth-blue-marble.jpg`) también es equirectangular 2:1, así que
 * los arcos caen exactamente sobre el país que dibuja la imagen.
 */

export interface FlatPoint {
  x: number
  y: number
}

/** Convierte `[latitud, longitud]` a coordenadas del viewBox 360 × 180. */
export function projectToFlat(lat: number, lng: number): FlatPoint {
  return { x: lng + 180, y: 90 - lat }
}

/**
 * Corrige el salto del antimeridiano: elige el extremo de longitud más
 * cercano al origen para que un arco Japón → EE. UU. cruce el Pacífico en vez
 * de dar la vuelta al mapa.
 */
export function wrapFlatLongitude(startX: number, endX: number): number {
  let x = endX
  while (x - startX > 180) x -= 360
  while (startX - x > 180) x += 360
  return x
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Traza un arco cuadrático entre dos países en la vista plana.
 *
 * El punto de control se separa del segmento una distancia proporcional a su
 * longitud (con un tope) para que los arcos se lean como arcos y no como
 * líneas rectas.
 */
export function buildFlatArcPath(
  start: [number, number],
  end: [number, number],
): string {
  const from = projectToFlat(start[0], start[1])
  const to = projectToFlat(end[0], end[1])
  const endX = wrapFlatLongitude(from.x, to.x)

  const dx = endX - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const lift = Math.min(42, length * 0.28)
  const controlX = (from.x + endX) / 2 - (dy / length) * lift
  const controlY = (from.y + to.y) / 2 + (dx / length) * lift

  return `M ${round(from.x)} ${round(from.y)} Q ${round(controlX)} ${round(controlY)} ${round(endX)} ${round(to.y)}`
}
