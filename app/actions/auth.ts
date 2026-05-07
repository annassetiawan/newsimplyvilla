'use server'

import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'

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
  villaName: string
  villaAddress: string
  villaCity: string
  villaPhone: string
  firstRoom?: {
    code: string
    name: string
    capacity: number
    pricePerNight: number
  }
}): Promise<{ success: boolean; message?: string }> {
  const supabase = getSupabase()

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: { data: { name: data.name } },
  })
  if (error) return { success: false, message: error.message }
  if (!authData.user) return { success: false, message: 'User creation failed' }

  try {
    const villa = await db.villa.create({
      data: {
        name: data.villaName,
        address: `${data.villaAddress}, ${data.villaCity}`,
        contact: data.villaPhone,
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

    if (data.firstRoom) {
      await db.room.create({
        data: {
          code: data.firstRoom.code,
          name: data.firstRoom.name,
          capacity: data.firstRoom.capacity,
          pricePerNight: data.firstRoom.pricePerNight,
          status: 'AVAILABLE',
          type: 'Standard',
          photos: [],
          villaId: villa.id,
        },
      })
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Registration failed',
    }
  }

  return { success: true }
}
