'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createRatePlan, updateRatePlan } from '@/app/actions/ratePlan'
import type { RatePlanData } from './RoomDetailClient'

interface Props {
  open: boolean
  onClose: () => void
  roomId: string
  initial: RatePlanData | null
  onSaved: (plan: RatePlanData) => void
}

function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
        checked ? 'bg-neutral-800' : 'bg-gray-200 dark:bg-gray-700'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function RatePlanModal({ open, onClose, roomId, initial, onSaved }: Props) {
  const isEdit = !!initial
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(initial?.name ?? '')
  const [basePrice, setBasePrice] = useState(initial ? String(initial.basePrice) : '')
  const [sellMode, setSellMode] = useState<'per_room' | 'per_person'>(
    (initial?.sellMode as 'per_room' | 'per_person') ?? 'per_room'
  )
  const [maxPersons, setMaxPersons] = useState(String(initial?.maxPersons ?? 2))
  const [isRefundable, setIsRefundable] = useState(initial?.isRefundable ?? true)
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = Number(basePrice)
    if (!name.trim()) { setError('Nama rate plan wajib diisi'); return }
    if (isNaN(price) || price < 0) { setError('Harga tidak valid'); return }
    setError('')

    startTransition(async () => {
      const data = {
        roomId,
        name: name.trim(),
        basePrice: price,
        sellMode,
        maxPersons: Number(maxPersons),
        isRefundable,
        isActive,
      }

      if (isEdit && initial) {
        const res = await updateRatePlan(initial.id, data)
        if (res.success) {
          onSaved({ ...initial, ...data })
          toast.success('Rate plan diperbarui')
          onClose()
        } else {
          toast.error('Gagal menyimpan')
        }
      } else {
        const res = await createRatePlan(data)
        if (res.success) {
          onSaved({
            id: res.id!,
            roomId,
            name: data.name,
            basePrice: data.basePrice,
            currency: 'IDR',
            sellMode: data.sellMode,
            maxPersons: data.maxPersons,
            isRefundable: data.isRefundable,
            isActive: data.isActive,
            createdAt: new Date().toISOString(),
          })
          toast.success('Rate plan ditambahkan')
          onClose()
        } else {
          toast.error('Gagal menyimpan')
        }
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Rate Plan' : 'Tambah Rate Plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-name">Nama Rate Plan</Label>
            <Input
              id="rp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard, Early Bird, Non-Refundable"
              required
            />
          </div>

          {/* Base price */}
          <div className="space-y-1.5">
            <Label htmlFor="rp-price">Harga Dasar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Input
                id="rp-price"
                type="number"
                min="0"
                step="1000"
                className="pl-8"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="500000"
                required
              />
            </div>
          </div>

          {/* Sell mode + max persons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Sell Mode</Label>
              <Select value={sellMode} onValueChange={(v) => setSellMode(v as 'per_room' | 'per_person')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_room">Per Kamar</SelectItem>
                  <SelectItem value="per_person">Per Orang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-persons">Max Persons</Label>
              <Input
                id="rp-persons"
                type="number"
                min="1"
                value={maxPersons}
                onChange={(e) => setMaxPersons(e.target.value)}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Refundable</p>
                <p className="text-xs text-muted-foreground">Tamu bisa batalkan dan dapat refund</p>
              </div>
              <Toggle
                checked={isRefundable}
                onChange={setIsRefundable}
                disabled={isPending}
                ariaLabel="Ubah refundable rate plan"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Status Aktif</p>
                <p className="text-xs text-muted-foreground">Rate plan ditampilkan ke tamu</p>
              </div>
              <Toggle
                checked={isActive}
                onChange={setIsActive}
                disabled={isPending}
                ariaLabel="Ubah status aktif rate plan"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
