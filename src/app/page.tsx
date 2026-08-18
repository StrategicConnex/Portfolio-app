import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import Navbar          from '@/components/Navbar'
import Hero            from '@/components/Hero'
import Perfil          from '@/components/Perfil'

// Loading fallbacks for Suspense boundaries
function SectionFallback() {
  return <div className="py-20 sm:py-32 px-4 sm:px-6 md:px-8 bg-[var(--bg)] animate-pulse" aria-hidden="true" />
}

function SectionFallbackBg2() {
  return <div className="py-20 sm:py-32 px-4 sm:px-6 md:px-8 bg-[var(--bg2)] animate-pulse" aria-hidden="true" />
}

// Dynamic imports for components below the fold
const Arquitectura    = dynamic(() => import('@/components/Arquitectura'))
const Experiencia     = dynamic(() => import('@/components/Experiencia'))
const TrustBadges     = dynamic(() => import('@/components/TrustBadges'))
const SIEMDashboard   = dynamic(() => import('@/components/SIEMDashboard'))
const Stack           = dynamic(() => import('@/components/Stack'))
const Certificaciones = dynamic(() => import('@/components/Certificaciones'))
const AuditHub        = dynamic(() => import('@/components/AuditHub'))
const SCAudit         = dynamic(() => import('@/components/SCAudit'))
const Blog            = dynamic(() => import('@/components/Blog'))
import { AskAICopilotShell } from '@/components/ask-ai/AskAICopilotShell'

const Proyecto        = dynamic(() => import('@/components/Proyecto'))
const Contacto        = dynamic(() => import('@/components/Contacto'))
const Footer          = dynamic(() => import('@/components/Footer'))

export default function Home() {
  return (
    <>
      <Navbar />
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

        {/* ── 7. CTA ── */}
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Contacto />
        </Suspense>
      </main>
      <AskAICopilotShell />
      <Suspense fallback={<div aria-hidden="true" />}>
        <Footer />
      </Suspense>
    </>
  )
}
