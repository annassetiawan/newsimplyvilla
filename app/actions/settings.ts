'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

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
