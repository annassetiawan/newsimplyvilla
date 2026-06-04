'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { generateSlug } from '@/lib/utils'
import { logActivity } from '@/lib/activity-log'

export async function getActivityLog() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const logs = await db.activityLog.findMany({
    where: { villaId: user.villaId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    module: l.module,
    staffName: l.staffName,
    createdAt: l.createdAt.toISOString(),
  }))
}

export async function updateVillaProfile(data: {
  name: string
  description?: string
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  try {
    await db.villa.update({
      where: { id: user.villaId },
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        description: data.description || null,
      },
    })

    await logActivity({
      villaId: user.villaId,
      staffName: user.name,
      action: `Updated villa profile: ${data.name}`,
      module: 'Settings',
    })

    revalidatePath('/settings')
    revalidatePath('/v')
    return { success: true }
  } catch (error) {
    console.error('updateVillaProfile error:', error)
    return { success: false, message: 'Gagal menyimpan profil villa.' }
  }
}
