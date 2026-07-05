'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.email('Invalid email address'),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmittedEmail(values.email)
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SimplyVilla</h1>
          <p className="mt-1 text-sm text-muted-foreground">Villa Management Platform</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          {submitted ? (
            <div className="text-center">
              <div className="mb-3 flex justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold">Cek email kamu</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Kami kirim link reset password ke{' '}
                <span className="font-medium text-foreground">{submittedEmail}</span>. Cek folder
                spam jika tidak muncul.
              </p>
              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Reset password</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Masukkan email dan kami kirim link reset password.
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@villa.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim…' : 'Kirim link reset'}
                </Button>
              </form>
              <Link
                href="/login"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali ke halaman masuk
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
