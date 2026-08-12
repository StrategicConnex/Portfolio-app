'use client'

import { Environment, Lightformer } from '@react-three/drei'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

/**
 * Entorno procedural (SPEC §12, §17): sin HDRI, sin red, CSP-compatible.
 * Env map con Lightformers (reflejos para metales/cristal en Fase 4) +
 * luces base frías con acentos de semántica (BLUE/CYAN/AMBER).
 */
export default function DatacenterEnvironment() {
  const t = DATACENTER_TOKENS.colors
  return (
    <>
      {/* Las luces (ambient/dir/acentos) viven en SceneLighting: transiciones
          atmosféricas por escena (SPEC §3). Acá solo el env map procedural. */}
      <Environment resolution={512}>
        <Lightformer
          intensity={1.4}
          color={t.primaryCold}
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        {/* Pasillos (NRG): tiras largas de luz de techo a lo largo del corredor
            — los metales/chasis captan franjas de reflexión, no puntos. */}
        <Lightformer
          intensity={0.8}
          color="#dfe9ff"
          position={[0, 4.6, -3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 1, 1]}
        />
        <Lightformer
          intensity={0.5}
          color="#dfe9ff"
          position={[0, 4.6, -8]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 1, 1]}
        />
        <Lightformer
          intensity={0.7}
          color={t.dataCyan}
          position={[-5, 1, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 2, 1]}
        />
        <Lightformer
          intensity={0.5}
          color={t.securityAmber}
          position={[5, -1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 2, 1]}
        />
        {/* Profundidad: glow frío al fondo del pasillo */}
        <Lightformer
          intensity={0.35}
          color={t.dataCyan}
          position={[0, 1, -12]}
          scale={[18, 6, 1]}
        />
        <Lightformer
          intensity={0.9}
          form="ring"
          color="#ffffff"
          position={[0, 2, 5]}
          scale={[4, 4, 1]}
        />
      </Environment>
    </>
  )
}
