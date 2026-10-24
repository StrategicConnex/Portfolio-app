/**
 * Límites y pasos de los controles del mapa de ciberataques.
 *
 * Vive fuera del componente para poder testear la aritmética sin montar
 * WebGL: la escena de three.js no se puede renderizar en jsdom.
 */

/** Distancia mínima de la cámara al centro del globo. */
export const MIN_CAMERA_DISTANCE = 3.5
/** Distancia máxima de la cámara al centro del globo. */
export const MAX_CAMERA_DISTANCE = 9

/** Factor de acercamiento por pulsación. */
const ZOOM_IN_FACTOR = 0.82
/** Factor de alejamiento por pulsación. */
const ZOOM_OUT_FACTOR = 1.22

/** Un paso de giro manual: 10°. */
export const MANUAL_ROTATION_STEP_RAD = Math.PI / 18

/** Escala mínima de la vista plana (el mapa entero, sin ampliar). */
export const FLAT_MIN_SCALE = 1
/** Escala máxima de la vista plana. */
export const FLAT_MAX_SCALE = 2.6
/** Factor de ampliación/reducción de la vista plana. */
const FLAT_ZOOM_IN_FACTOR = 1.25
const FLAT_ZOOM_OUT_FACTOR = 0.8

/** Desplazamiento horizontal de la vista plana, en porcentaje del ancho. */
export const FLAT_PAN_STEP = 10

export type ZoomDirection = 'in' | 'out'
export type HorizontalDirection = 'left' | 'right'

/**
 * Siguiente distancia de cámara al acercar o alejar, siempre dentro de los
 * límites del globo.
 */
export function nextCameraDistance(
  current: number,
  direction: ZoomDirection,
): number {
  const factor = direction === 'in' ? ZOOM_IN_FACTOR : ZOOM_OUT_FACTOR
  return Math.min(
    MAX_CAMERA_DISTANCE,
    Math.max(MIN_CAMERA_DISTANCE, current * factor),
  )
}

/** Siguiente escala de la vista plana, acotada a los límites. */
export function nextFlatScale(current: number, direction: ZoomDirection): number {
  const factor = direction === 'in' ? FLAT_ZOOM_IN_FACTOR : FLAT_ZOOM_OUT_FACTOR
  return Math.min(FLAT_MAX_SCALE, Math.max(FLAT_MIN_SCALE, current * factor))
}

/**
 * Desplazamiento horizontal máximo de la vista plana para una escala.
 *
 * Al ampliar, el contenido sobresale del marco en `(escala - 1) / 2` por
 * lado. El desplazamiento se aplica antes de la escala, así que el tope en
 * porcentaje del ancho es `(escala - 1) / (2 · escala)`: panear más dejaría
 * un borde negro a la vista.
 */
export function flatPanLimit(scale: number): number {
  if (!Number.isFinite(scale) || scale <= 1) return 0
  return Math.round(((scale - 1) / (2 * scale)) * 100)
}

/** Siguiente desplazamiento horizontal de la vista plana, acotado. */
export function nextFlatPan(
  current: number,
  direction: HorizontalDirection,
  limit: number,
): number {
  const delta = direction === 'left' ? -FLAT_PAN_STEP : FLAT_PAN_STEP
  return Math.min(limit, Math.max(-limit, current + delta))
}

/**
 * Giro manual del globo, en radianes.
 *
 * Un ángulo positivo mueve la superficie hacia la derecha del espectador:
 * el botón «derecha» gira la tierra en ese sentido.
 */
export function manualRotationDelta(direction: HorizontalDirection): number {
  return direction === 'left'
    ? -MANUAL_ROTATION_STEP_RAD
    : MANUAL_ROTATION_STEP_RAD
}
