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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createExpense } from '@/app/actions/reports'

const CATEGORIES = [
  'Staff salary',
  'Utilities',
  'Maintenance',
  'F&B supplies',
  'Amenities',
  'Other',
] as const

const schema = z.object({
  date: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  amount: z.number().min(1, 'Must be greater than 0'),
  paymentStatus: z.enum(['PAID', 'UNPAID']),
})
type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export function ExpenseModal({ open, onClose }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      description: '',
      category: '',
      amount: 0,
      paymentStatus: 'UNPAID',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        category: '',
        amount: 0,
        paymentStatus: 'UNPAID',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: Values) {
    startTransition(async () => {
      await createExpense({
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        amount: data.amount,
        paymentStatus: data.paymentStatus,
      })
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" {...form.register('date')} />
              {form.formState.errors.date && (
                <p className="text-xs text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Amount (IDR)</Label>
              <Input
                type="number"
                min={1}
                placeholder="0"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input placeholder="Expense description..." {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.category && (
                <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Controller
                name="paymentStatus"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Add expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
