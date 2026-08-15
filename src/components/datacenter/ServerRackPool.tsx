'use client'

import { useMemo } from 'react'
import { ContactShadows, Instances, Instance } from '@react-three/drei'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import {
  BACKGROUND_RACKS,
  CORRIDOR_RACKS,
  HERO_RACK_POS,
  HERO_UNIT_OFFSETS,
  TIER_COUNTS,
  UNIT_OFFSETS,
} from '@/lib/datacenter.layout'
import { getChassisBump, getChassisMap, getUnitBump } from '@/lib/datacenterTextures'

/**
 * Racks del datacenter con GPU instancing (SPEC §20): 2 draw calls para el
 * corredor/fondo (cabinets + unidades) sin importar cuántos racks haya, más
 * el slot del rack hero (S1). El conteo se escala por tier de calidad.
 */
export default function ServerRackPool({ profile }: { profile: QualityProfile }) {
  const counts = TIER_COUNTS[profile] ?? TIER_COUNTS.MEDIUM

  const corridor = useMemo(
    () => CORRIDOR_RACKS.slice(0, counts.corridorRows * 2),
    [counts.corridorRows],
  )
  const background = useMemo(
    () => BACKGROUND_RACKS.slice(0, counts.backgroundRows * 2),
    [counts.backgroundRows],
  )

  return (
    <group>
      {/* Sombra de contacto del rack hero (bake 1 frame — frameloop demand,
          SPEC §10): aterriza el protagonista de S1 sobre el piso elevado. */}
      <ContactShadows
        position={[0, -0.002, 0]}
        opacity={0.35}
        scale={5}
        blur={2.6}
        far={2.5}
        resolution={256}
        frames={1}
        color="#000000"
      />

      {/* Rack hero (S1): procedural — el GLB fue removido en favor de imagen
          realista en el DOM layer (hybrid approach). */}
      <ProceduralHeroRack />

      {/* Gabinetes del corredor + fondo: material compartido (instancing) con
          el detalle PBR procedural del chasis (juntas + ventilación). El map
          multiplica el color por instancia — la variación de fila se conserva.
          emissive sutil para que los racks se lean en la penumbra. */}
      <Instances limit={64} castShadow={false}>
        <boxGeometry args={[1, 2.4, 0.9]} />
        <meshStandardMaterial
          color="#0d1524"
          metalness={0.7}
          roughness={0.4}
          map={getChassisMap()}
          bumpMap={getChassisBump()}
          bumpScale={0.03}
          emissive="#0a1525"
          emissiveIntensity={0.15}
        />
        {corridor.map((r, i) => (
          <Instance key={`c-${i}`} position={r.position} color={r.color} />
        ))}
        {background.map((r, i) => (
          <Instance key={`b-${i}`} position={r.position} scale={r.scale} color={r.color} />
        ))}
      </Instances>

      {/* Unidades (servidores): auto-iluminadas para leerse desde cualquier
          ángulo (clave en la vista amplia de S5) — LEDs azules/cyan más brillantes. */}
      <Instances limit={256}>
        <boxGeometry args={[0.94, 0.07, 0.6]} />
        <meshStandardMaterial
          color="#16263f"
          metalness={0.5}
          roughness={0.5}
          emissive="#4DA3FF"
          emissiveIntensity={0.55}
          bumpMap={getUnitBump()}
          bumpScale={0.05}
        />
        {corridor.map((r, i) =>
          UNIT_OFFSETS.map((u, j) => (
            <Instance
              key={`u-${i}-${j}`}
              position={[r.position[0] + u[0], r.position[1] + u[1], r.position[2] + u[2]]}
              color={(j === 2 || j === 4) && i % 2 === 0 ? '#22d3ee' : '#1c3357'}
            />
          )),
        )}
      </Instances>
    </group>
  )
}

/** Rack hero (S1) procedural — geometría detallada con marco de puerta,
 * LED indicators, ventilation grille y mesh door. */
