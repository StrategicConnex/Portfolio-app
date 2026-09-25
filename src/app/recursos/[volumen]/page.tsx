import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RECURSO_FILES, recursoDownloadHref, type RecursoDocMeta } from '@/data/recursos'
import { RECURSO_OUTLINE, type OutlineHeading } from '@/data/recursos-outline'
import { VOLUMES, volumeBySlug } from '@/lib/recursos-volumes'
import { getServerT } from '@/lib/server-i18n'
import { SITE } from '@/lib/constants'

export function generateStaticParams() {
  return VOLUMES.map((v) => ({ volumen: v.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ volumen: string }>
}): Promise<Metadata> {
  const { volumen } = await params
  const vol = volumeBySlug(volumen)
  if (!vol) return {}
  const { language } = await getServerT()
  const copy = language === 'es' ? vol.es : vol.en
  const title = `${copy.name} — ${SITE.name}`
  return {
    title,
    description: copy.description,
    alternates: { canonical: `${SITE.url}/recursos/${vol.slug}` },
    openGraph: { title, description: copy.description, url: `${SITE.url}/recursos/${vol.slug}`, type: 'article' },
  }
}

function labelFor(f: RecursoDocMeta, dict: Record<string, string>): string {
  return (f.labelKey && dict[f.labelKey]) || f.fallback
}

function formatLabel(path: string): 'DOCX' | 'XLSX' {
  return path.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'DOCX'
}

/** Collapse an outline to a readable chapter index: H1+H2, deduplicated. */
function chapterIndex(headings: OutlineHeading[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const h of headings) {
    if (h.t > 2 || seen.has(h.x)) continue
    seen.add(h.x)
    out.push(h.x)
  }
  return out
}

export default async function VolumePage({
  params,
}: {
  params: Promise<{ volumen: string }>
}) {
  const { volumen } = await params
  const vol = volumeBySlug(volumen)
  if (!vol) notFound()

  const { language, dict } = await getServerT()
  const copy = language === 'es' ? vol.es : vol.en
  const docs = RECURSO_FILES.filter((f) => f.category === vol.slug)

  const outlines = docs.map((f) => ({ doc: f, headings: RECURSO_OUTLINE[f.path] || [] }))
  const chapters = Array.from(
    new Set(outlines.flatMap((o) => chapterIndex(o.headings))),
  ).slice(0, 24)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: copy.name,
    description: copy.description,
    author: { '@type': 'Person', name: SITE.name, url: SITE.url },
    inLanguage: language,
    url: `${SITE.url}/recursos/${vol.slug}`,
    numberOfPages: docs.length,
  }

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)] px-4 pt-28 pb-20 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label={dict['recursos.hub_label']} className="mb-8">
          <Link
            href="/recursos"
            className="text-[10px] font-bold uppercase tracking-[2px] text-[var(--blue)] hover:underline"
          >
            ← {dict['recursos.page.back_library']}
          </Link>
        </nav>

        <header className="mb-12">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{copy.name}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--gold)]">{copy.tagline}</p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
        </header>

        {chapters.length > 0 && (
          <section aria-labelledby="chapters-title" className="mb-12 rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-6 sm:p-8">
            <h2 id="chapters-title" className="mb-4 text-sm font-bold uppercase tracking-[2px] text-foreground">
              {dict['recursos.page.chapters']}
            </h2>
            <ol className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {chapters.map((c, i) => (
                <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="font-mono text-xs text-[var(--blue)]">{String(i + 1).padStart(2, '0')}</span>
                  <span>{c}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="files-title" className="mb-12">
          <h2 id="files-title" className="mb-4 text-sm font-bold uppercase tracking-[2px] text-foreground">
            {dict['recursos.page.files']} ({docs.length})
          </h2>
          <ul className="grid gap-3">
            {docs.map((f) => {
              const format = formatLabel(f.path)
              const heads = outlines.find((o) => o.doc.path === f.path)?.headings ?? []
              const sections = heads.filter((h) => h.t <= 2).slice(0, 3).map((h) => h.x)
              return (
                <li
                  key={f.path}
                  className="flex items-center gap-4 rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-4"
                >
                  <span
                    className={`rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                      format === 'XLSX'
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                        : 'border-blue-500/25 bg-blue-500/10 text-blue-300'
                    }`}
                  >
                    {format}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{labelFor(f, dict)}</p>
                    {sections.length > 0 && (
                      <p className="truncate text-xs text-muted-foreground">{sections.join(' · ')}</p>
                    )}
                  </div>
                  <a
                    href={recursoDownloadHref(f.path)}
                    download
                    className="shrink-0 rounded-xl bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-[2px] text-primary-foreground transition-colors hover:bg-blue-600"
                  >
                    {dict['recursos.download']}
                  </a>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="other-volumes-title">
          <h2 id="other-volumes-title" className="mb-4 text-sm font-bold uppercase tracking-[2px] text-foreground">
            {dict['recursos.page.other_volumes']}
          </h2>
          <div className="flex flex-wrap gap-2">
            {VOLUMES.filter((v) => v.slug !== vol.slug).map((v) => (
              <Link
                key={v.slug}
                href={`/recursos/${v.slug}`}
                className="rounded-full border border-[var(--surface-border)] bg-[var(--card)] px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-[var(--blue)]/40 hover:text-[var(--blue)]"
              >
                {(language === 'es' ? v.es : v.en).name.split('·')[0].trim()}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
