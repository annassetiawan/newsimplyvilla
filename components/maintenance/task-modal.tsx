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
import { Textarea } from '@/components/ui/textarea'
import { createTask, updateTask } from '@/app/actions/tasks'

export interface TaskFormData {
  id?: string
  title: string
  type: 'MAINTENANCE' | 'CLEANING'
  location: string
  priority: 'HIGH' | 'MED' | 'LOW'
  assignedTo?: string
  dueDate?: string
}

interface StaffOption {
  id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  initial?: TaskFormData | null
  locationOptions: string[]
  staffOptions: StaffOption[]
}

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['MAINTENANCE', 'CLEANING']),
  location: z.string().min(1, 'Location is required'),
  priority: z.enum(['HIGH', 'MED', 'LOW']),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})
type TaskValues = z.infer<typeof taskSchema>

export function TaskModal({ open, onClose, initial, locationOptions, staffOptions }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      type: 'MAINTENANCE',
      location: '',
      priority: 'MED',
      assignedTo: '',
      dueDate: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        title: initial?.title ?? '',
        type: initial?.type ?? 'MAINTENANCE',
        location: initial?.location ?? '',
        priority: initial?.priority ?? 'MED',
        assignedTo: initial?.assignedTo ?? '',
        dueDate: initial?.dueDate ? initial.dueDate.slice(0, 16) : '',
        notes: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: TaskValues) {
    startTransition(async () => {
      const payload = {
        title: data.title,
        type: data.type,
        location: data.location,
        priority: data.priority,
        assignedTo: data.assignedTo || undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      }
      if (initial?.id) {
        await updateTask(initial.id, payload)
      } else {
        await createTask(payload)
      }
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="Task title..." {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                name="type"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="CLEANING">Cleaning</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MED">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              list="location-options"
              placeholder="Select or type location..."
              {...form.register('location')}
            />
            <datalist id="location-options">
              {locationOptions.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
            {form.formState.errors.location && (
              <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Input
                list="staff-options"
                placeholder="Staff name..."
                {...form.register('assignedTo')}
              />
              <datalist id="staff-options">
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label>Due date &amp; time</Label>
              <Input type="datetime-local" {...form.register('dueDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Additional details..."
              className="min-h-[60px]"
              {...form.register('notes')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : initial ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
