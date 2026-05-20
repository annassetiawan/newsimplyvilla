'use client'

import { useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AttendanceInputModal } from './attendance-input-modal'
import { cn } from '@/lib/utils'
import type { Employee, Attendance } from '../types'

interface Props {
  employees: Employee[]
  attendances: Attendance[]
  currentMonth: number
  currentYear: number
}

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const STATUS_CONFIG = {
  PRESENT: { label: 'H', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', title: 'Hadir' },
  SICK:    { label: 'S', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400', title: 'Sakit' },
  LEAVE:   { label: 'I', bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400', title: 'Izin' },
  ABSENT:  { label: 'A', bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400', title: 'Alpha' },
  OFF:     { label: 'O', bg: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400', title: 'OFF' },
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

export function AttendanceTab({ employees, attendances, currentMonth, currentYear }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE')
  const totalDays = daysInMonth(selectedMonth, selectedYear)

  // Map: employeeId -> day -> status
  const attMap = new Map<string, Map<number, Attendance>>()
  for (const a of attendances) {
    const d = new Date(a.date)
    if (d.getMonth() + 1 !== selectedMonth || d.getFullYear() !== selectedYear) continue
    if (!attMap.has(a.employeeId)) attMap.set(a.employeeId, new Map())
    attMap.get(a.employeeId)!.set(d.getDate(), a)
  }

  const monthOptions: { month: number; year: number; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    monthOptions.push({ month: m, year: y, label: `${MONTHS[m - 1]} ${y}` })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [y, m] = e.target.value.split('-').map(Number)
            setSelectedYear(y)
            setSelectedMonth(m)
          }}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {monthOptions.map((o) => (
            <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
              {o.label}
            </option>
          ))}
        </select>

        <Button
          onClick={() => setModalOpen(true)}
          className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 gap-2"
        >
          <CalendarCheck className="w-4 h-4" /> Input Absensi
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className={cn('inline-flex w-5 h-5 items-center justify-center rounded text-[10px] font-bold', v.bg)}>
              {v.label}
            </span>
            {v.title}
          </span>
        ))}
      </div>

      {activeEmployees.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Belum ada karyawan aktif"
          description="Tambahkan karyawan terlebih dahulu untuk mencatat absensi."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="text-sm min-w-max">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/40 min-w-[160px]">
                  Karyawan
                </th>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                  <th key={d} className="px-2 py-3 font-medium text-muted-foreground text-center min-w-[32px]">
                    {d}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-muted-foreground text-center min-w-[48px]">H</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center min-w-[48px]">A</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center min-w-[48px]">S</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center min-w-[48px]">I</th>
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map((emp, idx) => {
                const empMap = attMap.get(emp.id) ?? new Map()
                let hadir = 0, alpha = 0, sakit = 0, izin = 0
                empMap.forEach((a) => {
                  if (a.status === 'PRESENT') hadir++
                  else if (a.status === 'ABSENT') alpha++
                  else if (a.status === 'SICK') sakit++
                  else if (a.status === 'LEAVE') izin++
                })

                return (
                  <tr key={emp.id} className={cn(idx < activeEmployees.length - 1 && 'border-b border-border')}>
                    <td className="px-4 py-2.5 font-medium sticky left-0 bg-background border-r border-border">
                      {emp.name}
                    </td>
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
                      const a = empMap.get(d)
                      const cfg = a ? STATUS_CONFIG[a.status as keyof typeof STATUS_CONFIG] : null
                      return (
                        <td key={d} className="px-1 py-2.5 text-center">
                          {cfg ? (
                            <span
                              title={cfg.title + (a?.note ? `: ${a.note}` : '')}
                              className={cn('inline-flex w-6 h-6 items-center justify-center rounded text-[10px] font-bold cursor-default', cfg.bg)}
                            >
                              {cfg.label}
                            </span>
                          ) : (
                            <span className="inline-block w-6 h-6 text-center text-muted-foreground/30 text-xs leading-6">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-center text-emerald-600 dark:text-emerald-400 font-medium">{hadir || '—'}</td>
                    <td className="px-4 py-2.5 text-center text-red-600 dark:text-red-400 font-medium">{alpha || '—'}</td>
                    <td className="px-4 py-2.5 text-center text-blue-600 dark:text-blue-400 font-medium">{sakit || '—'}</td>
                    <td className="px-4 py-2.5 text-center text-yellow-600 dark:text-yellow-400 font-medium">{izin || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AttendanceInputModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employees={activeEmployees}
        defaultDate={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
      />
    </div>
  )
}
