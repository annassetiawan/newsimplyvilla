'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

type SOPCategory = 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'INVENTORY' | 'SAFETY'

async function getVillaId() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user.villaId
}

export async function createSOP(data: {
  title: string
  category: SOPCategory
  estimatedMinutes: number
  steps: { step: number; text: string }[]
}) {
  const villaId = await getVillaId()
  await db.sOP.create({
    data: {
      villaId,
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
