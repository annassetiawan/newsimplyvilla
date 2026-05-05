'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

export async function createExpense(data: {
  date: Date
  description: string
  category: string
  amount: number
  paymentStatus: 'PAID' | 'UNPAID'
}) {
  await db.transaction.create({
    data: {
      villaId: VILLA_ID,
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
