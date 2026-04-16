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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
