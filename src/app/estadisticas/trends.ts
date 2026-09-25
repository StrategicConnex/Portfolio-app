/**
 * Derivadas de la serie diaria para /estadisticas: comparativa semanal y
 * sparkline. Funciones puras (sin reloj ni I/O) para poder testearlas
 * con series sintéticas — la serie ya viene de `countByDay`.
 */

export interface DayCount {
  day: string
  count: number
}

/**
 * Suma los últimos `days` valores de la serie (cola). Con menos datos de los
 * pedidos, suma lo que haya — la página solo llama con series completas.
 */
export function sumLastDays(series: DayCount[], days: number): number {
  return series.slice(-days).reduce((sum, d) => sum + d.count, 0)
}

/**
 * Variación porcentual entre dos períodos, redondeada a entero.
 * `null` si no hay base de comparación (período previo en cero): mostrar
 * "+∞%" no aporta nada a un dashboard público.
 */
export function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export type TrendDirection = 'up' | 'down' | 'flat'

/** Dirección de la tendencia según el delta (0% cuenta como plano). */
export function trendDirection(deltaPct: number | null): TrendDirection {
  if (deltaPct === null || deltaPct === 0) return 'flat'
  return deltaPct > 0 ? 'up' : 'down'
}

/**
 * Path SVG para una sparkline de la serie, en un viewBox `width×height`.
 * Devuelve `''` si no hay nada que dibujar (serie vacía, de un solo punto o
 * toda en cero): el llamador oculta el `<svg>` en ese caso.
 */
export function sparklinePath(
  series: DayCount[],
  width = 100,
  height = 32,
): string {
  if (series.length < 2) return ''
  const max = Math.max(...series.map((d) => d.count))
  if (max <= 0) return ''
  const stepX = width / (series.length - 1)
  const y = (count: number) =>
    Math.round((height - (count / max) * height) * 100) / 100
  return series
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${Math.round(i * stepX * 100) / 100} ${y(d.count)}`)
    .join(' ')
}
