'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { stockIn, stockOut, createInventoryItem } from '@/app/actions/inventory'

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  onHand: number
  minLevel: number
  unit: string
  movements: Movement[]
}

export interface Movement {
  id: string
  type: string
  quantity: number
  date: string
  note: string | null
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─── Stock In ──────────────────────────────────────────────────────────────

const stockInSchema = z.object({
  itemId: z.string().min(1, 'Select an item'),
  quantity: z.number().min(1, 'Must be at least 1'),
  date: z.string().min(1, 'Required'),
  note: z.string().optional(),
})
type StockInValues = z.infer<typeof stockInSchema>

export function StockInModal({
  open,
  onClose,
  items,
  defaultItemId,
}: {
  open: boolean
  onClose: () => void
  items: InventoryItem[]
  defaultItemId?: string
}) {
  const [pending, startTransition] = useTransition()
  const form = useForm<StockInValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: { itemId: '', quantity: 1, date: today(), note: '' },
  })

  useEffect(() => {
    if (open) form.reset({ itemId: defaultItemId ?? '', quantity: 1, date: today(), note: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: StockInValues) {
    startTransition(async () => {
      await stockIn({
        itemId: data.itemId,
        quantity: data.quantity,
        date: new Date(data.date),
        note: data.note || undefined,
      })
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Stock In</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Controller
              name="itemId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.itemId && (
              <p className="text-xs text-destructive">{form.formState.errors.itemId.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} {...form.register('quantity', { valueAsNumber: true })} />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...form.register('date')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Note</Label>
            <Input placeholder="Optional note..." {...form.register('note')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {pending ? 'Saving...' : 'Confirm Stock In'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stock Out ─────────────────────────────────────────────────────────────

const stockOutSchema = z.object({
  itemId: z.string().min(1, 'Select an item'),
  quantity: z.number().min(1, 'Must be at least 1'),
  date: z.string().min(1, 'Required'),
  note: z.string().optional(),
})
type StockOutValues = z.infer<typeof stockOutSchema>

export function StockOutModal({
  open,
  onClose,
  items,
  defaultItemId,
}: {
  open: boolean
  onClose: () => void
  items: InventoryItem[]
  defaultItemId?: string
}) {
  const [pending, startTransition] = useTransition()
  const form = useForm<StockOutValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: { itemId: '', quantity: 1, date: today(), note: '' },
  })

  useEffect(() => {
    if (open) form.reset({ itemId: defaultItemId ?? '', quantity: 1, date: today(), note: '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: StockOutValues) {
    startTransition(async () => {
      try {
        await stockOut({
          itemId: data.itemId,
          quantity: data.quantity,
          date: new Date(data.date),
          note: data.note || undefined,
        })
        onClose()
      } catch (e: unknown) {
        form.setError('quantity', {
          message: e instanceof Error ? e.message : 'Error processing stock out',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Stock Out</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Item</Label>
            <Controller
              name="itemId"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} — {i.onHand} {i.unit} on hand
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.itemId && (
              <p className="text-xs text-destructive">{form.formState.errors.itemId.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} {...form.register('quantity', { valueAsNumber: true })} />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...form.register('date')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Note / reason</Label>
            <Input placeholder="Optional reason..." {...form.register('note')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending} variant="destructive">
              {pending ? 'Saving...' : 'Confirm Stock Out'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── New Item ──────────────────────────────────────────────────────────────

const CATEGORIES = ['LINEN', 'AMENITY', 'FNB', 'MAINTENANCE'] as const
const CATEGORY_LABEL: Record<string, string> = {
  LINEN: 'Linen',
  AMENITY: 'Amenity',
  FNB: 'F&B',
  MAINTENANCE: 'Maintenance',
}

const newItemSchema = z.object({
  sku: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  category: z.enum(CATEGORIES),
  unit: z.string().min(1, 'Required'),
  onHand: z.number().min(0),
  minLevel: z.number().min(0),
})
type NewItemValues = z.infer<typeof newItemSchema>

function genSku() {
  return 'SKU-' + Math.random().toString(36).slice(2, 6).toUpperCase()
}

export function NewItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const form = useForm<NewItemValues>({
    resolver: zodResolver(newItemSchema),
    defaultValues: { sku: genSku(), name: '', category: 'LINEN', unit: 'pcs', onHand: 0, minLevel: 0 },
  })

  useEffect(() => {
    if (open) form.reset({ sku: genSku(), name: '', category: 'LINEN', unit: 'pcs', onHand: 0, minLevel: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: NewItemValues) {
    startTransition(async () => {
      await createInventoryItem(data)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New inventory item</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input {...form.register('sku')} />
              {form.formState.errors.sku && (
                <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input placeholder="pcs, rolls, L..." {...form.register('unit')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="Item name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>On hand (initial)</Label>
              <Input type="number" min={0} {...form.register('onHand', { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Min level</Label>
              <Input type="number" min={0} {...form.register('minLevel', { valueAsNumber: true })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stock History Sheet ───────────────────────────────────────────────────

export function StockHistorySheet({
  open,
  onClose,
  item,
}: {
  open: boolean
  onClose: () => void
  item: InventoryItem | null
}) {
  if (!item) return null
  const sorted = [...item.movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="mb-5">
          <SheetTitle>Stock history — {item.name}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {item.sku} · Current: {item.onHand} {item.unit}
          </p>
        </SheetHeader>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((mv) => (
              <div key={mv.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                    mv.type === 'IN'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  )}
                >
                  {mv.type === 'IN' ? '+' : '-'}
                  {mv.quantity}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">
                    {new Date(mv.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {mv.note && <p className="mt-0.5 text-sm">{mv.note}</p>}
                </div>
                <span
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    mv.type === 'IN' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {mv.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
