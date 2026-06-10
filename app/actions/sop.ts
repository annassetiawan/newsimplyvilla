'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { logActivity } from '@/lib/activity-log'

type SOPCategory = 'FRONT_DESK' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'INVENTORY' | 'SAFETY'


export async function createSOP(data: {
  title: string
  category: SOPCategory
  estimatedMinutes: number
  steps: { step: number; text: string }[]
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.sOP.create({
      data: {
        villaId: user.villaId!,
        title: data.title,
        category: data.category,
        estimatedMinutes: data.estimatedMinutes,
        steps: data.steps,
      },
    })
    await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Added SOP: ${data.title}`, module: 'SOP' })
    revalidatePath('/sop')
    return { success: true }
  } catch (error) {
    console.error('createSOP error:', error)
    return { success: false, message: 'Gagal menyimpan SOP. Coba lagi.' }
  }
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
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    await db.sOP.update({
      where: { id },
      data: {
        title: data.title,
        category: data.category,
        estimatedMinutes: data.estimatedMinutes,
        steps: data.steps,
      },
    })
    await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Updated SOP: ${data.title}`, module: 'SOP' })
    revalidatePath('/sop')
    return { success: true }
  } catch (error) {
    console.error('updateSOP error:', error)
    return { success: false, message: 'Gagal memperbarui SOP. Coba lagi.' }
  }
}

export async function deleteSOP(id: string) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  try {
    const sop = await db.sOP.findUnique({ where: { id } })
    await db.sOP.delete({ where: { id } })
    if (sop) await logActivity({ villaId: user.villaId!, staffName: user.name, action: `Deleted SOP: ${sop.title}`, module: 'SOP' })
    revalidatePath('/sop')
    return { success: true }
  } catch (error) {
    console.error('deleteSOP error:', error)
    return { success: false, message: 'Gagal menghapus SOP. Coba lagi.' }
  }
}
