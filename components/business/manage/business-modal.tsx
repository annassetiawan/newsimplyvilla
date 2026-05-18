'use client'

import { useEffect, useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
import { createBusiness, updateBusiness } from '@/app/actions/business'
import type { BusinessType } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  type: z.string().min(1, 'Tipe wajib diisi'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  editing: BusinessType | null
}

export function BusinessModal({ open, onClose, editing }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', type: '', description: '', status: 'ACTIVE' },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name,
              type: editing.type,
              description: editing.description ?? '',
              status: editing.status,
            }
          : { name: '', type: '', description: '', status: 'ACTIVE' }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateBusiness(editing.id, data)
        : await createBusiness({ name: data.name, type: data.type, description: data.description })

      if (result?.success === false) {
        toast.error(result.message)
        return
      }
      toast.success(editing ? 'Bisnis diperbarui' : 'Bisnis ditambahkan')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Bisnis' : 'Tambah Bisnis'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nama Bisnis</Label>
            <Input placeholder="cth: Cafe Bukit" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <Input placeholder="cth: Cafe, Laundry, Spa..." {...form.register('type')} />
            {form.formState.errors.type && (
              <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Deskripsi</Label>
            <Textarea
              placeholder="Opsional..."
              rows={3}
              className="resize-none"
              {...form.register('description')}
            />
          </div>
          {editing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktif</SelectItem>
                      <SelectItem value="INACTIVE">Nonaktif</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Menyimpan...' : editing ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
