'use client'

import { useState, useTransition } from 'react'
import { Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { upsertRestriction } from '@/app/actions/ratePlan'
import type { RestrictionData } from './RatePlanDetailClient'

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
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

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {show && (
        <span className="absolute left-5 top-0 z-10 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-foreground shadow-md">
          {text}
        </span>
      )}
    </span>
  )
}

interface Props {
  ratePlanId: string
  initial: RestrictionData | null
}

export function RestrictionForm({ ratePlanId, initial }: Props) {
  const [isPending, startTransition] = useTransition()

  const [minStay, setMinStay] = useState(String(initial?.minStay ?? 1))
  const [hasMaxStay, setHasMaxStay] = useState(initial?.maxStay != null)
  const [maxStay, setMaxStay] = useState(String(initial?.maxStay ?? ''))
  const [closedToArrival, setClosedToArrival] = useState(initial?.closedToArrival ?? false)
  const [closedToDeparture, setClosedToDeparture] = useState(initial?.closedToDeparture ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await upsertRestriction({
        ratePlanId,
        minStay: Number(minStay) || 1,
        maxStay: hasMaxStay && maxStay ? Number(maxStay) : null,
        closedToArrival,
        closedToDeparture,
      })
      if (res.success) {
        toast.success('Pengaturan restriksi disimpan')
      } else {
        toast.error('Gagal menyimpan')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6 space-y-6 max-w-xl">
      <div>
        <h3 className="text-base font-semibold">Restrictions</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Atur batasan pemesanan untuk rate plan ini. Berlaku untuk semua tanggal secara default.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Min stay */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="min-stay">Minimum Malam</Label>
            <Tooltip text="Tamu harus memesan minimal sejumlah malam ini. Contoh: 2 berarti minimal 2 malam." />
          </div>
          <Input
            id="min-stay"
            type="number"
            min="1"
            max="365"
            value={minStay}
            onChange={(e) => setMinStay(e.target.value)}
            className="max-w-[120px]"
          />
        </div>

        {/* Max stay */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label>Maksimum Malam</Label>
            <Tooltip text="Tamu tidak bisa memesan lebih dari jumlah malam ini. Opsional." />
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={hasMaxStay} onChange={setHasMaxStay} disabled={isPending} />
            <span className="text-sm text-muted-foreground">
              {hasMaxStay ? 'Ada batas maksimum' : 'Tidak ada batas maksimum'}
            </span>
          </div>
          {hasMaxStay && (
            <Input
              type="number"
              min="1"
              max="365"
              value={maxStay}
              onChange={(e) => setMaxStay(e.target.value)}
              placeholder="e.g. 14"
              className="max-w-[120px]"
            />
          )}
        </div>

        {/* CTA + CTD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">Tutup untuk Check-in</p>
                <Tooltip text="Tamu tidak bisa memulai reservasi (check-in) pada tanggal yang memiliki flag ini." />
              </div>
              <p className="text-xs text-muted-foreground">
                Tamu tidak bisa check-in di tanggal yang ditandai ini
              </p>
            </div>
            <Toggle checked={closedToArrival} onChange={setClosedToArrival} disabled={isPending} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">Tutup untuk Check-out</p>
                <Tooltip text="Tamu tidak bisa mengakhiri reservasi (check-out) pada tanggal yang memiliki flag ini." />
              </div>
              <p className="text-xs text-muted-foreground">
                Tamu tidak bisa check-out di tanggal yang ditandai ini
              </p>
            </div>
            <Toggle checked={closedToDeparture} onChange={setClosedToDeparture} disabled={isPending} />
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </form>
    </div>
  )
}
