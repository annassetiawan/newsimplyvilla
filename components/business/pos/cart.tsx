'use client'

import { useTransition } from 'react'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createPosTransaction } from '@/app/actions/pos'
import type { CartItem } from '@/app/actions/pos'

export interface CartEntry {
  itemId: string
  name: string
  price: number
  qty: number
  subtotal: number
}

interface Props {
  businessId: string
  cart: CartEntry[]
  paymentMethod: 'CASH' | 'TRANSFER'
  note: string
  onUpdateQty: (itemId: string, delta: number) => void
  onRemove: (itemId: string) => void
  onPaymentMethodChange: (method: 'CASH' | 'TRANSFER') => void
  onNoteChange: (note: string) => void
  onClearCart: () => void
}

export function Cart({
  businessId,
  cart,
  paymentMethod,
  note,
  onUpdateQty,
  onRemove,
  onPaymentMethodChange,
  onNoteChange,
  onClearCart,
}: Props) {
  const [pending, startTransition] = useTransition()
  const total = cart.reduce((s, c) => s + c.subtotal, 0)

  function handleCheckout() {
    if (cart.length === 0) return
    startTransition(async () => {
      const items: CartItem[] = cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        price: c.price,
        qty: c.qty,
        subtotal: c.subtotal,
      }))
      const result = await createPosTransaction({
        businessId,
        items,
        total,
        paymentMethod,
        note: note || undefined,
      })
      if (result?.success === false) {
        toast.error(result.message)
        return
      }
      toast.success('Transaksi berhasil!')
      onClearCart()
    })
  }

  if (cart.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
        <ShoppingCart className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Keranjang kosong.</p>
        <p className="text-xs text-muted-foreground">Pilih item dari katalog.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Items — scrollable, min-h-0 lets flex shrink below content size */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {cart.map((entry) => (
          <div
            key={entry.itemId}
            className="flex items-center gap-2 rounded-lg border border-border p-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                Rp{entry.price.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onUpdateQty(entry.itemId, -1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm font-medium">{entry.qty}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-6 w-6"
                onClick={() => onUpdateQty(entry.itemId, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="w-20 shrink-0 text-right text-sm font-semibold">
              Rp{entry.subtotal.toLocaleString('id-ID')}
            </p>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onRemove(entry.itemId)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-bold">Rp{total.toLocaleString('id-ID')}</span>
        </div>

        {/* Payment method */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Metode Pembayaran</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['CASH', 'TRANSFER'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onPaymentMethodChange(method)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  paymentMethod === method
                    ? 'border-neutral-800 bg-neutral-800 text-white dark:border-neutral-200 dark:bg-neutral-200 dark:text-neutral-900'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {method === 'CASH' ? 'Tunai' : 'Transfer'}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Catatan (opsional)</Label>
          <Textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Catatan transaksi..."
            rows={2}
            className="resize-none text-sm"
          />
        </div>

        <Button
          className="w-full"
          disabled={pending || cart.length === 0}
          onClick={handleCheckout}
        >
          {pending ? 'Memproses...' : 'Konfirmasi Transaksi'}
        </Button>
      </div>
    </div>
  )
}
