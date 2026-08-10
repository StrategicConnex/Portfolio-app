'use client'

import { useState } from 'react'

export type DeviceTier = 'HIGH' | 'MEDIUM' | 'LOW'

export type HardwareInfo = {
  tier: DeviceTier
  webglSupported: boolean
  coarsePointer: boolean
  cores: number
  deviceMemory?: number
}

function detectWebGL(): boolean {
  if (typeof window === 'undefined' || typeof window.WebGLRenderingContext === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function classify(): HardwareInfo {
  if (typeof window === 'undefined') {
    return { tier: 'MEDIUM', webglSupported: false, coarsePointer: false, cores: 0 }
  }
  const cores = navigator.hardwareConcurrency || 0
  const nav = navigator as unknown as { deviceMemory?: number }
  const deviceMemory = nav.deviceMemory
  const coarsePointer = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

  let tier: DeviceTier = cores >= 8 ? 'HIGH' : cores >= 4 ? 'MEDIUM' : 'LOW'
  if (deviceMemory !== undefined) {
    if (deviceMemory < 4) tier = 'LOW'
    else if (deviceMemory < 8 && tier === 'HIGH') tier = 'MEDIUM'
  }
  // Touch/tablet: cap en MEDIUM salvo hardware realmente potente
  if (coarsePointer && tier === 'HIGH' && cores < 12) tier = 'MEDIUM'

  return { tier, webglSupported: detectWebGL(), coarsePointer, cores, deviceMemory }
}

/**
 * Clasifica el dispositivo (HIGH/MEDIUM/LOW) y detecta WebGL (SPEC §9).
 * Componentes cliente montados con `ssr:false` — la clasificación se hace
 * una vez en el inicializador lazy (no hay estado que re-sincronizar).
 */
export function useHardwareDetection(): HardwareInfo {
  const [info] = useState<HardwareInfo>(classify)
  return info
}
