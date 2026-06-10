import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
  }

  const staff = await db.staff.findUnique({
    where: { supabaseUserId: data.user.id },
    include: { villa: { include: { subscription: true } } },
  })

  if (!staff) {
    return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
  }

  if (!staff.isActive) {
    return NextResponse.json({ error: 'Akun tidak aktif' }, { status: 403 })
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      position: staff.position,
      villaId: staff.villaId,
      villaName: staff.villa?.name ?? null,
    },
    redirectTo: staff.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard',
  })
}
