'use client'

import { useMemo } from 'react'
import { Instances, Instance } from '@react-three/drei'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import {
  GLB_ASSETS,
  SWITCH_PROTAGONIST_GLB_POS,
  SWITCH_SLOTS,
  TIER_COUNTS,
} from '@/lib/datacenter.layout'
import GlbAsset from './GlbAsset'

/**
 * Switches 1U (ASSET-SCENE-MAP §5, gap G4): pool instanciado de chasis 1U en la
 * cara frontal de los racks del corredor (S2-S5) + slot GLB del switch
 * protagonista en S3 (origen de data streams) con fallback procedural.
 * El grid de puertos no es legible a distancia de corredor (MESHY-CONTACT-SHEET
 * §1b) — quedan como contexto decorativo: LEDs estáticos (el movimiento en S3
 * lo ponen los data streams), presupuesto instanciado.
 */
export default function ServerSwitchPool({ profile }: { profile: QualityProfile }) {
  const counts = TIER_COUNTS[profile] ?? TIER_COUNTS.MEDIUM
  const slots = useMemo(
    () => SWITCH_SLOTS.slice(0, counts.corridorRows * 2),
    [counts.corridorRows],
  )

  return (
    <group>
      {/* Sombra de contacto simulada del switch protagonista (P1): cuelga de la
          cara frontal del rack (z=-2.05) — un ContactShadows horizontal no
          aplica sobre una superficie vertical; un plano AO oscuro en la cara
          del rack (detrás del chasis 0.5) lo separa de la superficie. */}
      <mesh position={[-2.6, 1.9, -2.055]} renderOrder={1}>
        <planeGeometry args={[0.9, 0.12]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} depthWrite={false} />
      </mesh>

      {/* Slot GLB protagonista (S3, origen de streams) — fallback = chasis aislado */}
      <GlbAsset
        path={GLB_ASSETS.networkSwitch}
        position={SWITCH_PROTAGONIST_GLB_POS}
        fallback={<ProceduralSwitch position={SWITCH_PROTAGONIST_GLB_POS} />}
      />

      {/* Chasis 1U instanciados en los racks del corredor — 1 draw call */}
      <Instances limit={64}>
        <boxGeometry args={[0.82, 0.07, 0.5]} />
        <meshStandardMaterial
          color="#16263f"
          metalness={0.85}
          roughness={0.4}
          emissive="#4DA3FF"
          emissiveIntensity={0.18}
        />
        {slots.map((s, i) => (
          <Instance key={i} position={s.position} color={i % 3 === 0 ? '#22d3ee' : '#1c3357'} />
        ))}
      </Instances>
    </group>
  )
}

/** Fallback procedural del slot (misma geometría que el pool, aislada). */
function ProceduralSwitch({ position }: { position: [number, number, number] }) {
  // El GLB es base-origin (base en y=position[1]); el slab es centro-anclado:
  // +0.035 para que la base coincida con la del GLB.
  return (
    <mesh position={[position[0], position[1] + 0.035, position[2]]}>
      <boxGeometry args={[0.82, 0.07, 0.5]} />
      <meshStandardMaterial
        color="#16263f"
        metalness={0.85}
        roughness={0.4}
        emissive="#4DA3FF"
        emissiveIntensity={0.18}
      />
    </mesh>
  )
}
