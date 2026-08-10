'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import { nodes, edges } from '@/data/mindmap'
import HudLabel from './HudLabel'
import { NODE_LABEL_KEYS } from '@/context/translations/datacenter'

const SCALE = 0.55

/**
 * Topología holográfica decorativa de la Escena 2 (SPEC §20): reutiliza
 * `src/data/mindmap.ts` (ADR-003) como una pared holográfica — aristas en un
 * solo lineSegments y nodos en un solo Points. Sin interacción (decorativo).
 */
export default function PurdueHologram() {
  const { linePositions, nodePositions, nodeColors } = useMemo(() => {
    const byLabel = new Map(nodes.map((n) => [n.label, n]))
    const lineArr: number[] = []
    for (const [a, b] of edges) {
      const pa = byLabel.get(a)?.pos
      const pb = byLabel.get(b)?.pos
      if (!pa || !pb) continue
      lineArr.push(pa[0] * SCALE, pa[1] * SCALE, 0, pb[0] * SCALE, pb[1] * SCALE, 0)
    }
    const nodeArr: number[] = []
    const colArr: number[] = []
    for (const n of nodes) {
      nodeArr.push(n.pos[0] * SCALE, n.pos[1] * SCALE, 0)
      const c = new THREE.Color(n.color)
      colArr.push(c.r, c.g, c.b)
    }
    return {
      linePositions: new Float32Array(lineArr),
      nodePositions: new Float32Array(nodeArr),
      nodeColors: new Float32Array(colArr),
    }
  }, [])

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    return g
  }, [linePositions])

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3))
    g.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3))
    return g
  }, [nodePositions, nodeColors])

  return (
    <group position={[0, 3.4, -2.2]}>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </lineSegments>
      <points geometry={nodeGeo}>
        <pointsMaterial
          size={0.2}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      {/* Labels de nodos (SPEC §13, §14): claves i18n, nunca el label crudo. */}
      {nodes.map((n) => {
        const key = NODE_LABEL_KEYS[n.label]
        if (!key) return null
        return (
          <HudLabel
            key={n.label}
            position={[n.pos[0] * SCALE, n.pos[1] * SCALE - 0.45, 0.2]}
            labelKey={key}
            scene={1}
            variant="node"
            color={n.color}
            distanceFactor={10}
          />
        )
      })}
    </group>
  )
}
