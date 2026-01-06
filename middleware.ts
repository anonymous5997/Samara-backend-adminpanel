import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Production Middleware for Route Protection + Region Detection
 *
 * RULES:
 * 1. /admin/* routes require admin role
 * 2. /profile, /orders, /wishlist, /checkout require authentication
 * 3. Region is detected server-side
 * 4. Never trust client-side role or region values
 */

const PROTECTED_ROUTES = ['/profile', '/orders', '/wishlist', '/checkout']
const ADMIN_ROUTES = ['/admin']
const PUBLIC_AUTH_ROUTES = ['/auth/login', '/auth/signup']

// 🌍 Country → Region mapping
const REGION_MAP: Record<string, string> = {
  IN: 'IN',
  US: 'US',
  CA: 'CA',
  AE: 'AE',
  GB: 'GB',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // ─────────────────────────────────────────────
  // 🌍 REGION DETECTION (SAFE + NON-DESTRUCTIVE)
  // ─────────────────────────────────────────────
  const existingRegion = request.cookies.get('region')?.value

  if (!existingRegion) {
    const country =
      request.headers.get('x-vercel-ip-country') || 'IN'

    const region = REGION_MAP[country] || 'US'

    supabaseResponse.cookies.set('region', region, {
      path: '/',
      sameSite: 'lax',
    })
  }

  // ─────────────────────────────────────────────
  // 🔐 SUPABASE AUTH CLIENT
  // ─────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  const user = session?.user ?? null

  if (error) {
    console.log('[Middleware] Auth error:', error.message)
  }

  const path = request.nextUrl.pathname

  // ─────────────────────────────────────────────
  // PUBLIC AUTH ROUTES
  // ─────────────────────────────────────────────
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some(route =>
    path.startsWith(route)
  )

  if (isPublicAuthRoute) {
    return supabaseResponse
  }

  // ─────────────────────────────────────────────
  // ADMIN ROUTES
  // ─────────────────────────────────────────────
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    path.startsWith(route)
  )

  if (isAdminRoute) {
    if (!user) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.role !== 'admin') {
      const redirectUrl = new URL('/', request.url)
      redirectUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  }

  // ─────────────────────────────────────────────
  // PROTECTED ROUTES (NON-ADMIN)
  // ─────────────────────────────────────────────
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    path.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // ─────────────────────────────────────────────
  // PUBLIC ROUTES
  // ─────────────────────────────────────────────
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
