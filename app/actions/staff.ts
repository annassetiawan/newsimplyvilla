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
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  await db.staff.update({ where: { id }, data: { isActive } })
  revalidatePath('/users')
}
