'use client'

import { useEffect, useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, History } from 'lucide-react'
import { getPosTransactions } from '@/app/actions/pos'
import { cn } from '@/lib/utils'

interface TxItem {
  itemId: string
  name: string
  price: number
  qty: number
  subtotal: number
}

interface Transaction {
  id: string
  total: number
  paymentMethod: string
  note: string | null
  createdAt: string
  items: TxItem[]
}

interface Props {
  businessId: string
  refreshKey: number
}

export function TransactionHistory({ businessId, refreshKey }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!businessId) return
    startTransition(async () => {
      const raw = await getPosTransactions(businessId)
      setTransactions(
        raw.map((tx) => ({
          id: tx.id,
          total: tx.total,
          paymentMethod: tx.paymentMethod,
          note: tx.note,
          createdAt: tx.createdAt.toISOString(),
          items: tx.items as unknown as TxItem[],
        }))
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, refreshKey])

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <History className="h-6 w-6 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div key={tx.id} className="overflow-hidden rounded-lg border border-border">
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            onClick={() => setExpanded((prev) => (prev === tx.id ? null : tx.id))}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Rp{tx.total.toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {new Date(tx.createdAt).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <span className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              tx.paymentMethod === 'CASH'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            )}>
              {tx.paymentMethod === 'CASH' ? 'Tunai' : 'Transfer'}
            </span>
            {expanded === tx.id ? (
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </button>

          {expanded === tx.id && (
            <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
              {tx.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-medium">Rp{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
              {tx.note && (
                <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                  Catatan: {tx.note}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
