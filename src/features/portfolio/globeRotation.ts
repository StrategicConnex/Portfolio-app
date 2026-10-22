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
