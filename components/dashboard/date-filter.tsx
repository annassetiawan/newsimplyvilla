'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDays, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PRESETS, getDateRange, type Preset } from '@/lib/dashboard-date'

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtRange(from: Date, to: Date) {
  if (from.getFullYear() === to.getFullYear()) {
    return `${fmtShort(from)} – ${to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  return `${from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function DashboardDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preset = (searchParams.get('preset') ?? 'this_month') as Preset

  const { from, to } = getDateRange(preset)
  const currentLabel = PRESETS.find((p) => p.value === preset)?.label ?? 'This month'

  function select(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('preset', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">{fmtRange(from, to)}</span>
          <span className="sm:hidden">{currentLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {PRESETS.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => select(p.value)}
            className="flex items-center justify-between"
          >
            {p.label}
            {preset === p.value && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
