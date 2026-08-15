'use client'

import * as THREE from 'three'

/**
 * Glow radial procedural (patrón singleton de meshDoorTexture): una textura
 * blanca con falloff radial (núcleo opaco → borde transparente) para que los
 * puntos aditivos se lean como LUZ, no como cuadrados (el defecto del audit
 * "solo cuadrados"). La comparten StoryPhoton (P7d) y ConnectionBeam (P7e).
 * Cero assets externos (R5).
 */
export const GLOW_TEXTURE_SIZE = 64

let cached: THREE.CanvasTexture | null = null

export function getGlowTexture(): THREE.CanvasTexture {
  if (cached) return cached
  if (typeof document === 'undefined') {
    throw new Error('getGlowTexture requires a browser (client-only)')
  }
  const canvas = document.createElement('canvas')
  canvas.width = GLOW_TEXTURE_SIZE
  canvas.height = GLOW_TEXTURE_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  const g = ctx.createRadialGradient(GLOW_TEXTURE_SIZE / 2, GLOW_TEXTURE_SIZE / 2, 0, GLOW_TEXTURE_SIZE / 2, GLOW_TEXTURE_SIZE / 2, GLOW_TEXTURE_SIZE / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.7)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, GLOW_TEXTURE_SIZE, GLOW_TEXTURE_SIZE)
  const tex = new THREE.CanvasTexture(canvas)
  cached = tex
  return tex
}

/** Geometría de puntos con `count` vértices (posición en 0; el runtime escribe
 *  cada frame — SPEC §22: geometría creada una vez, solo se muta el atributo). */
export function pointGeometry(count: number): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
  return g
}
