'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

export type CartItem = {
  itemId: string
  name: string
  price: number
  qty: number
  subtotal: number
}

export async function createPosTransaction(data: {
  businessId: string
  items: CartItem[]
  total: number
  paymentMethod: 'CASH' | 'TRANSFER'
  note?: string
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    // Deduct stock for each item (independent rows, safe to run concurrently)
    await Promise.all(
      data.items.map((item) =>
        db.businessItem.updateMany({
          where: { id: item.itemId, villaId: user.villaId! },
          data: { stock: { decrement: item.qty } },
        })
      )
    )

    await db.posTransaction.create({
      data: {
        businessId: data.businessId,
        items: data.items,
        total: data.total,
        paymentMethod: data.paymentMethod,
        note: data.note,
        villaId: user.villaId!,
      },
    })

    await logActivity({
      villaId: user.villaId!,
      staffName: user.name,
      action: `Transaksi POS: Rp${data.total.toLocaleString('id-ID')} (${data.paymentMethod})`,
      module: 'Business',
    })

    revalidatePath('/business')
    return { success: true }
  } catch (error) {
    console.error('createPosTransaction error:', error)
    return { success: false, message: 'Gagal memproses transaksi. Coba lagi.' }
  }
}

export async function getPosTransactions(businessId: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  return db.posTransaction.findMany({
    where: { businessId, villaId: user.villaId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
