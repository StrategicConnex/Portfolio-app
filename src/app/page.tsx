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
import DatacenterMount from '@/components/datacenter/DatacenterMount'
import DataMoment from '@/components/datacenter/DataMoment'
import SceneTransition from '@/components/datacenter/SceneTransition'
import StaticPoster from '@/components/datacenter/StaticPoster'

export default function Home() {
  return (
    <>
      {/*
        Capa base Z-10 (SPEC §9, §25): StaticPoster siempre presente en el HTML
        inicial — progressive enhancement Nivel 1 (pinta sin JS). En modo
        reduce-motion / tier LOW / sin WebGL es el LCP (fetchpriority=high +
        preload condicional en <head>); en modo normal el canvas opaco (Z-20)
        lo cubre sin cambio visual.
      */}
      <StaticPoster />
      <DatacenterMount />
      <DataMoment />
      <SceneTransition />
      <Navbar />
      {/* z-40: el contenido DOM se apila por encima del canvas fijo (SPEC §2) */}
      <main className="relative z-40">
        <Hero />
        <Perfil />
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Arquitectura />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Experiencia />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <TrustBadges />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SIEMDashboard />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <AuditHub />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <SCAudit />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Blog />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Stack />
        </Suspense>
        <Suspense fallback={<SectionFallbackBg2 />}>
          <Certificaciones />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Proyecto />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Contacto />
        </Suspense>
      </main>
      <AskAICopilotShell />
      <div className="relative z-40">
        <Suspense fallback={<div aria-hidden="true" />}>
          <Footer />
        </Suspense>
      </div>
    </>
  )
}
