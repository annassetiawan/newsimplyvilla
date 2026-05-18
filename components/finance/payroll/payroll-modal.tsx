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
import { upsertPayroll } from '@/app/actions/finance'
import { MONTH_NAMES_FULL } from '@/lib/finance'

interface StaffMember { id: string; name: string; position: string }

interface Props {
  open: boolean
  onClose: () => void
  staffList: StaffMember[]
  defaultMonth: number
  defaultYear: number
  prefillStaffId?: string
  prefillAmount?: number
}

export function PayrollModal({
  open,
  onClose,
  staffList,
  defaultMonth,
  defaultYear,
  prefillStaffId,
  prefillAmount,
}: Props) {
  const [staffId, setStaffId] = useState(prefillStaffId ?? '')
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [amount, setAmount] = useState(prefillAmount?.toString() ?? '')
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setStaffId(prefillStaffId ?? '')
    setMonth(defaultMonth)
    setYear(defaultYear)
    setAmount(prefillAmount?.toString() ?? '')
    setNote('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!staffId) { toast.error('Pilih staff terlebih dahulu'); return }
    const amt = Number(amount)
    if (!amt || amt <= 0) { toast.error('Masukkan nominal gaji yang valid'); return }

    startTransition(async () => {
      const result = await upsertPayroll({
        staffId,
        month,
        year,
        amount: amt,
        note: note.trim() || undefined,
      })
      if (result.success) {
        toast.success('Payroll berhasil disimpan')
        handleClose()
      }
    })
  }

  const monthOptions = MONTH_NAMES_FULL.map((name, i) => ({ value: i + 1, label: name }))
  const yearOptions = [defaultYear - 1, defaultYear, defaultYear + 1]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Input Payroll</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Staff</Label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              <option value="">Pilih staff...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.position}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Bulan</Label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Tahun</Label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nominal Gaji (Rp)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Contoh: 3500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea
              placeholder="Catatan tambahan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
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
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
