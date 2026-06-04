'use server'

import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { generateSlug } from '@/lib/utils'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function registerUser(data: {
  name: string
  email: string
  password: string
}): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabase()

  const existing = await db.staff.findUnique({ where: { email: data.email } })
  if (existing) return { success: false, message: 'Email sudah digunakan. Silakan masuk.' }

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { name: data.name } },
  })
  if (error) return { success: false, message: error.message }
  if (!authData.user) return { success: false, message: 'User creation failed' }

  try {
    const villaName = `${data.name}'s Villa`
    const villa = await db.villa.create({
      data: {
        name: villaName,
        slug: generateSlug(villaName),
        address: '-',
        isOnboarded: false,
      },
    })

    await db.staff.create({
      data: {
        supabaseUserId: authData.user.id,
        name: data.name,
        email: data.email,
        role: 'OWNER',
        position: 'Owner / Manager',
        isActive: true,
        villaId: villa.id,
      },
    })

    await db.subscription.create({
      data: {
        villaId: villa.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    })
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Registration failed',
    }
  }

  return { success: true }
}
