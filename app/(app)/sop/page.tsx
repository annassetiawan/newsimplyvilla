export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { SOPClient } from '@/components/sop/sop-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function SopPage() {
  const sopsRaw = await db.sOP.findMany({
    where: { villaId: VILLA_ID },
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
