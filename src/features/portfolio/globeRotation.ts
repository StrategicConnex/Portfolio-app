/**
 * Rotación del globo del mapa de ciberataques.
 *
 * La velocidad se expresa en RADIANES POR SEGUNDO y se aplica con el delta
 * real del frame. Esto es lo que garantiza que el mundo no pueda "adelantarse"
 * a los marcadores: si el giro se aplicara por frame (`rotation.y += 0.002`),
 * la velocidad angular dependería de los FPS y en una máquina lenta el globo
 * giraría más despacio que en una rápida, pero el desfase real aparecería
 * cuando el globe y los puntos NO comparten la misma rotación.
 *
 * Aquí la regla es explícita: el delta se clampa para que una pestaña en
 * segundo plano no teletransporte el globo al volver al foco.
 *
 * El mismo módulo resuelve el encuadre del chat: `rotationForLongitude`
 * calcula el ángulo que pone un país de frente a la cámara y
 * `shortestAngularDelta` da el camino más corto para llegar sin dar vueltas
 * de más. Ambas son aritmética pura, así que se prueban sin WebGL.
 */

/**
 * Velocidad de giro de la Tierra en radianes por segundo.
 *
 * A 0.06 rad/s el globo tarda ~105 s en dar una vuelta completa: se sigue
 * perceiving como una Tierra viva, pero los marcadores ya se leen anclados a
 * su país en vez de "volando" sobre la superficie.
 */
export const EARTH_ROTATION_RAD_PER_SEC = 0.06

/**
 * Tope del delta por frame (segundos). Evita saltos bruscos al volver a una
 * pestaña que estaba en segundo plano (delta de varios segundos).
 */
export const MAX_FRAME_DELTA_SEC = 0.1

/**
 * Calcula el siguiente ángulo de rotación del globo.
 *
 * @param current Ángulo actual en radianes.
 * @param delta Segundos transcurridos desde el frame anterior.
 * @returns Ángulo siguiente en radianes.
 */
export function advanceEarthRotation(current: number, delta: number): number {
  const safeDelta = Math.min(Math.max(delta, 0), MAX_FRAME_DELTA_SEC)
  return current + EARTH_ROTATION_RAD_PER_SEC * safeDelta
}

/**
 * Ángulo de rotación del grupo de la Tierra que deja una longitud dada de
 * frente a la cámara.
 *
 * La cámara mira al globo desde `+z` y `latLngToVector3` usa
 * `theta = (lng + 180)`. Con esa convención, la longitud que encara la cámara
 * sin rotar es `-90°`; para llevar otra longitud al frente hay que girar el
 * grupo `-90° - lng`. El resultado se normaliza a `(-π, π]` para que el
 * suavizado elija siempre el camino más corto.
 *
 * @param lng Longitud en grados decimales.
 * @returns Ángulo de rotación en radianes, normalizado.
 */
export function rotationForLongitude(lng: number): number {
  return normalizeAngle(-Math.PI / 2 - (lng * Math.PI) / 180)
}

/** Normaliza un ángulo a `(-π, π]`. */
export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  const wrapped = (((angle + Math.PI) % twoPi) + twoPi) % twoPi - Math.PI
  // `-π` y `π` son el mismo punto; se prefiere `π` para no invertir el signo.
  return wrapped === -Math.PI ? Math.PI : wrapped
}

/**
 * Diferencia angular más corta entre dos orientaciones, en radianes.
 * El resultado cae en `(-π, π]`: girar por ese camino nunca da más de media
 * vuelta y evita que un foco cercano dé una vuelta completa al globo.
 */
export function shortestAngularDelta(current: number, target: number): number {
  return normalizeAngle(target - current)
}
