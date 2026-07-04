import { PackageCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/EmptyState'

export interface LowStockItem {
  id: string
  name: string
  onHand: number
  minLevel: number
}

export function LowStockCard({ items }: { items: LowStockItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Low stock alerts</CardTitle>
          {items.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {items.length}
            </span>
          )}
        </div>
        <CardDescription>
          {items.length === 0
            ? 'All stock levels are healthy'
            : `${items.length} items below threshold`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={PackageCheck}
            title="Stok semua aman"
            description="Tidak ada item yang perlu di-restock saat ini."
            iconColor="text-green-500 dark:text-green-400"
            minHeight="min-h-[160px]"
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const pct = Math.min(
                Math.round((item.onHand / item.minLevel) * 100),
                100
              )
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="shrink-0 text-xs">
                      <span className="font-semibold text-foreground">{item.onHand}</span>
                      <span className="text-muted-foreground"> / min {item.minLevel}</span>
                    </p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <button type="button" className="mt-1 w-full text-center text-xs font-medium text-primary hover:underline">
              Reorder all
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
