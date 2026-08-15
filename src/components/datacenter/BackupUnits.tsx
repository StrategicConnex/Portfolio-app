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

/** Unidad procedural aislada para el fallback del slot (misma geometría/color). */
function ProceduralBackupUnit({
  position,
  scale,
}: {
  position: [number, number, number]
  scale: [number, number, number]
}) {
  return (
    <Instances limit={2}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#0d1524" metalness={0.6} roughness={0.5} />
      <Instance position={position} scale={scale} color="#111c30" />
    </Instances>
  )
}
