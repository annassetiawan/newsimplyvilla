import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Only allow same-origin relative paths, never an attacker-supplied absolute
// URL or protocol-relative "//host" — otherwise `next` becomes an open
// redirect right after the user proves their identity via OTP.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    return '/dashboard'
  }
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = safeNextPath(searchParams.get('next'))

  if (token_hash && type) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    console.log('[auth/confirm] verifyOtp result:', { type, error: error?.message })
    if (!error) {
      if (type === 'invite') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', origin))
}
