'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPriceCalendar } from '@/app/actions/ratePlan'
import { PriceOverrideModal } from './PriceOverrideModal'
import type { PriceOverrideData } from './RatePlanDetailClient'

const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function fmtRp(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function fmtRpShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`
  return String(n)
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

interface Props {
  ratePlanId: string
  basePrice: number
  initialOverrides: PriceOverrideData[]
  initialYear: number
  initialMonth: number
}

type SelectMode = 'single' | 'range'

export function PriceCalendar({ ratePlanId, basePrice, initialOverrides, initialYear, initialMonth }: Props) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [overrides, setOverrides] = useState<Record<string, PriceOverrideData>>(
    () => Object.fromEntries(initialOverrides.map((o) => [o.date, o]))
  )
  const [isLoading, startNavTransition] = useTransition()

  // Selection state
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [rangeStart, setRangeStart] = useState<string | null>(null)
  const [selectMode, setSelectMode] = useState<SelectMode>('single')
  const [modalOpen, setModalOpen] = useState(false)

  const firstDayOfMonth = new Date(year, month - 1, 1)
  // ISO week: Mon=0 … Sun=6
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()

  function navigate(delta: number) {
    startNavTransition(async () => {
      let ny = year
      let nm = month + delta
      if (nm < 1) { ny--; nm = 12 }
      if (nm > 12) { ny++; nm = 1 }

      const fresh = await getPriceCalendar(ratePlanId, ny, nm)
      setOverrides(
        Object.fromEntries(
          fresh.map((o) => [
            o.date.toISOString().split('T')[0],
            {
              id: o.id,
              ratePlanId: o.ratePlanId,
              date: o.date.toISOString().split('T')[0],
              price: o.price !== null ? Number(o.price) : null,
              isClosed: o.isClosed,
            },
          ])
        )
      )
      setYear(ny)
      setMonth(nm)
      setSelectedDates([])
      setRangeStart(null)
    })
  }

  function handleDayClick(date: string) {
    if (selectMode === 'single') {
      setSelectedDates([date])
      setRangeStart(date)
      setModalOpen(true)
      return
    }

    // Range mode: first click sets start, second click completes range
    if (!rangeStart) {
      setRangeStart(date)
      setSelectedDates([date])
      return
    }

    // Same date clicked twice → treat as single
    if (date === rangeStart) {
      setSelectedDates([date])
      setModalOpen(true)
      return
    }

    const start = rangeStart < date ? rangeStart : date
    const end = rangeStart < date ? date : rangeStart
    const range: string[] = []
    const cur = new Date(start)
    const endD = new Date(end)
    while (cur <= endD) {
      range.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }
    setSelectedDates(range)
    setModalOpen(true)
  }

  function handleSaved(updates: PriceOverrideData[]) {
    setOverrides((prev) => {
      const next = { ...prev }
      for (const u of updates) {
        if (u.price === null && !u.isClosed) {
          delete next[u.date]
        } else {
          next[u.date] = u
        }
      }
      return next
    })
    setSelectedDates([])
    setRangeStart(null)
  }

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isRange = selectedDates.length > 1

  return (
    <div className="space-y-4">
      {/* Calendar controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-base font-semibold min-w-[140px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={() => navigate(1)}
            disabled={isLoading}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode:</span>
          <div className="flex gap-1 rounded-lg border border-border bg-background p-0.5">
            {(['single', 'range'] as SelectMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setSelectMode(m); setSelectedDates([]); setRangeStart(null) }}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  selectMode === m
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'single' ? 'Satu Tanggal' : 'Range'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-background border border-border" />
          Harga dasar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" />
          Harga custom
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800" />
          Tutup
        </span>
      </div>

      {/* Range info */}
      {selectMode === 'range' && rangeStart && selectedDates.length === 1 && !modalOpen && (
        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
          Mulai dari <strong>{rangeStart}</strong> — klik tanggal akhir untuk melengkapi range
        </p>
      )}

      {/* Calendar grid */}
      <div className={cn('rounded-xl border border-border bg-background overflow-hidden', isLoading && 'opacity-60')}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-16 border-b border-r border-border last:border-r-0" />
            }

            const dateStr = isoDate(year, month, day)
            const override = overrides[dateStr]
            const isSelected = selectedDates.includes(dateStr)
            const isClosed = override?.isClosed
            const hasCustomPrice = override && !isClosed && override.price !== null
            const displayPrice = hasCustomPrice ? override!.price! : basePrice

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                className={cn(
                  'relative h-16 p-1.5 text-left border-b border-r border-border last:border-r-0 transition-colors',
                  'hover:ring-2 hover:ring-inset hover:ring-neutral-300 dark:hover:ring-neutral-600',
                  isClosed
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : hasCustomPrice
                    ? 'bg-blue-50 dark:bg-blue-900/10'
                    : 'bg-background',
                  isSelected && 'ring-2 ring-inset ring-neutral-800 dark:ring-neutral-200'
                )}
              >
                <span className={cn(
                  'text-[11px] font-semibold',
                  isClosed ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}>
                  {day}
                </span>
                {isClosed ? (
                  <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-bold uppercase text-red-600 dark:text-red-400">
                    TUTUP
                  </span>
                ) : (
                  <span className={cn(
                    'absolute bottom-1 left-1 right-1 text-center text-[10px] font-medium truncate',
                    hasCustomPrice ? 'text-blue-700 dark:text-blue-300' : 'text-muted-foreground'
                  )}>
                    {fmtRpShort(displayPrice)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {modalOpen && selectedDates.length > 0 && (
        <PriceOverrideModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedDates([]); setRangeStart(null) }}
          ratePlanId={ratePlanId}
          basePrice={basePrice}
          dates={selectedDates}
          existing={selectedDates.length === 1 ? (overrides[selectedDates[0]] ?? null) : null}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
