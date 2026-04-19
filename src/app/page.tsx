import dynamic from 'next/dynamic'
import Navbar          from '@/components/Navbar'
import Hero            from '@/components/Hero'
import Perfil          from '@/components/Perfil'

// Dynamic imports for components below the fold
const Arquitectura    = dynamic(() => import('@/components/Arquitectura'))
const Experiencia     = dynamic(() => import('@/components/Experiencia'))
const TrustBadges     = dynamic(() => import('@/components/TrustBadges'))
const SIEMDashboard   = dynamic(() => import('@/components/SIEMDashboard'))
const Stack           = dynamic(() => import('@/components/Stack'))
const Certificaciones = dynamic(() => import('@/components/Certificaciones'))
const Proyecto        = dynamic(() => import('@/components/Proyecto'))
const Contacto        = dynamic(() => import('@/components/Contacto'))
const Footer          = dynamic(() => import('@/components/Footer'))

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Perfil />
        <Arquitectura />
        <Experiencia />
        <TrustBadges />
        <SIEMDashboard />
        <Stack />
        <Certificaciones />
        <Proyecto />
        <Contacto />
      </main>
      <Footer />
    </>
  )
}
