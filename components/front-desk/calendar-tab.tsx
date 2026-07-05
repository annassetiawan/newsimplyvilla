'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Plus, BedDouble } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/EmptyState'
import { cancelReservation, markAsPaid } from '@/app/actions/reservations'
import { ReservationDetailSheet } from './reservation-detail-sheet'
import { EditReservationModal } from './edit-reservation-modal'
import { CalendarGrid, CALENDAR_DAYS } from './calendar-grid'
import type { ListReservation } from './list-tab'

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

  const days = Array.from({ length: CALENDAR_DAYS }, (_, i) => {
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

  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(todayBase.getFullYear(), todayBase.getMonth() - 12 + i, 1)
    return d
  })

  const selectedMonthValue = `${viewStart.getFullYear()}-${String(viewStart.getMonth() + 1).padStart(2, '0')}`

  function jumpToMonth(value: string) {
    const [y, m] = value.split('-').map(Number)
    setViewStart(startOfDay(new Date(y, m - 1, 1)))
  }

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

  if (rooms.length === 0) {
    return (
      <EmptyState
        icon={BedDouble}
        title="Belum ada kamar"
        description="Tambahkan kamar terlebih dahulu sebelum membuat reservasi."
        actionLabel="Tambah kamar"
        actionHref="/rooms"
      />
    )
  }

  return (
    <div className="space-y-3 overflow-hidden">
      {/* Mobile: notice + list prompt only */}
      <div className="lg:hidden">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">Tampilan kalender tersedia di desktop</p>
          <p className="mt-0.5 text-xs opacity-80">Di perangkat mobile, gunakan tab <strong>List</strong> untuk melihat reservasi.</p>
        </div>
        <div className="mt-3 flex justify-center">
          <Button size="sm" onClick={onNewReservation} className="bg-primary text-white hover:bg-[#C8911A]">
            <Plus className="mr-1.5 h-4 w-4" />
            New reservation
          </Button>
        </div>
      </div>

      {/* Desktop: full calendar */}
      <div className="hidden lg:block">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select value={selectedMonthValue} onValueChange={jumpToMonth}>
            <SelectTrigger className="h-8 w-[160px] text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((d) => {
                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                return <SelectItem key={value} value={value}>{label}</SelectItem>
              })}
            </SelectContent>
          </Select>
          <span className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            {days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {days[13].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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

      <CalendarGrid
        rooms={rooms}
        reservations={reservations}
        days={days}
        viewStart={viewStart}
        todayBase={todayBase}
        onSelectReservation={setSelected}
      />

      {reservations.length === 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <Plus className="h-3.5 w-3.5" />
          Klik &apos;New reservation&apos; untuk tambah reservasi baru
        </p>
      )}
      </div>{/* end desktop wrapper */}

      <ReservationDetailSheet
        selected={selected}
        onClose={() => setSelected(null)}
        pending={pending}
        onMarkPaid={handleMarkAsPaid}
        onCancel={handleCancel}
        onEdit={handleEdit}
      />

      <EditReservationModal
        key={editTarget?.id ?? 'none'}
        reservation={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
