import { MetadataRoute } from 'next'
import { SITE } from '@/lib/constants'
import { VOLUMES } from '@/features/recursos/recursos-volumes'

/** hreflang alternates for a crawlable path (`/` maps to the bare origin). */
function languages(path: string): Record<string, string> {
  const base = path === '/' ? SITE.url : `${SITE.url}${path}`
  return {
    'es-AR': `${base}?lang=es`,
    en: `${base}?lang=en`,
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: languages('/') },
    },
    {
      url: `${SITE.url}/#perfil`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE.url}/#experiencia`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE.url}/#servicios`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE.url}/#certificaciones`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE.url}/#contacto`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE.url}/recursos`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: languages('/recursos') },
    },
    {
      url: `${SITE.url}/estadisticas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
      alternates: { languages: languages('/estadisticas') },
    },
    {
      url: `${SITE.url}/cyber-attack-map`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
      alternates: { languages: languages('/cyber-attack-map') },
    },
    ...VOLUMES.map((v) => ({
      url: `${SITE.url}/recursos/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages: languages(`/recursos/${v.slug}`) },
    })),
  ]
}
