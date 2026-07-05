'use client'

import { cn } from '@/lib/utils'
import type { ListReservation } from './list-tab'

export const CALENDAR_DAYS = 14

interface RoomRow {
  id: string
  code: string
  name: string
  capacity: number
}

function startOfDay(d: Date) {
  const n = new Date(d)
  n.setHours(0, 0, 0, 0)
  return n
}

const isConfirmed = (res: ListReservation) =>
  res.paymentStatus === 'PAID' &&
  res.status !== 'CANCELLED' &&
  res.status !== 'CHECKEDOUT'

const isPending = (res: ListReservation) =>
  res.paymentStatus === 'UNPAID' &&
  res.status !== 'CANCELLED' &&
  res.status !== 'CHECKEDOUT'

const isVisible = (res: ListReservation) =>
  res.status !== 'CANCELLED' && res.status !== 'CHECKEDOUT'

function getBlock(res: ListReservation, viewStart: Date) {
  const resStart = startOfDay(new Date(res.checkIn))
  const resEnd = startOfDay(new Date(res.checkOut))
  const viewEnd = new Date(viewStart)
  viewEnd.setDate(viewStart.getDate() + CALENDAR_DAYS)

  if (resEnd <= viewStart || resStart >= viewEnd) return null

  const clampedStart = resStart < viewStart ? viewStart : resStart
  const clampedEnd = resEnd > viewEnd ? viewEnd : resEnd

  const leftDays = Math.floor(
    (clampedStart.getTime() - viewStart.getTime()) / 86400000
  )
  const widthDays = Math.max(
    1,
    Math.ceil((clampedEnd.getTime() - clampedStart.getTime()) / 86400000)
  )
  const totalNights = Math.ceil(
    (resEnd.getTime() - resStart.getTime()) / 86400000
  )

  return {
    left: `calc(${leftDays} / ${CALENDAR_DAYS} * 100% + 2px)`,
    width: `calc(${widthDays} / ${CALENDAR_DAYS} * 100% - 4px)`,
    nights: totalNights,
  }
}

interface CalendarGridProps {
  rooms: RoomRow[]
  reservations: ListReservation[]
  days: Date[]
  viewStart: Date
  todayBase: Date
  onSelectReservation: (res: ListReservation) => void
}

export function CalendarGrid({
  rooms,
  reservations,
  days,
  viewStart,
  todayBase,
  onSelectReservation,
}: CalendarGridProps) {
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-[160px] shrink-0 border-r border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              Room
            </div>
            <div className="flex flex-1">
              {days.map((day) => {
                const isToday = day.toDateString() === todayBase.toDateString()
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'flex-1 border-r border-border px-1 py-2 text-center last:border-0',
                      isToday ? 'bg-primary/10' : ''
                    )}
                  >
                    <p
                      className={cn(
                        'text-xs font-semibold',
                        isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {day.toLocaleDateString('en-GB', { day: 'numeric' })}
                    </p>
                    <p
                      className={cn(
                        'text-[10px]',
                        isToday ? 'text-primary' : 'text-muted-foreground'
                      )}
                    >
                      {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Room rows */}
          {rooms.map((room, idx) => {
            const roomRes = reservations.filter((r) => r.room.id === room.id)
            return (
              <div
                key={room.id}
                className={cn('flex', idx < rooms.length - 1 && 'border-b border-border')}
              >
                <div className="w-[160px] shrink-0 border-r border-border px-3 py-3">
                  <p className="truncate text-xs font-bold">{room.name}</p>
                  <p className="font-id text-muted-foreground">
                    {room.code} · {room.capacity}p
                  </p>
                </div>

                <div className="relative flex flex-1" style={{ height: 64 }}>
                  {days.map((day) => {
                    const isToday = day.toDateString() === todayBase.toDateString()
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          'h-full flex-1 border-r border-border last:border-0',
                          isToday && 'bg-primary/5'
                        )}
                      />
                    )
                  })}

                  {roomRes.flatMap((res) => {
                    if (!isVisible(res)) return []
                    const block = getBlock(res, viewStart)
                    if (!block) return []
                    const confirmed = isConfirmed(res)
                    const pending = isPending(res)
                    return [
                      <button
                        key={res.id}
                        type="button"
                        className={cn(
                          'absolute top-2 bottom-2 flex items-center justify-between overflow-hidden rounded-md px-2.5 transition-opacity hover:opacity-80',
                          confirmed && 'bg-primary text-white',
                          pending && 'border-2 border-dashed border-primary bg-primary/10 text-primary',
                          !confirmed && !pending && 'bg-muted text-muted-foreground'
                        )}
                        style={{ left: block.left, width: block.width }}
                        title={`${res.guest.name} · ${block.nights}n`}
                        onClick={() => onSelectReservation(res)}
                      >
                        <span className="truncate text-[11px] font-semibold leading-none">
                          {res.guest.name}
                        </span>
                        <span className="ml-1.5 shrink-0 text-[10px] font-medium opacity-70">
                          {block.nights}n
                        </span>
                      </button>,
                    ]
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-3">
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-8 rounded bg-primary" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-8 rounded border-2 border-dashed border-primary bg-primary/10" />
          <span>Pending payment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded bg-primary/10" />
          <span>Today</span>
        </div>
      </div>
    </>
  )
}
