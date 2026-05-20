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
import { updateLeaveAllocation } from '@/app/actions/leave'
import type { Employee, LeaveAllocation } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  employees: Employee[]
  leaveAllocations: LeaveAllocation[]
  currentYear: number
}

export function LeaveAllocationModal({ open, onClose, employees, leaveAllocations, currentYear }: Props) {
  const allocMap = new Map(leaveAllocations.map((a) => [a.employeeId, a]))
  const [values, setValues] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  function getDefault(empId: string) {
    return String(allocMap.get(empId)?.totalDays ?? 12)
  }

  function getValue(empId: string) {
    return values[empId] ?? getDefault(empId)
  }

  function handleClose() {
    setValues({})
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const toSave = employees.map((emp) => ({
      employeeId: emp.id,
      totalDays: Number(getValue(emp.id)),
    }))

    startTransition(async () => {
      await Promise.all(
        toSave.map(({ employeeId, totalDays }) =>
          updateLeaveAllocation(employeeId, currentYear, totalDays)
        )
      )
      toast.success('Jatah cuti diperbarui')
      handleClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Jatah Cuti {currentYear}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Atur jumlah hari cuti per tahun untuk setiap karyawan aktif.
          </p>

          <div className="space-y-3 border-t border-border pt-4">
            {employees.map((emp) => {
              const alloc = allocMap.get(emp.id)
              return (
                <div key={emp.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{emp.name}</p>
                    {alloc && (
                      <p className="text-xs text-muted-foreground">
                        Terpakai: {alloc.usedDays} hari
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      max="365"
                      value={getValue(emp.id)}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [emp.id]: e.target.value }))
                      }
                      className="text-center h-9"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">hari</span>
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
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
