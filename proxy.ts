import { NextResponse, type NextRequest } from 'next/server'

// Edge-safe session decode (no node:crypto HMAC verify here — the signature
// is fully verified server-side in lib/auth.ts on every data access; the
// proxy only routes based on the claimed role for UX, it is not the sole guard).
function decodeRole(token: string | undefined): { role: string } | null {
  if (!token) return null
  const [payload] = token.split('.')
  if (!payload) return null
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

const ADMIN_ONLY = ['/settings']
const WRITE_ROLES = ['admin', 'moderator']
const WRITE_ONLY = ['/calculator', '/invoices/new']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = decodeRole(request.cookies.get('ft_session')?.value)

  // Public routes
  if (pathname === '/login' || pathname.startsWith('/verify')) {
    if (pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (ADMIN_ONLY.some((p) => pathname.startsWith(p)) && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (WRITE_ONLY.some((p) => pathname.startsWith(p)) && !WRITE_ROLES.includes(session.role)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|api|.*\\.(?:png|svg|jpg|ico)).*)'],
}
