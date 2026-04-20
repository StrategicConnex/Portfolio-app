'use client'

import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float, MeshDistortMaterial, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useLanguage } from '@/context/LanguageContext'

/* ─── Level Data ─── */
const LEVELS = [
  { id: 4, y: 2.4, color: '#6366f1', label: 'Level 4: Enterprise', desc: 'ERP, Email, Internet DMZ' },
  { id: 3, y: 1.2, color: '#3b82f6', label: 'Level 3: Operations', desc: 'MES, Historians, Asset Mgmt' },
  { id: 2, y: 0.0, color: '#10b981', label: 'Level 2: Control',    desc: 'SCADA, HMI, Engineering' },
  { id: 1, y: -1.2, color: '#f59e0b', label: 'Level 1: Field',      desc: 'PLCs, RTUs, Controllers' },
  { id: 0, y: -2.4, color: '#ef4444', label: 'Level 0: Process',    desc: 'Sensors, Actuators, IO' },
]

/* ─── Individual Level Component ─── */
function PurdueLevel({ data, active, onHover }: { data: typeof LEVELS[0]; active: boolean; onHover: (id: number | null) => void }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = data.y + Math.sin(state.clock.elapsedTime + data.id) * 0.05
    }
  })

  return (
    <group>
      {/* The Plane */}
      <mesh 
        ref={meshRef}
        onPointerOver={() => onHover(data.id)}
        onPointerOut={() => onHover(null)}
        position={[0, data.y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[6, 4]} />
        <MeshDistortMaterial 
          color={data.color}
          speed={2}
          distort={active ? 0.2 : 0}
          opacity={active ? 0.4 : 0.15}
          transparent
          side={THREE.DoubleSide}
        />
        
        {/* Wireframe Edge */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(6, 4)]} />
          <lineBasicMaterial color={data.color} opacity={active ? 0.8 : 0.3} transparent />
        </lineSegments>
      </mesh>

      {/* Label */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          position={[-3.5, data.y, 0]}
          fontSize={0.25}
          color={data.color}
          anchorX="right"
          font="/fonts/Inter-Bold.ttf" // Optional: ensure this exists or use default
        >
          {data.label.split(':')[0]}
        </Text>
      </Float>

      {/* Detail Text (only when active) */}
      {active && (
        <Text
          position={[0, data.y + 0.6, 0]}
          fontSize={0.18}
          color="white"
          maxWidth={4}
          textAlign="center"
        >
          {data.desc}
        </Text>
      )}
    </group>
  )
}

/* ─── Scene Component ─── */
function PurdueScene() {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null)

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#1E90FF" />
      
      <group rotation={[0, -0.4, 0]}>
        {LEVELS.map((level) => (
          <PurdueLevel 
            key={level.id} 
            data={level} 
            active={hoveredLevel === level.id}
            onHover={setHoveredLevel}
          />
        ))}
        
        {/* Connecting Lines (Vertical Pillars) */}
        <mesh position={[-2.8, 0, -1.8]}>
          <boxGeometry args={[0.02, 5, 0.02]} />
          <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
        </mesh>
        <mesh position={[2.8, 0, -1.8]}>
          <boxGeometry args={[0.02, 5, 0.02]} />
          <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
        </mesh>
        <mesh position={[2.8, 0, 1.8]}>
          <boxGeometry args={[0.02, 5, 0.02]} />
          <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
        </mesh>
        <mesh position={[-2.8, 0, 1.8]}>
          <boxGeometry args={[0.02, 5, 0.02]} />
          <meshBasicMaterial color="#ffffff" opacity={0.1} transparent />
        </mesh>
      </group>

      <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
      <OrbitControls 
        enableZoom={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.5}
        makeDefault 
      />
    </>
  )
}

/* ─── Main Export ─── */
export default function PurdueModel3D() {
  const { t } = useLanguage()
  
  return (
    <div className="w-full h-[500px] md:h-[650px] relative bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden group">
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-xs font-bold tracking-[2px] text-blue-400 uppercase mb-1">
          {t('arquitectura.purdue.title')}
        </h3>
        <p className="text-[10px] text-slate-500 font-mono">
          [MODE: 3D_SPATIAL_VIEW]
        </p>
      </div>

      <div className="absolute bottom-6 right-6 z-10 pointer-events-none text-right">
        <p className="text-[10px] text-slate-400 italic">
          {t('arquitectura.purdue.interaction')}
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
        <PurdueScene />
      </Canvas>
      
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />
    </div>
  )
}
