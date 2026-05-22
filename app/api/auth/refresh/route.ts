import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.refresh_token) {
    return NextResponse.json({ error: 'refresh_token wajib diisi' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: body.refresh_token })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Refresh token tidak valid atau sudah expired' }, { status: 401 })
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
  })
}
