'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

const VILLA_ID = 'villa-senja-ubud'

type SOPCategory = 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'INVENTORY' | 'SAFETY'

export async function createSOP(data: {
  title: string
  category: SOPCategory
  estimatedMinutes: number
  steps: { step: number; text: string }[]
}) {
  await db.sOP.create({
    data: {
      villaId: VILLA_ID,
      title: data.title,
      category: data.category,
      estimatedMinutes: data.estimatedMinutes,
      steps: data.steps,
    },
  })
  revalidatePath('/sop')
}

export async function updateSOP(
  id: string,
  data: {
    title: string
    category: SOPCategory
    estimatedMinutes: number
    steps: { step: number; text: string }[]
  }
) {
  await db.sOP.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      estimatedMinutes: data.estimatedMinutes,
      steps: data.steps,
    },
  })
  revalidatePath('/sop')
}

export async function deleteSOP(id: string) {
  await db.sOP.delete({ where: { id } })
  revalidatePath('/sop')
}
