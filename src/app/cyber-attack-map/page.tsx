import type { Metadata } from 'next'
import CyberAttackMap3D from '@/features/portfolio/CyberAttackMap3D'
import { getServerT } from '@/lib/server-i18n'
import { SITE } from '@/lib/constants'

/**
 * Página a pantalla completa del mapa de ciberataques.
 *
 * El idioma se resuelve en el servidor con el mismo seam que el resto del
 * sitio (`cookie → Accept-Language → default`), de modo que el primer paint
 * ya sale en el idioma correcto y el metadata (title/description) coincide
 * con lo que se ve.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { language, t } = await getServerT()
  const title = `${t('threatmap.title')} — ${SITE.name}`
  const description = t('threatmap.subtitle')
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/cyber-attack-map` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/cyber-attack-map`,
      type: 'website',
      locale: language === 'es' ? 'es_AR' : 'en_US',
    },
  }
}

export default async function CyberAttackMapPage() {
  const { t } = await getServerT()

  return (
    <main className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            <span className="text-blue-400">🌐</span> {t('threatmap.title')}
          </h1>
          <p className="text-gray-400">{t('threatmap.subtitle')}</p>
          <p className="text-gray-500 text-sm max-w-3xl mt-3 leading-relaxed">
            {t('threatmap.intro')}
          </p>
        </div>
        <CyberAttackMap3D />
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">{t('threatmap.sources.title')}</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• DShield (SANS Internet Storm Center)</li>
              <li>• CISA KEV (Known Exploited Vulnerabilities)</li>
              <li>• {t('threatmap.sources.ipwho')}</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2">{t('threatmap.features.title')}</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• {t('threatmap.features.globe')}</li>
              <li>• {t('threatmap.features.arcs')}</li>
              <li>• {t('threatmap.features.labels')}</li>
              <li>• {t('threatmap.features.live')}</li>
              <li>• {t('threatmap.features.types')}</li>
            </ul>
          </div>
          <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">{t('threatmap.controls.title')}</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• {t('threatmap.controls.drag')}</li>
              <li>• {t('threatmap.controls.scroll')}</li>
              <li>• {t('threatmap.controls.auto')}</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
