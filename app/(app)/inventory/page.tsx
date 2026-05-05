export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { InventoryClient } from '@/components/inventory/inventory-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function InventoryPage() {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [itemsRaw, recentMovements] = await Promise.all([
    db.inventoryItem.findMany({
      where: { villaId: VILLA_ID },
      orderBy: { name: 'asc' },
      include: { movements: { orderBy: { date: 'desc' } } },
    }),
    db.stockMovement.findMany({
      where: { item: { villaId: VILLA_ID }, date: { gte: sevenDaysAgo } },
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
