import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Hero            from '@/features/portfolio/Hero'
import Perfil          from '@/features/portfolio/Perfil'

// Loading fallbacks for Suspense boundaries
function SectionFallback() {
  return <div className="py-20 sm:py-32 px-4 sm:px-6 md:px-8 bg-[var(--bg)] animate-pulse" aria-hidden="true" />
}

function SectionFallbackBg2() {
  return <div className="py-20 sm:py-32 px-4 sm:px-6 md:px-8 bg-[var(--bg2)] animate-pulse" aria-hidden="true" />
}

// Dynamic imports for components below the fold
const Arquitectura    = dynamic(() => import('@/features/portfolio/Arquitectura'))
const Experiencia     = dynamic(() => import('@/features/portfolio/Experiencia'))
const TrustBadges     = dynamic(() => import('@/features/portfolio/TrustBadges'))
const SIEMDashboard   = dynamic(() => import('@/features/portfolio/SIEMDashboard'))
const Stack           = dynamic(() => import('@/features/portfolio/Stack'))
const Certificaciones = dynamic(() => import('@/features/portfolio/Certificaciones'))
const AuditHub        = dynamic(() => import('@/features/portfolio/AuditHub'))
const SCAudit         = dynamic(() => import('@/features/portfolio/SCAudit'))
const Blog            = dynamic(() => import('@/features/portfolio/Blog'))
const Recursos        = dynamic(() => import('@/features/recursos/Recursos'))

const Proyecto        = dynamic(() => import('@/features/portfolio/Proyecto'))
const Contacto        = dynamic(() => import('@/features/portfolio/Contacto'))

export default function Home() {
  return (
    <>
      {/* Navbar, copiloto y footer vienen del layout raíz (globales en todas
          las rutas); la home solo compone sus secciones. */}
      <main id="main-content">
        {/* ── 1. Anchor — Hero + identity ── */}
        <Hero />
        <Perfil />

        {/* ── 2. Experience + credentials ── */}
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Experiencia />
        </Suspense>
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Certificaciones />
        </Suspense>

        {/* ── 3. Methodology — "how I work" ── */}
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Arquitectura />
        </Suspense>

        {/* ── 4. Trust proof — badges, stack ── */}
        <Suspense fallback={<SectionFallbackBg2 />}>
          <TrustBadges />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Stack />
        </Suspense>

        {/* ── 5. Live proof — dashboards + tools ── */}
        <Suspense fallback={<SectionFallback />}>
          <SIEMDashboard />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AuditHub />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SCAudit />
        </Suspense>

        {/* ── 6. Project + editorial ── */}
        <Suspense fallback={<SectionFallback />}>
          <Proyecto />
        </Suspense>
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Blog />
        </Suspense>

        {/* ── 6.5 Downloadable IT/OT library ── */}
        <Suspense fallback={<SectionFallback />}>
          <Recursos />
        </Suspense>

        {/* ── 7. CTA ── */}
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Contacto />
        </Suspense>
      </main>
    </>
  )
}
