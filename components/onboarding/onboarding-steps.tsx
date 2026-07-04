'use client'

import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import { ArrowLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ALL_MODULES,
  BED_TYPES,
  DEFAULT_PERMISSIONS,
  FACILITIES,
  POSITIONS,
  ROOM_DEFAULT,
  STAFF_DEFAULT,
  type RoomsValues,
  type StaffValues,
  type VillaValues,
} from './onboarding-shared'

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-destructive">{msg}</p>
}

function ErrorBanner({ error }: { error: string }) {
  if (!error) return null
  return (
    <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  )
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

export function WelcomeStep({ userName, onStart }: { userName: string; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 6L4 22h6v20h12V30h4v12h12V22h6L24 6z" fill="#E1A62F" opacity="0.8" />
          <rect x="18" y="30" width="12" height="12" rx="1" fill="#E1A62F" />
          <path d="M24 6L4 22h6v20h12V30h4v12h12V22h6L24 6z" stroke="#C8911A" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Selamat datang di SimplyVilla!</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Kami akan bantu kamu setup villa dalam 3 menit.
      </p>
      <p className="mt-4 text-base font-medium">Halo, {userName}!</p>
      <Button className="mt-8 w-full" onClick={onStart}>
        Mulai setup <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Step 2: Villa profile ────────────────────────────────────────────────────

interface VillaStepProps {
  form: UseFormReturn<VillaValues>
  facilities: string[]
  onToggleFacility: (f: string) => void
  error: string
  isPending: boolean
  onSubmit: (values: VillaValues) => void
  onBack: () => void
}

export function VillaStep({
  form,
  facilities,
  onToggleFacility,
  error,
  isPending,
  onSubmit,
  onBack,
}: VillaStepProps) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Lengkapi profil villa kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi ini akan ditampilkan di sistem manajemen kamu.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Nama villa</Label>
          <Input placeholder="Villa Senja Ubud" {...form.register('name')} />
          <FieldError msg={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label>Alamat lengkap</Label>
          <Input placeholder="Jl. Raya Ubud No. 10" {...form.register('address')} />
          <FieldError msg={form.formState.errors.address?.message} />
        </div>

        <div className="space-y-1.5">
          <Label>Kota</Label>
          <Input placeholder="Ubud, Bali" {...form.register('city')} />
          <FieldError msg={form.formState.errors.city?.message} />
        </div>

        <div className="space-y-1.5">
          <Label>Nomor telepon</Label>
          <Input type="tel" placeholder="+62 812 3456 7890" {...form.register('phone')} />
          <FieldError msg={form.formState.errors.phone?.message} />
        </div>

        <div className="space-y-1.5">
          <Label>Deskripsi singkat <span className="text-muted-foreground">(opsional)</span></Label>
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            rows={3}
            placeholder="Ceritakan sedikit tentang villa kamu..."
            {...form.register('description')}
          />
        </div>

        <div className="space-y-2">
          <Label>Fasilitas tersedia</Label>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onToggleFacility(f)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                  facilities.includes(f)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                )}
              >
                {facilities.includes(f) && <Check className="mr-1 inline h-3 w-3" />}
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </>
  )
}

// ─── Step 3: Rooms ────────────────────────────────────────────────────────────

interface RoomsStepProps {
  form: UseFormReturn<RoomsValues>
  error: string
  isPending: boolean
  onSubmit: (values: RoomsValues) => void
  onBack: () => void
}

