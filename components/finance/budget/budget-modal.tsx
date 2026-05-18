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
import { upsertBudget } from '@/app/actions/finance'
import { MONTH_NAMES_FULL } from '@/lib/finance'

interface Props {
  open: boolean
  onClose: () => void
  defaultMonth: number
  defaultYear: number
  currentTarget?: number
}

export function BudgetModal({ open, onClose, defaultMonth, defaultYear, currentTarget }: Props) {
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [target, setTarget] = useState(currentTarget?.toString() ?? '')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(target.replace(/\D/g, ''))
    if (!amount || amount <= 0) {
      toast.error('Masukkan target yang valid')
      return
    }
    startTransition(async () => {
      const result = await upsertBudget({ month, year, target: amount })
      if (result.success) {
        toast.success('Target budget berhasil disimpan')
        onClose()
      }
    })
  }

  const monthOptions = MONTH_NAMES_FULL.map((name, i) => ({ value: i + 1, label: name }))
  const yearOptions = [defaultYear - 1, defaultYear, defaultYear + 1]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Target Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
            <Label>Target Revenue (Rp)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Contoh: 50000000"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {isPending ? 'Menyimpan...' : 'Simpan Target'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
