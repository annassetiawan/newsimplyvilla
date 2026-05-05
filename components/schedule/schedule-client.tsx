'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Users, Clock, AlertTriangle } from 'lucide-react'
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

const SHIFT_STYLE: Record<string, string> = {
  MORNING: 'bg-[#E1A62F] text-white',
  AFTERNOON: 'bg-[#F5D78E] text-amber-900',
  NIGHT: 'bg-gray-700 text-gray-100',
  OFF: 'bg-muted text-muted-foreground',
}

const SHIFT_LABEL: Record<string, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  NIGHT: 'Night',
  OFF: 'Off',
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

export function ScheduleClient({ staff, shifts }: Props) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<ShiftFormData | null>(null)

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function prevWeek() {
    setWeekStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() - 7)
      return n
    })
  }
  function nextWeek() {
    setWeekStart((d) => {
      const n = new Date(d)
      n.setDate(n.getDate() + 7)
      return n
    })
  }

  function getShift(staffId: string, day: Date) {
    const key = toDateKey(day)
    return shifts.find((s) => s.staffId === staffId && s.date.slice(0, 10) === key)
  }

  function openNew(staffId: string, day: Date) {
    setEditShift({
      staffId,
      date: toDateKey(day),
      shiftType: 'MORNING',
    })
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

  const weekShifts = shifts.filter((s) => {
    const d = new Date(s.date)
    d.setHours(0, 0, 0, 0)
    return d >= days[0] && d <= days[6]
  })

  const totalShifts = weekShifts.filter((s) => s.shiftType !== 'OFF').length
  const hoursScheduled = totalShifts * 8
  const totalSlots = staff.length * 7
  const coveredSlots = weekShifts.length
  const coverageGaps = totalSlots - coveredSlots

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[220px] text-center text-sm font-medium">
            {days[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} –{' '}
            {days[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <Button variant="outline" size="sm" onClick={nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setEditShift(null)
            setModalOpen(true)
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Assign shift
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-36 px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                  Staff
                </th>
                {days.map((day, i) => {
                  const isToday = day.getTime() === today.getTime()
                  return (
                    <th
                      key={i}
                      className={cn(
                        'px-2 py-2.5 text-center text-xs font-semibold',
                        isToday ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                      )}
                    >
                      <p>{DAYS[i]}</p>
                      <p className={cn('text-base font-bold mt-0.5', isToday ? 'text-primary' : 'text-foreground')}>
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
                  className={cn('border-b border-border last:border-0', ri % 2 === 1 && 'bg-muted/20')}
                >
                  <td className="px-4 py-2">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{member.role}</p>
                  </td>
                  {days.map((day, di) => {
                    const shift = getShift(member.id, day)
                    return (
                      <td key={di} className="px-1.5 py-1.5 text-center">
                        {shift ? (
                          <button
                            onClick={() => openEdit(shift)}
                            className={cn(
                              'w-full rounded-md px-1 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-80',
                              SHIFT_STYLE[shift.shiftType]
                            )}
                          >
                            {SHIFT_LABEL[shift.shiftType]}
                          </button>
                        ) : (
                          <button
                            onClick={() => openNew(member.id, day)}
                            className="w-full rounded-md border border-dashed border-border px-1 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
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

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        {Object.entries(SHIFT_LABEL).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('inline-block h-3 w-3 rounded-sm', SHIFT_STYLE[key])} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <ShiftModal
        open={modalOpen}
        onClose={handleClose}
        initial={editShift}
        staffOptions={staff}
      />
    </div>
  )
}
