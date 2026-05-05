'use client'

import { useState } from 'react'
import { MoreHorizontal, Search, Plus, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import {
  StockInModal,
  StockOutModal,
  NewItemModal,
  StockHistorySheet,
  type InventoryItem,
} from './inventory-modals'

const CAT_LABEL: Record<string, string> = {
  LINEN: 'Linen',
  AMENITY: 'Amenity',
  FNB: 'F&B',
  MAINTENANCE: 'Maintenance',
}

const FILTER_TABS = ['All', 'Linen', 'Amenity', 'F&B', 'Maintenance'] as const
type FilterTab = (typeof FILTER_TABS)[number]

const TAB_TO_CAT: Record<string, string> = {
  Linen: 'LINEN',
  Amenity: 'AMENITY',
  'F&B': 'FNB',
  Maintenance: 'MAINTENANCE',
}

interface RecentStats {
  inCount: number
  outCount: number
}

interface Props {
  items: InventoryItem[]
  recentStats: RecentStats
}

function StockBar({ onHand, minLevel }: { onHand: number; minLevel: number }) {
  const pct = minLevel > 0 ? Math.min(100, (onHand / minLevel) * 100) : 100
  const isLow = onHand < minLevel
  return (
    <div className="space-y-1 min-w-[100px]">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', isLow ? 'bg-red-500' : 'bg-green-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={cn(
          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
          isLow
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        )}
      >
        {isLow ? 'Low' : 'OK'}
      </span>
    </div>
  )
}

export function InventoryClient({ items, recentStats }: Props) {
  const [tab, setTab] = useState<FilterTab>('All')
  const [search, setSearch] = useState('')
  const [stockInOpen, setStockInOpen] = useState(false)
  const [stockOutOpen, setStockOutOpen] = useState(false)
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null)
  const [defaultItemId, setDefaultItemId] = useState<string | undefined>()

  function openStockIn(itemId?: string) {
    setDefaultItemId(itemId)
    setStockInOpen(true)
  }
  function openStockOut(itemId?: string) {
    setDefaultItemId(itemId)
    setStockOutOpen(true)
  }

  const filtered = items.filter((item) => {
    const matchTab = tab === 'All' || item.category === TAB_TO_CAT[tab]
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  // Stats
  const lowStockCount = items.filter((i) => i.onHand < i.minLevel).length
  const totalUnits = items.reduce((s, i) => s + i.onHand, 0)
  const categoryCount = new Set(items.map((i) => i.category)).size

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Items tracked</p>
            <p className="mt-2 text-3xl font-bold">{items.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">across {categoryCount} categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total units</p>
            <p className="mt-2 text-3xl font-bold">{totalUnits.toLocaleString()}</p>
            <p className="mt-1 text-xs text-muted-foreground">in stock across all items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Below minimum</p>
            <p className={cn('mt-2 text-3xl font-bold', lowStockCount > 0 ? 'text-red-600' : 'text-green-600')}>
              {lowStockCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lowStockCount === 0 ? 'All stock levels healthy' : 'items need restocking'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Last 7 days</p>
            <p className="mt-2 text-3xl font-bold">
              <span className="text-green-600">+{recentStats.inCount}</span>
              <span className="mx-1 text-muted-foreground text-xl">/</span>
              <span className="text-red-600">-{recentStats.outCount}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">IN / OUT movements</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter + search + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          {FILTER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
                tab === t ? 'bg-background text-foreground shadow' : 'hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items or SKU..."
            className="h-8 w-48 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
            onClick={() => openStockIn()}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" /> Stock In
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
            onClick={() => openStockOut()}
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" /> Stock Out
          </Button>
          <Button
            size="sm"
            className="h-8 bg-primary text-white hover:bg-[#C8911A]"
            onClick={() => setNewItemOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New item
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">On hand</TableHead>
              <TableHead className="text-center">Min level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((item) => {
              const isLow = item.onHand < item.minLevel
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">{item.sku}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{CAT_LABEL[item.category] ?? item.category}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn('font-semibold', isLow ? 'text-red-600' : 'text-foreground')}>
                      {isLow && <AlertTriangle className="mr-1 inline h-3 w-3 text-red-500" />}
                      {item.onHand} {item.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {item.minLevel} {item.unit}
                  </TableCell>
                  <TableCell>
                    <StockBar onHand={item.onHand} minLevel={item.minLevel} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openStockIn(item.id)}>
                          Stock In
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openStockOut(item.id)}>
                          Stock Out
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setHistoryItem(item)}>
                          View history
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <StockInModal
        open={stockInOpen}
        onClose={() => setStockInOpen(false)}
        items={items}
        defaultItemId={defaultItemId}
      />
      <StockOutModal
        open={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        items={items}
        defaultItemId={defaultItemId}
      />
      <NewItemModal open={newItemOpen} onClose={() => setNewItemOpen(false)} />
      <StockHistorySheet
        open={!!historyItem}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
      />
    </div>
  )
}
