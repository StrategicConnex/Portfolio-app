'use client'

import * as THREE from 'three'

/**
 * Texturas PBR procedurales (bridge de texturas, ASSET-PIPELINE §4 — R5):
 * generadas con canvas en runtime, singleton, cero assets externos.
 *
 * - getChassisMap / getChassisBump : paneles de chasis con juntas, filas de
 *   ventilación y ruido industrial (le dan a una caja el "leído" de hardware).
 * - getBrushedMap / getBrushedBump : acero cepillado anisotrópico (bezels,
 *   marcos) — rayas finas horizontales con variación de brillo.
 * - getUnitBump                     : ranuras de ventilación de unidades 1U.
 *
 * Contrato: las funciones puras (panelSeams, ventRows, brushedStreaks,
 * unitSlots) son testeables sin canvas; el pintado vive en los singletons.
 */

export const PANEL_TEXTURE_SIZE = 1024
export const BRUSHED_TEXTURE_SIZE = 512

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Juntas de panel: 2 verticales (divide el frontal en tercios) + 2
 * horizontales (borde superior de ventilación y línea de base). Finas. */
export function panelSeams(size: number): Rect[] {
  return [
    { x: size / 3 - 1, y: 0, w: 2, h: size },
    { x: (2 * size) / 3 - 1, y: 0, w: 2, h: size },
    { x: 0, y: 0.8 * size - 1, w: size, h: 2 },
    { x: 0, y: 0.08 * size - 1, w: size, h: 2 },
  ]
}

/** Filas de ventilación: 3 filas × 12 ranuras horizontales en la zona
 * superior del panel (estética louver de chasis industrial). */
export function ventRows(size: number): Rect[] {
  const rows: Rect[] = []
  const top = 0.84 * size
  const slotW = 0.045 * size
  const slotH = 0.016 * size
  for (let r = 0; r < 3; r++) {
    const y = top + r * 0.042 * size
    const margin = 0.08 * size
    const span = 0.84 * size
    for (let c = 0; c < 12; c++) {
      rows.push({ x: margin + (c * span) / 11, y, w: slotW, h: slotH })
    }
  }
  return rows
}

/** Ranuras de unidades 1U: líneas horizontales finas repartidas (vent de
 * servidor), con un cluster denso en el centro (zona de discos). */
export function unitSlots(size: number): Rect[] {
  const slots: Rect[] = []
  const rows = 26
  for (let r = 0; r < rows; r++) {
    const y = 0.04 * size + (r * 0.92 * size) / (rows - 1)
    const density = Math.abs(r / (rows - 1) - 0.5) < 0.18 ? 1.6 : 1
    const x = 0.1 * size
    const w = 0.8 * size * density
    slots.push({ x, y, w, h: 0.012 * size })
  }
  return slots
}

/** Rayas de cepillado: secuencia determinista (seed) de líneas horizontales
 * finas con shade en [0,1] — 0 = más oscuro. */
export function brushedStreaks(size: number, seed = 7): { y: number; h: number; shade: number }[] {
  const streaks: { y: number; h: number; shade: number }[] = []
  let s = seed
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  let y = 0
  while (y < size) {
    const h = 1 + Math.floor(rnd() * 3)
    const shade = 0.25 + rnd() * 0.5
    streaks.push({ y, h, shade })
    y += h + rnd() * 3
  }
  return streaks
}

// --- canvas painting (browser-only) -----------------------------------------

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  return [canvas, ctx]
}

