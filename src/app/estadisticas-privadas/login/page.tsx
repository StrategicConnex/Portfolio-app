import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isPanelAuthConfigured } from '@/lib/panel-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Acceso — Panel',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: Promise<{ e?: string }>
}

/**
 * Página de login del panel privado. Mínima a propósito: un password field
 * y un form que posteá al route handler /sesion — que valida, emite la
 * cookie y redirige al panel. Sin JS requerido.
 */
export default async function PanelLoginPage({ searchParams }: Props) {
  const { e } = await searchParams
  if (!isPanelAuthConfigured()) notFound()

  return (
    <main
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--bg2, #0b1220)', color: 'var(--text, #e2e8f0)' }}
    >
      <div className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 p-6">
        <p className="text-[11px] font-bold uppercase tracking-[3px] text-blue-400">Panel privado</p>
        <h1 className="mt-1 text-xl font-bold">Acceso restringido</h1>

        {e === '1' && (
          <p className="mt-3 text-xs text-amber-400" data-testid="login-error">
            Clave incorrecta.
          </p>
        )}
        {e === 'rate' && (
          <p className="mt-3 text-xs text-amber-400" data-testid="login-rate">
            Demasiados intentos. Espera un minuto.
          </p>
        )}

        <form method="post" action="/estadisticas-privadas/sesion" className="mt-4 space-y-3">
          <input
            type="password"
            name="k"
            required
            autoComplete="off"
            placeholder="Clave de acceso"
            aria-label="Clave de acceso"
            className="w-full rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}
