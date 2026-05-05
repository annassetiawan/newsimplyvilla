'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { joinWaitlist } from '@/app/actions/waitlist'

interface Props {
  isOpen: boolean
  onClose: () => void
  billingPeriod: 'bulanan' | 'tahunan'
}

const schema = z.object({
  email: z.string().email('Format email tidak valid'),
  billing: z.enum(['bulanan', 'tahunan']),
})
type Values = z.infer<typeof schema>

export function WaitlistModal({ isOpen, onClose, billingPeriod }: Props) {
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', billing: billingPeriod },
  })

  function onSubmit(data: Values) {
    startTransition(async () => {
      const result = await joinWaitlist(data.email)
      if (!result.success) {
        form.setError('email', { message: result.message })
        return
      }
      setSubmittedEmail(data.email)
      setSubmitted(true)
    })
  }

  function handleClose() {
    onClose()
    setTimeout(() => {
      setSubmitted(false)
      setSubmittedEmail('')
      form.reset({ email: '', billing: billingPeriod })
    }, 300)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold">Kamu sudah terdaftar! 🎉</h3>
              <p className="text-sm text-muted-foreground">
                Kami akan kirim email ke{' '}
                <span className="font-medium text-foreground">{submittedEmail}</span> begitu
                SimplyVilla Pro siap. Stay tuned!
              </p>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Tutup
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E1A62F22]">
                  <Mail className="h-5 w-5 text-[#E1A62F]" />
                </div>
                <DialogTitle className="text-[15px] font-semibold leading-snug">
                  Dapatkan akses pertama ke Pro
                </DialogTitle>
              </div>
            </DialogHeader>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Pembayaran sedang dalam tahap persiapan. Daftarkan email kamu dan kami akan
              notifikasi begitu Pro tersedia — plus kamu dapat early bird discount 20%.
            </p>

            <div className="rounded-lg bg-[#E1A62F11] border border-[#E1A62F33] px-3 py-2.5 text-xs font-medium text-amber-800">
              🎉 Early bird: diskon 20% untuk 50 pendaftar pertama
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="kamu@email.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Preferensi billing</Label>
                <div className="flex gap-2">
                  {(['bulanan', 'tahunan'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => form.setValue('billing', opt)}
                      className={cn(
                        'flex-1 rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors',
                        form.watch('billing') === opt
                          ? 'border-[#E1A62F] bg-[#E1A62F11] text-amber-800'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt === 'bulanan' ? (
                        <>
                          <div className="font-semibold">Bulanan</div>
                          <div className="text-[10px] opacity-70">Rp 299K/bln</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold">Tahunan</div>
                          <div className="text-[10px] opacity-70">Rp 2.99M/thn — hemat 2 bulan</div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full"
                style={{ backgroundColor: '#E1A62F' }}
              >
                {pending ? 'Mendaftar...' : 'Daftarkan saya'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
