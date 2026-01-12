import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Samara Production Middleware
 * - Handles Supabase session cookies
 * - Protects routes
 * - Applies region detection
 */

const PROTECTED_ROUTES = ["/profile", "/orders", "/wishlist", "/checkout"]
const ADMIN_ROUTES = ["/admin"]
const PUBLIC_AUTH_ROUTES = ["/auth/login", "/auth/signup", "/auth/callback"]

const REGION_MAP: Record<string, string> = {
  IN: "IN",
  US: "US",
  CA: "CA",
  AE: "AE",
  GB: "GB",
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  /* ─────────────────────────────────────────────
     🌍 REGION COOKIE
  ───────────────────────────────────────────── */
  const regionCookie = request.cookies.get("region")?.value

  if (!regionCookie) {
    const country =
      request.headers.get("x-vercel-ip-country") || "IN"

    const region = REGION_MAP[country] || "IN"

    response.cookies.set("region", region, {
      path: "/",
      sameSite: "lax",
    })
  }

  /* ─────────────────────────────────────────────
     🔐 SUPABASE COOKIE BRIDGE (THIS IS THE FIX)
  ───────────────────────────────────────────── */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user ?? null
  const path = request.nextUrl.pathname

  /* ─────────────────────────────────────────────
     PUBLIC AUTH ROUTES
  ───────────────────────────────────────────── */
  if (PUBLIC_AUTH_ROUTES.some(p => path.startsWith(p))) {
    return response
  }

  /* ─────────────────────────────────────────────
     ADMIN ROUTES
  ───────────────────────────────────────────── */
  if (ADMIN_ROUTES.some(p => path.startsWith(p))) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return response
  }

  /* ─────────────────────────────────────────────
     PROTECTED ROUTES
  ───────────────────────────────────────────── */
  if (PROTECTED_ROUTES.some(p => path.startsWith(p)) && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
