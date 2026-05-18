import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { ProGate } from '@/components/ProGate'
import BusinessClient from '@/components/business/business-client'

export default async function BusinessPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const businesses = await db.business.findMany({
    where: { villaId: user.villaId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    description: b.description,
    status: b.status as 'ACTIVE' | 'INACTIVE',
    createdAt: b.createdAt.toISOString(),
    items: b.items.map((item) => ({
      id: item.id,
      businessId: item.businessId,
      name: item.name,
      price: item.price,
      category: item.category,
      photo: item.photo,
      stock: item.stock,
      villaId: item.villaId,
    })),
  }))

  return (
    <ProGate
      feature="Business"
      description="Kelola unit bisnis tambahan villa (cafe, laundry, spa, dll) dan transaksi penjualan via POS."
    >
      <BusinessClient businesses={serialized} villaId={user.villaId} />
    </ProGate>
  )
}
