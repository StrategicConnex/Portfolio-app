'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { Instances, Instance } from '@react-three/drei'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'

const TILE = 0.5
const HALF = 8
/** Centro local del plano del piso elevado (grupo en [0,-0.01,-6], 16×16). */
const FLOOR_Z = -6

/**
 * Piso técnico del datacenter (SPEC §3 — "pasillos simétricos", dirección de
 * arte):
 * - Nivel inferior (y=-2.9): plano oscuro + rejilla técnica sutil (Escena 4).
 * - Piso elevado (y=0): **losetas de raised floor instanciadas** (P1) —
 *   un draw call para 1024 losetas, con **vent tiles** de emisión cyan bajo el
 *   corredor: el "aire frío del plenum" se lee como glow azulado desde abajo
 *   (look NRG/iyO). Losetas y vents se omiten en tier LOW (el plano base ya
 *   da la superficie; el presupuesto LOW queda intacto).
 */
export default function DatacenterFloor({ profile }: { profile: QualityProfile }) {
  const grid = useMemo(() => {
    const size = 20
    const div = 20
    const half = size / 2
    const step = size / div
    const pts: number[] = []
    for (let i = 0; i <= div; i++) {
      const p = -half + i * step
      pts.push(p, 0, -half, p, 0, half)
      pts.push(-half, 0, p, half, 0, p)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3))
    return g
  }, [])

  const showTiles = profile !== 'LOW'

  /** Losetas raised floor: 32×32 sobre el área 16×16 del plano (1 DC). */
  const tiles = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let x = -HALF + TILE / 2; x < HALF; x += TILE) {
      for (let z = FLOOR_Z - HALF + TILE / 2; z < FLOOR_Z + HALF; z += TILE) {
        arr.push([x, 0.015, z])
      }
    }
    return arr
  }, [])

  /** Vent tiles del corredor: 2 columnas a lo largo del pasillo (glow cyan). */
  const vents = useMemo(() => {
    const arr: [number, number, number][] = []
    for (let z = -12; z <= -2; z += 0.5) {
      arr.push([-0.25, 0.02, z])
      arr.push([0.25, 0.02, z])
    }
    return arr
  }, [])

  return (
    <>
      {/* Piso elevado del corredor (y=0): aterriza racks y hero — raised floor
          sobre el plenum técnico de y=-2.9 (lectura de datacenter real, S5).
          Metalness bajo + roughness media: capta los reflejos del env map. */}
      <group position={[0, -0.01, FLOOR_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial color="#0a1420" metalness={0.35} roughness={0.55} />
        </mesh>
        {/* Losetas de raised floor (P1): variación de tono por fila/columna
            (damasco sutil — escala humana del datacenter). */}
        {showTiles && (
          <Instances limit={1100}>
            <boxGeometry args={[0.46, 0.02, 0.46]} />
            <meshStandardMaterial color="#0b1524" metalness={0.45} roughness={0.6} />
            {tiles.map((p, i) => (
              <Instance key={i} position={p} color={i % 2 === 0 ? '#0b1524' : '#0a1220'} />
            ))}
          </Instances>
        )}
        {/* Vent tiles del plenum (P1): glow cyan frío bajo el corredor. */}
        {showTiles && (
          <Instances limit={64}>
            <boxGeometry args={[0.46, 0.03, 0.46]} />
            <meshStandardMaterial
              color="#081120"
              metalness={0.4}
              roughness={0.7}
              emissive="#22d3ee"
              emissiveIntensity={0.45}
            />
            {vents.map((p, i) => (
              <Instance key={i} position={p} />
            ))}
          </Instances>
        )}
      </group>
      {/* Nivel técnico inferior (S4): donde descansan las unidades de backup */}
      <group position={[0, -2.9, -7]}>
        {/* Plano base: captura la luz (revelado de S5, ambiente de S4) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#0d1b30" metalness={0.4} roughness={0.7} />
        </mesh>
        {/* Rejilla técnica sutil */}
        <lineSegments geometry={grid}>
          <lineBasicMaterial color="#4DA3FF" transparent opacity={0.1} />
        </lineSegments>
      </group>
    </>
  )
}
