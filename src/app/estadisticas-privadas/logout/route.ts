import { NextResponse, type NextRequest } from 'next/server'
import { PANEL_COOKIE } from '@/lib/panel-auth'

export const dynamic = 'force-dynamic'

/** Cierra la sesión: borra la cookie y vuelve al login. */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/estadisticas-privadas/login', req.nextUrl.origin), {
    status: 303,
  })
  res.cookies.delete(PANEL_COOKIE)
  return res
}
