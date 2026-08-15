'use client'

import { Environment, Lightformer } from '@react-three/drei'
import type { QualityProfile } from '@/hooks/useAdaptiveQuality'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

/** Resolución del env map por tier (P1): 1024 solo en ULTRA (coste de memoria
 * del cube target); HIGH/MEDIUM 512; LOW 256. STATIC no monta canvas. */
const ENV_RESOLUTION: Record<QualityProfile, number> = {
  ULTRA: 1024,
  HIGH: 512,
  MEDIUM: 512,
  LOW: 256,
  STATIC: 256,
}

/**
 * Entorno procedural (SPEC §12, §17): sin HDRI, sin red, CSP-compatible.
 * Env map con Lightformers (reflejos para metales/cristal en Fase 4) +
 * luces base frías con acentos de semántica (BLUE/CYAN/AMBER).
 *
 * P1 materialidad: tira cálida del nivel inferior (S4, reflejo ámbar en los
 * gabinetes de storage), tira vertical fría a la derecha (reflejos altos en
 * los chasis del corredor, look iyO/NRG) y ring cyan sobre el rack hero (S1).
 */
export default function DatacenterEnvironment({ profile }: { profile: QualityProfile }) {
  const t = DATACENTER_TOKENS.colors
  return (
    <>
      {/* Las luces (ambient/dir/acentos) viven en SceneLighting: transiciones
          atmosféricas por escena (SPEC §3). Acá solo el env map procedural. */}
      <Environment resolution={ENV_RESOLUTION[profile] ?? 512}>
        {/* Techo principal — ilumina la parte superior de los chasis */}
        <Lightformer
          intensity={1.8}
          color={t.primaryCold}
          position={[0, 5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
        {/* Pasillos (NRG): tiras largas de luz de techo a lo largo del corredor
            — los metales/chasis captan franjas de reflexión, no puntos. */}
        <Lightformer
          intensity={1.1}
          color="#dfe9ff"
          position={[0, 4.6, -3]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 1.5, 1]}
        />
        <Lightformer
          intensity={0.7}
          color="#dfe9ff"
          position={[0, 4.6, -8]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 1.5, 1]}
        />
        {/* Tira adicional para profundidad — reflections en los racks del fondo */}
        <Lightformer
          intensity={0.4}
          color="#b8c8e0"
          position={[0, 4.6, -14]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[14, 1, 1]}
        />
        {/* Lateral cyan — reflejos fríos en los costados de los chasis */}
        <Lightformer
          intensity={0.9}
          color={t.dataCyan}
          position={[-5, 1, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 2, 1]}
        />
        {/* Lateral ámbar — reflejos cálidos en el lado opuesto */}
        <Lightformer
          intensity={0.65}
          color={t.securityAmber}
          position={[5, -1, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 2, 1]}
        />
        {/* Fill frontal sutil — ilumina las caras frontales de los racks */}
        <Lightformer
          intensity={0.3}
          color="#e8eeff"
          position={[0, 2, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[12, 4, 1]}
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
        {/* P1 · tira cálida del nivel inferior (S4): los gabinetes de storage
            captan una franja ámbar horizontal, no un punto de luz. */}
        <Lightformer
          intensity={0.55}
          color={t.securityAmber}
          position={[0, -2.2, -6]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 1, 1]}
        />
        {/* P1 · tira vertical fría a la derecha del corredor: reflejos verticales
            en los chasis (metal cepillado premium, dirección iyO/NRG). */}
        <Lightformer
          intensity={0.45}
          color="#e4f0ff"
          position={[5, 2, -5]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[10, 0.35, 1]}
        />
        {/* Ring cyan sobre el rack hero (S1): corona de reflexión */}
        <Lightformer
          intensity={0.7}
          form="ring"
          color={t.dataCyan}
          position={[0, 3.4, 2.5]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[3, 3, 1]}
        />
        {/* Ring ámbar sobre backup units (S4): corona cálida */}
        <Lightformer
          intensity={0.4}
          form="ring"
          color={t.securityAmber}
          position={[0, -1.5, -6]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[2.5, 2.5, 1]}
        />
      </Environment>
    </>
  )
}
