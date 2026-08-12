'use client'

import * as THREE from 'three'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

/**
 * UI procedural de pantalla SIEM (ASSET-SCENE-MAP §6, gap G4): textura oscura
 * de dashboard — rejilla, barras de actividad, nodos de alerta, fila de LEDs.
 * CERO texto (SPEC §23 + R5: nunca texto hardcoded en geometría; la UI es
 * textura procedural local, nunca un screenshot externo sin licencia).
 * Singleton por app (patrón meshDoorTexture) — 1 textura compartida por todos
 * los displays, 1 draw call de material.
 */

export const SIEM_UI_W = 1024
export const SIEM_UI_H = 576

export type SiemUiBar = { x: number; y: number; w: number; h: number; color: string }
export type SiemUiDot = { x: number; y: number; r: number; color: string }

export interface SiemUiLayout {
  gridV: number[]
  gridH: number[]
  headerCells: SiemUiBar[]
  chartBars: SiemUiBar[]
  alertDots: SiemUiDot[]
  ledRow: SiemUiDot[]
}

/** Geometría pura del dashboard (testeable sin canvas). Coordenadas absolutas. */
export function siemUiLayout(w = SIEM_UI_W, h = SIEM_UI_H): SiemUiLayout {
  const { dataCyan, secondaryBlue, securityAmber, warningRed } = DATACENTER_TOKENS.colors
  const gridV: number[] = []
  for (let x = 64; x < w; x += 64) gridV.push(x)
  const gridH: number[] = []
  for (let y = 64; y < h; y += 48) gridH.push(y)

  // Cabecera: 5 celdas de datos (contadores del SOC)
  const headerCells: SiemUiBar[] = [0, 1, 2, 3, 4].map((i) => ({
    x: 32 + i * 96,
    y: 24,
    w: 72,
    h: 16,
    color: i % 2 === 0 ? secondaryBlue : dataCyan,
  }))

  // Panel central: 3 columnas de barras de actividad
  const chartBars: SiemUiBar[] = []
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 5; row++) {
      chartBars.push({
        x: 80 + col * 160,
        y: 240 + row * 48,
        w: 56,
        h: 14 + ((col * 7 + row * 13) % 5) * 6,
        color: col === 2 ? securityAmber : dataCyan,
      })
    }
  }

  // Derecha: nodos de alerta (sin texto — semántica de color)
  const alertDots: SiemUiDot[] = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 880,
    y: 96 + i * 64,
    r: 7,
    color: i === 1 || i === 4 ? warningRed : securityAmber,
  }))

  // Fila inferior: LEDs de estado
  const ledRow: SiemUiDot[] = Array.from({ length: 12 }, (_, i) => ({
    x: 40 + i * 48,
    y: h - 32,
    r: 4,
    color: i % 5 === 0 ? securityAmber : dataCyan,
  }))

  return { gridV, gridH, headerCells, chartBars, alertDots, ledRow }
}

let cached: THREE.CanvasTexture | null = null

/** Textura del dashboard SIEM (singleton por app). */
export function getSiemUiTexture(w = SIEM_UI_W, h = SIEM_UI_H): THREE.CanvasTexture {
  if (cached) return cached
  if (typeof document === 'undefined') throw new Error('getSiemUiTexture requires a browser (client-only)')
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')

  const l = siemUiLayout(w, h)
  ctx.fillStyle = '#050b14'
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(34, 211, 238, 0.07)'
  ctx.lineWidth = 1
  for (const x of l.gridV) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (const y of l.gridH) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  for (const c of l.headerCells) {
    ctx.fillStyle = c.color + '33'
    ctx.fillRect(c.x, c.y, c.w, c.h)
    ctx.fillStyle = c.color
    ctx.fillRect(c.x, c.y + c.h, c.w, 2)
  }
  for (const b of l.chartBars) {
    ctx.fillStyle = b.color
    ctx.globalAlpha = 0.65
    ctx.fillRect(b.x, b.y, b.w, b.h)
    ctx.globalAlpha = 1
  }
  for (const d of l.alertDots) {
    ctx.fillStyle = d.color
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = d.color + '44'
    ctx.beginPath()
    ctx.arc(d.x, d.y, d.r * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  for (const led of l.ledRow) {
    ctx.fillStyle = led.color
    ctx.beginPath()
    ctx.arc(led.x, led.y, led.r, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 8
  cached = tex
  return tex
}
