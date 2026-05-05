'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        {/* Branding */}
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
              <h2 className="text-lg font-semibold">Check your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                If <span className="font-medium text-foreground">{email}</span> is registered,
                you&apos;ll receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Reset your password</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@villa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
