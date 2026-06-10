import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { db } from '@/lib/db'
import { VillaTable } from '@/components/admin/villa-table'

export default async function AdminVillasPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const villas = await db.villa.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      subscription: true,
      staff: { where: { role: 'OWNER' }, take: 1 },
    },
  })

  const serialized = villas.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    email: v.email,
    ownerName: v.staff[0]?.name ?? null,
    plan: v.subscription?.plan ?? 'FREE',
    status: v.subscription?.status ?? 'ACTIVE',
    createdAt: v.subscription?.createdAt?.toISOString() ?? new Date().toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Villas</h1>
        <p className="text-sm text-muted-foreground">
          Manage all villas and their subscription plans.
        </p>
      </div>

      <VillaTable villas={serialized} />
    </div>
  )
}
