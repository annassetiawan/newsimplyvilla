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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SOP</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Standard operating procedures for all villa departments.
        </p>
      </div>
      <SOPClient sops={sops} />
    </div>
  )
}
