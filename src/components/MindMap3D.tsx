'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line, Float, Stars } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

/* ── Nodos del mapa ── */
const nodes = [
  { label: 'JUAN PALACIOS',       pos: [0, 0, 0] as [number,number,number],    color: '#C5A46D', size: 0.48 },
  { label: 'Ciberseguridad IT/OT',pos: [3, 1.2, 0] as [number,number,number],  color: '#1E90FF' },
  { label: 'Redes & Infra',        pos: [-3, 1.2, 0] as [number,number,number], color: '#3B82F6' },
  { label: 'Cloud & Virt.',        pos: [0, 3, 0.5] as [number,number,number],  color: '#06B6D4' },
  { label: 'OT / Industrial',      pos: [0, -3, 0] as [number,number,number],   color: '#F97316' },
  { label: 'Desarrollo Web',       pos: [3.5, -1.5, 1] as [number,number,number], color: '#8B5CF6' },
  { label: 'Automatización',       pos: [-3.5, -1.5, 1] as [number,number,number], color: '#10B981' },
]

/* ── Nodo individual ── */
function Node({
  label, pos, color, size = 0.3,
}: {
  label: string; pos: [number, number, number]; color: string; size?: number
}) {
  const meshRef   = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += 0.005
    meshRef.current.position.y  =
      pos[1] + Math.sin(state.clock.elapsedTime * 0.8 + pos[0]) * 0.07
  })

  return (
    <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={pos}>
        <mesh
          ref={meshRef}
          scale={hovered ? 1.2 : 1}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[size, 32, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered ? 1.2 : 0.7}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>

        {/* Label */}
        <Text
          position={[0, size + 0.32, 0]}
          fontSize={0.19}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {label}
        </Text>
      </group>
    </Float>
  )
}

/* ── Líneas de conexión ── */
function Connections() {
  const center = new THREE.Vector3(0, 0, 0)
  return (
    <>
      {nodes.slice(1).map((n, i) => (
        <Line
          key={i}
          points={[center, new THREE.Vector3(...n.pos)]}
          color={n.color}
          lineWidth={1.2}
          transparent
          opacity={0.55}
        />
      ))}
    </>
  )
}

/* ── Escena Three.js ── */
function Scene() {
  return (
    <>
      <color attach="background" args={['#050e1a']} />
      <fog attach="fog" args={['#050e1a', 9, 20]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]}  intensity={2.5} color="#1E90FF" />
      <pointLight position={[-5, -5, 5]} intensity={1.5} color="#C5A46D" />
      <Stars radius={80} depth={50} count={2500} factor={4} saturation={0} fade speed={0.8} />
      <Connections />
      {nodes.map((n, i) => (
        <Node key={i} label={n.label} pos={n.pos} color={n.color} size={n.size} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  )
}

/* ── Export ── */
export default function MindMap3D() {
  return (
    <div style={{ width: '100%', height: 480, borderRadius: 16, overflow: 'hidden', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: 55 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
