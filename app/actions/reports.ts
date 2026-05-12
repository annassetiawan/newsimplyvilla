'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

export async function createExpense(data: {
  date: Date
  description: string
  category: string
  amount: number
  paymentStatus: 'PAID' | 'UNPAID'
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  try {
    await db.transaction.create({
      data: {
        villaId: user.villaId,
        date: data.date,
        type: 'EXPENSE',
        description: data.description,
        category: data.category,
        amount: data.amount,
        paymentStatus: data.paymentStatus,
      },
    })
    await logActivity({
      villaId: user.villaId,
      staffName: user.name,
      action: `Recorded expense: ${data.description} Rp ${data.amount.toLocaleString('id-ID')}`,
      module: 'Reports',
    })
    revalidatePath('/reports')
    return { success: true }
  } catch (error) {
    console.error('createExpense error:', error)
    return { success: false, message: 'Gagal menyimpan pengeluaran. Coba lagi.' }
  }
}
