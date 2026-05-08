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
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'OWNER') throw new Error('Only owners can manage room settings')

  if (data.id) {
    const existing = await db.room.findUnique({ where: { id: data.id } })
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
    if (existing && existing.pricePerNight !== data.pricePerNight) {
      await db.transaction.create({
        data: {
          date: new Date(),
          type: 'EXPENSE',
          description: `Room price updated: ${existing.code} — Rp ${existing.pricePerNight.toLocaleString('id-ID')} → Rp ${data.pricePerNight.toLocaleString('id-ID')}`,
          amount: 0,
          category: 'Admin',
          paymentStatus: 'PAID',
          villaId: user.villaId,
        },
      })
    }
  } else {
    await db.room.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        capacity: data.capacity,
        pricePerNight: data.pricePerNight,
        status: data.status,
        photos: [],
        villaId: user.villaId,
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
