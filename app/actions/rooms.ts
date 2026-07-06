'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'
import { getVillaPlan } from '@/lib/subscription'
import { getChannexClient } from '@/lib/channex/getClient'
import { syncRoomType } from '@/lib/channex/sync'

async function getSessionVillaId() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return user.villaId!
}

export async function upsertRoom(data: {
  id?: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE'
  photos?: string[]
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  if (user.role !== 'OWNER') return { success: false, message: 'Hanya owner yang bisa mengelola kamar.' }

  if (!data.id) {
    const plan = await getVillaPlan()
    if (plan === 'FREE') {
      const roomCount = await db.room.count({ where: { villaId: user.villaId! } })
      if (roomCount >= 10) {
        return { success: false, message: 'Paket Free hanya mendukung maksimal 10 kamar. Upgrade ke Pro untuk menambah lebih banyak kamar.' }
      }
    }
  }

  try {
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
          ...(data.photos !== undefined && { photos: data.photos }),
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
            villaId: user.villaId!,
          },
        })
      }
      await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Updated room: ${data.name}`, module: 'Rooms' })
      void (async () => {
        const client = await getChannexClient(user.villaId!)
        if (!client) return
        await syncRoomType(user.villaId!, data.id!, client)
      })().catch(console.error)
    } else {
      const newRoom = await db.room.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type,
          capacity: data.capacity,
          pricePerNight: data.pricePerNight,
          status: data.status,
          photos: data.photos ?? [],
          villaId: user.villaId!,
        },
      })
      await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Added room: ${data.name}`, module: 'Rooms' })
      void (async () => {
        const client = await getChannexClient(user.villaId!)
        if (!client) return
        await syncRoomType(user.villaId!, newRoom.id, client)
      })().catch(console.error)
    }
    revalidatePath('/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('upsertRoom error:', error)
    return { success: false, message: 'Gagal menyimpan data kamar. Coba lagi.' }
  }
}

export async function createArea(data: { name: string; description?: string }) {
  const villaId = await getSessionVillaId()
  try {
    await db.area.create({
      data: {
        name: data.name,
        description: data.description,
        villaId,
      },
    })
    revalidatePath('/rooms')
    return { success: true }
  } catch (error) {
    console.error('createArea error:', error)
    return { success: false, message: 'Gagal menyimpan area. Coba lagi.' }
  }
}
