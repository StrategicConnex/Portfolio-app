import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import './globals.css'
import { LanguageProvider } from '@/context/LanguageContext'
import { SITE } from '@/lib/constants'
import { LANGUAGE_COOKIE, detectLanguageServer } from '@/lib/language'
import React from 'react'
import Script from 'next/script'
import { ObservabilityProvider } from '@/components/observability/ObservabilityProvider'
import { HtmlLangUpdater } from '@/components/HtmlLangUpdater'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén | Ciberseguridad para Oil & Gas en Vaca Muerta',
  description: SITE.description,
  keywords: SITE.keywords,
  authors: [{ name: SITE.name, url: SITE.social.linkedin }],
  creator: SITE.creator,
  applicationName: SITE.applicationName,
  publisher: SITE.publisher,
  openGraph: {
    title: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén | Ciberseguridad para Oil & Gas en Vaca Muerta',
    description: 'Referente en ciberseguridad industrial y consultoría IT/OT para Oil & Gas en Neuquén y Vaca Muerta.',
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.applicationName,
    images: [
      {
        url: SITE.profileImage,
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
    images: [SITE.profileImage],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE.url, languages: { 'es-AR': SITE.url, 'en': SITE.url } },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      name: SITE.name,
      jobTitle: 'Arquitecto IT/OT – Ciberseguridad Industrial',
      description: 'Especialista en ciberseguridad industrial con 20+ años en Oil & Gas. IEC 62443, NIST CSF, SCADA, Modelo Purdue. Basado en Neuquén, Argentina.',
      url: SITE.url,
      sameAs: [SITE.social.linkedin, SITE.social.github, SITE.social.twitter],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Neuquén',
        addressRegion: 'Neuquén',
        addressCountry: 'AR',
      },
      knowsAbout: [
        'Ciberseguridad Industrial Argentina', 'IEC 62443', 'NIST CSF', 'SCADA', 'Modelo Purdue',
        'Oil & Gas Vaca Muerta', 'SIEM Security Onion', 'Arquitectura IT/OT',
        'Infraestructura Crítica', 'Seguridad de Redes', 'Continuidad de Negocio',
      ],
    },
    {
      '@type': 'ProfessionalService',
      name: 'Juan Felipe Palacios – Consultoría IT/OT Neuquén',
      serviceType: 'Ciberseguridad para Oil & Gas en Vaca Muerta',
      description: 'Servicios de consultoría en ciberseguridad industrial, arquitectura de redes IT/OT y gestión de infraestructura crítica para el sector Oil & Gas en Vaca Muerta.',
      url: SITE.url,
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
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE.url}/breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: 'Perfil Profesional', item: `${SITE.url}/#perfil` },
        { '@type': 'ListItem', position: 3, name: 'Experiencia IT/OT', item: `${SITE.url}/#experiencia` },
        { '@type': 'ListItem', position: 4, name: 'Servicios', item: `${SITE.url}/#servicios` },
        { '@type': 'ListItem', position: 5, name: 'Certificaciones', item: `${SITE.url}/#certificaciones` },
        { '@type': 'ListItem', position: 6, name: 'Contacto', item: `${SITE.url}/#contacto` },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE.url}/faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Qué servicios de ciberseguridad industrial ofreces?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ofrezco auditorías de seguridad OT/IT, implementación de SIEM (Security Onion), diseño de arquitectura basada en el modelo Purdue, consultoría en IEC 62443 y NIST CSF, análisis de vulnerabilidades y respuesta a incidentes para infraestructura crítica.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué experiencia tienes en el sector Oil & Gas en Vaca Muerta?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cuento con más de 20 años de trayectoria en operación y seguridad de infraestructura TI y OT en el sector Oil & Gas en Vaca Muerta, Neuquén. He liderado proyectos de seguridad perimetral, segmentación de redes y monitoreo continuo con Security Onion, cumpliendo con estándares internacionales como IEC 62443 y SOX.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué es el modelo Purdue en ciberseguridad OT?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El modelo Purdue (ISA-95) es una arquitectura de referencia para redes industriales (OT) que segmenta los sistemas de control en seis niveles, desde sensores y actuadores (Nivel 0) hasta la red corporativa (Nivel 4). Su correcta implementación es clave para la seguridad de infraestructura crítica como la de Vaca Muerta.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo puedo contactarte para consultoría IT/OT?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Puedes contactarme a través del formulario de contacto en mi sitio web, enviarme un mensaje por LinkedIn o descargar mi CV completo desde la sección de contacto. También puedes usar el asistente AI en la esquina inferior derecha para consultas rápidas.',
          },
        },
      ],
    },
  ],
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const headersStore = await headers()
  const langCookie = cookieStore.get(LANGUAGE_COOKIE)

  // Initial language via the shared seam: cookie → Accept-Language header → default.
  // Same rule as detectLanguageClient() — both live in src/lib/language.ts.
  const initialLang = detectLanguageServer(
    langCookie?.value,
    headersStore.get('accept-language'),
  )

  // The RUM telemetry API only accepts deployed origins, so it must never
  // fire from localhost — including `next start` runs of the production
  // build (e.g. the CI e2e job), where the CORS rejection would surface
  // as console errors.
  const host = headersStore.get('host') ?? ''
  const isLocalHost =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('[::1]') ||
    host.startsWith('0.0.0.0')

  return (
    <html lang={initialLang} suppressHydrationWarning style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="canonical" href={SITE.url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* SCAudit RUM only on deployed (non-localhost) production builds:
            the telemetry API only allows deployed origins, so loading it on
            localhost produces CORS errors in the console. */}
        {process.env.NODE_ENV === 'production' && !isLocalHost && (
          <Script
            src={SITE.scaudit.scriptUrl}
            strategy="afterInteractive"
            data-project-id={SITE.scaudit.projectId}
            data-api-url={SITE.scaudit.apiUrl}
            data-sampling="1.0"
            data-spa-tracking="true"
            data-batch-size="10"
            data-flush-interval="15000"
          />
        )}
      </head>
      <body className="font-sans antialiased bg-[#0f172a] text-slate-300">
        <LanguageProvider initialLanguage={initialLang}>
          <HtmlLangUpdater />
          <ObservabilityProvider>
            {children}
          </ObservabilityProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
