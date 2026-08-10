'use client'

import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import {
  BACKGROUND_RACKS,
  CORRIDOR_RACKS,
  HERO_RACK_POS,
  HERO_UNIT_OFFSETS,
  TIER_COUNTS,
  UNIT_OFFSETS,
} from '@/lib/datacenter.layout'

/**
 * Racks del datacenter con GPU instancing (SPEC §20): 2 draw calls totales
 * (cabinets + unidades) sin importar cuántos racks haya. El conteo se
 * escala por tier de calidad.
 */
export default function ServerRackPool({ profile }: { profile: QualityProfile }) {
  const counts = TIER_COUNTS[profile] ?? TIER_COUNTS.MEDIUM

  const corridor = useMemo(
    () => CORRIDOR_RACKS.slice(0, counts.corridorRows * 2),
    [counts.corridorRows],
  )
  const background = useMemo(
    () => BACKGROUND_RACKS.slice(0, counts.backgroundRows * 2),
    [counts.backgroundRows],
  )

  return (
    <group>
      {/* Gabinetes */}
      <Instances limit={64} castShadow={false}>
        <boxGeometry args={[1, 2.4, 0.9]} />
        <meshStandardMaterial color="#0d1524" metalness={0.7} roughness={0.4} />
        <Instance position={HERO_RACK_POS} scale={[1.15, 1.25, 1]} color="#101a30" />
        {corridor.map((r, i) => (
          <Instance key={`c-${i}`} position={r.position} color={r.color} />
        ))}
        {background.map((r, i) => (
          <Instance key={`b-${i}`} position={r.position} scale={r.scale} color={r.color} />
        ))}
      </Instances>

      {/* Unidades (servidores): auto-iluminadas para leerse desde cualquier
          ángulo (clave en la vista amplia de S5) — LEDs azules/cyan. */}
      <Instances limit={256}>
        <boxGeometry args={[0.94, 0.07, 0.6]} />
        <meshStandardMaterial
          color="#16263f"
          metalness={0.5}
          roughness={0.5}
          emissive="#1E90FF"
          emissiveIntensity={0.32}
        />
        {HERO_UNIT_OFFSETS.map((u, i) => (
          <Instance
            key={`hu-${i}`}
            position={[HERO_RACK_POS[0] + u[0], HERO_RACK_POS[1] + u[1], HERO_RACK_POS[2] + u[2]]}
            color={i % 3 === 2 ? '#22d3ee' : '#1c3357'}
          />
        ))}
        {corridor.map((r, i) =>
          UNIT_OFFSETS.map((u, j) => (
            <Instance
              key={`u-${i}-${j}`}
              position={[r.position[0] + u[0], r.position[1] + u[1], r.position[2] + u[2]]}
              color={(j === 2 || j === 4) && i % 2 === 0 ? '#22d3ee' : '#1c3357'}
            />
          )),
        )}
      </Instances>
    </group>
  )
}
