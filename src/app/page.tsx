import Navbar          from '@/components/Navbar'
import Hero            from '@/components/Hero'
import Perfil          from '@/components/Perfil'
import Arquitectura    from '@/components/Arquitectura'
import Experiencia     from '@/components/Experiencia'
import TrustBadges     from '@/components/TrustBadges'
import SIEMDashboard   from '@/components/SIEMDashboard'
import Stack           from '@/components/Stack'
import Certificaciones from '@/components/Certificaciones'
import Proyecto        from '@/components/Proyecto'
import Contacto        from '@/components/Contacto'
import Footer          from '@/components/Footer'

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
