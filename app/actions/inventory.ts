'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

export async function stockIn(data: {
  itemId: string
  quantity: number
  date: Date
  note?: string
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    const [item] = await Promise.all([
      db.inventoryItem.findUnique({ where: { id: data.itemId } }),
      db.inventoryItem.update({
        where: { id: data.itemId },
        data: { onHand: { increment: data.quantity } },
      }),
      db.stockMovement.create({
        data: {
          itemId: data.itemId,
          type: 'IN',
          quantity: data.quantity,
          date: data.date,
          note: data.note,
        },
      }),
    ])
    if (item) await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Stock In: ${item.name} ×${data.quantity}`, module: 'Inventory' })
    revalidatePath('/inventory')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('stockIn error:', error)
    return { success: false, message: 'Gagal menambah stok. Coba lagi.' }
  }
}

export async function stockOut(data: {
  itemId: string
  quantity: number
  date: Date
  note?: string
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    const item = await db.inventoryItem.findUnique({ where: { id: data.itemId } })
    if (!item) return { success: false, message: 'Item tidak ditemukan.' }
    if (data.quantity > item.onHand)
      return { success: false, message: `Stok tidak cukup — hanya tersisa ${item.onHand}.` }

    await Promise.all([
      db.inventoryItem.update({
        where: { id: data.itemId },
        data: { onHand: { decrement: data.quantity } },
      }),
      db.stockMovement.create({
        data: {
          itemId: data.itemId,
          type: 'OUT',
          quantity: data.quantity,
          date: data.date,
          note: data.note,
        },
      }),
      logActivity({ villaId: user.villaId!, staffName: user.name, action: `Stock Out: ${item.name} ×${data.quantity}`, module: 'Inventory' }),
    ])
    revalidatePath('/inventory')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('stockOut error:', error)
    return { success: false, message: 'Gagal mengurangi stok. Coba lagi.' }
  }
}

export async function createInventoryItem(data: {
  sku: string
  name: string
  category: 'LINEN' | 'AMENITY' | 'FNB' | 'MAINTENANCE'
  unit: string
  onHand: number
  minLevel: number
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.inventoryItem.create({
      data: { ...data, villaId: user.villaId! },
    })
    await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Added inventory item: ${data.name}`, module: 'Inventory' })
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    console.error('createInventoryItem error:', error)
    return { success: false, message: 'Gagal menyimpan item. Coba lagi.' }
  }
}

export async function updateInventoryItem(
  id: string,
  data: {
    sku: string
    name: string
    category: 'LINEN' | 'AMENITY' | 'FNB' | 'MAINTENANCE'
    unit: string
    minLevel: number
  }
) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.inventoryItem.update({ where: { id }, data })
    revalidatePath('/inventory')
    return { success: true }
  } catch (error) {
    console.error('updateInventoryItem error:', error)
    return { success: false, message: 'Gagal memperbarui item. Coba lagi.' }
  }
}
