'use client'

import { useState, useRef, useCallback, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRoomCalendar, getVillaCalendar } from '@/app/actions/ratePlan'
import { PriceOverrideModal } from './PriceOverrideModal'

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const WINDOW = 14 // days to show

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function fromISO(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
  if (n >= 1_000) return `${Math.round(n / 1_000)}rb`
  return String(n)
}

function fmtHeaderDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = DAY_LABELS[date.getDay()]
  return { day, date: d, month: MONTH_LABELS[m - 1], iso }
}

function isWeekend(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return dow === 0 || dow === 6
}

function buildDateWindow(startISO: string): string[] {
  const start = fromISO(startISO)
  return Array.from({ length: WINDOW }, (_, i) => toISO(addDays(start, i)))
}

function getDatesInDrag(d: DragState): string[] {
  const a = d.startDate < d.endDate ? d.startDate : d.endDate
  const b = d.startDate < d.endDate ? d.endDate : d.startDate
  const result: string[] = []
  const cur = fromISO(a)
  const end = fromISO(b)
  while (cur <= end) {
    result.push(toISO(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

export interface RatePlanCalendarRow {
  id: string
  name: string
  basePrice: number
  sellMode: string
  maxPersons: number
  isRefundable: boolean
  isActive: boolean
  roomId: string
  roomCode?: string
  roomName?: string
  overrides: {
    id: string
    ratePlanId: string
    date: string
    price: number | null
    isClosed: boolean
  }[]
}

interface DragState {
  ratePlanId: string
  startDate: string
  endDate: string
}

interface ModalState {
  ratePlanId: string
  ratePlanName: string
  dates: string[]
  existing: RatePlanCalendarRow['overrides'][0] | null
}

interface Props {
  roomId?: string
  villaWide?: boolean
  roomFilter?: string
  initialRows: RatePlanCalendarRow[]
  initialStartDate: string
}

export function RatesCalendar({ roomId, villaWide, roomFilter, initialRows, initialStartDate }: Props) {
  const [startDate, setStartDate] = useState(initialStartDate)
  const [rows, setRows] = useState<RatePlanCalendarRow[]>(initialRows)
  const [isLoading, startNavTransition] = useTransition()

  const [drag, setDrag] = useState<DragState | null>(null)
  const [modal, setModal] = useState<ModalState | null>(null)
  const isDragging = useRef(false)
  const isFirstRender = useRef(true)

  const dates = buildDateWindow(startDate)

  // ── Navigation ──────────────────────────────────────────────────────────────

  function navigate(delta: number) {
    const newStart = toISO(addDays(fromISO(startDate), delta * WINDOW))
    startNavTransition(async () => {
      const end = toISO(addDays(fromISO(newStart), WINDOW - 1))
      const fresh = villaWide
        ? await getVillaCalendar(newStart, end, roomFilter)
        : await getRoomCalendar(roomId!, newStart, end)
      setRows(fresh)
      setStartDate(newStart)
    })
  }

  // ── Refetch current window when the room filter changes (villa-wide only) ──

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!villaWide) return
    startNavTransition(async () => {
      const end = toISO(addDays(fromISO(startDate), WINDOW - 1))
      setRows(await getVillaCalendar(startDate, end, roomFilter))
    })
    // Only re-run on roomFilter changes — startDate changes are already handled by navigate(),
    // and villaWide is a static prop for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
  }, [roomFilter])

  // ── Drag selection ──────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((ratePlanId: string, date: string) => {
    isDragging.current = true
    setDrag({ ratePlanId, startDate: date, endDate: date })
  }, [])

  const handleMouseEnter = useCallback((ratePlanId: string, date: string) => {
    if (!isDragging.current) return
    setDrag((prev) => {
      if (!prev || prev.ratePlanId !== ratePlanId) return prev
      return { ...prev, endDate: date }
    })
  }, [])

  const handleMouseUp = useCallback((ratePlanId: string) => {
    if (!isDragging.current || !drag) { isDragging.current = false; return }
    isDragging.current = false

    if (drag.ratePlanId !== ratePlanId) { setDrag(null); return }

    const selectedDates = getDatesInDrag(drag)
    const row = rows.find((r) => r.id === ratePlanId)
    if (!row) { setDrag(null); return }

    // Find existing override only for single-date selection
    const existing = selectedDates.length === 1
      ? (row.overrides.find((o) => o.date === selectedDates[0]) ?? null)
      : null

    setModal({ ratePlanId, ratePlanName: row.name, dates: selectedDates, existing })
    setDrag(null)
  }, [drag, rows])

  // ── After save ──────────────────────────────────────────────────────────────

  function handleSaved(updates: { id: string; ratePlanId: string; date: string; price: number | null; isClosed: boolean }[]) {
    setRows((prev) =>
      prev.map((row) => {
        const relevant = updates.filter((u) => u.ratePlanId === row.id)
        if (!relevant.length) return row
        const overrideMap = new Map(row.overrides.map((o) => [o.date, o]))
        for (const u of relevant) {
          if (u.price === null && !u.isClosed) {
            overrideMap.delete(u.date)
          } else {
            overrideMap.set(u.date, u)
          }
        }
        return { ...row, overrides: Array.from(overrideMap.values()) }
      })
    )
  }

  // ── Header label ────────────────────────────────────────────────────────────

  const firstDate = fromISO(dates[0])
  const lastDate = fromISO(dates[dates.length - 1])
  const headerLabel =
    firstDate.getMonth() === lastDate.getMonth()
      ? `${firstDate.getDate()} – ${lastDate.getDate()} ${MONTH_LABELS[firstDate.getMonth()]} ${firstDate.getFullYear()}`
      : `${firstDate.getDate()} ${MONTH_LABELS[firstDate.getMonth()]} – ${lastDate.getDate()} ${MONTH_LABELS[lastDate.getMonth()]} ${lastDate.getFullYear()}`

  const dateHeaders = dates.map(fmtHeaderDate)

  return (
    <div
      className="space-y-4 select-none"
      onMouseLeave={() => {
        if (isDragging.current) { isDragging.current = false; setDrag(null) }
      }}
    >
      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold min-w-[200px] text-center">{headerLabel}</span>
        <button type="button"
          onClick={() => navigate(1)}
          disabled={isLoading}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {isLoading && (
          <span className="text-xs text-muted-foreground animate-pulse">Memuat...</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-background border border-border" />
          Harga dasar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 dark:bg-blue-900/30" />
          Harga custom
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" />
          Tutup
        </span>
        <span className="text-muted-foreground/60">· Drag untuk pilih beberapa tanggal</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-border bg-background text-center">
          <Tag className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada rate plan</p>
          <p className="text-xs text-muted-foreground">Tambah rate plan terlebih dahulu di tab Rate Plans.</p>
        </div>
      ) : (
        /* Scrollable table */
        <div className={cn('overflow-x-auto rounded-xl border border-border bg-background', isLoading && 'opacity-60')}>
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                {/* Label column header */}
                <th className="sticky left-0 z-10 bg-muted/50 border-b border-r border-border px-4 py-2 text-left text-xs font-semibold text-muted-foreground w-44 min-w-[176px]">
                  Rate Plan
                </th>
                {/* Date columns */}
                {dateHeaders.map(({ day, date, month, iso }) => (
                  <th
                    key={iso}
                    className={cn(
                      'border-b border-r border-border px-1 py-1.5 text-center last:border-r-0 min-w-[56px] w-14',
                      isWeekend(iso)
                        ? 'bg-blue-50/60 dark:bg-blue-900/10'
                        : 'bg-muted/30'
                    )}
                  >
                    <div className="text-[10px] font-medium text-muted-foreground">{day}</div>
                    <div className="text-xs font-bold text-foreground leading-tight">{date}</div>
                    <div className="text-[9px] text-muted-foreground/70">{month}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const overrideMap = new Map(row.overrides.map((o) => [o.date, o]))

                return (
                  <tr key={row.id} className="group">
                    {/* Rate plan label */}
                    <td className="sticky left-0 z-10 bg-background group-hover:bg-muted/20 border-r border-border px-4 py-3 transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0">
                          {row.roomCode && (
                            <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground/70 truncate max-w-[140px]">
                              {row.roomCode} · {row.roomName}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">{row.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {fmtShort(row.basePrice)} dasar
                            {row.sellMode === 'per_person' && ' / orang'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {!row.isActive && (
                              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500">
                                Nonaktif
                              </span>
                            )}
                            {!row.isRefundable && (
                              <span className="rounded-full bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-orange-600 dark:text-orange-400">
                                Non-refund
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date cells */}
                    {dates.map((date) => {
                      const override = overrideMap.get(date)
                      const isClosed = override?.isClosed ?? false
                      const hasCustomPrice = override && !isClosed && override.price !== null
                      const displayPrice = hasCustomPrice ? override!.price! : row.basePrice

                      const isInDrag =
                        drag?.ratePlanId === row.id &&
                        (() => {
                          const a = drag.startDate < drag.endDate ? drag.startDate : drag.endDate
                          const b = drag.startDate < drag.endDate ? drag.endDate : drag.startDate
                          return date >= a && date <= b
                        })()

                      return (
                        <td
                          key={date}
                          onMouseDown={() => handleMouseDown(row.id, date)}
                          onMouseEnter={() => handleMouseEnter(row.id, date)}
                          onMouseUp={() => handleMouseUp(row.id)}
                          className={cn(
                            'border-r border-border last:border-r-0 px-1 py-2 text-center cursor-pointer transition-colors',
                            isWeekend(date) && !isClosed && !hasCustomPrice && !isInDrag
                              ? 'bg-blue-50/30 dark:bg-blue-900/5'
                              : '',
                            isClosed
                              ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : hasCustomPrice
                              ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                              : 'bg-background hover:bg-muted/40',
                            isInDrag && 'ring-2 ring-inset ring-neutral-800 dark:ring-neutral-200 bg-neutral-50 dark:bg-neutral-900'
                          )}
                        >
                          {isClosed ? (
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                              Tutup
                            </span>
                          ) : (
                            <span className={cn(
                              'text-[11px] font-medium',
                              hasCustomPrice
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-muted-foreground'
                            )}>
                              {fmtShort(displayPrice)}
                            </span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <PriceOverrideModal
          key={`${modal.ratePlanId}-${modal.dates[0]}`}
          open
          onClose={() => setModal(null)}
          ratePlanId={modal.ratePlanId}
          ratePlanName={modal.ratePlanName}
          basePrice={rows.find((r) => r.id === modal.ratePlanId)?.basePrice ?? 0}
          dates={modal.dates}
          existing={modal.existing}
          onSaved={(updates) => {
            handleSaved(updates)
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
