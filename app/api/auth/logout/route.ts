import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header tidak ditemukan' }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const supabase = getSupabase()

  const { error: userError } = await supabase.auth.getUser(token)
  if (userError) {
    return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
  }

  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
