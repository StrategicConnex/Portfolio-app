import type { Metadata } from 'next'
import Link from 'next/link'
import { RECURSO_FILES } from '@/data/recursos'
import { VOLUMES } from '@/lib/recursos-volumes'
import { getServerT } from '@/lib/server-i18n'
import { SITE } from '@/lib/constants'

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getServerT()
  const es = language === 'es'
  const title = es
    ? 'Biblioteca IT/OT — Libro descargable de guías, plantillas y estándares industriales'
    : 'IT/OT Library — Downloadable book of guides, templates and industrial standards'
  const description = es
    ? 'Cinco volúmenes de documentación IT/OT en PDF/DOCX/XLSX: IT, OT, integración, ciberseguridad industrial (IEC 62443) y tendencias. Descarga gratuita.'
    : 'Five volumes of IT/OT documentation (DOCX/XLSX): IT, OT, integration, industrial cybersecurity (IEC 62443) and trends. Free download.'
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/recursos` },
    openGraph: { title, description, url: `${SITE.url}/recursos`, type: 'website' },
  }
}

export default async function RecursosHubPage() {
  const { language, dict } = await getServerT()
  const es = language === 'es'

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)] px-4 pt-28 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[4px] text-[var(--blue)]">
            {dict['recursos.hub_label']}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {dict['recursos.hub_title']}{' '}
            <span className="text-[var(--gold)]">{dict['recursos.hub_highlight']}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {dict['recursos.hub_intro']}
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VOLUMES.map((vol) => {
            const copy = es ? vol.es : vol.en
            const docs = RECURSO_FILES.filter((f) => f.category === vol.slug)
            return (
              <Link
                key={vol.slug}
                href={`/recursos/${vol.slug}`}
                className="group flex flex-col rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-6 transition-all hover:-translate-y-1 hover:border-[var(--blue)]/40 hover:shadow-lg"
              >
                <h2 className="text-base font-bold text-foreground group-hover:text-[var(--blue)]">
                  {copy.name}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">
                  {copy.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {copy.description}
                </p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[2px] text-[var(--blue)]">
                  {docs.length} {dict['recursos.page.docs']} →
                </p>
              </Link>
            )
          })}
        </div>

        {/* Non-volume collections: standards summaries + project documents.
            Kept here so every library file is reachable from an indexable page. */}
        {(['standards', 'project'] as const).map((cat) => {
          const docs = RECURSO_FILES.filter((f) => f.category === cat)
          if (docs.length === 0) return null
          return (
            <section key={cat} aria-labelledby={`hub-${cat}`} className="mt-10">
              <h2 id={`hub-${cat}`} className="mb-4 text-sm font-bold uppercase tracking-[2px] text-foreground">
                {dict[`recursos.cat.${cat}`]} ({docs.length})
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {docs.map((f) => (
                  <li
                    key={f.path}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--surface-border)] bg-[var(--card)] px-4 py-2.5"
                  >
                    <span className="min-w-0 truncate text-sm text-foreground">
                      {(f.labelKey && dict[f.labelKey]) || f.fallback}
                    </span>
                    <a
                      href={`/${encodeURI(f.path)}`}
                      download
                      className="shrink-0 text-[10px] font-bold uppercase tracking-[2px] text-[var(--blue)] hover:underline"
                    >
                      {dict['recursos.download']} ↓
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </main>
  )
}
