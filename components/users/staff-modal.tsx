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
import { createStaff, updateStaff } from '@/app/actions/staff'
import type { StaffData } from './users-client'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  position: z.string().min(1, 'Required'),
  role: z.enum(['OWNER', 'STAFF']),
  isActive: z.boolean(),
})
type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  initial?: StaffData | null
}

export function StaffModal({ open, onClose, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      role: 'STAFF',
      isActive: true,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        position: initial?.position ?? '',
        role: (initial?.role as Values['role']) ?? 'STAFF',
        isActive: initial?.isActive ?? true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: Values) {
    startTransition(async () => {
      if (initial) {
        await updateStaff(initial.id, data)
      } else {
        await createStaff(data)
      }
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit staff' : 'Add staff member'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input placeholder="Full name..." {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="email@example.com" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input placeholder="e.g. Housekeeper" {...form.register('position')} />
              {form.formState.errors.position && (
                <p className="text-xs text-destructive">{form.formState.errors.position.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {initial && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="isActive"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value ? 'true' : 'false'}
                    onValueChange={(v) => field.onChange(v === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : initial ? 'Save changes' : 'Add staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
