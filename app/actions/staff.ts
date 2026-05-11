'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

async function getVillaId() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user.villaId
}

export async function createStaff(data: {
  name: string
  email: string
  position: string
  role: 'OWNER' | 'STAFF'
}) {
  const villaId = await getVillaId()
  try {
    await db.staff.create({
      data: {
        villaId,
        name: data.name,
        email: data.email,
        position: data.position,
        role: data.role,
        isActive: true,
      },
    })
    console.log(`Email sent to ${data.email}: Welcome to SimplyVilla, ${data.name}!`)
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('createStaff error:', error)
    return { success: false, message: 'Gagal menambah staff. Coba lagi.' }
  }
}

export async function updateStaff(
  id: string,
  data: {
    name: string
    email: string
    position: string
    role: 'OWNER' | 'STAFF'
    isActive: boolean
  }
) {
  await getVillaId()
  try {
    await db.staff.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        position: data.position,
        role: data.role,
        isActive: data.isActive,
      },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('updateStaff error:', error)
    return { success: false, message: 'Gagal memperbarui staff. Coba lagi.' }
  }
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  await getVillaId()
  try {
    await db.staff.update({ where: { id }, data: { isActive } })
    revalidatePath('/users')
    return { success: true }
  } catch (error) {
    console.error('toggleStaffActive error:', error)
    return { success: false, message: 'Gagal memperbarui status staff. Coba lagi.' }
  }
}
