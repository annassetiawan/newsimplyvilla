'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronRight, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteRatePlan, toggleRatePlanActive } from '@/app/actions/ratePlan'
import { RatePlanModal } from './RatePlanModal'
import type { RatePlanData } from './RoomDetailClient'

function fmtRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

interface Props {
  roomId: string
  ratePlans: RatePlanData[]
  onRatePlansChange: (plans: RatePlanData[]) => void
}

export function RatePlanList({ roomId, ratePlans, onRatePlansChange }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RatePlanData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(plan: RatePlanData) {
    setEditing(plan)
    setModalOpen(true)
  }

  function handleSaved(plan: RatePlanData) {
    if (editing) {
      onRatePlansChange(ratePlans.map((p) => (p.id === plan.id ? plan : p)))
    } else {
      onRatePlansChange([...ratePlans, plan])
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus rate plan ini? Semua data harga dan restriksi terkait juga akan dihapus.')) return
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteRatePlan(id)
      if (res.success) {
        onRatePlansChange(ratePlans.filter((p) => p.id !== id))
        toast.success('Rate plan dihapus')
      } else {
        toast.error('Gagal menghapus rate plan')
      }
      setDeletingId(null)
    })
  }

  function handleToggle(plan: RatePlanData) {
    startTransition(async () => {
      const res = await toggleRatePlanActive(plan.id, !plan.isActive)
      if (res.success) {
        onRatePlansChange(
          ratePlans.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p))
        )
      } else {
        toast.error('Gagal mengubah status')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Rate Plans</h2>
          <p className="text-sm text-muted-foreground">
            Definisikan tipe-tipe harga untuk kamar ini.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah Rate Plan
        </Button>
      </div>

      {ratePlans.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Belum ada rate plan"
          description="Tambah rate plan untuk menentukan harga kamar ini."
          actionLabel="+ Tambah Rate Plan"
          onAction={openAdd}
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Harga Dasar
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                  Sell Mode
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Max Persons
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                  Refundable
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ratePlans.map((plan) => (
                <tr key={plan.id} className="group hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/rooms/${plan.roomId}/rate-plans/${plan.id}`}
                      className="font-medium text-foreground hover:underline flex items-center gap-1"
                    >
                      {plan.name}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {fmtRp(plan.basePrice)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                    {plan.sellMode === 'per_room' ? 'Per Kamar' : 'Per Orang'}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell">
                    {plan.maxPersons}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                        plan.isRefundable
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {plan.isRefundable ? 'Ya' : 'Tidak'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggle(plan)}
                      disabled={isPending}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
                        plan.isActive ? 'bg-neutral-800' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                          plan.isActive ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(plan)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        disabled={deletingId === plan.id}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RatePlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        roomId={roomId}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  )
}
