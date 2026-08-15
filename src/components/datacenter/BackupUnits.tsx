'use client'

import { useMemo } from 'react'
import { ContactShadows, Instances, Instance } from '@react-three/drei'
import { BACKUP_UNITS } from '@/lib/datacenter.layout'

/** Unidades de backup / mass storage (Escena 4). La unidad protagonista —la más
 * cercana a cámara ([0,-2.4,-4])— es slot GLB (`storage_unit_v02.glb`, Tripo)
 * con fallback procedural (SPEC §37); el resto permanece instanciado. 2 draw calls.
 * El GLB se autoriza al footprint del slot (1.8×1×1.2, origen en base, sin
 * scale en runtime — convención ASSET-PIPELINE §5, igual que el rack hero).
 *
 * Dirección de arte (G7.4): las unidades procedurales son gabinetes metálicos
 * oscuros, familia del corredor — SIN glow ámbar (las "cajas amarillas" que
 * rompían la coherencia junto al storage fotográfico). El acento ámbar de S4
 * vive en la luz de escena (`SceneLighting`, amber/warmLow), no en los meshes.
 */
export default function BackupUnits({ count }: { count: number }) {
  const units = useMemo(() => BACKUP_UNITS.slice(0, count), [count])
  const first = units[0]

  return (
    <group>
      {/* Sombras de contacto del pool de storage (P1): aterrizan las unidades
          sobre el piso técnico (y=-2.9) — bake 1 frame (frameloop demand). */}
      <ContactShadows position={[0, -2.885, -5]} opacity={0.4} scale={[8, 4]} blur={2.6} far={1.6} resolution={256} frames={1} color="#000000" />
      <ContactShadows position={[0, -2.885, -10]} opacity={0.35} scale={[6, 4]} blur={2.6} far={1.6} resolution={256} frames={1} color="#000000" />

      {/* Unidad protagonista (S4): procedural — GLB removido, imagen realista en DOM. */}
      {first && <ProceduralBackupUnit position={first.position} scale={first.scale} />}

      <Instances limit={16}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0d1524" metalness={0.6} roughness={0.5} />
        {/* j = i-1: se preserva la paridad de color original del pool */}
        {units.slice(1).map((u, j) => (
          <Instance key={j} position={u.position} scale={u.scale} color={(j + 1) % 2 === 0 ? '#111c30' : '#0d1524'} />
        ))}
      </Instances>
    </group>
  )
}

/** Unidad procedural aislada para el fallback del slot — storage array detallado. */
function ProceduralBackupUnit({
  position,
  scale,
}: {
  position: [number, number, number]
  scale: [number, number, number]
}) {
  const px = position[0]
  const py = position[1]
  const pz = position[2]
  const sx = scale[0]
  const sy = scale[1]
  const sz = scale[2]

  return (
    <group>
      {/* Chasis principal */}
      <Instances limit={2}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0d1524" metalness={0.6} roughness={0.5} />
        <Instance position={position} scale={scale} color="#111c30" />
      </Instances>

      {/* Bezel frontal — marco metálico alrededor del panel */}
      <mesh position={[px, py, pz + sz * 0.51]} scale={[sx * 1.01, sy * 1.005, sz * 0.015]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1a2540" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Panel interior (zona lisa del storage) */}
      <mesh position={[px, py, pz + sz * 0.515]} scale={[sx * 0.92, sy * 0.92, sz * 0.008]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0b1524" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* LED status strip — 4 indicadores en la parte inferior */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh
          key={`sled-${i}`}
          position={[px - sx * 0.3 + i * sx * 0.2, py - sy * 0.42, pz + sz * 0.52]}
          scale={[0.02, 0.02, 0.008]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={i < 3 ? '#16a34a' : '#c27a3a'}
            emissive={i < 3 ? '#16a34a' : '#c27a3a'}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}

      {/* Hot-swap handle indicators — 2 líneas horizontales sutiles */}
      {Array.from({ length: 2 }).map((_, i) => (
        <mesh
          key={`handle-${i}`}
          position={[px - sx * 0.15 + i * sx * 0.3, py, pz + sz * 0.52]}
          scale={[sx * 0.12, sy * 0.04, sz * 0.005]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#1a2a44" metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
    </group>
  )
}
