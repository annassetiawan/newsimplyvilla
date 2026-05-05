'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

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
    await db.room.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        pricePerNight: data.pricePerNight,
        status: data.status,
        villaId: VILLA_ID,
      },
    })
  }
  revalidatePath('/rooms')
  revalidatePath('/dashboard')
}

export async function createArea(data: { name: string; description?: string }) {
  await db.area.create({
    data: {
      name: data.name,
      description: data.description,
      villaId: VILLA_ID,
    },
  })
  revalidatePath('/rooms')
}
