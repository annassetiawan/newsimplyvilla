import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
  let supabaseResponse = NextResponse.next({ request: req })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) return supabaseResponse

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request: req })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Must call getUser() to keep session fresh — do not add code between
  // createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')

  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/v/') ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/auth/')

  if (!user && !isAuthPage && !isPublicPage) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
