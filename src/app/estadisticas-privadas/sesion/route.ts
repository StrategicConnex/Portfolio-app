import { NextResponse, type NextRequest } from 'next/server'
import {
  PANEL_COOKIE,
  panelCookieOptions,
  createPanelCookieValue,
  matchesPanelToken,
  isPanelAuthConfigured,
} from '@/lib/panel-auth'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Intentos de login por minuto y cliente — fuerza bruta fuera. */
const LOGIN_ATTEMPTS_PER_MIN = 5

/**
 * Login del panel privado — emite la cookie de sesión firmada.
 *
 * - `GET  ?k=<token>`: atajo para automatización y compatibilidad con el
 *   patrón histórico `?k=`. Verifica, emite cookie y redirige al panel **sin
 *   query**, sacando el token de la URL efectiva (bookmarks viejos dejan de
 *   tener el token).
 * - `POST` (form `k=<token>`): el formulario HTML de la página de login,
 *   sin JS.
 *
 * Rate-limit de 5/min por cliente (mismo seam Redis+memoria del resto de la
 * app); fallos → redirect a `?e=1` / `?e=rate` sin confirmar nada en el body.
 * Sin env configurada, la ruta no existe (404).
 */
function redirect(base: string, path: string, status = 303): NextResponse {
  return NextResponse.redirect(new URL(path, base), { status })
}

async function handleLogin(token: string | null, req: NextRequest): Promise<NextResponse> {
  const base = req.nextUrl.origin

  // Sin env no hay nada que autenticar: la ruta no existe.
  if (!isPanelAuthConfigured()) {
    return new NextResponse('Not found', { status: 404 })
  }

  const limit = await checkRateLimit(`panel-login:${getClientId(req)}`, LOGIN_ATTEMPTS_PER_MIN)
  if (!limit.allowed) {
    return redirect(base, '/estadisticas-privadas/login?e=rate')
  }

  if (!matchesPanelToken(token)) {
    return redirect(base, '/estadisticas-privadas/login?e=1')
  }
  const value = createPanelCookieValue()
  if (!value) return new NextResponse('Not found', { status: 404 })

  const res = redirect(base, '/estadisticas-privadas')
  res.cookies.set(PANEL_COOKIE, value, panelCookieOptions())
  return res
}

export async function GET(req: NextRequest) {
  return handleLogin(req.nextUrl.searchParams.get('k'), req)
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null)
  const k = form?.get('k')
  return handleLogin(typeof k === 'string' ? k : null, req)
}
