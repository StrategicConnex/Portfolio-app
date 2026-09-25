import type { Metadata } from 'next'
import { countByCountry, countByDay, countByFile, countByVolume, readRecent } from '@/lib/download-stats'
import { getServerT } from '@/lib/server-i18n'
import { SITE } from '@/lib/constants'
import { CopyButton } from './CopyButton'
import { pctDelta, sparklinePath, sumLastDays, trendDirection } from './trends'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { language } = await getServerT()
  const es = language === 'es'
  const title = es
    ? 'Estadísticas de descargas — Biblioteca IT/OT'
    : 'Download stats — IT/OT Library'
  const description = es
    ? 'Métricas agregadas y anónimas de la biblioteca: descargas por documento, por día y por país. Sin datos personales.'
    : 'Aggregated, anonymous library metrics: downloads per document, per day and per country. No personal data.'
  return {
    title,
    description,
    alternates: { canonical: `${SITE.url}/estadisticas` },
    openGraph: { title, description, url: `${SITE.url}/estadisticas`, type: 'website' },
  }
}

/**
 * Página pública de métricas agregadas de la biblioteca.
 *
 * Privacy by design: solo se muestran **agregaciones** (archivo, día UTC y
 * país de baja resolución). Nunca se renderizan IP, user-agent, referrer ni
 * eventos individuales — eso vive únicamente en el panel privado
 * `/estadisticas-privadas`. Con el log vacío muestra un estado vacío honesto.
 */
