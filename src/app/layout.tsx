import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://juanfpalacios.vercel.app'),
  title: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén | Ciberseguridad para Oil & Gas en Vaca Muerta',
  description:
    'Consultoría IT/OT y ciberseguridad industrial para Oil & Gas en Vaca Muerta. Experiencia en IEC 62443, NIST, SCADA y redes críticas. Basado en Neuquén, Argentina.',
  keywords: [
    'Ciberseguridad Industrial', 'IT/OT', 'IEC 62443', 'NIST', 'SCADA',
    'Ciberseguridad para Oil & Gas en Vaca Muerta', 'Consultoría IT/OT Neuquén', 'Oil & Gas', 'Vaca Muerta', 'Neuquén', 'Argentina',
    'Security Onion', 'SIEM', 'Modelo Purdue', 'ISO 27001', 'SOX',
    'Juan Felipe Palacios', 'Consultoría IT/OT', 'Infraestructura crítica', 'Neuquén',
  ],
  authors: [{ name: 'Juan Felipe Palacios', url: 'https://linkedin.com/in/juanfpalacios' }],
  creator: 'Juan Felipe Palacios',
  applicationName: 'Portfolio - Juan Felipe Palacios',
  publisher: 'Juan Felipe Palacios',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  openGraph: {
    title: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén | Ciberseguridad para Oil & Gas en Vaca Muerta',
    description: 'Referente en ciberseguridad industrial y consultoría IT/OT para Oil & Gas en Neuquén y Vaca Muerta.',
    type: 'website',
    locale: 'es_AR',
    url: 'https://juanfpalacios.vercel.app',
    siteName: 'Juan Felipe Palacios Portfolio',
    images: [
      {
        url: 'https://juanfpalacios.vercel.app/JuanPalacios.png',
        alt: 'Foto de perfil de Juan Felipe Palacios',
        width: 1200,
        height: 1200,
      },
      {
        url: 'https://juanfpalacios.vercel.app/JuanPalacios.webp',
        alt: 'Foto de perfil de Juan Felipe Palacios',
        width: 1200,
        height: 1200,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén | Ciberseguridad para Oil & Gas',
    description: 'Consultoría IT/OT y Ciberseguridad Industrial para Oil & Gas en Vaca Muerta y Neuquén.',
    creator: '@juanfpalacios',
    site: '@juanfpalacios',
    images: ['https://juanfpalacios.vercel.app/JuanPalacios.png'],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://juanfpalacios.vercel.app', languages: { 'es-AR': 'https://juanfpalacios.vercel.app' } },
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
      name: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén',
      serviceType: 'Ciberseguridad para Oil & Gas en Vaca Muerta',
      description: 'Servicios de consultoría en ciberseguridad industrial, arquitectura de redes IT/OT y gestión de infraestructura crítica para el sector Oil & Gas en Vaca Muerta.',
      url: 'https://juanfpalacios.vercel.app',
      areaServed: ['Neuquén', 'Argentina', 'Vaca Muerta'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Neuquén, Argentina',
        addressLocality: 'Neuquén',
        addressRegion: 'Neuquén',
        addressCountry: 'AR',
      },
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

import ChatBot from '@/components/ChatBot'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable} style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
        <meta name="color-scheme" content="dark" />
        <link rel="canonical" href="https://juanfpalacios.vercel.app" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <ChatBot />
      </body>
    </html>
  )
}

