'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calcPettyCashBalance, formatRp, MONTH_NAMES_FULL } from '@/lib/finance'
import { deletePettyCash } from '@/app/actions/finance'
import { PettyCashModal } from './petty-cash-modal'
import { EmptyState } from '@/components/ui/EmptyState'

interface PettyCash {
  id: string
  date: string
  description: string
  type: string
  amount: number
  note: string | null
}

interface Props {
  pettyCash: PettyCash[]
}

export function PettyCashTab({ pettyCash }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const balance = calcPettyCashBalance(pettyCash)

  const filtered = filterMonth === 'all'
    ? pettyCash
    : pettyCash.filter((p) => {
        const d = new Date(p.date)
        return `${d.getMonth() + 1}-${d.getFullYear()}` === filterMonth
      })

  // Compute running balance from filtered (oldest first)
  const withBalance = [...filtered].reverse().reduce<(PettyCash & { running: number })[]>((acc, p) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].running : 0
    acc.push({ ...p, running: p.type === 'IN' ? prev + p.amount : prev - p.amount })
    return acc
  }, []).reverse()

  // Build month filter options from data
  const monthOptions = Array.from(
    new Set(pettyCash.map((p) => {
      const d = new Date(p.date)
      return `${d.getMonth() + 1}-${d.getFullYear()}`
    }))
  ).sort((a, b) => {
    const [am, ay] = a.split('-').map(Number)
    const [bm, by] = b.split('-').map(Number)
    return by !== ay ? by - ay : bm - am
  })

  function handleDelete(id: string) {
    startTransition(async () => {
      await deletePettyCash(id)
      toast.success('Transaksi dihapus')
    })
  }

  return (
    <div className="space-y-5">
      {/* Balance card + action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="rounded-xl border border-border bg-background p-5 sm:min-w-[220px]">
          <p className="text-sm text-muted-foreground mb-1">Saldo Petty Cash</p>
          <p className={cn('text-2xl font-bold tabular-nums', balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {formatRp(balance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Dari {pettyCash.length} transaksi</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 h-9 px-3 text-sm self-start"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Transaksi
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="petty-cash-month" className="text-sm text-muted-foreground">Filter bulan:</label>
        <select
          id="petty-cash-month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">Semua</option>
          {monthOptions.map((o) => {
            const [m, y] = o.split('-').map(Number)
            return <option key={o} value={o}>{MONTH_NAMES_FULL[m - 1]} {y}</option>
          })}
        </select>
      </div>

      {/* Table */}
      {withBalance.length === 0 ? (
        <EmptyState
          icon={ArrowDownCircle}
          title="Belum ada transaksi"
          description="Mulai catat pemasukan atau pengeluaran petty cash"
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tanggal</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Keterangan</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Tipe</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Jumlah</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Saldo</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {withBalance.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.description}</p>
                      {p.note && <p className="text-xs text-muted-foreground mt-0.5">{p.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.type === 'IN' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <ArrowUpCircle className="h-3 w-3" /> IN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                          <ArrowDownCircle className="h-3 w-3" /> OUT
                        </span>
                      )}
                    </td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums font-medium',
                      p.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                    )}>
                      {p.type === 'IN' ? '+' : '-'}{formatRp(p.amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatRp(p.running)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button"
                        onClick={() => handleDelete(p.id)}
                        disabled={isPending}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Hapus transaksi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PettyCashModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
