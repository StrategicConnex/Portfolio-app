'use client'

import { useActiveScene } from '@/lib/activeScene'
import { PHASE_TINTS } from '@/lib/datacenter.tokens'

/**
 * Convierte #RRGGBB → rgba() string (testeable en aislamiento).
 * Precomputado por fase en render; nunca toca el DOM fuera del gate.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Phase Gate — la firma del sitio (audit de diseño P2, SPEC §3):
 * un overlay DOM fijo en Z-30 (bajo el contenido Z-40, sobre el canvas Z-20),
 * `pointer-events: none` y `aria-hidden`, que tiñe el frame con la
 * temperatura de color de la fase activa (azul → cian → ámbar → champagne),
 * sincronizado con el store `activeScene` vía `useActiveScene`
 * (useSyncExternalStore → re-render solo al cruzar de escena, sin tocar la
 * lógica del frame loop ni del DOM).
 *
 * Mecánica: 5 capas full-bleed apiladas, cada una con su gradiente radial de
 * fase; la capa activa tiene opacity 1 y las demás 0, con `transition:
 * opacity 700ms` → el cambio de fase es un crossfade (la mezcla entre dos
 * capas a media transición da la temperatura intermedia). reduced-motion:
 * transición anulada por media query CSS y por la prop `reduced` (el toggle
 * manual del sitio). En tier STATIC el gate no se monta (el poster tiene su
 * propia temperatura estática).
 */
export default function PhaseGate({ reduced = false }: { reduced?: boolean }) {
  const scene = useActiveScene()
  const safe = scene >= 0 && scene < PHASE_TINTS.length ? scene : 0

  return (
    <div aria-hidden="true" data-testid="phase-gate" className="phase-gate">
      {PHASE_TINTS.map((tint, i) => (
        <div
          key={tint.sceneId}
          data-phase={tint.sceneId}
          data-active={i === safe ? 'true' : 'false'}
          className="phase-gate-layer"
          style={{
            opacity: i === safe ? 1 : 0,
            transition: reduced ? 'none' : undefined,
            background: `radial-gradient(ellipse at 50% 42%, ${hexToRgba(tint.color, 0.02)} 0%, ${hexToRgba(tint.color, tint.edgeAlpha * 0.35)} 60%, ${hexToRgba(tint.color, tint.edgeAlpha)} 100%)`,
          }}
        />
      ))}
    </div>
  )
}
