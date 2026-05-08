'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

async function getUser() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

export async function saveVillaProfile(data: {
  name: string
  address: string
  city: string
  phone: string
  description?: string
  facilities: string[]
}) {
  const user = await getUser()
  await db.villa.update({
    where: { id: user.villaId },
    data: {
      name: data.name,
      address: `${data.address}, ${data.city}`,
      contact: data.phone,
      description: data.description || null,
      facilities: data.facilities,
    },
  })
  return { success: true }
}

export async function saveOnboardingRooms(
  rooms: Array<{
    code: string
    name: string
    capacity: number
    bedType: string
    pricePerNight: number
    status: 'AVAILABLE' | 'MAINTENANCE'
  }>
) {
  const user = await getUser()
  await db.room.createMany({
    data: rooms.map((r) => ({
      code: r.code,
      name: r.name,
      capacity: r.capacity,
      type: r.bedType,
      pricePerNight: r.pricePerNight,
      status: r.status,
      photos: [],
      villaId: user.villaId,
    })),
  })
  return { success: true }
}

export async function inviteStaff(
  staffList: Array<{
    name: string
    email: string
    position: string
  }>
) {
  const user = await getUser()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  for (const member of staffList) {
    await db.staff.create({
      data: {
        name: member.name,
        email: member.email,
        position: member.position,
        role: 'STAFF',
        isActive: true,
        villaId: user.villaId,
      },
    })
    try {
      await adminClient.auth.admin.inviteUserByEmail(member.email, {
        data: { name: member.name },
      })
    } catch {
      // Invite email failed — DB record still created
    }
  }
  return { success: true }
}

export async function completeOnboarding() {
  const user = await getUser()
  await db.villa.update({
    where: { id: user.villaId },
    data: { isOnboarded: true },
  })
  redirect('/dashboard')
}
