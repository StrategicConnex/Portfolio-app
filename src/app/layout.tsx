import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Juan Felipe Palacios – Arquitecto IT/OT | Ciberseguridad Industrial',
  description:
    'Profesional con 20+ años en Ciberseguridad Industrial, Arquitectura IT/OT, IEC 62443, NIST, SCADA y Oil & Gas. Basado en Neuquén, Argentina. Disponible para proyectos de alta criticidad.',
  keywords: [
    'Ciberseguridad Industrial', 'IT/OT', 'IEC 62443', 'NIST', 'SCADA',
    'Arquitecto de Redes', 'Oil & Gas', 'Vaca Muerta', 'Neuquén', 'Argentina',
    'Security Onion', 'SIEM', 'Modelo Purdue', 'ISO 27001', 'SOX',
    'Juan Felipe Palacios', 'Next.js', 'VMware', 'Azure', 'Cisco',
  ],
  authors: [{ name: 'Juan Felipe Palacios', url: 'https://linkedin.com/in/juanfpalacios' }],
  creator: 'Juan Felipe Palacios',
  openGraph: {
    title: 'Juan Felipe Palacios – Arquitecto IT/OT | Ciberseguridad Industrial',
    description: 'Transformando infraestructura crítica en sistemas resilientes e inteligentes. 20+ años en Oil & Gas. Neuquén, Argentina.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://juanfpalacios.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juan Felipe Palacios – Arquitecto IT/OT | Ciberseguridad Industrial',
    description: 'Transformando infraestructura crítica en sistemas resilientes e inteligentes.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://juanfpalacios.vercel.app' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      name: 'Juan Felipe Palacios',
      jobTitle: 'Arquitecto IT/OT – Ciberseguridad Industrial',
      description: 'Especialista en ciberseguridad industrial con 20+ años en Oil & Gas. IEC 62443, NIST CSF, SCADA, Modelo Purdue. Basado en Neuquén, Argentina.',
      url: 'https://juanfpalacios.vercel.app',
      sameAs: ['https://linkedin.com/in/juanfpalacios'],
      email: 'palacios_juan@hotmail.com',
      telephone: '+542995869435',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Neuquén',
        addressRegion: 'Neuquén',
        addressCountry: 'AR',
      },
      knowsAbout: ['Ciberseguridad Industrial Argentina', 'IEC 62443', 'NIST CSF', 'SCADA', 'Modelo Purdue', 'Oil & Gas Vaca Muerta', 'SIEM Security Onion', 'Arquitectura IT/OT'],
    },
    {
      '@type': 'ProfessionalService',
      name: 'Juan Felipe Palacios – Consultoría IT/OT',
      description: 'Servicios de consultoría en ciberseguridad industrial, arquitectura de redes IT/OT y gestión de infraestructura crítica para el sector Oil & Gas en Vaca Muerta.',
      url: 'https://juanfpalacios.vercel.app',
      areaServed: ['Neuquén', 'Argentina', 'Vaca Muerta'],
      geo: { '@type': 'GeoCoordinates', latitude: -38.9516, longitude: -68.0591 },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios de Ciberseguridad IT/OT',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Auditoría de Seguridad OT/IT' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Implementación SIEM' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Diseño Arquitectura Purdue' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Consultoría IEC 62443 / NIST' } },
        ],
      },
    },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="color-scheme" content="dark" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
