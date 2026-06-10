export const revalidate = 300

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { SOPClient } from '@/components/sop/sop-client'
import { getSessionUser } from '@/lib/getSession'

export default async function SopPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  const villaId = user.villaId

  const sopsRaw = await db.sOP.findMany({
    where: { villaId },
    orderBy: { updatedAt: 'desc' },
  })

  const sops = sopsRaw.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category as string,
    estimatedMinutes: s.estimatedMinutes,
    steps: (s.steps as { step: number; text: string }[]) ?? [],
    updatedAt: s.updatedAt.toISOString(),
  }))

  return <SOPClient sops={sops} />
}
