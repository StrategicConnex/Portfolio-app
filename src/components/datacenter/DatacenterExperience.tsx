'use client'

import dynamic from 'next/dynamic'
import { useHardwareDetection } from '@/hooks/useHardwareDetection'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality'
import { useWebGLContextManager } from '@/hooks/useWebGLContextManager'
import DatacenterErrorBoundary from './DatacenterErrorBoundary'
import PhaseGate from './PhaseGate'

// Canvas 3D en chunk separado (SPEC §43): solo se descarga cuando el perfil
// NO es STATIC. En reduce-motion / tier LOW / sin WebGL el bundle three+R3F
// (~230 KB gz) nunca llega al cliente. En modo normal se difiere al montaje.
const DatacenterCanvas = dynamic(() => import('./DatacenterCanvas'), {
  ssr: false,
  loading: () => null,
})

/**
 * Orquestador del Living Datacenter (SPEC §2, §9, §25, §26):
 * decide si el Canvas 3D (Z-20) se monta según perfil de calidad (hardware +
 * reduced-motion + WebGL + runtime FPS) y estado del context manager.
 * StaticPoster (Z-10) es la capa base siempre presente en el HTML inicial
 * (page.tsx); aquí solo se decide el canvas. El bundle 3D es un chunk lazy
 * (next/dynamic): en perfiles STATIC nunca se descarga. Incluye el toggle
 * manual "Reduce Motion" (SPEC §8).
 */
export default function DatacenterExperience() {
  const { reduced, toggle } = usePrefersReducedMotion()
  const { tier, webglSupported, coarsePointer } = useHardwareDetection()
  const profile = useAdaptiveQuality({ tier, webglSupported, reduced, coarsePointer })
  const { contextLost } = useWebGLContextManager()

  const canvasActive = profile !== 'STATIC' && !contextLost

  return (
    <>
      {canvasActive && (
        <DatacenterErrorBoundary>
          <DatacenterCanvas profile={profile} />
        </DatacenterErrorBoundary>
      )}

      {/* Phase Gate (P2): temperatura de color de la fase activa — solo con
          canvas vivo; en STATIC el poster tiene su propia temperatura. */}
      {canvasActive && <PhaseGate reduced={reduced} />}

      {/* Toggle manual de motion safety — control real, no decorativo */}
      <button
        type="button"
        aria-pressed={reduced}
        aria-label={reduced ? 'Activar animaciones 3D' : 'Reducir animaciones 3D'}
        title={reduced ? 'Activar animaciones 3D' : 'Reducir animaciones 3D'}
        onClick={toggle}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 60,
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          cursor: 'pointer',
          color: reduced ? 'rgba(148,163,184,0.9)' : 'rgba(77,163,255,0.9)',
          background: 'rgba(2,6,12,0.55)',
          border: reduced ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(77,163,255,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        {reduced ? '◌' : '◎'}
      </button>
    </>
  )
}