export function RoomsStep({ form, error, isPending, onSubmit, onBack }: RoomsStepProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'rooms' })

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Tambahkan kamar pertama kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kamu bisa tambah lebih banyak kamar nanti.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative rounded-lg border border-border bg-muted/30 p-4"
          >
            {index > 0 && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Hapus kamar ${index + 1}`}
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {index > 0 && (
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kamar {index + 1}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kode kamar</Label>
                <Input
                  placeholder="FR-01"
                  {...form.register(`rooms.${index}.code`)}
                />
                <FieldError msg={form.formState.errors.rooms?.[index]?.code?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Kapasitas tamu</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="2"
                  {...form.register(`rooms.${index}.capacity`, { valueAsNumber: true })}
                />
                <FieldError msg={form.formState.errors.rooms?.[index]?.capacity?.message} />
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Nama kamar</Label>
              <Input
                placeholder="Frangipani Suite"
                {...form.register(`rooms.${index}.name`)}
              />
              <FieldError msg={form.formState.errors.rooms?.[index]?.name?.message} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipe tempat tidur</Label>
                <Select
                  defaultValue="King"
                  onValueChange={(v) => form.setValue(`rooms.${index}.bedType`, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BED_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status awal</Label>
                <Select
                  defaultValue="AVAILABLE"
                  onValueChange={(v) =>
                    form.setValue(`rooms.${index}.status`, v as 'AVAILABLE' | 'MAINTENANCE')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <Label>Harga per malam (Rp)</Label>
              <Input
                type="number"
                min={0}
                placeholder="500000"
                {...form.register(`rooms.${index}.pricePerNight`, { valueAsNumber: true })}
              />
              <FieldError msg={form.formState.errors.rooms?.[index]?.pricePerNight?.message} />
            </div>
          </div>
        ))}

        {fields.length < 5 && (
          <button
            type="button"
            onClick={() => append(ROOM_DEFAULT)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Tambah kamar lain
          </button>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </>
  )
}

// ─── Step 4: Staff invite ─────────────────────────────────────────────────────

interface StaffStepProps {
  form: UseFormReturn<StaffValues>
  error: string
  isPending: boolean
  onSubmit: (values: StaffValues) => void
  onBack: () => void
  onSkip: () => void
}

export function StaffStep({ form, error, isPending, onSubmit, onBack, onSkip }: StaffStepProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'staffList' })
  const watchedStaffList = form.watch('staffList')

  function togglePermission(index: number, key: string) {
    const current = form.getValues(`staffList.${index}.permissions`) ?? []
    form.setValue(
      `staffList.${index}.permissions`,
      current.includes(key) ? current.filter((k: string) => k !== key) : [...current, key],
      { shouldDirty: true }
    )
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Undang anggota tim kamu</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Langkah ini opsional. Bisa dilakukan nanti di halaman Users.
        </p>
      </div>

      <ErrorBanner error={error} />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="relative rounded-lg border border-border bg-muted/30 p-4">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Hapus staf ${index + 1}`}
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nama lengkap</Label>
                <Input
                  placeholder="Nama staf"
                  {...form.register(`staffList.${index}.name`)}
                />
                <FieldError msg={form.formState.errors.staffList?.[index]?.name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="staf@villa.com"
                  {...form.register(`staffList.${index}.email`)}
                />
                <FieldError msg={form.formState.errors.staffList?.[index]?.email?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Posisi</Label>
                <Select
                  defaultValue="Front Desk"
                  onValueChange={(v) => form.setValue(`staffList.${index}.position`, v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Akses modul</Label>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background p-2.5">
                  {ALL_MODULES.map((mod) => {
                    const checked = (watchedStaffList[index]?.permissions ?? DEFAULT_PERMISSIONS).includes(mod.key)
                    return (
                      <label
                        key={mod.key}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 accent-neutral-800"
                          checked={checked}
                          onChange={() => togglePermission(index, mod.key)}
                        />
                        <span>{mod.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {fields.length < 3 && (
          <button
            type="button"
            onClick={() => append(STAFF_DEFAULT)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Tambah staf
          </button>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isPending}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? 'Mengundang...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isPending}
            className="shrink-0 text-sm text-neutral-400 hover:text-neutral-600"
          >
            Lewati
          </button>
        </div>
      </form>
    </>
  )
}

// ─── Step 5: Completion ───────────────────────────────────────────────────────

interface CompletionStepProps {
  villaName: string
  roomCount: number
  staffCount: number
  isPending: boolean
  onComplete: () => void
}

export function CompletionStep({
  villaName,
  roomCount,
  staffCount,
  isPending,
  onComplete,
}: CompletionStepProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <style>{`
        @keyframes checkIn {
          0% { transform: scale(0) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-check-in { animation: checkIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      <div className="animate-check-in mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <Check className="h-10 w-10 text-green-600" strokeWidth={2.5} />
      </div>

      <h2 className="text-2xl font-bold tracking-tight">Villa kamu siap!</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Semua sudah dikonfigurasi. Selamat mengelola villa kamu.
      </p>

      {/* Summary */}
      <div className="mt-6 w-full rounded-lg border border-border bg-muted/40 p-4 text-left">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Ringkasan
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Villa</span>
            <span className="font-medium">{villaName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Kamar ditambahkan</span>
            <span className="font-medium">{roomCount} kamar</span>
          </div>
          {staffCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Staf diundang</span>
              <span className="font-medium">{staffCount} orang</span>
            </div>
          )}
        </div>
      </div>

      <Button className="mt-6 w-full" onClick={onComplete} disabled={isPending}>
        {isPending ? 'Membuka dashboard...' : 'Buka Dashboard'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
      </Button>
    </div>
  )
}
