'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cancelReservation, markAsPaid } from '@/app/actions/reservations'
import { ReservationDetailSheet } from './reservation-detail-sheet'
import { EditReservationModal } from './edit-reservation-modal'
import type { ListReservation } from './list-tab'

const DAYS = 14

interface RoomRow {
  id: string
  code: string
  name: string
  capacity: number
}

interface Props {
  rooms: RoomRow[]
  reservations: ListReservation[]
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
  const [selected, setSelected] = useState<ListReservation | null>(null)
  const [editTarget, setEditTarget] = useState<ListReservation | null>(null)
  const [pending, startTransition] = useTransition()

  const days = Array.from({ length: DAYS }, (_, i) => {
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

  function getBlock(res: ListReservation) {
    const resStart = startOfDay(new Date(res.checkIn))
    const resEnd = startOfDay(new Date(res.checkOut))
    const viewEnd = new Date(viewStart)
    viewEnd.setDate(viewStart.getDate() + DAYS)

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
      left: `calc(${leftDays} / ${DAYS} * 100% + 2px)`,
      width: `calc(${widthDays} / ${DAYS} * 100% - 4px)`,
      nights: totalNights,
    }
  }

  const isActive = (status: string) =>
    status === 'CONFIRMED' || status === 'CHECKEDIN'

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelReservation(id)
      setSelected(null)
    })
  }

  function handleMarkAsPaid(id: string) {
    startTransition(async () => {
      await markAsPaid(id)
      if (selected?.id === id) {
        setSelected({ ...selected, paymentStatus: 'PAID' })
      }
    })
  }

  function handleEdit(res: ListReservation) {
    setEditTarget(res)
  }

  function handleEditSuccess(updates: Partial<ListReservation>) {
    if (selected) setSelected({ ...selected, ...updates })
  }

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
                  <p className="text-xs font-bold">{room.code}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{room.name}</p>
                  <p className="text-[11px] text-muted-foreground/60">{room.capacity} pax</p>
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

                  {roomRes.map((res) => {
                    const block = getBlock(res)
                    if (!block) return null
                    const active = isActive(res.status)
                    return (
                      <button
                        key={res.id}
                        className={cn(
                          'absolute top-2.5 bottom-2.5 flex items-center overflow-hidden rounded-md px-2 transition-opacity hover:opacity-80',
                          active
                            ? 'bg-primary text-white'
                            : 'border-2 border-dashed border-primary bg-primary/10 text-primary'
                        )}
                        style={{ left: block.left, width: block.width }}
                        title={`${res.guest.name} · ${block.nights}n`}
                        onClick={() => setSelected(res)}
                      >
                        <span className="truncate text-[11px] font-semibold">
                          {res.guest.name}
                          {block.nights > 1 && (
                            <span className="ml-1 opacity-70">· {block.nights}n</span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ReservationDetailSheet
        selected={selected}
        onClose={() => setSelected(null)}
        pending={pending}
        onMarkPaid={handleMarkAsPaid}
        onCancel={handleCancel}
        onEdit={handleEdit}
      />

      <EditReservationModal
        reservation={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
