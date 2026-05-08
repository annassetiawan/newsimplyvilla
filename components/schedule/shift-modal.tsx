'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { upsertShift } from '@/app/actions/shifts'

export interface ShiftFormData {
  staffId: string
  date: string
  shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'OFF'
}

interface StaffOption {
  id: string
  name: string
}

interface SavedShift {
  id: string
  staffId: string
  date: string
  shiftType: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave?: (shift: SavedShift) => void
  initial?: ShiftFormData | null
  staffOptions: StaffOption[]
}

const shiftSchema = z.object({
  staffId: z.string().min(1, 'Staff is required'),
  date: z.string().min(1, 'Date is required'),
  shiftType: z.enum(['MORNING', 'AFTERNOON', 'NIGHT', 'OFF']),
})
type ShiftValues = z.infer<typeof shiftSchema>

const SHIFT_LABELS: Record<string, string> = {
  MORNING: 'Morning (06:00–14:00)',
  AFTERNOON: 'Afternoon (14:00–22:00)',
  NIGHT: 'Night (22:00–06:00)',
  OFF: 'Day Off',
}

export function ShiftModal({ open, onClose, onSave, initial, staffOptions }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<ShiftValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      staffId: '',
      date: '',
      shiftType: 'MORNING',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        staffId: initial?.staffId ?? '',
        date: initial?.date ?? '',
        shiftType: initial?.shiftType ?? 'MORNING',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: ShiftValues) {
    startTransition(async () => {
      const saved = await upsertShift({
        staffId: data.staffId,
        date: new Date(data.date),
        shiftType: data.shiftType,
      })
      onSave?.(saved)
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit shift' : 'Assign shift'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Staff member</Label>
            <Controller
              name="staffId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!initial}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.staffId && (
              <p className="text-xs text-destructive">{form.formState.errors.staffId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Date</Label>
            <input
              type="date"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!!initial}
              {...form.register('date')}
            />
            {form.formState.errors.date && (
              <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Shift type</Label>
            <Controller
              name="shiftType"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHIFT_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Save shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
