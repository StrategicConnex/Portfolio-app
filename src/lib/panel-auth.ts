/**
 * Autenticación del panel privado de descargas (`/estadisticas-privadas`).
 *
 * Modelo: **login único que emite una cookie firmada HMAC-SHA256** en lugar
 * del patrón `?k=<token>` en cada visita — el token en la URL queda en logs
 * de servidor, historial del navegador y referrers; la cookie httpOnly no.
 *
 * - La clave de firma es la misma env `DOWNLOAD_STATS_TOKEN` (no se introduce
 *   ninguna credencial nueva: quien la conoce puede abrir sesión).
 * - El valor de la cookie es `<expiresMs>.<hmac(expiresMs)>` — sin PII, con
 *   expiración verificada en tiempo constante junto con la firma.
 * - Las cookies las establece el route handler `/estadisticas-privadas/login`
 *   (GET con `?k=` para automatización, POST de formulario sin JS); en esta
 *   versión de Next ni las páginas ni el layout pueden setear cookies.
 * - Sin env configurada, todo el subsistema reporta "no configurado" y el
 *   panel sigue respondiendo 404 (la ruta no existe).
 */

import { createHmac, timingSafeEqual } from 'node:crypto'

export const PANEL_COOKIE = 'panel_auth'

/** 30 días — la sesión debe sobrevivir a un uso esporádico del panel. */
export const PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/**
 * Secreto de firma (= token de acceso). Se exige un mínimo de 8 caracteres
 * para que el HMAC no sea trivialmente fuerza-brutable; con menos de 16 se
 * avisa (el valor por defecto del proyecto tiene 9).
 */
function panelSecret(): string | null {
  const token = process.env.DOWNLOAD_STATS_TOKEN
  if (!token || token.length < 8) return null
  return token
}

/** ¿Hay backend de autenticación configurado? (si no, el panel no existe). */
export function isPanelAuthConfigured(): boolean {
  return panelSecret() !== null
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** Comparación en tiempo constante (evita el oráculo de timing). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

/** Genera el valor firmado de la cookie para un nuevo login. */
export function createPanelCookieValue(): string | null {
  const secret = panelSecret()
  if (!secret) return null
  const expires = String(Date.now() + PANEL_COOKIE_MAX_AGE * 1000)
  return `${expires}.${sign(expires, secret)}`
}

/** ¿La cookie provista es válida y no expirada? (tiempo constante). */
export function verifyPanelCookie(value: string | undefined | null): boolean {
  const secret = panelSecret()
  if (!secret || !value) return false
  const dot = value.indexOf('.')
  if (dot <= 0) return false
  const expires = value.slice(0, dot)
  const sig = value.slice(dot + 1)
  if (!/^\d+$/.test(expires) || !/^[0-9a-f]{64}$/.test(sig)) return false
  if (!safeEqual(sign(expires, secret), sig)) return false
  return Number(expires) > Date.now()
}

/** ¿El `?k=`/password provisto coincide con el token? (tiempo constante). */
export function matchesPanelToken(k: string | undefined | null): boolean {
  const secret = panelSecret()
  if (!secret || !k) return false
  return safeEqual(k, secret)
}

/**
 * ¿Hay sesión válida en la cookie del request actual? (Server Component /
 * Route Handler). En tests `next/headers` se mockea.
 */
export async function hasValidPanelSession(): Promise<boolean> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return verifyPanelCookie(store.get(PANEL_COOKIE)?.value)
}

/** Opciones de la cookie de sesión (httpOnly: invisible para JS del cliente). */
export function panelCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PANEL_COOKIE_MAX_AGE,
  }
}
