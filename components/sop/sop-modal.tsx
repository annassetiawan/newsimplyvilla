'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSOP, updateSOP } from '@/app/actions/sop'
import type { SOPData } from './sop-client'

const CATEGORIES = [
  { value: 'FRONT_DESK', label: 'Front Desk' },
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'SAFETY', label: 'Safety' },
] as const

const schema = z.object({
  title: z.string().min(1, 'Required'),
  category: z.enum(['FRONT_DESK', 'HOUSEKEEPING', 'MAINTENANCE', 'INVENTORY', 'SAFETY']),
  estimatedMinutes: z.number().min(1),
  steps: z.array(z.object({ text: z.string().min(1) })).min(1, 'At least one step required'),
})
type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  initial?: SOPData | null
}

export function SOPModal({ open, onClose, initial }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: 'FRONT_DESK',
      estimatedMinutes: 15,
      steps: [{ text: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'steps' })

  useEffect(() => {
    if (open) {
      if (initial) {
        form.reset({
          title: initial.title,
          category: initial.category as Values['category'],
          estimatedMinutes: initial.estimatedMinutes,
          steps: initial.steps.map((s) => ({ text: s.text })),
        })
      } else {
        form.reset({
          title: '',
          category: 'FRONT_DESK',
          estimatedMinutes: 15,
          steps: [{ text: '' }],
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function onSubmit(data: Values) {
    startTransition(async () => {
      const steps = data.steps.map((s, i) => ({ step: i + 1, text: s.text }))
      if (initial) {
        await updateSOP(initial.id, {
          title: data.title,
          category: data.category,
          estimatedMinutes: data.estimatedMinutes,
          steps,
        })
      } else {
        await createSOP({
          title: data.title,
          category: data.category,
          estimatedMinutes: data.estimatedMinutes,
          steps,
        })
      }
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit SOP' : 'New SOP'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="SOP title..." {...form.register('title')} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estimated time (min)</Label>
              <Input
                type="number"
                min={1}
                {...form.register('estimatedMinutes', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Steps</Label>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    {index + 1}
                  </div>
                  <Textarea
                    rows={2}
                    placeholder={`Step ${index + 1}...`}
                    className="min-h-0 flex-1 resize-none text-sm"
                    {...form.register(`steps.${index}.text`)}
                  />
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => append({ text: '' })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add step
            </Button>
            {form.formState.errors.steps && (
              <p className="text-xs text-destructive">
                {form.formState.errors.steps.message ?? 'All steps must have text'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : initial ? 'Save changes' : 'Create SOP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
