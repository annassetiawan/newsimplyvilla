'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
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
import { Controller } from 'react-hook-form'
import { createBusinessItem, updateBusinessItem } from '@/app/actions/business'
import { ImageUpload } from './image-upload'
import type { BusinessItemType } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  price: z.number().min(0, 'Harga minimal 0'),
  category: z.string().min(1, 'Kategori wajib diisi'),
  stock: z.number().min(0, 'Stok minimal 0'),
  photo: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  businessId: string
  editing: BusinessItemType | null
}

export function ItemModal({ open, onClose, businessId, editing }: Props) {
  const [pending, startTransition] = useTransition()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', price: 0, category: '', stock: 0, photo: '' },
  })

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name,
              price: editing.price,
              category: editing.category,
              stock: editing.stock,
              photo: editing.photo ?? '',
            }
          : { name: '', price: 0, category: '', stock: 0, photo: '' }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing])

  function onSubmit(data: FormValues) {
    startTransition(async () => {
      const result = editing
        ? await updateBusinessItem(editing.id, {
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            photo: data.photo || undefined,
          })
        : await createBusinessItem({
            businessId,
            name: data.name,
            price: data.price,
            category: data.category,
            stock: data.stock,
            photo: data.photo || undefined,
          })

      if (result?.success === false) {
        toast.error(result.message)
        return
      }
      toast.success(editing ? 'Item diperbarui' : 'Item ditambahkan')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Item' : 'Tambah Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Nama Item</Label>
            <Input placeholder="cth: Kopi Susu, Cuci Baju..." {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Harga (Rp)</Label>
              <Input
                type="number"
                min={0}
                {...form.register('price', { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Stok</Label>
              <Input
                type="number"
                min={0}
                {...form.register('stock', { valueAsNumber: true })}
              />
              {form.formState.errors.stock && (
                <p className="text-xs text-destructive">{form.formState.errors.stock.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Input placeholder="cth: Minuman, Makanan..." {...form.register('category')} />
            {form.formState.errors.category && (
              <p className="text-xs text-destructive">{form.formState.errors.category.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Foto (opsional)</Label>
            <Controller
              name="photo"
              control={form.control}
              render={({ field }) => (
                <ImageUpload value={field.value ?? ''} onChange={field.onChange} />
              )}
            />
          </div>
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
