'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BusinessType } from '../types'

interface Props {
  businesses: BusinessType[]
  value: string
  onChange: (id: string) => void
}

export function BusinessSelector({ businesses, value, onChange }: Props) {
  const active = businesses.filter((b) => b.status === 'ACTIVE')

  return (
    <div className="flex items-center gap-3">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">Unit Bisnis</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-52 text-sm">
          <SelectValue placeholder="Pilih bisnis..." />
        </SelectTrigger>
        <SelectContent>
          {active.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Tidak ada bisnis aktif</p>
          ) : (
            active.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
                <span className="ml-2 text-muted-foreground text-xs">· {b.type}</span>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
