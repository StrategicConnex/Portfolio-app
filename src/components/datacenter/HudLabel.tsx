'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useLanguage } from '@/context/LanguageContext'
import { useActiveScene } from '@/lib/activeScene'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { SCENES } from '@/lib/scenes'
import { DATACENTER_TOKENS } from '@/lib/datacenter.tokens'
import { parseCounter, formatCounter, easeOutCubic } from '@/lib/datacenterData'
import { purdueForScene } from '@/lib/datacenter.storyline'

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
  /** Contador de datos encarnados (audit G3): valor numérico grande sobre el
   * label, ej. '99.9%' / '131/142'. El labelKey sigue siendo el texto i18n. */
  value?: string
  /** Count-up al entrar en escena (audit G3): el contador anima de 0 a su
   * valor con easing. Escritura directa al DOM en useFrame (sin re-renders,
   * SPEC §32) — la invalidación la da `MicroAnimDriver`. Con
   * prefers-reduced-motion → valor final estático. */
  countUp?: boolean
}

/** Fase 1-based de la escena en formato HUD (audit G1): 0 → '01/05'. */
export function formatPhase(sceneIndex: number, total: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(sceneIndex + 1)}/${pad(total)}`
}

/**
 * Cull tras la cámara (audit P4 — lección Hanwha): el `Html` de drei proyecta
 * el DOM con transform espejada cuando el ancla queda DETRÁS del plano de
 * cámara. El label se desvanece según el coseno del ángulo entre la dirección
 * de la cámara y el vector hacia el ancla: opacidad plena hasta cos ≈ 0.18
 * (~80° del eje de visión) y 0 en el plano (nunca se ve la proyección
 * espejada). Con `prefers-reduced-motion` → snap (defensivo: el canvas
 * normalmente no monta en modo reduce).
 */
export const LABEL_FADE_COS = 0.18

export function labelFacingOpacity(facing: number, reduced: boolean, fadeCos = LABEL_FADE_COS): number {
  if (reduced) return facing > 0 ? 1 : 0
  return THREE.MathUtils.clamp(facing / fadeCos, 0, 1)
}

// Vectores temporales compartidos entre instancias (single-thread): sin
// allocations dentro del frame (SPEC §32).
const _worldPos = new THREE.Vector3()
const _toLabel = new THREE.Vector3()
const _camDir = new THREE.Vector3()

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
const COUNT_UP_MS = 1100

export default function HudLabel({
  position,
  labelKey,
  scene,
  distanceFactor = 7,
  color = DATACENTER_TOKENS.colors.dataCyan,
  variant = 'status',
  value,
  countUp = false,
}: HudLabelProps) {
  const { t } = useLanguage()
  const activeScene = useActiveScene()
  const { reduced } = usePrefersReducedMotion()

  // El count-up solo aplica cuando hay value numérico parseable.
  const spec = useMemo(() => (countUp && value ? parseCounter(value) : null), [countUp, value])
  const valueRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<number | null>(null)
  const doneRef = useRef(false)
  // Cull tras la cámara: anchor del grupo en el grafo de escena (mundo real) y
  // div raíz del label (opacidad).
  const anchorRef = useRef<THREE.Group>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const style = VARIANT_STYLE[variant]

  // Escribe el texto animado DIRECTAMENTE en el DOM (sin setState, SPEC §32).
  // La invalidación la aporta MicroAnimDriver; al completar el contador deja
  // de escribir (una escritura final asegura el valor exacto).
  // IMPORTANTE: el Html de drei monta su DOM con delay; el count-up debe
  // arrancar cuando `valueRef.current` existe (DOM montado), no al montar el
  // componente React — si no, la animación termina antes de ser visible.
  useFrame((state) => {
    if (spec && !reduced && !doneRef.current && valueRef.current) {
      if (startRef.current === null) startRef.current = state.clock.elapsedTime
      const elapsed = (state.clock.elapsedTime - startRef.current) * 1000
      const p = easeOutCubic(elapsed / COUNT_UP_MS)
      if (valueRef.current) valueRef.current.textContent = formatCounter(spec, p)
      if (p >= 1) {
        doneRef.current = true
        if (valueRef.current) valueRef.current.textContent = formatCounter(spec, 1)
      }
    }

    // Cull: oculta el label cuando su ancla queda detrás de la cámara (o al
    // pasar el plano durante el atravieso de racks) — sin setState, escritura
    // directa a style (SPEC §32). El Html de drei proyecta espejado detrás del
    // plano; la opacidad 0 elimina el artefacto ANTES de que ocurra.
    if (anchorRef.current && rootRef.current) {
      anchorRef.current.updateWorldMatrix(true, false)
      anchorRef.current.getWorldPosition(_worldPos)
      _toLabel.copy(_worldPos).sub(state.camera.position)
      const lenSq = _toLabel.lengthSq()
      if (lenSq < 1e-8) {
        // Ancla degenerada (en la posición de la cámara): nunca visible.
        rootRef.current.style.opacity = '0'
      } else {
        _toLabel.divideScalar(Math.sqrt(lenSq))
        state.camera.getWorldDirection(_camDir)
        rootRef.current.style.opacity = String(style.opacity * labelFacingOpacity(_toLabel.dot(_camDir), reduced))
      }
    }
  })

  if (scene !== undefined && activeScene !== scene) return null

  // Numeración de fase del recorrido (audit G1): solo los labels de escena
  // (scene) llevan `PHASE 0n/05` — los status de boot y nodos de Purdue no.
  const phaseLine =
    variant === 'scene' && scene !== undefined
      ? `${t('dc.phase.label')} ${formatPhase(scene, SCENES.length)}`
      : null
  // Eje Purdue del storyline (audit P7c): el nivel IEC 62443 de la escena
  // (NIVEL 04 · EMPRESA …) — solo en labels de escena, bajo la fase.
  const purdue = variant === 'scene' && scene !== undefined ? purdueForScene(scene) : null
  const purdueLine = purdue ? `${t('dc.purdue.label')} ${purdue.level} · ${t(purdue.nameKey)}` : null

  return (
    <group ref={anchorRef} position={position}>
    <Html transform distanceFactor={distanceFactor} zIndexRange={[30, 20]}>
      <div
        ref={rootRef}
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
        {phaseLine && (
          <div
            style={{
              fontSize: '0.4rem',
              letterSpacing: '0.32em',
              color: DATACENTER_TOKENS.colors.gold,
              opacity: 0.9,
              marginBottom: '0.2rem',
              whiteSpace: 'nowrap',
            }}
          >
            {phaseLine}
          </div>
        )}
        {purdueLine && (
          <div
            style={{
              fontSize: '0.4rem',
              letterSpacing: '0.32em',
              color,
              opacity: 0.75,
              marginBottom: '0.2rem',
              whiteSpace: 'nowrap',
            }}
          >
            {purdueLine}
          </div>
        )}
        {value !== undefined && (
          <div
            ref={valueRef}
            style={{
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontSize: '0.9rem',
              letterSpacing: '0.08em',
              color: '#f8fafc',
              textShadow: `0 0 10px ${color}aa`,
              marginBottom: '0.15rem',
              whiteSpace: 'nowrap',
            }}
          >
            {/* countUp: arranca en 0 (o valor final con reduced-motion) y el
                useFrame lo anima vía textContent — sin re-renders. */}
            {countUp && spec && !reduced ? formatCounter(spec, 0) : value}
          </div>
        )}
        {t(labelKey)}
      </div>
    </Html>
    </group>
  )
}
