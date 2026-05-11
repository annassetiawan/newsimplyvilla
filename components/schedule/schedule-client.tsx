'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Users, Clock, AlertTriangle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ShiftModal } from './shift-modal'
import type { ShiftFormData } from './shift-modal'

export interface ShiftData {
  id: string
  staffId: string
  date: string
  shiftType: string
}

export interface StaffData {
  id: string
  name: string
  role: string
}

interface Props {
  staff: StaffData[]
  shifts: ShiftData[]
}

const SHIFT_CONFIG: Record<string, { label: string; time: string; cell: string; legend: string }> = {
  MORNING: {
    label: 'Morning',
    time: '07:00–15:00',
    cell: 'bg-[#E1A62F] text-white hover:bg-[#C8911A]',
    legend: 'bg-[#E1A62F]',
  },
  AFTERNOON: {
    label: 'Afternoon',
    time: '15:00–23:00',
    cell: 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
    legend: 'bg-amber-100 border border-amber-300',
  },
  NIGHT: {
    label: 'Night',
    time: '23:00–07:00',
    cell: 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400',
    legend: 'bg-gray-100 border border-gray-300',
  },
  OFF: {
    label: 'Off',
    time: '–',
    cell: 'text-muted-foreground hover:bg-muted/50',
    legend: 'bg-background border border-border',
  },
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMonday(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function ScheduleClient({ staff, shifts: initialShifts }: Props) {
  const [localShifts, setLocalShifts] = useState(initialShifts)
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<ShiftFormData | null>(null)

  function handleSave(saved: ShiftData) {
    setLocalShifts((prev) => {
      const without = prev.filter(
        (s) => !(s.staffId === saved.staffId && s.date.slice(0, 10) === saved.date.slice(0, 10))
      )
      return [...without, saved]
    })
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function prevWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
  }
  function nextWeek() {
    setWeekStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
  }

  function getShift(staffId: string, day: Date) {
    const key = toDateKey(day)
    return localShifts.find((s) => s.staffId === staffId && s.date.slice(0, 10) === key)
  }

  function openNew(staffId: string, day: Date) {
    setEditShift({ staffId, date: toDateKey(day), shiftType: 'MORNING' })
    setModalOpen(true)
  }

  function openEdit(shift: ShiftData) {
    setEditShift({
      staffId: shift.staffId,
      date: shift.date.slice(0, 10),
      shiftType: shift.shiftType as ShiftFormData['shiftType'],
    })
    setModalOpen(true)
  }

  function handleClose() {
    setModalOpen(false)
    setEditShift(null)
  }

  const weekShifts = localShifts.filter((s) => {
    const d = new Date(s.date)
    d.setHours(0, 0, 0, 0)
    return d >= days[0] && d <= days[6]
  })

  const totalShifts = weekShifts.filter((s) => s.shiftType !== 'OFF').length
  const hoursScheduled = totalShifts * 8
  const totalSlots = staff.length * 7
  const coverageGaps = totalSlots - weekShifts.length

  if (staff.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Belum ada staf"
        description="Tambahkan staf terlebih dahulu sebelum membuat jadwal."
        actionLabel="Tambah staf"
        actionHref="/users"
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Shifts</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold">{totalShifts}</p>
          <p className="text-xs text-muted-foreground">this week</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Hours Scheduled</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold">{hoursScheduled}</p>
          <p className="text-xs text-muted-foreground">estimated ({totalShifts} × 8h)</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Coverage Gaps</span>
          </div>
          <p className={cn('mt-1.5 text-2xl font-bold', coverageGaps > 0 ? 'text-destructive' : '')}>
            {coverageGaps}
          </p>
          <p className="text-xs text-muted-foreground">unassigned slots</p>
        </div>
      </div>

      {/* Legend + nav */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Legend — hidden on mobile */}
        <div className="hidden items-center gap-5 text-xs text-muted-foreground lg:flex">
          {Object.entries(SHIFT_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('inline-block h-3.5 w-3.5 rounded-sm', cfg.legend)} />
              <span className="font-medium text-foreground">{cfg.label}</span>
              <span>{cfg.time}</span>
            </div>
          ))}
        </div>

        {/* Week nav + assign */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="flex-1 text-center text-sm font-medium lg:min-w-[200px] lg:flex-none">
            {days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' – '}
            {days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="ml-1 gap-1.5"
            onClick={() => { setEditShift(null); setModalOpen(true) }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Assign shift</span>
            <span className="sm:hidden">Assign</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-44 px-4 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Staff member
                </th>
                {days.map((day, i) => {
                  const isToday = day.getTime() === today.getTime()
                  return (
                    <th
                      key={i}
                      className={cn(
                        'px-2 py-3 text-center',
                        isToday ? 'bg-primary/5' : ''
                      )}
                    >
                      <p className={cn(
                        'text-xs font-semibold',
                        isToday ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {DAYS[i]}
                      </p>
                      <p className={cn(
                        'mt-0.5 text-lg font-bold leading-none',
                        isToday ? 'text-primary' : 'text-foreground'
                      )}>
                        {day.getDate()}
                      </p>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {staff.map((member, ri) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0"
                >
                  {/* Staff cell */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{member.name}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Day cells */}
                  {days.map((day, di) => {
                    const shift = getShift(member.id, day)
                    const isToday = day.getTime() === today.getTime()
                    const cfg = shift ? SHIFT_CONFIG[shift.shiftType] : null

                    return (
                      <td
                        key={di}
                        className={cn('px-2 py-2', isToday && 'bg-primary/5')}
                      >
                        {shift && cfg ? (
                          <button
                            onClick={() => openEdit(shift)}
                            className={cn(
                              'w-full rounded-lg px-2 py-2.5 text-center transition-opacity',
                              cfg.cell
                            )}
                          >
                            <p className="text-xs font-bold leading-none">{cfg.label}</p>
                            <p className="mt-1 text-[10px] font-medium opacity-80 leading-none">
                              {cfg.time}
                            </p>
                          </button>
                        ) : (
                          <button
                            onClick={() => openNew(member.id, day)}
                            className="w-full rounded-lg border border-dashed border-border py-2.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          >
                            +
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalShifts === 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
          <Plus className="h-3.5 w-3.5" />
          Klik + untuk mulai membuat jadwal minggu ini
        </p>
      )}

      <ShiftModal
        open={modalOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editShift}
        staffOptions={staff}
      />
    </div>
  )
}
