'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STREAM_PATHS, samplePath } from '@/lib/datacenter.layout'

const PER_PATH = 48

/**
 * Flujos de datos (Escena 3): puntos que viajan por los cables. La geometría
 * se crea una vez; por frame solo se muta el atributo position (SPEC §22).
 * La animación corre al ritmo del MicroAnimDriver (frameloop demand).
 */
export default function DataStreams() {
  const geo = useMemo(() => {
    const positions = new Float32Array(STREAM_PATHS.length * PER_PATH * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    STREAM_PATHS.forEach((path, p) => {
      for (let i = 0; i < PER_PATH; i++) {
        const pt = samplePath(path, i / (PER_PATH - 1))
        positions[(p * PER_PATH + i) * 3] = pt[0]
        positions[(p * PER_PATH + i) * 3 + 1] = pt[1]
        positions[(p * PER_PATH + i) * 3 + 2] = pt[2]
      }
    })
    return g
  }, [])

  const pointsRef = useRef<THREE.Points | null>(null)

  useFrame((state) => {
    const points = pointsRef.current
    if (!points) return
    const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute
    const pos = attr.array as Float32Array
    const offset = (state.clock.elapsedTime * 1.6) % 1
    STREAM_PATHS.forEach((path, p) => {
      for (let i = 0; i < PER_PATH; i++) {
        const idx = p * PER_PATH + i
        const tt = (i / (PER_PATH - 1) + offset) % 1
        const pt = samplePath(path, tt)
        pos[idx * 3] = pt[0]
        pos[idx * 3 + 1] = pt[1]
        pos[idx * 3 + 2] = pt[2]
      }
    })
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        size={0.085}
        color="#22d3ee"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
