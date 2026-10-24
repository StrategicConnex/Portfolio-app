import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Sustituye marcadores `{nombre}` por su valor.
 *
 * Los textos de la interfaz que llevan variables (cuantías, nombres de
 * proveedor) viven en los diccionarios de traducción, que solo guardan
 * cadenas: este helper es el puente entre la plantilla y el dato.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

/**
 * Convierte un `Date` a HH:MM:SS en Argentina (UTC-3).
 *
 * El proyecto estandariza TODO su horario en UTC-3 (Argentina, sin DST
 * desde 2009): reloj del SIEM, event stream, KPIs y horas que reporta el
 * copilot. Este helper hace la conversión independiente del TZ del
 * visitante y del servidor — siempre se muestra la hora argentina.
 */
export function toArgentinaTime(date: Date) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 19)
}
