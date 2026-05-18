'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { deleteBusiness } from '@/app/actions/business'
import { BusinessModal } from './business-modal'
import { ItemList } from './item-list'
import type { BusinessType } from '../types'

interface Props {
  initialBusinesses: BusinessType[]
}

export default function BusinessManage({ initialBusinesses }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessType | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(biz: BusinessType) {
    setEditing(biz)
    setModalOpen(true)
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => (prev === id ? null : id))
  }

  function handleDelete(biz: BusinessType) {
    if (!confirm(`Hapus bisnis "${biz.name}"? Semua item dan transaksi terkait akan ikut terhapus.`))
      return
    setDeletingId(biz.id)
    startTransition(async () => {
      const result = await deleteBusiness(biz.id)
      setDeletingId(null)
      if (result?.success === false) toast.error(result.message)
      else toast.success('Bisnis dihapus')
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialBusinesses.length} unit bisnis
        </p>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Tambah Bisnis
        </Button>
      </div>

      {/* Empty state */}
      {initialBusinesses.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Store className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Belum ada unit bisnis</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tambahkan bisnis pertama (cafe, laundry, spa, dll).
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah Bisnis
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {initialBusinesses.map((biz, idx) => (
            <div key={biz.id}>
              {/* ── Business row ── */}
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30',
                  idx !== 0 && 'border-t border-border'
                )}
              >
                {/* Status dot */}
                <div
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    biz.status === 'ACTIVE' ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'
                  )}
                />

                {/* Name + type */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{biz.name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {biz.type}
                    </span>
                  </div>
                  {biz.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {biz.description}
                    </p>
                  )}
                </div>

                {/* Item count */}
                <span className="shrink-0 text-xs text-muted-foreground">
                  {biz.items.length} item
                </span>

                {/* Status label */}
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    biz.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {biz.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => openEdit(biz)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    disabled={deletingId === biz.id}
                    onClick={() => handleDelete(biz)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => toggleExpand(biz.id)}
                  >
                    {expanded === biz.id ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Expanded item list ── */}
              {expanded === biz.id && (
                <div className="border-t border-border bg-muted/20 px-4 py-4">
                  <ItemList businessId={biz.id} items={biz.items} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BusinessModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  )
}
