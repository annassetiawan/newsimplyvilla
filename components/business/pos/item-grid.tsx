'use client'

import { ImageOff, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { BusinessItemType } from '../types'
import Image from 'next/image'

interface Props {
  items: BusinessItemType[]
  onAdd: (item: BusinessItemType) => void
}

export function ItemGrid({ items, onAdd }: Props) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Belum ada item di bisnis ini.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const outOfStock = item.stock === 0
        return (
          <button type="button"
            key={item.id}
            disabled={outOfStock}
            onClick={() => onAdd(item)}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-all',
              outOfStock
                ? 'cursor-not-allowed opacity-50'
                : 'hover:border-neutral-400 hover:shadow-sm active:scale-[0.98]'
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-muted">
              {item.photo ? (
                <Image
                  src={item.photo}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageOff className="h-6 w-6 text-muted-foreground/30" />
                </div>
              )}
              {outOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Badge variant="destructive" className="text-[10px]">
                    Habis
                  </Badge>
                </div>
              )}
              {!outOfStock && (
                <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-white shadow">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-0.5 p-2.5">
              <p className="line-clamp-2 text-[13px] font-medium leading-tight">{item.name}</p>
              <p className="text-[11px] text-muted-foreground">{item.category}</p>
              <p className="mt-1 text-sm font-semibold">
                Rp{item.price.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-muted-foreground">Stok: {item.stock}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
