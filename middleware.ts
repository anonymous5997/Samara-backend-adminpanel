import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Production Middleware for Route Protection
 *
 * CRITICAL RULES:
 * 1. /admin/* routes require admin role
 * 2. /profile, /orders, /wishlist require authentication
 * 3. Server-side role checks are mandatory
 * 4. Never trust client-side role values
 */

const PROTECTED_ROUTES = ['/profile', '/orders', '/wishlist', '/checkout'];
const ADMIN_ROUTES = ['/admin'];
const PUBLIC_AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  // Get user session - use getSession() for better performance
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

  // Debug logging
  if (error) {
    console.log('[Middleware] Auth error:', error.message);
  }
  console.log('[Middleware] Path:', request.nextUrl.pathname, 'User:', user?.email || 'none');

  const path = request.nextUrl.pathname;

  // Allow public auth routes
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => path.startsWith(route));
  if (isPublicAuthRoute) {
    return supabaseResponse;
  }

  // Check if route is admin route
  const isAdminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route));

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    path.startsWith(route)
  );

  // Admin route protection
  if (isAdminRoute) {
    if (!user) {
      // Not authenticated - redirect to login
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      // Not admin - redirect to home with error
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    // Admin verified - allow access
    return supabaseResponse;
  }

  // Protected route (non-admin)
  if (isProtectedRoute) {
    if (!user) {
      // Not authenticated - redirect to login
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Authenticated - allow access
    return supabaseResponse;
  }

  // Public route - allow access
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
