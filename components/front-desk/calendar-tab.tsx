'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const DAY_W = 56

interface RoomRow {
  id: string
  code: string
  name: string
  capacity: number
}

interface ResBlock {
  id: string
  checkIn: string
  checkOut: string
  status: string
  guest: { name: string }
  room: { id: string }
}

interface Props {
  rooms: RoomRow[]
  reservations: ResBlock[]
  onNewReservation: () => void
}

function startOfDay(d: Date) {
  const n = new Date(d)
  n.setHours(0, 0, 0, 0)
  return n
}

export function CalendarTab({ rooms, reservations, onNewReservation }: Props) {
  const todayBase = startOfDay(new Date())
  const [viewStart, setViewStart] = useState(todayBase)

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(viewStart)
    d.setDate(viewStart.getDate() + i)
    return d
  })

  function prevWeek() {
    setViewStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() - 7)
      return n
    })
  }
  function nextWeek() {
    setViewStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + 7)
      return n
    })
  }

  function getBlock(res: ResBlock) {
    const resStart = startOfDay(new Date(res.checkIn))
    const resEnd = startOfDay(new Date(res.checkOut))
    const viewEnd = new Date(viewStart)
    viewEnd.setDate(viewStart.getDate() + 14)

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

    return { left: leftDays * DAY_W + 2, width: widthDays * DAY_W - 4, nights: totalNights }
  }

  const isActive = (status: string) =>
    status === 'CONFIRMED' || status === 'CHECKEDIN'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[190px] text-center text-sm font-medium">
            {days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {days[13].toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="sm"
          onClick={onNewReservation}
          className="bg-primary hover:bg-[#C8911A] text-white"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New reservation
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div style={{ minWidth: 160 + 14 * DAY_W }}>
          {/* Header */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="w-[160px] shrink-0 border-r border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground">
              Room
            </div>
            {days.map((day) => {
              const isToday = day.toDateString() === todayBase.toDateString()
              return (
                <div
                  key={day.toISOString()}
                  style={{ width: DAY_W, minWidth: DAY_W }}
                  className={cn(
                    'shrink-0 border-r border-border px-1 py-2 text-center last:border-0',
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

          {/* Room rows */}
          {rooms.map((room, idx) => {
            const roomRes = reservations.filter((r) => r.room.id === room.id)
            return (
              <div
                key={room.id}
                className={cn('flex', idx < rooms.length - 1 && 'border-b border-border')}
              >
                <div className="w-[160px] shrink-0 border-r border-border px-3 py-3">
                  <p className="text-xs font-bold">{room.code}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{room.name}</p>
                  <p className="text-[11px] text-muted-foreground/60">{room.capacity} pax</p>
                </div>

                <div className="relative flex" style={{ height: 64 }}>
                  {days.map((day) => {
                    const isToday = day.toDateString() === todayBase.toDateString()
                    return (
                      <div
                        key={day.toISOString()}
                        style={{ width: DAY_W, minWidth: DAY_W }}
                        className={cn(
                          'h-full shrink-0 border-r border-border last:border-0',
                          isToday && 'bg-primary/5'
                        )}
                      />
                    )
                  })}

                  {roomRes.map((res) => {
                    const block = getBlock(res)
                    if (!block) return null
                    const active = isActive(res.status)
                    return (
                      <div
                        key={res.id}
                        className={cn(
                          'absolute top-2.5 bottom-2.5 flex items-center overflow-hidden rounded-md px-2',
                          active
                            ? 'bg-primary text-white'
                            : 'border-2 border-dashed border-primary bg-primary/10 text-primary'
                        )}
                        style={{ left: block.left, width: block.width }}
                        title={`${res.guest.name} · ${block.nights}n`}
                      >
                        <span className="truncate text-[11px] font-semibold">
                          {res.guest.name}
                          {block.width > 90 && (
                            <span className="ml-1 opacity-70">· {block.nights}n</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
