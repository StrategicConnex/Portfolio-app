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
          multiplica el color por instancia — la variación de fila se conserva. */}
      <Instances limit={64} castShadow={false}>
        <boxGeometry args={[1, 2.4, 0.9]} />
        <meshStandardMaterial
          color="#0d1524"
          metalness={0.7}
          roughness={0.4}
          map={getChassisMap()}
          bumpMap={getChassisBump()}
          bumpScale={0.03}
        />
        {corridor.map((r, i) => (
          <Instance key={`c-${i}`} position={r.position} color={r.color} />
        ))}
        {background.map((r, i) => (
          <Instance key={`b-${i}`} position={r.position} scale={r.scale} color={r.color} />
        ))}
      </Instances>

      {/* Unidades (servidores): auto-iluminadas para leerse desde cualquier
          ángulo (clave en la vista amplia de S5) — LEDs azules/cyan. */}
      <Instances limit={256}>
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

/** Rack hero (S1) procedural — misma geometría/material que antes formaba parte
 * de los pools; ahora aislado para que el GLB pueda reemplazarlo (SPEC §37). */
function ProceduralHeroRack() {
  return (
    <group>
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
        <Instance position={HERO_RACK_POS} scale={[1.15, 1.25, 1]} color="#101a30" />
      </Instances>
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
            position={[HERO_RACK_POS[0] + u[0], HERO_RACK_POS[1] + u[1], HERO_RACK_POS[2] + u[2]]}
            color={i % 3 === 2 ? '#22d3ee' : '#1c3357'}
          />
        ))}
      </Instances>
    </group>
  )
}
