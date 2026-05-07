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

export async function upsertRoom(data: {
  id?: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
}) {
  if (data.id) {
    await db.room.update({
      where: { id: data.id },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        pricePerNight: data.pricePerNight,
        status: data.status,
      },
    })
  } else {
    const villaId = await getVillaId()
    await db.room.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        pricePerNight: data.pricePerNight,
        status: data.status,
        photos: [],
        villaId,
      },
    })
  }
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
}

export async function createArea(data: { name: string; description?: string }) {
  const villaId = await getVillaId()
  await db.area.create({
    data: {
      name: data.name,
      description: data.description,
      villaId,
    },
  })
  revalidatePath('/rooms')
}
