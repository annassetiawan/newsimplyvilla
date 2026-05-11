'use client'

import { useEffect, useState, useTransition } from 'react'
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

const ALL_MODULES = [
  { key: 'dashboard',       label: 'Dashboard' },
  { key: 'front-desk',      label: 'Front Desk' },
  { key: 'rooms',           label: 'Rooms & Areas' },
  { key: 'inventory',       label: 'Inventory' },
  { key: 'maintenance',     label: 'Maintenance' },
  { key: 'schedule',        label: 'Schedule' },
  { key: 'reports',         label: 'Reports' },
  { key: 'sop',             label: 'SOP' },
  { key: 'users',           label: 'Users' },
  { key: 'settings',        label: 'Settings' },
]

const DEFAULT_PERMISSIONS = ['dashboard', 'front-desk', 'rooms', 'maintenance', 'schedule', 'sop']

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  position: z.string().min(1, 'Required'),
  role: z.enum(['OWNER', 'STAFF']),
  isActive: z.boolean(),
  permissions: z.array(z.string()).default([]),
})
type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  initial?: StaffData | null
}

export function StaffModal({ open, onClose, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      role: 'STAFF',
      isActive: true,
      permissions: DEFAULT_PERMISSIONS,
    },
  })

  const watchedRole = form.watch('role')
  const watchedPermissions = form.watch('permissions')

  useEffect(() => {
    if (open) {
      setError('')
      form.reset({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        position: initial?.position ?? '',
        role: (initial?.role as Values['role']) ?? 'STAFF',
        isActive: initial?.isActive ?? true,
        permissions: initial?.permissions?.length ? initial.permissions : DEFAULT_PERMISSIONS,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function togglePermission(key: string) {
    const current = form.getValues('permissions')
    form.setValue(
      'permissions',
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    )
  }

  function onSubmit(data: Values) {
    setError('')
    startTransition(async () => {
      const result = initial
        ? await updateStaff(initial.id, data)
        : await createStaff(data)
      if (!result.success) {
        setError(result.message ?? 'Terjadi kesalahan. Coba lagi.')
        return
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

          {watchedRole === 'STAFF' && (
            <div className="space-y-2">
              <Label>Module access</Label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-muted/30 p-3">
                {ALL_MODULES.map((mod) => {
                  const checked = watchedPermissions.includes(mod.key)
                  return (
                    <label
                      key={mod.key}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-neutral-800"
                        checked={checked}
                        onChange={() => togglePermission(mod.key)}
                      />
                      <span>{mod.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
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
