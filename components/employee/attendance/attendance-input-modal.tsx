'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { bulkUpsertAttendance } from '@/app/actions/attendance'
import type { Employee } from '../types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  employees: Employee[]
  defaultDate: string
}

type AttStatus = 'PRESENT' | 'ABSENT' | 'SICK' | 'LEAVE' | 'OFF'

const STATUS_OPTIONS: { value: AttStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Hadir' },
  { value: 'SICK',    label: 'Sakit' },
  { value: 'LEAVE',   label: 'Izin' },
  { value: 'ABSENT',  label: 'Alpha' },
  { value: 'OFF',     label: 'OFF' },
]

const STATUS_STYLE: Record<AttStatus, string> = {
  PRESENT: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  SICK:    'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  LEAVE:   'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
  ABSENT:  'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
  OFF:     'border-neutral-400 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
}

export function AttendanceInputModal({ open, onClose, employees, defaultDate }: Props) {
  const [date, setDate] = useState(defaultDate)
  const [entries, setEntries] = useState<Record<string, { status: AttStatus; note: string }>>({})
  const [isPending, startTransition] = useTransition()

  function setAll(status: AttStatus) {
    const next: Record<string, { status: AttStatus; note: string }> = {}
    employees.forEach((e) => {
      next[e.id] = { status, note: entries[e.id]?.note ?? '' }
    })
    setEntries(next)
  }

  function setStatus(empId: string, status: AttStatus) {
    setEntries((prev) => ({
      ...prev,
      [empId]: { status, note: prev[empId]?.note ?? '' },
    }))
  }

  function setNote(empId: string, note: string) {
    setEntries((prev) => ({
      ...prev,
      [empId]: { status: prev[empId]?.status ?? 'PRESENT', note },
    }))
  }

  function handleClose() {
    setEntries({})
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const toSave = Object.entries(entries)
      .filter(([, v]) => v.status)
      .map(([employeeId, v]) => ({ employeeId, status: v.status, note: v.note || undefined }))

    if (toSave.length === 0) {
      toast.error('Belum ada absensi yang diisi')
      return
    }

    startTransition(async () => {
      const result = await bulkUpsertAttendance(toSave, date)
      if ('error' in result) {
        toast.error((result as { error: string }).error)
      } else {
        toast.success(`Absensi ${toSave.length} karyawan disimpan`)
        handleClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Input Absensi</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          {/* Quick set all */}
          <div className="space-y-2">
            <Label>Set semua karyawan</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAll(opt.value)}
                  className="px-3 py-1.5 rounded-md border text-xs font-medium hover:opacity-80 transition-opacity border-border bg-background text-muted-foreground"
                >
                  Semua {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            {employees.map((emp) => {
              const entry = entries[emp.id]
              return (
                <div key={emp.id} className="space-y-2">
                  <p className="text-sm font-medium">{emp.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStatus(emp.id, opt.value)}
                        className={cn(
                          'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                          entry?.status === opt.value
                            ? STATUS_STYLE[opt.value]
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {entry?.status && entry.status !== 'PRESENT' && entry.status !== 'OFF' && (
                    <Input
                      placeholder="Catatan (opsional)"
                      value={entry.note}
                      onChange={(e) => setNote(emp.id, e.target.value)}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Absensi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