export default async function EstadisticasPublicas() {
  const { dict } = await getServerT()

  const events = await readRecent(10_000)
  const total = events.length
  const byFile = countByFile(events)
  // 60 días para derivar semana actual vs. previa y el sparkline de los 30
  // últimos; la gráfica principal sigue siendo de 30 días.
  const byDay60 = countByDay(events, { days: 60 })
  const byDay = byDay60.slice(-30)
  const weekNow = sumLastDays(byDay60, 7)
  const weekPrev = sumLastDays(byDay60.slice(0, -7), 7)
  const weekDelta = pctDelta(weekNow, weekPrev)
  const weekTrend = trendDirection(weekDelta)
  const sparkPath = sparklinePath(byDay)
  const byVolume = countByVolume(events)
  const byCountry = countByCountry(events)
  const maxDay = Math.max(...byDay.map((d) => d.count), 1)
  const maxVolume = Math.max(...byVolume.map((v) => v.count), 1)
  const maxCountry = Math.max(...byCountry.map((c) => c.count), 1)

  const dayLabel = (day: string) => `${day.slice(8)}/${day.slice(5, 7)}`
  const dayTooltip = (day: string, count: number) =>
    `${dayLabel(day)}: ${count} ${count === 1 ? dict['stats.day_one'] : dict['stats.day_many']}`

  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)] px-4 pt-28 pb-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[4px] text-[var(--blue)]">
            {dict['stats.kicker']}
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            {dict['stats.title']}{' '}
            <span className="text-[var(--gold)]">{dict['stats.highlight']}</span>
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {dict['stats.intro']}
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-subtle)' }}>{dict['stats.privacy_note']}</p>
        </header>

        {total === 0 ? (
          <p className="rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-8 text-sm text-muted-foreground">
            {dict['stats.empty']}
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xs font-bold uppercase tracking-[2px] text-foreground">{dict['stats.kpis']}</h2>
              <span
                data-testid="week-trend"
                className={
                  'rounded-full border px-2.5 py-1 text-[11px] font-semibold ' +
                  (weekTrend === 'up'
                    ? 'border-[var(--ok)] text-[var(--ok)]'
                    : weekTrend === 'down'
                      ? 'border-[var(--danger)] text-[var(--danger)]'
                      : 'border-[var(--surface-border)] text-muted-foreground')
                }
              >
                {weekDelta !== null && (
                  <span aria-hidden="true" className="mr-1">
                    {weekTrend === 'up' ? '▲' : weekTrend === 'down' ? '▼' : '■'}
                  </span>
                )}
                {weekDelta !== null ? `${weekDelta > 0 ? '+' : ''}${weekDelta}% ` : ''}
                {dict['stats.trend.vs_prev']}
              </span>
            </div>
            <section aria-label={dict['stats.kpis']} className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: dict['stats.kpi.total'], value: String(total), spark: undefined },
                { label: dict['stats.kpi.files'], value: String(byFile.length), spark: undefined },
                {
                  label: dict['stats.kpi.countries'],
                  value: String(byCountry.filter((c) => c.country !== '??').length),
                  spark: undefined,
                },
                {
                  label: dict['stats.kpi.last30'],
                  value: String(byDay.reduce((sum, d) => sum + d.count, 0)),
                  spark: sparkPath || undefined,
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4"
                >
                  <div className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">
                    {kpi.label}
                  </div>
                  <div className="mt-1 text-xl font-bold text-[var(--blue)]">{kpi.value}</div>
                  {kpi.spark && (
                    <svg
                      data-testid="sparkline"
                      viewBox="0 0 100 32"
                      preserveAspectRatio="none"
                      className="mt-2 h-8 w-full"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d={kpi.spark} fill="none" stroke="var(--blue)" strokeWidth="2" />
                    </svg>
                  )}
                </div>
              ))}
            </section>

            <section className="mb-10">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">
                {dict['stats.by_day.title']}{' '}
                <span className="font-normal normal-case text-muted-foreground">{dict['stats.by_day.subtitle']}</span>
              </h2>
              <div className="rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
                <div
                  className="flex h-36 items-end gap-[2px] border-b border-[var(--border)]"
                  role="img"
                  aria-label={dict['stats.by_day.title']}
                >
                  {byDay.map((d) => (
                    <div
                      key={d.day}
                      data-day={d.day}
                      title={dayTooltip(d.day, d.count)}
                      className="flex h-full flex-1 flex-col justify-end"
                    >
                      <div
                        className="rounded-t-sm bg-gradient-to-t from-[var(--blue)] to-[var(--blue)]/60"
                        style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex gap-[2px]">
                  {byDay.map((d, i) => (
                    <span key={d.day} className="flex-1 text-center text-[8px]" style={{ color: 'var(--text-faint)' }}>
                      {i % 5 === 0 || i === byDay.length - 1 ? dayLabel(d.day) : ''}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">
                {dict['stats.by_volume.title']}
              </h2>
              <div className="space-y-2 rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
                {byVolume
                  .filter((v) => v.count > 0 || v.category !== 'otros')
                  .map((v) => (
                    <div key={v.category} data-volume={v.category} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-xs text-muted-foreground sm:w-48">
                        {dict[`recursos.cat.${v.category}`]}
                      </span>
                      <div className="h-4 flex-1 overflow-hidden rounded" style={{ background: 'var(--surface-fill)' }}>
                        <div
                          className="h-full rounded bg-gradient-to-r from-[var(--blue)] to-[var(--blue)]/60"
                          style={{ width: `${(v.count / maxVolume) * 100}%`, minWidth: v.count > 0 ? 4 : 0 }}
                        />
                      </div>
                      <span className="w-8 text-right text-xs font-bold text-[var(--blue)]">{v.count}</span>
                    </div>
                  ))}
              </div>
            </section>

            <section className="mb-10">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">
                {dict['stats.by_country.title']}
              </h2>
              <div className="space-y-2 rounded-2xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
                {byCountry.map((c) => (
                  <div key={c.country} data-country={c.country} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs text-muted-foreground sm:w-48">
                      {c.country === '??' ? dict['stats.country_unknown'] : c.country}
                    </span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-[var(--bg2, rgba(148,163,184,0.15))]">
                      <div
                        className="h-full rounded bg-gradient-to-r from-[var(--gold)] to-[var(--gold)]/60"
                        style={{ width: `${(c.count / maxCountry) * 100}%`, minWidth: c.count > 0 ? 4 : 0 }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-bold text-[var(--gold)]">{c.count}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[2px] text-foreground">
                  {dict['stats.by_file.title']}
                </h2>
                <CopyButton
                  label={dict['stats.trend.copy']}
                  copiedLabel={dict['stats.trend.copied']}
                  getText={() =>
                    ['Documento\tDescargas', ...byFile.map((c) => `${c.file}\t${c.count}`)].join('\n')
                  }
                />
              </div>
              <div className="overflow-x-auto rounded-2xl border border-[var(--surface-border)]">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground" style={{ background: 'var(--surface-fill)' }}>
                    <tr>
                      <th className="px-3 py-2">{dict['stats.by_file.file']}</th>
                      <th className="px-3 py-2 text-right">{dict['stats.by_file.downloads']}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byFile.map((c, i) => (
                      <tr key={c.file} className={i % 2 ? 'bg-[var(--card)]' : ''}>
                        <td className="max-w-xl truncate px-3 py-1.5 font-mono text-[11px] text-foreground">{c.file}</td>
                        <td className="px-3 py-1.5 text-right font-bold text-[var(--blue)]">{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <p className="mt-10 text-center text-xs" style={{ color: 'var(--text-subtle)' }}>{dict['stats.footer_note']}</p>
      </div>
    </main>
  )
}
