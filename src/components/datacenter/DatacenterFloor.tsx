'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Piso técnico del nivel inferior (SPEC §3 — "pasillos simétricos", dirección
 * de arte): un plano oscuro con rejilla sutil en y = -2.9, donde descansan las
 * unidades de backup (Escena 4) y que da superficie iluminada a la vista amplia
 * del clímax (Escena 5). Procedural, 2 draw calls, sin texturas.
 */
export default function DatacenterFloor() {
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

  return (
    <>
      {/* Piso elevado del corredor (y=0): aterriza racks y hero — raised floor
          sobre el plenum técnico de y=-2.9 (lectura de datacenter real, S5).
          Metalness bajo + roughness media: capta los reflejos del env map. */}
      <group position={[0, -0.01, -6]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial color="#0a1420" metalness={0.35} roughness={0.55} />
        </mesh>
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
          <lineBasicMaterial color="#1e90ff" transparent opacity={0.1} />
        </lineSegments>
      </group>
    </>
  )
}
