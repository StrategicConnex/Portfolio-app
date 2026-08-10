'use client'

import { useEffect, useState } from 'react'
import type { DeviceTier } from './useHardwareDetection'

export type QualityProfile = 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' | 'STATIC'

const ORDER: QualityProfile[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW', 'STATIC']

function tierToProfile(tier: DeviceTier, coarsePointer: boolean): QualityProfile {
  if (tier === 'LOW') return 'LOW'
  if (tier === 'HIGH' && !coarsePointer) return 'ULTRA'
  if (tier === 'HIGH') return 'HIGH'
  return 'MEDIUM'
}

type Options = {
  tier: DeviceTier
  webglSupported: boolean
  reduced: boolean
  coarsePointer: boolean
}

/**
 * Perfil de calidad adaptativo (SPEC §9): ULTRA → STATIC.
 * - Sin WebGL o reduced-motion ⇒ STATIC (StaticPoster).
 * - El perfil base se deriva en el render; la degradación runtime (FPS
 *   sostenido < 45 → MEDIUM, < 30 → LOW) solo se actualiza desde el sampler
 *   rAF, nunca desde el cuerpo de un efecto. FPS ≥ 50 recupera el base.
 * El DOM, la navegación y el Copilot nunca se degradan.
 */
export function useAdaptiveQuality({ tier, webglSupported, reduced, coarsePointer }: Options): QualityProfile {
  const base: QualityProfile = !webglSupported || reduced ? 'STATIC' : tierToProfile(tier, coarsePointer)
  const [downgrade, setDowngrade] = useState(0)

  useEffect(() => {
    if (!webglSupported || reduced) return

    let raf = 0
    let last = performance.now()
    const samples: number[] = []

    const loop = (now: number) => {
      const dt = now - last
      last = now
      if (dt > 0 && dt < 100) samples.push(1000 / dt)

      if (samples.length >= 60) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length
        samples.length = 0
        setDowngrade((prev) => {
          if (avg < 30) return 2
          if (avg < 45) return Math.max(prev, 1)
          if (avg >= 50) return 0
          return prev
        })
      }
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [webglSupported, reduced])

  if (base === 'STATIC') return 'STATIC'
  const baseIdx = ORDER.indexOf(base)
  return ORDER[Math.min(baseIdx + downgrade, ORDER.indexOf('LOW'))]
}
