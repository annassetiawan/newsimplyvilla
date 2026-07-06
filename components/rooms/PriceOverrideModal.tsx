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
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { setPriceOverride, setPriceOverrideRange, deletePriceOverride } from '@/app/actions/ratePlan'
import type { PriceOverrideData } from './RatePlanDetailClient'

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
        checked ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'
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

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

interface Props {
  open: boolean
  onClose: () => void
  ratePlanId: string
  ratePlanName?: string
  basePrice: number
  dates: string[]
  existing: PriceOverrideData | null
  onSaved: (updates: PriceOverrideData[]) => void
}

export function PriceOverrideModal({ open, onClose, ratePlanId, ratePlanName, basePrice, dates, existing, onSaved }: Props) {
  const isRange = dates.length > 1
  const [isPending, startTransition] = useTransition()

  const [price, setPrice] = useState(
    existing?.price !== null && existing?.price !== undefined ? String(existing.price) : ''
  )
  const [isClosed, setIsClosed] = useState(existing?.isClosed ?? false)
  const [minStay, setMinStay] = useState('')
  const [maxStay, setMaxStay] = useState('')
  const [cta, setCta] = useState(false)
  const [ctd, setCtd] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const priceVal = price === '' ? null : Number(price)
    const restrictions = {
      minStay: minStay ? Number(minStay) : null,
      maxStay: maxStay ? Number(maxStay) : null,
      closedToArrival: cta || null,
      closedToDeparture: ctd || null,
    }

    startTransition(async () => {
      if (isRange) {
        const res = await setPriceOverrideRange({
          ratePlanId,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
          price: isClosed ? null : priceVal,
          isClosed,
          ...restrictions,
        })
        if (res.success) {
          onSaved(
            dates.map((date) => ({
              id: '',
              ratePlanId,
              date,
              price: isClosed ? null : priceVal,
              isClosed,
            }))
          )
          toast.success(`${dates.length} tanggal diperbarui`)
          onClose()
        } else {
          toast.error('Gagal menyimpan')
        }
      } else {
        const res = await setPriceOverride({
          ratePlanId,
          date: dates[0],
          price: isClosed ? null : priceVal,
          isClosed,
          ...restrictions,
        })
        if (res.success) {
          onSaved([{
            id: existing?.id ?? '',
            ratePlanId,
            date: dates[0],
            price: isClosed ? null : priceVal,
            isClosed,
          }])
          toast.success('Harga disimpan')
          onClose()
        } else {
          toast.error('Gagal menyimpan')
        }
      }
    })
  }

  function handleReset() {
    if (!existing) return
    startTransition(async () => {
      const res = await deletePriceOverride(ratePlanId, dates[0])
      if (res.success) {
        onSaved([{ id: existing.id, ratePlanId, date: dates[0], price: null, isClosed: false }])
        toast.success('Reset ke harga dasar')
        onClose()
      } else {
        toast.error('Gagal reset')
      }
    })
  }

  const planLabel = ratePlanName ? ` · ${ratePlanName}` : ''
  const title = isRange
    ? `Set Harga: ${fmtDate(dates[0])} — ${fmtDate(dates[dates.length - 1])} (${dates.length} hari)${planLabel}`
    : `Set Harga: ${fmtDate(dates[0])}${planLabel}`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Close toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Tutup Tanggal Ini</p>
              <p className="text-xs text-muted-foreground">Tidak menerima pemesanan</p>
            </div>
            <Toggle
              checked={isClosed}
              onChange={setIsClosed}
              disabled={isPending}
              ariaLabel="Tandai tanggal ditutup"
            />
          </div>

          {/* Price input */}
          {!isClosed && (
            <div className="space-y-1.5">
              <Label htmlFor="po-price">
                Harga Override
                <span className="ml-1 text-xs text-muted-foreground">
                  (kosongkan untuk pakai harga dasar)
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                <Input
                  id="po-price"
                  type="number"
                  min="0"
                  step="1000"
                  className="pl-8"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={String(basePrice)}
                />
              </div>
            </div>
          )}

          {/* Restrictions */}
          {!isClosed && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pembatasan (opsional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="po-min-stay" className="text-xs">Min malam</Label>
                  <Input
                    id="po-min-stay"
                    type="number"
                    min={1}
                    placeholder="1"
                    value={minStay}
                    onChange={(e) => setMinStay(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="po-max-stay" className="text-xs">Maks malam</Label>
                  <Input
                    id="po-max-stay"
                    type="number"
                    min={1}
                    placeholder="—"
                    value={maxStay}
                    onChange={(e) => setMaxStay(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="po-cta" checked={cta} onCheckedChange={(v) => setCta(!!v)} />
                  <Label htmlFor="po-cta" className="text-xs cursor-pointer">Tutup Check-in (CTA)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="po-ctd" checked={ctd} onCheckedChange={(v) => setCtd(!!v)} />
                  <Label htmlFor="po-ctd" className="text-xs cursor-pointer">Tutup Check-out (CTD)</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {!isRange && existing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isPending}
                className="mr-auto"
              >
                Reset ke Default
              </Button>
            )}
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
