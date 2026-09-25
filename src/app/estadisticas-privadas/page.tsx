import { notFound, redirect } from 'next/navigation'
import { countByDay, countByFile, countByVolume, readRecent } from '@/lib/download-stats'
import { hasValidPanelSession, isPanelAuthConfigured, matchesPanelToken } from '@/lib/panel-auth'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Estadísticas privadas — Descargas',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ k?: string }>
}

const VOLUME_LABEL: Record<string, string> = {
  vol1: 'Vol. I · IT',
  vol2: 'Vol. II · OT',
  vol3: 'Vol. III · Integración',
  vol4: 'Vol. IV · Ciberseguridad',
  vol5: 'Vol. V · Tendencias',
  standards: 'Estándares',
  project: 'Proyecto',
  otros: 'Otros',
}

/**
 * Panel privado de descargas — NO enlazado desde ningún lado y con
 * `noindex`. Solo responde con la env `DOWNLOAD_STATS_TOKEN` coincidente
 * en `?k=`; sin token configurado la ruta responde 404 (no existe).
 *
 * Muestra: total de descargas por archivo y los últimos eventos con
 * IP, país y user-agent.
 */
export default async function EstadisticasDescargas({ searchParams }: Props) {
  const token = process.env.DOWNLOAD_STATS_TOKEN
  const { k } = await searchParams
  if (!isPanelAuthConfigured()) notFound()

  // Sesión válida por cookie → entra. Si no hay sesión pero `?k=` matchea
  // (bookmark/enlace viejo), deriva al route handler de sesión para que emita
  // la cookie y regrese al panel con URL limpia. Cualquier otra cosa → 404:
  // la ruta "no existe" para quien no tiene acceso.
  if (!(await hasValidPanelSession())) {
    if (matchesPanelToken(k)) redirect(`/estadisticas-privadas/sesion?k=${encodeURIComponent(String(k))}`)
    notFound()
  }

  const events = await readRecent(10_000)
  const counts = countByFile(events)
  const total = events.length
  const last = events[events.length - 1]
  const recent = events.slice(-100).reverse()
  const byDay = countByDay(events, { days: 30 })
  const byVolume = countByVolume(events)
  const maxDay = Math.max(...byDay.map((d) => d.count), 1)
  const maxVolume = Math.max(...byVolume.map((v) => v.count), 1)
  const durable = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        dateStyle: 'short',
        timeStyle: 'medium',
      })
    } catch {
      return iso
    }
  }

  return (
    // Tokens del tema (mismo criterio que el login): el chrome global sigue
    // el tema del sitio; un fondo dark fijo rompía el contraste del blur.
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 text-sm" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--blue)' }}>Panel privado</p>
          <h1 className="mt-1 text-2xl font-bold">Descargas de la biblioteca</h1>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Almacenamiento: {durable ? 'Upstash Redis (durable)' : 'archivo local — en Vercel es efímero; configura UPSTASH_REDIS_REST_URL/TOKEN'}
          </p>
        </div>
        <form method="post" action="/estadisticas-privadas/logout">
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={{
              border: '1px solid var(--surface-border)',
              borderStyle: 'solid',
              color: 'var(--text-muted)',
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Descargas totales', value: String(total) },
          { label: 'Archivos distintos', value: String(counts.length) },
          { label: 'Último evento', value: last ? fmt(last.ts) : '—' },
          { label: 'IPs distintas', value: String(new Set(events.map((e) => e.ip)).size) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</div>
            <div className="mt-1 text-lg font-bold text-[var(--blue)]">{kpi.value}</div>
          </div>
        ))}
      </section>

      {total > 0 && (
        <>
          <section className="mb-10">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">
              Descargas por día <span className="font-normal normal-case text-muted-foreground">· últimos 30 días (UTC)</span>
            </h2>
            <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
              <div className="flex h-36 items-end gap-[2px] border-b border-[var(--surface-border)]" role="img" aria-label="Gráfica de descargas por día">
                {byDay.map((d) => (
                  <div
                    key={d.day}
                    data-day={d.day}
                    title={`${d.day.slice(8)}/${d.day.slice(5, 7)}: ${d.count} descarga${d.count === 1 ? '' : 's'}`}
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
                  <span key={d.day} className="flex-1 text-center text-[8px] text-muted-foreground">
                    {i % 5 === 0 || i === byDay.length - 1 ? `${d.day.slice(8)}/${d.day.slice(5, 7)}` : ''}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">Descargas por volumen</h2>
            <div className="space-y-2 rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-4">
              {byVolume
                .filter((v) => v.count > 0 || v.category !== 'otros')
                .map((v) => (
                  <div key={v.category} data-volume={v.category} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 text-xs text-foreground">{VOLUME_LABEL[v.category]}</span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-[var(--surface-fill)]">
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
        </>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">Descargas por archivo</h2>
        {counts.length === 0 ? (
          <p className="rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-6 text-muted-foreground">
            Sin descargas registradas todavía.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--card)] text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Archivo</th>
                  <th className="px-3 py-2 text-right">Descargas</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((c, i) => (
                  <tr key={c.file} className={i % 2 ? 'bg-[var(--card)]' : ''}>
                    <td className="max-w-xl truncate px-3 py-1.5 font-mono text-[11px] text-foreground">{c.file}</td>
                    <td className="px-3 py-1.5 text-right font-bold text-[var(--blue)]">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[2px] text-foreground">
          Últimos {recent.length} eventos (más reciente primero)
        </h2>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-[var(--surface-border)] bg-[var(--card)] p-6 text-muted-foreground">—</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--surface-border)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--card)] text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Archivo</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">País</th>
                  <th className="px-3 py-2">User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((ev, i) => (
                  <tr key={`${ev.ts}-${i}`} className={i % 2 ? 'bg-[var(--card)]' : ''}>
                    <td className="whitespace-nowrap px-3 py-1.5 text-foreground">{fmt(ev.ts)}</td>
                    <td className="max-w-[18rem] truncate px-3 py-1.5 font-mono text-[11px] text-foreground">{ev.file}</td>
                    <td className="whitespace-nowrap px-3 py-1.5 font-mono text-[var(--warn)]">{ev.ip}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{ev.country || '—'}</td>
                    <td className="max-w-[16rem] truncate px-3 py-1.5 text-muted-foreground" title={ev.ua}>{ev.ua || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
