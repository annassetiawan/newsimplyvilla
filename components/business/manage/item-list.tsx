'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { deleteBusinessItem } from '@/app/actions/business'
import { ItemModal } from './item-modal'
import type { BusinessItemType } from '../types'
import Image from 'next/image'

interface Props {
  businessId: string
  items: BusinessItemType[]
}

export function ItemList({ businessId, items }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BusinessItemType | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(item: BusinessItemType) {
    setEditing(item)
    setModalOpen(true)
  }

  function handleDelete(item: BusinessItemType) {
    if (!confirm(`Hapus item "${item.name}"?`)) return
    setDeletingId(item.id)
    startTransition(async () => {
      const result = await deleteBusinessItem(item.id)
      setDeletingId(null)
      if (result?.success === false) toast.error(result.message)
      else toast.success('Item dihapus')
    })
  }

  return (
    <div className="space-y-2.5">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={openCreate}>
          <Plus className="h-3 w-3" />
          Tambah Item
        </Button>
      </div>

      {/* Item rows */}
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Belum ada item. Tambah item pertama.
        </p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
            >
              {/* Thumbnail */}
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                {item.photo ? (
                  <Image
                    src={item.photo}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageOff className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Name + category */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">{item.category}</p>
              </div>

              {/* Price */}
              <span className="shrink-0 text-sm font-medium tabular-nums">
                Rp{item.price.toLocaleString('id-ID')}
              </span>

              {/* Stock */}
              <div className="w-16 shrink-0 text-right">
                {item.stock === 0 ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    Habis
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      item.stock <= 3
                        ? 'font-semibold text-orange-500'
                        : 'text-muted-foreground'
                    )}
                  >
                    Stok {item.stock}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => openEdit(item)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemModal
        key={modalOpen ? (editing?.id ?? 'new') : 'closed'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        businessId={businessId}
        editing={editing}
      />
    </div>
  )
}
