'use client'

import { useHardwareDetection } from '@/hooks/useHardwareDetection'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality'
import { useWebGLContextManager } from '@/hooks/useWebGLContextManager'
import DatacenterErrorBoundary from './DatacenterErrorBoundary'
import DatacenterCanvas from './DatacenterCanvas'
import StaticPoster from './StaticPoster'

/**
 * Orquestador del Living Datacenter (SPEC §2, §9, §25, §26):
 * decide Canvas 3D vs StaticPoster según perfil de calidad (hardware +
 * reduced-motion + WebGL + runtime FPS) y estado del context manager.
 * Incluye el toggle manual "Reduce Motion" (SPEC §8).
 */
export default function DatacenterExperience() {
  const { reduced, toggle } = usePrefersReducedMotion()
  const { tier, webglSupported, coarsePointer } = useHardwareDetection()
  const profile = useAdaptiveQuality({ tier, webglSupported, reduced, coarsePointer })
  const { contextLost } = useWebGLContextManager()

  const showPoster = profile === 'STATIC' || contextLost

  return (
    <>
      {showPoster ? (
        <StaticPoster />
      ) : (
        <DatacenterErrorBoundary>
          <DatacenterCanvas profile={profile} />
        </DatacenterErrorBoundary>
      )}

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
          color: reduced ? 'rgba(148,163,184,0.9)' : 'rgba(30,144,255,0.9)',
          background: 'rgba(2,6,12,0.55)',
          border: reduced ? '1px solid rgba(148,163,184,0.3)' : '1px solid rgba(30,144,255,0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      >
        {reduced ? '◌' : '◎'}
      </button>
    </>
  )
}
