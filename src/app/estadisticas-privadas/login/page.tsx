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
      // Tokens del tema (no dark fijo): el chrome global (navbar/footer con
      // blur) sí sigue el tema del sitio, así que un fondo dark fijo creaba
      // una mezcla imposible (blur claro sobre oscuro → gris sin contraste).
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div
        className="w-full rounded-xl border border-[var(--surface-border)] p-6"
        style={{ background: 'var(--card)' }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: 'var(--blue)' }}>Panel privado</p>
        <h1 className="mt-1 text-xl font-bold">Acceso restringido</h1>

        {e === '1' && (
          <p className="mt-3 text-xs" style={{ color: 'var(--warn)' }} data-testid="login-error">
            Clave incorrecta.
          </p>
        )}
        {e === 'rate' && (
          <p className="mt-3 text-xs" style={{ color: 'var(--warn)' }} data-testid="login-rate">
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
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{
              border: '1px solid var(--surface-border-strong, var(--surface-border))',
              background: 'var(--card)',
              color: 'var(--text)',
            }}
          />
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-sm font-bold transition-colors"
            style={{ background: 'var(--blue)', color: 'var(--bg)' }}
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  )
}