function ProceduralHeroRack() {
  const hx = HERO_RACK_POS[0]
  const hy = HERO_RACK_POS[1]
  const hz = HERO_RACK_POS[2]
  const rw = 1.15 // width scale
  const rh = 1.25 // height scale
  const rd = 1.0  // depth scale

  return (
    <group>
      {/* Chasis principal */}
      <Instances limit={2}>
        <boxGeometry args={[1, 2.4, 0.9]} />
        <meshStandardMaterial
          color="#0d1524"
          metalness={0.7}
          roughness={0.4}
          map={getChassisMap()}
          bumpMap={getChassisBump()}
          bumpScale={0.03}
        />
        <Instance position={HERO_RACK_POS} scale={[rw, rh, rd]} color="#101a30" />
      </Instances>

      {/* Marco de puerta frontal — crea relieve en el silhouette */}
      <mesh position={[hx, hy, hz + 0.46 * rd]} scale={[rw * 1.02, rh * 1.01, 0.02]}>
        <boxGeometry args={[1, 2.4, 1]} />
        <meshStandardMaterial color="#1a2540" metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Marco interior (bisel de puerta) */}
      <mesh position={[hx, hy, hz + 0.47 * rd]} scale={[rw * 0.94, rh * 0.96, 0.01]}>
        <boxGeometry args={[1, 2.4, 1]} />
        <meshStandardMaterial color="#0f1a2e" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* Ventilation grille superior — 5 ranuras horizontales */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={`vent-${i}`}
          position={[hx, hy + rh * 1.08 + i * 0.04, hz + 0.46 * rd]}
          scale={[rw * 0.85, 0.015, 0.015]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#0a1018" metalness={0.6} roughness={0.5} emissive="#4DA3FF" emissiveIntensity={0.08} />
        </mesh>
      ))}

      {/* LED status strip — 6 LEDs en la parte superior del frontal */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh
          key={`led-${i}`}
          position={[hx - rw * 0.4 + i * rw * 0.16, hy + rh * 1.1, hz + 0.47 * rd]}
          scale={[0.025, 0.025, 0.01]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={i < 4 ? '#22d3ee' : '#c27a3a'}
            emissive={i < 4 ? '#22d3ee' : '#c27a3a'}
            emissiveIntensity={i < 4 ? 1.5 : 0.8}
          />
        </mesh>
      ))}

      {/* Mesh door pattern — líneas verticales sutiles en la puerta frontal */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`mesh-${i}`}
          position={[hx - rw * 0.42 + i * (rw * 0.84 / 11), hy, hz + 0.465 * rd]}
          scale={[0.008, rh * 0.88, 0.005]}
        >
          <boxGeometry args={[1, 2.4, 1]} />
          <meshStandardMaterial color="#1a2540" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Unidades 1U del hero rack — más detalle */}
      <Instances limit={16}>
        <boxGeometry args={[0.94, 0.07, 0.6]} />
        <meshStandardMaterial
          color="#16263f"
          metalness={0.5}
          roughness={0.5}
          emissive="#4DA3FF"
          emissiveIntensity={0.32}
          bumpMap={getUnitBump()}
          bumpScale={0.05}
        />
        {HERO_UNIT_OFFSETS.map((u, i) => (
          <Instance
            key={`hu-${i}`}
            position={[hx + u[0], hy + u[1], hz + u[2]]}
            color={i % 3 === 2 ? '#22d3ee' : '#1c3357'}
          />
        ))}
      </Instances>

      {/* LEDs de unidades — puntos de luz por unidad */}
      {HERO_UNIT_OFFSETS.map((u, i) => (
        <mesh
          key={`uled-${i}`}
          position={[hx + u[0] + 0.42, hy + u[1] + 0.015, hz + u[2] + 0.31]}
          scale={[0.015, 0.015, 0.008]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={i % 3 === 2 ? '#22d3ee' : '#16a34a'}
            emissive={i % 3 === 2 ? '#22d3ee' : '#16a34a'}
            emissiveIntensity={2.0}
          />
        </mesh>
      ))}
    </group>
  )
}