function fillSeamsAndVents(
  ctx: CanvasRenderingContext2D,
  size: number,
  dark: string,
  light: string,
) {
  // Ruido industrial de fondo (bloques 8px, ±4 de gris) — textura de metal
  // pintado, no un degradado limpio de render.
  let s = 11
  const rnd = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  const img = ctx.getImageData(0, 0, size, size)
  const d = img.data
  for (let y = 0; y < size; y += 8) {
    for (let x = 0; x < size; x += 8) {
      const v = Math.round(rnd() * 8) - 4
      for (let yy = y; yy < Math.min(y + 8, size); yy++) {
        for (let xx = x; xx < Math.min(x + 8, size); xx++) {
          const i = (yy * size + xx) * 4
          d[i] = Math.max(0, Math.min(255, d[i] + v))
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v))
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v))
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.fillStyle = dark
  for (const r of panelSeams(size)) ctx.fillRect(r.x, r.y, r.w, r.h)
  for (const r of ventRows(size)) ctx.fillRect(r.x, r.y, r.w, r.h)
  // Relieve sutil del borde: línea clara bajo cada junta (efecto bisel)
  ctx.fillStyle = light
  for (const r of panelSeams(size)) {
    if (r.w > r.h) ctx.fillRect(r.x, r.y + r.h, r.w, 1)
    else ctx.fillRect(r.x + r.w, r.y, 1, r.h)
  }
}

const chassisCache: { map: THREE.CanvasTexture | null; bump: THREE.CanvasTexture | null } = {
  map: null,
  bump: null,
}

/** Albedo del chasis: gradiente vertical frío + juntas + ventilación. */
export function getChassisMap(size = PANEL_TEXTURE_SIZE): THREE.CanvasTexture {
  if (chassisCache.map) return chassisCache.map
  const [canvas, ctx] = makeCanvas(size)
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, '#141f33') // arriba más claro (luz del pasillo)
  g.addColorStop(0.55, '#0d1524')
  g.addColorStop(1, '#0a1018')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  fillSeamsAndVents(ctx, size, '#070c14', '#1d2a42')
  // viñeta de panel (bordes oscuros)
  const v = ctx.createRadialGradient(size / 2, size / 2, size * 0.35, size / 2, size / 2, size * 0.78)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  chassisCache.map = tex
  return tex
}

/** Bump del chasis (height map): juntas + ranuras de ventilación + ruido. */
export function getChassisBump(size = PANEL_TEXTURE_SIZE): THREE.CanvasTexture {
  if (chassisCache.bump) return chassisCache.bump
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = '#808080' // plano
  ctx.fillRect(0, 0, size, size)
  fillSeamsAndVents(ctx, size, '#000000', '#c8c8c8')
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  chassisCache.bump = tex
  return tex
}

const brushedCache: { map: THREE.CanvasTexture | null; bump: THREE.CanvasTexture | null } = {
  map: null,
  bump: null,
}

/** Acero cepillado (albedo): gradiente plata fría + rayas de cepillado. */
export function getBrushedMap(size = BRUSHED_TEXTURE_SIZE): THREE.CanvasTexture {
  if (brushedCache.map) return brushedCache.map
  const [canvas, ctx] = makeCanvas(size)
  const g = ctx.createLinearGradient(0, 0, 0, size)
  g.addColorStop(0, '#c6cdd8')
  g.addColorStop(0.5, '#b8c0cc')
  g.addColorStop(1, '#aab2c0')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  for (const st of brushedStreaks(size)) {
    ctx.fillStyle = `rgba(20,28,44,${st.shade * 0.35})`
    ctx.fillRect(0, st.y, size, st.h)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  brushedCache.map = tex
  return tex
}

/** Bump del cepillado: rayas finas (metal anisotrópico en la normal). */
export function getBrushedBump(size = BRUSHED_TEXTURE_SIZE): THREE.CanvasTexture {
  if (brushedCache.bump) return brushedCache.bump
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  for (const st of brushedStreaks(size)) {
    ctx.fillStyle = `rgba(0,0,0,${0.25 + st.shade * 0.3})`
    ctx.fillRect(0, st.y, size, st.h)
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  brushedCache.bump = tex
  return tex
}

let unitBumpCache: THREE.CanvasTexture | null = null

/** Bump de unidades de servidor: ranuras horizontales. */
export function getUnitBump(size = BRUSHED_TEXTURE_SIZE): THREE.CanvasTexture {
  if (unitBumpCache) return unitBumpCache
  const [canvas, ctx] = makeCanvas(size)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#2a2a2a'
  for (const r of unitSlots(size)) ctx.fillRect(r.x, r.y, r.w, r.h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  unitBumpCache = tex
  return tex
}
