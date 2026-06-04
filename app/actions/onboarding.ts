'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { generateSlug } from '@/lib/utils'

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
  try {
    await db.villa.update({
      where: { id: user.villaId },
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        address: `${data.address}, ${data.city}`,
        contact: data.phone,
        description: data.description || null,
        facilities: data.facilities,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('saveVillaProfile error:', error)
    return { success: false, message: 'Gagal menyimpan profil villa. Coba lagi.' }
  }
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
  try {
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
  } catch (error) {
    console.error('saveOnboardingRooms error:', error)
    return { success: false, message: 'Gagal menyimpan data kamar. Coba lagi.' }
  }
}

export async function inviteStaff(
  staffList: Array<{
    name: string
    email: string
    position: string
    permissions: string[]
  }>
) {
  const user = await getUser()

  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    for (const member of staffList) {
      const staff = await db.staff.create({
        data: {
          name: member.name,
          email: member.email,
          position: member.position,
          role: 'STAFF',
          isActive: true,
          villaId: user.villaId,
          permissions: member.permissions,
        },
      })
      try {
        const { data: inviteData } = await adminClient.auth.admin.inviteUserByEmail(member.email, {
          data: { name: member.name },
        })
        if (inviteData?.user?.id) {
          await db.staff.update({
            where: { id: staff.id },
            data: { supabaseUserId: inviteData.user.id },
          })
        }
      } catch {
        // Invite email failed — DB record still created
      }
    }
  } catch (error) {
    console.error('inviteStaff error:', error)
    throw new Error('Gagal mengundang staf. Coba lagi.')
  }
}

export async function completeOnboarding() {
  const user = await getUser()
  await db.villa.update({
    where: { id: user.villaId },
    data: { isOnboarded: true },
  })
  redirect('/dashboard')
}
