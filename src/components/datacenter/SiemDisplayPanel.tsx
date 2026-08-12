'use client'

import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import { DISPLAY_SLOTS, GLB_ASSETS } from '@/lib/datacenter.layout'
import GlbAsset from './GlbAsset'
import { getSiemUiTexture } from './screenUiTexture'

/**
 * Paneles SIEM (ASSET-SCENE-MAP §5, gap G4): displays con slot GLB
 * (`siem_display_v01.glb`) + fallback procedural; la UI de pantalla es textura
 * procedural local (screenUiTexture, R5) — nunca texto/DOM en geometría (§23).
 * Slots: S3 (lectura de UI, fit ~20% alto desktop) + S5 nodo central (pulso).
 * Tier: ULTRA/HIGH 2 · MEDIUM 1 (S3) · LOW 0 (matriz §4 apaga displays).
 */
export default function SiemDisplayPanel({ profile }: { profile: QualityProfile }) {
  if (profile === 'LOW') return null
  const slots =
    profile === 'ULTRA' || profile === 'HIGH' ? DISPLAY_SLOTS : DISPLAY_SLOTS.slice(0, 1)

  return (
    <group>
      {slots.map((slot) => (
        <GlbAsset
          key={slot.scene}
          path={GLB_ASSETS.siemDisplay}
          position={slot.position}
          fallback={<ProceduralDisplay position={slot.position} />}
        />
      ))}
    </group>
  )
}

/** Fallback procedural: marco industrial (4 barras) + quad de pantalla con la
 * UI SIEM procedural. Footprint 1.62×0.9×0.12, pantalla a +z, base-origin. */
function ProceduralDisplay({ position }: { position: [number, number, number] }) {
  const frameMat = { color: '#0a1420', metalness: 0.3, roughness: 0.6 } as const
  const ui = getSiemUiTexture()
  return (
    <group position={position}>
      <mesh position={[0, 0.87, 0.06]}>
        <boxGeometry args={[1.62, 0.06, 0.12]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[0, 0.03, 0.06]}>
        <boxGeometry args={[1.62, 0.06, 0.12]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[-0.78, 0.45, 0.06]}>
        <boxGeometry args={[0.06, 0.84, 0.12]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[0.78, 0.45, 0.06]}>
        <boxGeometry args={[0.06, 0.84, 0.12]} />
        <meshStandardMaterial {...frameMat} />
      </mesh>
      <mesh position={[0, 0.45, 0.075]}>
        <planeGeometry args={[1.5, 0.84]} />
        <meshStandardMaterial
          color="#0b1220"
          emissive="#e8f6ff"
          emissiveIntensity={0.85}
          map={ui}
          emissiveMap={ui}
        />
      </mesh>
    </group>
  )
}
