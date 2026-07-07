'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CalendarRange, Send, Plus, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { pushAriDeltaForDateRange, batchPushAriDelta } from '@/app/actions/channex'

interface RatePlanOption {
  id: string
  name: string
  roomName: string
  basePrice: number
}

interface Props {
  ratePlans: RatePlanOption[]
}

interface BatchEntry {
  id: string
  ratePlanId: string
  dateFrom: string
  dateTo: string
  price: string
  minStay: string
  maxStay: string
  stopSell: boolean
  cta: boolean
  ctd: boolean
}

function emptyEntry(ratePlans: RatePlanOption[]): BatchEntry {
  return {
    id: Math.random().toString(36).slice(2),
    ratePlanId: ratePlans[0]?.id ?? '',
    dateFrom: '',
    dateTo: '',
    price: '',
    minStay: '',
    maxStay: '',
    stopSell: false,
    cta: false,
    ctd: false,
  }
}

export function ChannexAriOverride({ ratePlans }: Props) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // Single mode state
  const [ratePlanId, setRatePlanId] = useState(ratePlans[0]?.id ?? '')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [price, setPrice] = useState('')
  const [minStay, setMinStay] = useState('')
  const [maxStay, setMaxStay] = useState('')
  const [stopSell, setStopSell] = useState(false)
  const [cta, setCta] = useState(false)
  const [ctd, setCtd] = useState(false)

  // Batch mode state
  const [entries, setEntries] = useState<BatchEntry[]>(() => [emptyEntry(ratePlans)])

  function handleSingleSubmit(e: React.FormEvent) {
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
        ratePlanId, dateFrom, dateTo,
        price: price ? Number(price) : null,
        minStay: minStay ? Number(minStay) : null,
        maxStay: maxStay ? Number(maxStay) : null,
        stopSell, closedToArrival: cta, closedToDeparture: ctd,
      })
      if (res.success) toast.success(res.message ?? 'Berhasil di-push ke Channex')
      else toast.error(res.message ?? 'Gagal push ke Channex')
    })
  }

  function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = entries.filter((en) => en.ratePlanId && en.dateFrom && en.dateTo && en.dateFrom <= en.dateTo)
    if (valid.length === 0) {
      toast.error('Isi minimal 1 baris dengan rate plan dan tanggal yang valid')
      return
    }
    startTransition(async () => {
      const res = await batchPushAriDelta(
        valid.map((en) => ({
          ratePlanId: en.ratePlanId,
          dateFrom: en.dateFrom,
          dateTo: en.dateTo,
          price: en.price ? Number(en.price) : null,
          minStay: en.minStay ? Number(en.minStay) : null,
          maxStay: en.maxStay ? Number(en.maxStay) : null,
          stopSell: en.stopSell,
          closedToArrival: en.cta,
          closedToDeparture: en.ctd,
        }))
      )
      if (res.success) {
        toast.success(res.message ?? 'Berhasil di-push ke Channex')
        setEntries([emptyEntry(ratePlans)])
      } else {
        toast.error(res.message ?? 'Gagal push ke Channex')
      }
    })
  }

  function updateEntry(id: string, patch: Partial<BatchEntry>) {
    setEntries((prev) => prev.map((en) => en.id === id ? { ...en, ...patch } : en))
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.length > 1 ? prev.filter((en) => en.id !== id) : prev)
  }

  if (ratePlans.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Tidak ada rate plan aktif. Buat rate plan di halaman Kamar terlebih dahulu.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium flex-1">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          Atur Harga &amp; Pembatasan per Tanggal
        </div>
        <div className="flex gap-1">
          {(['single', 'batch'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border transition-colors',
                mode === m
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'batch' && <Layers className="h-3 w-3" />}
              {m === 'single' ? 'Single' : 'Batch'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {mode === 'single'
          ? 'Override satu rate plan. Kosongkan field yang tidak ingin diubah.'
          : 'Tambah beberapa baris, lalu kirim semua dalam 1 API call ke Channex.'}
      </p>

      {/* Single mode */}
      {mode === 'single' && (
        <form onSubmit={handleSingleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Rate Plan</Label>
            <Select value={ratePlanId} onValueChange={setRatePlanId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ratePlans.map((rp) => (
                  <SelectItem key={rp.id} value={rp.id} className="text-xs">
                    {rp.roomName} — {rp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Mulai</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-xs" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tanggal Akhir</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-xs" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Harga (opsional)</Label>
              <Input type="number" placeholder={ratePlans.find((r) => r.id === ratePlanId)?.basePrice.toString()} value={price} onChange={(e) => setPrice(e.target.value)} min={0} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Min Malam</Label>
              <Input type="number" placeholder="1" value={minStay} onChange={(e) => setMinStay(e.target.value)} min={1} className="h-8 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Maks Malam</Label>
              <Input type="number" placeholder="—" value={maxStay} onChange={(e) => setMaxStay(e.target.value)} min={1} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { id: 'ss', label: 'Stop Sell', checked: stopSell, setter: setStopSell },
              { id: 'cta', label: 'Tutup Check-in (CTA)', checked: cta, setter: setCta },
              { id: 'ctd', label: 'Tutup Check-out (CTD)', checked: ctd, setter: setCtd },
            ].map(({ id, label, checked, setter }) => (
              <div key={id} className="flex items-center gap-2">
                <Checkbox id={id} checked={checked} onCheckedChange={(v) => setter(!!v)} />
                <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
          <Button type="submit" disabled={isPending} size="sm" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {isPending ? 'Mengirim...' : 'Push ke Channex'}
          </Button>
        </form>
      )}

      {/* Batch mode */}
      {mode === 'batch' && (
        <form onSubmit={handleBatchSubmit} className="space-y-3">
          <div className="space-y-2">
            {entries.map((en, idx) => (
              <div key={en.id} className="rounded-lg border border-border p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Baris {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeEntry(en.id)}
                    disabled={entries.length === 1}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <Select value={en.ratePlanId} onValueChange={(v) => updateEntry(en.id, { ratePlanId: v })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ratePlans.map((rp) => (
                      <SelectItem key={rp.id} value={rp.id} className="text-xs">
                        {rp.roomName} — {rp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={en.dateFrom} onChange={(e) => updateEntry(en.id, { dateFrom: e.target.value })} className="h-7 text-xs" placeholder="Dari" />
                  <Input type="date" value={en.dateTo} onChange={(e) => updateEntry(en.id, { dateTo: e.target.value })} className="h-7 text-xs" placeholder="Sampai" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Harga" value={en.price} onChange={(e) => updateEntry(en.id, { price: e.target.value })} min={0} className="h-7 text-xs" />
                  <Input type="number" placeholder="Min mlm" value={en.minStay} onChange={(e) => updateEntry(en.id, { minStay: e.target.value })} min={1} className="h-7 text-xs" />
                  <Input type="number" placeholder="Maks mlm" value={en.maxStay} onChange={(e) => updateEntry(en.id, { maxStay: e.target.value })} min={1} className="h-7 text-xs" />
                </div>

                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'stopSell' as const, label: 'Stop Sell' },
                    { key: 'cta' as const, label: 'CTA' },
                    { key: 'ctd' as const, label: 'CTD' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <Checkbox
                        id={`${en.id}-${key}`}
                        checked={en[key] as boolean}
                        onCheckedChange={(v) => updateEntry(en.id, { [key]: !!v })}
                      />
                      <Label htmlFor={`${en.id}-${key}`} className="text-xs cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => setEntries((prev) => [...prev, emptyEntry(ratePlans)])}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Baris
          </Button>

          <Button type="submit" disabled={isPending} size="sm" className="w-full gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {isPending ? 'Mengirim...' : `Push Semua (${entries.length} perubahan) — 1 API Call`}
          </Button>
        </form>
      )}
    </div>
  )
}
