export const revalidate = 60

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { InventoryClient } from '@/components/inventory/inventory-client'
import { getSessionUser } from '@/lib/getSession'

export default async function InventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [itemsRaw, recentMovements] = await Promise.all([
    db.inventoryItem.findMany({
      where: { villaId },
      orderBy: { name: 'asc' },
      include: { movements: { orderBy: { date: 'desc' }, take: 20 } },
    }),
    db.stockMovement.findMany({
      where: { item: { villaId }, date: { gte: sevenDaysAgo } },
    }),
  ])

  const items = itemsRaw.map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category as string,
    onHand: item.onHand,
    minLevel: item.minLevel,
    unit: item.unit,
    movements: item.movements.map((m) => ({
      id: m.id,
      type: m.type as string,
      quantity: m.quantity,
      date: m.date.toISOString(),
      note: m.note,
    })),
  }))

  const recentStats = {
    inCount: recentMovements
      .filter((m) => m.type === 'IN')
      .reduce((s, m) => s + m.quantity, 0),
    outCount: recentMovements
      .filter((m) => m.type === 'OUT')
      .reduce((s, m) => s + m.quantity, 0),
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Track stock levels, movements, and restocking alerts.
        </p>
      </div>
      <InventoryClient items={items} recentStats={recentStats} />
    </div>
  )
}
