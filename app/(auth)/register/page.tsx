'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Eye, EyeOff, ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { registerUser } from '@/app/actions/auth'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const step1Schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const step2Schema = z.object({
  villaName: z.string().min(2, 'Villa name is required'),
  villaAddress: z.string().min(5, 'Address is required'),
  villaCity: z.string().min(2, 'City is required'),
  villaPhone: z.string().min(6, 'Phone number is required'),
})

const step3Schema = z
  .object({
    roomCode: z.string().optional(),
    roomName: z.string().optional(),
    roomCapacity: z.string().optional(),
    roomPrice: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const anyFilled =
      data.roomCode?.trim() ||
      data.roomName?.trim() ||
      data.roomCapacity?.trim() ||
      data.roomPrice?.trim()
    if (!anyFilled) return
    if (!data.roomCode?.trim())
      ctx.addIssue({ code: 'custom', path: ['roomCode'], message: 'Wajib diisi' })
    if (!data.roomName?.trim())
      ctx.addIssue({ code: 'custom', path: ['roomName'], message: 'Wajib diisi' })
    if (!data.roomCapacity?.trim())
      ctx.addIssue({ code: 'custom', path: ['roomCapacity'], message: 'Wajib diisi' })
    if (!data.roomPrice?.trim())
      ctx.addIssue({ code: 'custom', path: ['roomPrice'], message: 'Wajib diisi' })
  })

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type Step3Values = z.infer<typeof step3Schema>

// ─── Progress Indicator ───────────────────────────────────────────────────────

function ProgressSteps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Akun', 'Villa', 'Kamar']
  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {steps.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3
        const isCompleted = stepNum < current
        const isActive = stepNum === current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                  isCompleted
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border-2 border-border bg-background text-muted-foreground',
                ].join(' ')}
              >
                {isCompleted ? '✓' : stepNum}
              </div>
              <span
                className={[
                  'mt-1 text-[10px] font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={[
                  'mb-4 h-px w-12',
                  isCompleted ? 'bg-primary' : 'bg-border',
                ].join(' ')}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [rootError, setRootError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Accumulated form data
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null)

  const form1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Values>({ resolver: zodResolver(step3Schema) })

  const onStep1 = (values: Step1Values) => {
    setStep1Data(values)
    setStep(2)
  }

  const onStep2 = (values: Step2Values) => {
    setStep2Data(values)
    setStep(3)
  }

  const onStep3 = async (values: Step3Values, skipRoom = false) => {
    if (!step1Data || !step2Data) return
    setIsSubmitting(true)
    setRootError('')

    const hasRoom =
      !skipRoom &&
      Boolean(values.roomCode?.trim()) &&
      Boolean(values.roomName?.trim()) &&
      Boolean(values.roomCapacity?.trim()) &&
      Boolean(values.roomPrice?.trim())

    const result = await registerUser({
      name: step1Data.name,
      email: step1Data.email,
      password: step1Data.password,
      villaName: step2Data.villaName,
      villaAddress: step2Data.villaAddress,
      villaCity: step2Data.villaCity,
      villaPhone: step2Data.villaPhone,
      firstRoom: hasRoom
        ? {
            code: values.roomCode!,
            name: values.roomName!,
            capacity: parseInt(values.roomCapacity!, 10),
            pricePerNight: parseFloat(values.roomPrice!),
          }
        : undefined,
    })

    if (!result.success) {
      setRootError(result.message ?? 'Registration failed. Please try again.')
      setIsSubmitting(false)
      return
    }

    // Sign in on the client so session cookie is set
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: step1Data.email,
      password: step1Data.password,
    })
    if (signInError) {
      setRootError('Account created — please sign in.')
      router.push('/login')
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          <ProgressSteps current={step} />

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Buat akun</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Langkah 1 dari 3</p>
              </div>
              <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" placeholder="Nama lengkap" {...form1.register('name')} />
                  {form1.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form1.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@villa.com"
                    autoComplete="email"
                    {...form1.register('email')}
                  />
                  {form1.formState.errors.email && (
                    <p className="text-xs text-destructive">
                      {form1.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 karakter"
                      className="pr-10"
                      {...form1.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form1.formState.errors.password && (
                    <p className="text-xs text-destructive">
                      {form1.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Konfirmasi password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      className="pr-10"
                      {...form1.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {form1.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {form1.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Lanjut <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Masuk
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: Villa Setup ── */}
          {step === 2 && (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Setup villa</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Langkah 2 dari 3</p>
              </div>
              <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="villaName">Nama villa</Label>
                  <Input
                    id="villaName"
                    placeholder="Villa Senja Ubud"
                    {...form2.register('villaName')}
                  />
                  {form2.formState.errors.villaName && (
                    <p className="text-xs text-destructive">
                      {form2.formState.errors.villaName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="villaAddress">Alamat</Label>
                  <Input
                    id="villaAddress"
                    placeholder="Jl. Raya Ubud No. 10"
                    {...form2.register('villaAddress')}
                  />
                  {form2.formState.errors.villaAddress && (
                    <p className="text-xs text-destructive">
                      {form2.formState.errors.villaAddress.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="villaCity">Kota</Label>
                  <Input
                    id="villaCity"
                    placeholder="Ubud, Bali"
                    {...form2.register('villaCity')}
                  />
                  {form2.formState.errors.villaCity && (
                    <p className="text-xs text-destructive">
                      {form2.formState.errors.villaCity.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="villaPhone">Nomor telepon</Label>
                  <Input
                    id="villaPhone"
                    type="tel"
                    placeholder="+62 812 3456 7890"
                    {...form2.register('villaPhone')}
                  />
                  {form2.formState.errors.villaPhone && (
                    <p className="text-xs text-destructive">
                      {form2.formState.errors.villaPhone.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                  </Button>
                  <Button type="submit" className="flex-1">
                    Lanjut <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: First Room ── */}
          {step === 3 && (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">Kamar pertama</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Langkah 3 dari 3</p>
              </div>
              {rootError && (
                <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {rootError}
                </p>
              )}
              <form
                onSubmit={form3.handleSubmit((v) => onStep3(v, false))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="roomCode">Kode kamar</Label>
                    <Input
                      id="roomCode"
                      placeholder="FR-01"
                      {...form3.register('roomCode')}
                    />
                    {form3.formState.errors.roomCode && (
                      <p className="text-xs text-destructive">
                        {form3.formState.errors.roomCode.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="roomCapacity">Kapasitas</Label>
                    <Input
                      id="roomCapacity"
                      type="number"
                      placeholder="2"
                      min={1}
                      {...form3.register('roomCapacity')}
                    />
                    {form3.formState.errors.roomCapacity && (
                      <p className="text-xs text-destructive">
                        {form3.formState.errors.roomCapacity.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="roomName">Nama kamar</Label>
                  <Input
                    id="roomName"
                    placeholder="Kamar Deluxe"
                    {...form3.register('roomName')}
                  />
                  {form3.formState.errors.roomName && (
                    <p className="text-xs text-destructive">
                      {form3.formState.errors.roomName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="roomPrice">Harga per malam (Rp)</Label>
                  <Input
                    id="roomPrice"
                    type="number"
                    placeholder="500000"
                    min={0}
                    {...form3.register('roomPrice')}
                  />
                  {form3.formState.errors.roomPrice && (
                    <p className="text-xs text-destructive">
                      {form3.formState.errors.roomPrice.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Mendaftar…' : 'Selesai & Masuk'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    disabled={isSubmitting}
                    onClick={() => onStep3({}, true)}
                  >
                    Tambah kamar nanti
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Kembali
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
