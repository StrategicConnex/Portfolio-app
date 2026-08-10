'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'

/** Hz de micro-animaciones por tier (SPEC §10 — invalidación híbrida). */
const HZ: Record<QualityProfile, number> = {
  ULTRA: 15,
  HIGH: 12,
  MEDIUM: 8,
  LOW: 0,
  STATIC: 0,
}

/**
 * Driver de micro-animaciones: con `frameloop="demand"` los flujos/LEDs solo
 * se animan si se invalidan frames. Este driver los invalida a Hz reducido
 * (GPU barata), 0 en LOW/STATIC (estático).
 */
export default function MicroAnimDriver({ profile }: { profile: QualityProfile }) {
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const hz = HZ[profile] ?? 0
    if (hz <= 0) return
    const id = window.setInterval(() => invalidate(), 1000 / hz)
    return () => window.clearInterval(id)
  }, [profile, invalidate])

  return null
}
