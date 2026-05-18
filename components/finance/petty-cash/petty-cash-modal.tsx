'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createPettyCash } from '@/app/actions/finance'

interface Props {
  open: boolean
  onClose: () => void
}

export function PettyCashModal({ open, onClose }: Props) {
  const [type, setType] = useState<'IN' | 'OUT'>('OUT')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [isPending, startTransition] = useTransition()

  function reset() {
    setType('OUT')
    setDescription('')
    setAmount('')
    setNote('')
    setDate(new Date().toISOString().split('T')[0])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!description.trim() || !amt || amt <= 0) {
      toast.error('Isi semua field yang diperlukan')
      return
    }
    startTransition(async () => {
      const result = await createPettyCash({
        description: description.trim(),
        type,
        amount: amt,
        note: note.trim() || undefined,
        date: new Date(date).toISOString(),
      })
      if (result.success) {
        toast.success('Transaksi petty cash ditambahkan')
        handleClose()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Petty Cash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Type toggle */}
          <div className="space-y-1.5">
            <Label>Tipe</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                  type === 'IN'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Masuk (IN)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                  type === 'OUT'
                    ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Keluar (OUT)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Keterangan</Label>
            <Input
              placeholder="Contoh: Beli perlengkapan kebersihan"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Jumlah (Rp)</Label>
            <Input
              type="number"
              min="1"
              placeholder="Contoh: 150000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea
              placeholder="Catatan tambahan..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {isPending ? 'Menyimpan...' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
