'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

export async function createStaff(data: {
  name: string
  email: string
  position: string
  role: 'OWNER' | 'STAFF'
}) {
  await db.staff.create({
    data: {
      villaId: VILLA_ID,
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
