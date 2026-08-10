'use client'

import { Html } from '@react-three/drei'
import { useLanguage } from '@/context/LanguageContext'
import { useActiveScene } from '@/lib/activeScene'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'

type HudLabelProps = {
  /** Posición 3D del label (anclada al mundo, no a pantalla). */
  position: [number, number, number]
  /** Clave i18n (es/en) — nunca texto hardcoded (SPEC §13). */
  labelKey: string
  /** Índice de escena (0–4) en la que el label es visible; omitir = siempre. */
  scene?: number
  /** Escala de distancia del Html transform (drei). */
  distanceFactor?: number
  /** Color semántico del token (BLUE/AMBER/CYAN/WHITE por defecto). */
  color?: string
  /** Tono de énfasis: label de escena (grande) vs. micro-label. */
  variant?: 'scene' | 'node' | 'status'
}

const VARIANT_STYLE = {
  scene: { size: '0.62rem', letterSpacing: '0.22em', opacity: 0.92 },
  node: { size: '0.5rem', letterSpacing: '0.14em', opacity: 0.78 },
  status: { size: '0.46rem', letterSpacing: '0.18em', opacity: 0.7 },
} as const

/**
 * HUD diegético (SPEC §13): label traducible anclado a una posición 3D,
 * renderizado como DOM (`Html transform`) dentro del canvas decorativo
 * (aria-hidden, pointer-events: none — no bloquea nada y no es anunciado).
 * Se oculta cuando su escena no está activa (store `activeScene`).
 */
export default function HudLabel({
  position,
  labelKey,
  scene,
  distanceFactor = 7,
  color = DATACENTER_TOKENS.colors.dataCyan,
  variant = 'status',
}: HudLabelProps) {
  const { t } = useLanguage()
  const activeScene = useActiveScene()

  if (scene !== undefined && activeScene !== scene) return null

  const style = VARIANT_STYLE[variant]

  return (
    <Html position={position} transform distanceFactor={distanceFactor} zIndexRange={[30, 20]}>
      <div
        data-testid="hud-label"
        style={{
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: style.size,
          letterSpacing: style.letterSpacing,
          textTransform: 'uppercase',
          color,
          opacity: style.opacity,
          whiteSpace: 'nowrap',
          background: 'rgba(2, 6, 23, 0.55)',
          border: `1px solid ${color}33`,
          padding: '0.25rem 0.55rem',
          borderRadius: '2px',
          userSelect: 'none',
          pointerEvents: 'none',
          lineHeight: 1.4,
          textShadow: `0 0 8px ${color}66`,
        }}
      >
        {t(labelKey)}
      </div>
    </Html>
  )
}
