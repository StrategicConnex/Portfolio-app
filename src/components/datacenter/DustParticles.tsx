'use client'

import { useMemo } from 'react'
import { Points, PointMaterial } from '@react-three/drei'
import { PARTICLES_BOX } from '@/lib/datacenter.layout'

/** PRNG determinista puro: mismo (seed, i) → mismo valor en [0,1). Idempotente entre renders. */
function seededUnit(seed: number, i: number): number {
  let h = (seed ^ Math.imul(i, 0x9e3779b1)) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Partículas de polvo en suspensión (Escena 1 y ambiente general). */
export default function DustParticles({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    const { min, max } = PARTICLES_BOX
    for (let i = 0; i < count; i++) {
      arr[i * 3] = min[0] + seededUnit(1, i * 3) * (max[0] - min[0])
      arr[i * 3 + 1] = min[1] + seededUnit(2, i * 3 + 1) * (max[1] - min[1])
      arr[i * 3 + 2] = min[2] + seededUnit(3, i * 3 + 2) * (max[2] - min[2])
    }
    return arr
  }, [count])

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#9cc8ff"
        size={0.022}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  )
}
