'use client'

import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import { BACKUP_UNITS } from '@/lib/datacenter.layout'

/** Unidades de backup / mass storage (Escena 4) — 1 draw call. */
export default function BackupUnits({ count }: { count: number }) {
  const units = useMemo(() => BACKUP_UNITS.slice(0, count), [count])

  return (
    <Instances limit={16}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#1a1206"
        metalness={0.6}
        roughness={0.5}
        emissive="#f59e0b"
        emissiveIntensity={0.28}
      />
      {units.map((u, i) => (
        <Instance key={i} position={u.position} scale={u.scale} color={i % 2 === 0 ? '#241a08' : '#1a1206'} />
      ))}
    </Instances>
  )
}
