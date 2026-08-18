'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Stars, Html } from '@react-three/drei'
import { useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { nodes, edges, type NodeDefinition } from '@/data/mindmap'
import { useLanguage } from '@/context/LanguageContext'

function ParticleNode({
  node,
  isSelected,
  isRelated,
  onSelect,
}: {
  node: NodeDefinition
  isSelected: boolean
  isRelated: boolean
  onSelect: (label: string) => void
}) {
  const { t } = useLanguage()
  const pointsRef = useRef<THREE.Points>(null)
  const [hovered, setHovered] = useState(false)
  const glowRef = useRef<THREE.Mesh>(null)
  
  const radius = 0.4

  const [positions] = useState(() => {
    const pos = new Float32Array(node.particleCount * 3)
    for (let i = 0; i < node.particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)
    }
    return pos
  })

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

  const opacity = isSelected ? 0.95 : isRelated ? 0.85 : 0.55
  const labelColor = isSelected ? '#FFFFFF' : isRelated ? '#E2E8F0' : '#C5A46D'

  return (
    <group position={node.pos}>
      <mesh
        ref={glowRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect(node.label)
        }}
      >
        <sphereGeometry args={[radius + 0.12, 32, 32]} />
        <meshBasicMaterial color={node.color} transparent opacity={hovered || isSelected ? 0.35 : 0.12} />
      </mesh>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color={node.color} transparent opacity={opacity} />
      </points>

      <Text
        position={[0, radius + 0.5, 0]}
        fontSize={0.18}
        color={labelColor}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {t(node.labelKey)}
      </Text>

      {(hovered || isSelected) && node.subs.length > 0 && (
        <Html position={[0, radius + 1.3, 0]} center>
          <div style={{
            background: 'rgba(30, 144, 255, 0.12)',
            color: '#E0F2FE',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '11px',
            border: '1px solid rgba(56,189,248,0.35)',
            boxShadow: '0 0 20px rgba(56,189,248,0.15)',
            maxWidth: '200px',
            textAlign: 'center',
            pointerEvents: 'none',
            backdropFilter: 'blur(5px)',
          }}>
            <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--info)' }}>{t('arch.mindmap.deps')}</strong>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {node.subKeys.map((subKey, idx) => (
                <li key={idx} style={{ margin: '2px 0', fontSize: '10px' }}>▸ {t(subKey)}</li>
              ))}
            </ul>
          </div>
        </Html>
      )}
    </group>
  )
}

/* ── Conexiones flujo neon ── */
function NeonConnections({ selectedLabel }: { selectedLabel: string | null }) {
  const lineRefs = useRef<(THREE.Line | null)[]>([])

  useFrame((state) => {
    lineRefs.current.forEach((line, idx) => {
      if (!line) return
      const positions = line.geometry.attributes.position.array as Float32Array
      const progress = (state.clock.elapsedTime * 0.52 + idx * 0.18) % 1
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 2] = Math.sin((i / positions.length) * Math.PI - progress * Math.PI * 2) * 0.08
      }
      line.geometry.attributes.position.needsUpdate = true
    })
  })

  const connectionData = useMemo(() => {
    return edges.map((edge) => {
      const from = nodes.find(node => node.label === edge[0])!
      const to = nodes.find(node => node.label === edge[1])!
      const start = new THREE.Vector3(...from.pos)
      const end = new THREE.Vector3(...to.pos)
      const points = []
      for (let j = 0; j <= 28; j++) {
        const t = j / 28
        points.push(start.clone().lerp(end, t))
      }
      const positionArray = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))
      return { edge, positionArray }
    })
  }, [])

  return (
    <>
      {connectionData.map((data, i) => {
        const selectedNode = selectedLabel ? nodes.find(node => node.label === selectedLabel) : undefined
        const active = Boolean(
          selectedNode &&
          ((selectedLabel && data.edge.includes(selectedLabel)) || selectedNode.related.includes(data.edge[0]) || selectedNode.related.includes(data.edge[1]))
        )
        
        return (
          <line key={i} ref={(el) => { lineRefs.current[i] = el as THREE.Line | null }}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[data.positionArray, 3]}
                count={data.positionArray.length / 3}
                array={data.positionArray}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={active ? '#FFFFFF' : '#00FFFF'}
              transparent
              opacity={active ? 0.95 : 0.28}
              linewidth={active ? 2.5 : 1.2}
            />
          </line>
        )
      })}
    </>
  )
}

/* ── Escena Three.js ── */
function Scene({ selectedLabel, onSelect }: { selectedLabel: string | null; onSelect: (label: string | null) => void }) {
  return (
    <>
      <color attach="background" args={['#050e1a']} />
      <fog attach="fog" args={['#050e1a', 9, 25]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#1E90FF" />
      <pointLight position={[-5, -5, 5]} intensity={1.5} color="#00FFFF" />
      <Stars radius={80} depth={50} count={2500} factor={4} saturation={0} fade speed={0.8} />
      <NeonConnections selectedLabel={selectedLabel} />
      {nodes.map((node, i) => {
        const isSelected = selectedLabel === node.label
        const selectedNode = selectedLabel ? nodes.find(n => n.label === selectedLabel) : undefined
        const isRelated = Boolean(
          selectedNode &&
          (node.related.includes(selectedLabel ?? '') ||
          (node.label !== selectedLabel && selectedNode.related.includes(node.label)))
        )
        return (
          <ParticleNode
            key={i}
            node={node}
            isSelected={isSelected}
            isRelated={isRelated}
            onSelect={(label) => onSelect(selectedLabel === label ? null : label)}
          />
        )
      })}
      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={13}
        autoRotate
        autoRotateSpeed={0.5}
        onStart={() => onSelect(null)}
      />
    </>
  )
}

/* ── Export ── */
export default function MindMap3D() {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    // Defer the initial update to avoid synchronous state updates in effect body
    setTimeout(checkMobile, 0)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const canvasHeight = isMobile ? 300 : 480
  
  return (
    <div style={{ width: '100%', height: canvasHeight, borderRadius: 16, overflow: 'hidden', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 9], fov: isMobile ? 70 : 55 }}>
        <Scene selectedLabel={selectedLabel} onSelect={setSelectedLabel} />
      </Canvas>
    </div>
  )
}
