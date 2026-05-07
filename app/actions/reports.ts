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

export async function createExpense(data: {
  date: Date
  description: string
  category: string
  amount: number
  paymentStatus: 'PAID' | 'UNPAID'
}) {
  const villaId = await getVillaId()
  await db.transaction.create({
    data: {
      villaId,
      date: data.date,
      type: 'EXPENSE',
      description: data.description,
      category: data.category,
      amount: data.amount,
      paymentStatus: data.paymentStatus,
    },
  })
  revalidatePath('/reports')
}
