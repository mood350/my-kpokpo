import { NextRequest, NextResponse } from 'next/server'

/*
 * Routes admin qui nécessitent une session active.
 * /demo est explicitement exclu : accessible sans connexion.
 */
const PROTECTED = [
  '/dashboard',
  '/vehicles',
  '/appointments',
  '/interventions',
  '/parts',
  '/technicians',
  '/invoices',
  '/reports',
  '/settings',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(
    prefix => pathname === prefix || pathname.startsWith(prefix + '/')
  )

  if (!isProtected) return NextResponse.next()

  // Le cookie auth_session est posé par le client au moment du login
  // et contient le refresh_token (durée de vie 7 jours).
  const session = request.cookies.get('auth_session')?.value

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/dashboard') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Exclure les assets statiques Next.js et les routes API.
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
