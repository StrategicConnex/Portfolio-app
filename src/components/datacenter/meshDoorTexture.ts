'use client'

import * as THREE from 'three'

/**
 * Bridge de texturas (ASSET-PIPELINE §4 / MESHY-PROMPTS-BLENDER §3.4):
 * la puerta del rack viaja en el GLB como plano PBR-neutral; el runtime le
 * inyecta el patrón de malla AR2580 como alphaMap (cutout) + bumpMap.
 * Cero assets externos (R5): la textura se genera procedural con canvas.
 *
 * El patrón es la abstracción "bakeable" del contrato: rejilla de barras
 * 24 columnas × 8 filas (el high-poly de bake del §3.4 es "Array 24×8
 * barras"). Luminancia = barras blancas (opacas) / huecos negros
 * (transparentes) — vale para alphaMap (canal G de three) y bumpMap.
 */

export const MESH_DOOR_COLS = 24
export const MESH_DOOR_ROWS = 8
export const MESH_DOOR_TEXTURE_SIZE = 512

export interface DoorBarRect {
  x: number
  y: number
  w: number
  h: number
}

/** Geometría pura del patrón (testeable sin canvas): barras equiespaciadas
 * que cubren ~56% del área (huecos ≈ 44% — densidad de perforación típica). */
export function meshDoorBars(size: number): {
  vertical: DoorBarRect[]
  horizontal: DoorBarRect[]
} {
  const cellW = size / MESH_DOOR_COLS
  const cellH = size / MESH_DOOR_ROWS
  const barW = cellW * 0.5 // mitad de la celda → huecos del mismo ancho
  const barH = cellH * 0.125 // fila fina (el lattice actual usaba 0.016/0.255)
  const vertical: DoorBarRect[] = []
  for (let i = 0; i < MESH_DOOR_COLS; i++) {
    vertical.push({ x: i * cellW + (cellW - barW) / 2, y: 0, w: barW, h: size })
  }
  const horizontal: DoorBarRect[] = []
  for (let j = 0; j < MESH_DOOR_ROWS; j++) {
    horizontal.push({ x: 0, y: j * cellH + (cellH - barH) / 2, w: size, h: barH })
  }
  return { vertical, horizontal }
}

let cached: THREE.CanvasTexture | null = null

/** Textura procedural de la puerta (singleton — se crea una sola vez por app). */
export function getMeshDoorTexture(size = MESH_DOOR_TEXTURE_SIZE): THREE.CanvasTexture {
  if (cached) return cached
  if (typeof document === 'undefined') {
    throw new Error('getMeshDoorTexture requires a browser (client-only)')
  }
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  const { vertical, horizontal } = meshDoorBars(size)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#ffffff'
  for (const b of vertical) ctx.fillRect(b.x, b.y, b.w, b.h)
  for (const b of horizontal) ctx.fillRect(b.x, b.y, b.w, b.h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  cached = tex
  return tex
}
