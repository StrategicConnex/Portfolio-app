'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars, Html } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

/* ── Nodos del mapa ── */
const nodes = [
  { label: 'JUAN PALACIOS',       pos: [0, 0, 0] as [number,number,number],    color: '#C5A46D', particleCount: 300, subs: [] },
  { label: 'Desarrollo Web',      pos: [4, 0, 0] as [number,number,number],    color: '#8B5CF6', particleCount: 150, subs: ['React', 'Next.js', 'Tailwind', 'UI Premium'] },
  { label: 'IA Aplicada',         pos: [2, 3.46, 0] as [number,number,number], color: '#1E90FF', particleCount: 150, subs: ['Chatbots', 'Automatización', 'Documentos inteligentes', 'Marketing IA'] },
  { label: 'Ingeniería Comercial', pos: [-2, 3.46, 0] as [number,number,number],color: '#10B981', particleCount: 150, subs: ['Licitaciones', 'Presentaciones', 'Propuestas'] },
  { label: 'Diseño Estratégico',  pos: [-4, 0, 0] as [number,number,number],   color: '#F97316', particleCount: 150, subs: ['Branding', 'UX/UI', 'Conversiones'] },
  { label: 'Industrias',          pos: [-2, -3.46, 0] as [number,number,number],color: '#06B6D4', particleCount: 150, subs: ['Oil & Gas', 'Construcción', 'Energía'] },
  { label: 'Resultados',          pos: [2, -3.46, 0] as [number,number,number], color: '#EF4444', particleCount: 150, subs: ['Más ventas', 'Mejor imagen', 'Menos tiempo', 'Escalabilidad'] },
]

/* ── Nodo de partículas ── */
function ParticleNode({
  label, pos, color, particleCount, subs = [],
}: {
  label: string; pos: [number, number, number]; color: string; particleCount: number; subs?: string[]
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const [hovered, setHovered] = useState(false)
  const glowRef = useRef<THREE.Mesh>(null)
  
  const positions = new Float32Array(particleCount * 3)
  const radius = 0.4

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)
  }

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += 0.0008
      pointsRef.current.rotation.y += 0.001
    }
    if (glowRef.current) {
      glowRef.current.scale.set(
        1 + Math.sin(state.clock.elapsedTime * 3) * 0.15,
        1 + Math.sin(state.clock.elapsedTime * 3) * 0.15,
        1 + Math.sin(state.clock.elapsedTime * 3) * 0.15
      )
    }
  })

  return (
    <group position={pos}>
      {/* Glow pulsante */}
      <mesh ref={glowRef} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[radius + 0.1, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.4 : 0.15} />
      </mesh>

      {/* Partículas */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={color} transparent opacity={0.9} />
      </points>

      {/* Label */}
      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.18}
        color="#C5A46D"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>

      {/* Hover info flujo */}
      {hovered && subs.length > 0 && (
        <Html position={[0, radius + 1.3, 0]} center>
          <div style={{
            background: 'rgba(30, 144, 255, 0.1)',
            color: '#00FFFF',
            padding: '10px 14px',
            borderRadius: '4px',
            fontSize: '11px',
            border: '1px solid #00FFFF',
            boxShadow: '0 0 20px rgba(0,255,255,0.5), inset 0 0 10px rgba(0,255,255,0.2)',
            maxWidth: '160px',
            textAlign: 'center',
            pointerEvents: 'none',
            animation: 'pulse 2s infinite',
            backdropFilter: 'blur(4px)'
          }}>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
              }
            `}</style>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {subs.map((sub, idx) => <li key={idx} style={{ margin: '2px 0', fontSize: '10px' }}>▸ {sub}</li>)}
            </ul>
          </div>
        </Html>
      )}
    </group>
  )
}

/* ── Conexiones flujo neon ── */
function NeonConnections() {
  const lineRefs = useRef<THREE.Line[]>([])
  
  const center = new THREE.Vector3(0, 0, 0)
  
  useFrame((state) => {
    nodes.slice(1).forEach((n, idx) => {
      if (!lineRefs.current[idx]) return
      const line = lineRefs.current[idx]
      const positions = (line.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array
      
      const progress = (state.clock.elapsedTime * 0.5 + idx * 0.15) % 1
      for (let i = 0; i < positions.length; i += 3) {
        const t = i / positions.length
        positions[i + 2] = Math.sin(t * Math.PI - progress * Math.PI * 2) * 0.1
      }
      (line.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true
    })
  })

  return (
    <>
      {nodes.slice(1).map((n, i) => {
        const start = center.clone()
        const end = new THREE.Vector3(...n.pos)
        const points = []
        for (let j = 0; j <= 20; j++) {
          const t = j / 20
          points.push(start.clone().lerp(end, t))
        }
        
        return (
          <line key={i} ref={(el) => { if (el) lineRefs.current[i] = el }} >
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={points.length} array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))} itemSize={3} />
            </bufferGeometry>
            <lineBasicMaterial color="#00FFFF" linewidth={2} transparent opacity={0.8} />
          </line>
        )
      })}
    </>
  )
}

/* ── Escena Three.js ── */
function Scene() {
  return (
    <>
      <color attach="background" args={['#050e1a']} />
      <fog attach="fog" args={['#050e1a', 9, 25]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#1E90FF" />
      <pointLight position={[-5, -5, 5]} intensity={1.5} color="#00FFFF" />
      <Stars radius={80} depth={50} count={2500} factor={4} saturation={0} fade speed={0.8} />
      <NeonConnections />
      {nodes.map((n, i) => (
        <ParticleNode key={i} label={n.label} pos={n.pos} color={n.color} particleCount={n.particleCount} subs={n.subs} />
      ))}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

/* ── Export ── */
export default function MindMap3D() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const canvasHeight = isMobile ? 300 : 480
  
  return (
    <div style={{ width: '100%', height: canvasHeight, borderRadius: 16, overflow: 'hidden', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: isMobile ? 70 : 55 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
