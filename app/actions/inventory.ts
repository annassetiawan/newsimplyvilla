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

export async function stockIn(data: {
  itemId: string
  quantity: number
  date: Date
  note?: string
}) {
  await db.inventoryItem.update({
    where: { id: data.itemId },
    data: { onHand: { increment: data.quantity } },
  })
  await db.stockMovement.create({
    data: {
      itemId: data.itemId,
      type: 'IN',
      quantity: data.quantity,
      date: data.date,
      note: data.note,
    },
  })
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

export async function stockOut(data: {
  itemId: string
  quantity: number
  date: Date
  note?: string
}) {
  const item = await db.inventoryItem.findUnique({ where: { id: data.itemId } })
  if (!item) throw new Error('Item not found')
  if (data.quantity > item.onHand)
    throw new Error(`Cannot remove ${data.quantity} — only ${item.onHand} in stock`)

  await db.inventoryItem.update({
    where: { id: data.itemId },
    data: { onHand: { decrement: data.quantity } },
  })
  await db.stockMovement.create({
    data: {
      itemId: data.itemId,
      type: 'OUT',
      quantity: data.quantity,
      date: data.date,
      note: data.note,
    },
  })
  revalidatePath('/inventory')
  revalidatePath('/dashboard')
}

export async function createInventoryItem(data: {
  sku: string
  name: string
  category: 'LINEN' | 'AMENITY' | 'FNB' | 'MAINTENANCE'
  unit: string
  onHand: number
  minLevel: number
}) {
  const villaId = await getVillaId()
  await db.inventoryItem.create({
    data: { ...data, villaId },
  })
  revalidatePath('/inventory')
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
  await db.inventoryItem.update({ where: { id }, data })
  revalidatePath('/inventory')
}
