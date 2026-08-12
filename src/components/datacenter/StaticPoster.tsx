/**
 * StaticPoster — capa base Z-10 "modo operational / low power" (SPEC §9, §25).
 * Se renderiza SIEMPRE en el HTML inicial (page.tsx, server-side): es la capa
 * de progressive enhancement Nivel 1, visible cuando no hay canvas (reduced-
 * motion, sin WebGL, tier LOW, error del canvas o context lost) y cubierta
 * por el canvas opaco Z-20 en modo normal.
 *
 * Puramente decorativo (aria-hidden, pointer-events none) y estático (sin
 * animación). El visual es el póster "Cold Cathedral" (canvas.png exportado a
 * webp), que mantiene la identidad del datacenter: torre central con
 * temperatura cyan→ámbar, telemetría clínica y banda de especificación. Un
 * scrim sutil garantiza legibilidad del DOM (Z-40) sin apagar la pieza.
 *
 * LCP: se renderiza como <img> (no background-image) con fetchpriority="high"
 * y dimensiones explícitas para que, en modo estático, sea el Largest
 * Contentful Paint correcto y temprano (pinta sin esperar hidratación). El
 * <head> (layout.tsx) adelanta el fetch con un <link rel="preload">
 * condicional cuando aplica reduce-motion.
 *
 * Detalle crítico de Chromium (verificado empíricamente, Chromium 1228):
 * Chrome NO registra como candidato LCP una imagen cuyo borde inferior
 * toca o supera el borde inferior del viewport (altura >= 100vh). Por eso la
 * altura es `calc(100vh - 1px)`: sigue siendo full-bleed (el fondo oscuro del
 * wrapper cubre el px inferior) pero entra en el conjunto de candidatos LCP.
 */
export default function StaticPoster() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#02060c',
      }}
    >
      {/* Cold Cathedral poster — LCP en modo estático */}
      {/* eslint-disable-next-line @next/next/no-img-element -- <img> directo de /public evita el round-trip del optimizador (mejor LCP); el póster ya es un webp optimizado de 42 KB y el preload del <head> apunta a esta misma URL. */}
      <img
        data-poster-img
        src="/images/cold-cathedral-poster.webp"
        alt=""
        width={1400}
        height={1867}
        fetchPriority="high"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: 'calc(100vh - 1px)',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
      />
      {/* Scrim de legibilidad para el contenido DOM (Z-40) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 45%, rgba(2,6,12,0.30) 0%, rgba(2,6,12,0.62) 100%)',
        }}
      />
    </div>
  )
}
