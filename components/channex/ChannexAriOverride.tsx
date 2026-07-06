'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CalendarRange, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pushAriDeltaForDateRange } from '@/app/actions/channex'

interface RatePlanOption {
  id: string
  name: string
  roomName: string
  basePrice: number
}

interface Props {
  ratePlans: RatePlanOption[]
}

export function ChannexAriOverride({ ratePlans }: Props) {
  const [isPending, startTransition] = useTransition()

  const [ratePlanId, setRatePlanId] = useState(ratePlans[0]?.id ?? '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [price, setPrice] = useState('')
  const [minStay, setMinStay] = useState('')
  const [maxStay, setMaxStay] = useState('')
  const [stopSell, setStopSell] = useState(false)
  const [cta, setCta] = useState(false)
  const [ctd, setCtd] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ratePlanId || !dateFrom || !dateTo) {
      toast.error('Rate plan dan rentang tanggal wajib diisi')
      return
    }
    if (dateFrom > dateTo) {
      toast.error('Tanggal mulai harus sebelum tanggal akhir')
      return
    }

    startTransition(async () => {
      const res = await pushAriDeltaForDateRange({
        ratePlanId,
        dateFrom,
        dateTo,
        price: price ? Number(price) : null,
        minStay: minStay ? Number(minStay) : null,
        maxStay: maxStay ? Number(maxStay) : null,
        stopSell,
        closedToArrival: cta,
        closedToDeparture: ctd,
      })
      if (res.success) toast.success(res.message ?? 'Berhasil di-push ke Channex')
      else toast.error(res.message ?? 'Gagal push ke Channex')
    })
  }

  if (ratePlans.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Tidak ada rate plan aktif. Buat rate plan di halaman Kamar terlebih dahulu.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
        Atur Harga & Pembatasan per Tanggal
      </div>

      <p className="text-xs text-muted-foreground">
        Override harga atau pembatasan untuk rentang tanggal tertentu. Kosongkan field yang tidak ingin diubah.
      </p>

      {/* Rate plan */}
      <div className="space-y-1.5">
        <Label className="text-xs">Rate Plan</Label>
        <Select value={ratePlanId} onValueChange={setRatePlanId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ratePlans.map((rp) => (
              <SelectItem key={rp.id} value={rp.id} className="text-xs">
                {rp.roomName} — {rp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Tanggal Mulai</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 text-xs"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tanggal Akhir</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-8 text-xs"
            required
          />
        </div>
      </div>

      {/* Rate & stay */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Harga (opsional)</Label>
          <Input
            type="number"
            placeholder={ratePlans.find((r) => r.id === ratePlanId)?.basePrice.toString()}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Min Malam</Label>
          <Input
            type="number"
            placeholder="1"
            value={minStay}
            onChange={(e) => setMinStay(e.target.value)}
            min={1}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Maks Malam</Label>
          <Input
            type="number"
            placeholder="—"
            value={maxStay}
            onChange={(e) => setMaxStay(e.target.value)}
            min={1}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Restrictions */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="stop-sell"
            checked={stopSell}
            onCheckedChange={(v) => setStopSell(!!v)}
          />
          <Label htmlFor="stop-sell" className="text-xs cursor-pointer">Stop Sell</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="cta"
            checked={cta}
            onCheckedChange={(v) => setCta(!!v)}
          />
          <Label htmlFor="cta" className="text-xs cursor-pointer">Tutup Check-in (CTA)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="ctd"
            checked={ctd}
            onCheckedChange={(v) => setCtd(!!v)}
          />
          <Label htmlFor="ctd" className="text-xs cursor-pointer">Tutup Check-out (CTD)</Label>
        </div>
      </div>

      <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
        <Send className="h-3.5 w-3.5" />
        {isPending ? 'Mengirim...' : 'Push ke Channex'}
      </Button>
    </form>
  )
}
