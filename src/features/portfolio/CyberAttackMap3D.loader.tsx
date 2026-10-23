'use client'

/**
 * Skeleton shown while the three.js chunk downloads. It is intentionally tiny
 * (~2 KB) and mirrors the map's badge/globe/footer chrome so the swap to the
 * real canvas does not shift the layout.
 */
export default function CyberAttackMap3DLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando visualización 3D de ciberataques"
      className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden border border-blue-500/20 bg-black shadow-2xl"
    >
      {/* Esqueleto del badge superior */}
      <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-md px-4 py-3 rounded-lg border border-blue-500/30">
        <div className="h-2.5 w-28 bg-blue-500/20 rounded animate-pulse mb-2" />
        <div className="h-2 w-24 bg-emerald-500/20 rounded animate-pulse" />
      </div>

      {/* Esqueleto del globo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border border-blue-500/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full border border-blue-500/10 animate-pulse delay-75" />
          <div className="absolute inset-8 rounded-full bg-blue-500/5 animate-pulse delay-150" />
        </div>
      </div>

      {/* Texto accesible para lectores de pantalla */}
      <span className="sr-only">
        Inicializando mapa 3D de inteligencia de amenazas. Cargando texturas y
        conectando con fuentes DShield y CISA KEV.
      </span>

      {/* Footer esqueleto */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-blue-500/30">
        <div className="h-2 w-48 bg-gray-500/20 rounded animate-pulse" />
      </div>
    </div>
  )
}
