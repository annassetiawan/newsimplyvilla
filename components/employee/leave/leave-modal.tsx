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
import { Textarea } from '@/components/ui/textarea'
import { createLeaveRequest } from '@/app/actions/leave'
import type { Employee, LeaveAllocation } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  employees: Employee[]
  leaveAllocations: LeaveAllocation[]
}

export function LeaveModal({ open, onClose, employees, leaveAllocations }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [employeeId, setEmployeeId] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  const currentYear = new Date().getFullYear()
  const allocMap = new Map(leaveAllocations.map((a) => [a.employeeId, a]))

  const selectedAlloc = employeeId ? allocMap.get(employeeId) : null
  const remaining = selectedAlloc ? selectedAlloc.totalDays - selectedAlloc.usedDays : null

  function reset() {
    setEmployeeId('')
    setStartDate(today)
    setEndDate(today)
    setReason('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !reason.trim()) {
      toast.error('Isi semua field yang diperlukan')
      return
    }

    startTransition(async () => {
      const result = await createLeaveRequest({
        employeeId,
        startDate,
        endDate,
        reason: reason.trim(),
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Pengajuan cuti ditambahkan')
        handleClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Pengajuan Cuti</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Karyawan <span className="text-destructive">*</span></Label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Pilih karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            {selectedAlloc && (
              <p className="text-xs text-muted-foreground">
                Sisa jatah cuti {currentYear}: <span className="font-semibold text-foreground">{remaining} hari</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tanggal Mulai <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (e.target.value > endDate) setEndDate(e.target.value)
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Akhir <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Alasan <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Keperluan keluarga, sakit, dll..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {isPending ? 'Menyimpan...' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
