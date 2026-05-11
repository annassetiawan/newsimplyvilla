'use client'

import { useState, useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, ArrowLeft, ChevronRight, Plus, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  saveVillaProfile,
  saveOnboardingRooms,
  inviteStaff,
  completeOnboarding,
} from '@/app/actions/onboarding'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const villaSchema = z.object({
  name: z.string().min(2, 'Nama villa minimal 2 karakter'),
  address: z.string().min(5, 'Alamat wajib diisi'),
  city: z.string().min(2, 'Kota wajib diisi'),
  phone: z.string().min(6, 'Nomor telepon wajib diisi'),
  description: z.string().optional(),
})

const singleRoomSchema = z.object({
  code: z.string().min(1, 'Kode kamar wajib diisi'),
  name: z.string().min(1, 'Nama kamar wajib diisi'),
  capacity: z.number().min(1, 'Minimal 1 tamu'),
  bedType: z.string().min(1, 'Pilih tipe tempat tidur'),
  pricePerNight: z.number().min(1, 'Harga wajib diisi'),
  status: z.enum(['AVAILABLE', 'MAINTENANCE']),
})

const roomsSchema = z.object({
  rooms: z.array(singleRoomSchema).min(1),
})

const staffMemberSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Email tidak valid'),
  position: z.string().min(1, 'Pilih posisi'),
  permissions: z.array(z.string()).default([]),
})

const staffFormSchema = z.object({
  staffList: z.array(staffMemberSchema),
})

type VillaValues = z.infer<typeof villaSchema>
type RoomsValues = z.infer<typeof roomsSchema>
type StaffValues = z.infer<typeof staffFormSchema>

// ─── Constants ────────────────────────────────────────────────────────────────

const FACILITIES = ['Swimming Pool', 'WiFi', 'Parkir', 'AC', 'Dapur', 'Taman', 'Kolam Anak']
const BED_TYPES = ['King', 'Queen', 'Twin', 'Single']
const POSITIONS = ['Front Desk', 'Housekeeper', 'Maintenance', 'Other']

const ALL_MODULES = [
  { key: 'dashboard',    label: 'Dashboard' },
  { key: 'front-desk',   label: 'Front Desk' },
  { key: 'rooms',        label: 'Rooms & Areas' },
  { key: 'inventory',    label: 'Inventory' },
  { key: 'maintenance',  label: 'Maintenance' },
  { key: 'schedule',     label: 'Schedule' },
  { key: 'reports',      label: 'Reports' },
  { key: 'sop',          label: 'SOP' },
  { key: 'users',        label: 'Users' },
  { key: 'settings',     label: 'Settings' },
]

const DEFAULT_PERMISSIONS = ['dashboard', 'front-desk', 'rooms', 'maintenance', 'schedule', 'sop']

const ROOM_DEFAULT = {
  code: '',
  name: '',
  capacity: 2,
  bedType: 'King',
  pricePerNight: 0,
  status: 'AVAILABLE' as const,
}

const STAFF_DEFAULT = { name: '', email: '', position: 'Front Desk', permissions: DEFAULT_PERMISSIONS }

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  userName: string
  villaName: string
  villaAddress: string
  villaContact: string
  villaDescription: string
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  const pct = Math.min((step / 4) * 100, 100)
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ─── Field error ──────────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-destructive">{msg}</p>
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingClient({
  userName,
  villaName,
  villaAddress,
  villaContact,
  villaDescription,
}: Props) {
  const [step, setStep] = useState(1)
  const [facilities, setFacilities] = useState<string[]>([])
  const [roomCount, setRoomCount] = useState(0)
  const [staffCount, setStaffCount] = useState(0)
  const [savedVillaName, setSavedVillaName] = useState(villaName)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // ── Step 2: Villa form
  const villaForm = useForm<VillaValues>({
    resolver: zodResolver(villaSchema),
    defaultValues: {
      name: villaName,
      address: villaAddress,
      city: '',
      phone: villaContact,
      description: villaDescription,
    },
  })

  // ── Step 3: Rooms form
  const roomsForm = useForm<RoomsValues>({
    resolver: zodResolver(roomsSchema),
    defaultValues: { rooms: [ROOM_DEFAULT] },
  })
  const { fields: roomFields, append: appendRoom, remove: removeRoom } = useFieldArray({
    control: roomsForm.control,
    name: 'rooms',
  })

  // ── Step 4: Staff form
  const staffForm = useForm<StaffValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { staffList: [STAFF_DEFAULT] },
  })
  const { fields: staffFields, append: appendStaff, remove: removeStaff } = useFieldArray({
    control: staffForm.control,
    name: 'staffList',
  })
  const watchedStaffList = staffForm.watch('staffList')

  function toggleStaffPermission(index: number, key: string) {
    const current = staffForm.getValues(`staffList.${index}.permissions`) ?? []
    staffForm.setValue(
      `staffList.${index}.permissions`,
      current.includes(key) ? current.filter((k: string) => k !== key) : [...current, key],
      { shouldDirty: true }
    )
  }

  function toggleFacility(f: string) {
    setFacilities((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  // ── Handlers

  function handleVillaSubmit(values: VillaValues) {
    setError('')
    startTransition(async () => {
      try {
        await saveVillaProfile({ ...values, facilities })
        setSavedVillaName(values.name)
        setStep(3)
      } catch {
        setError('Gagal menyimpan. Coba lagi.')
      }
    })
  }

  function handleRoomsSubmit(values: RoomsValues) {
    setError('')
    startTransition(async () => {
      try {
        await saveOnboardingRooms(values.rooms)
        setRoomCount(values.rooms.length)
        setStep(4)
      } catch {
        setError('Gagal menyimpan kamar. Coba lagi.')
      }
    })
  }

  function handleStaffSubmit(values: StaffValues) {
    const filled = values.staffList.filter((s) => s.name.trim() && s.email.trim())
    if (filled.length === 0) {
      handleSkipStaff()
      return
    }
    setError('')
    startTransition(async () => {
      try {
        await inviteStaff(filled)
        setStaffCount(filled.length)
        setStep(5)
      } catch {
        setError('Gagal mengundang staf. Coba lagi.')
      }
    })
  }

  function handleSkipStaff() {
    setStep(5)
  }

  function handleComplete() {
    startTransition(async () => {
      await completeOnboarding()
    })
  }

  // ── Layout wrapper

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <p className="mt-2 text-sm font-semibold tracking-tight">SimplyVilla</p>
      </div>

      {/* Progress */}
      {step <= 4 && (
        <div className="mb-6 w-full max-w-[560px] space-y-2">
          <ProgressBar step={step} />
          <p className="text-[13px] text-neutral-500">
            Langkah {step} dari 4
          </p>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-background p-8">

        {/* ── Step 1: Welcome ──────────────────────────────────────── */}
        {step === 1 && (
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
            <Button
              className="mt-8 w-full"
              onClick={() => setStep(2)}
            >
              Mulai setup <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Villa profile ─────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Lengkapi profil villa kamu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Informasi ini akan ditampilkan di sistem manajemen kamu.
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <form onSubmit={villaForm.handleSubmit(handleVillaSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama villa</Label>
                <Input placeholder="Villa Senja Ubud" {...villaForm.register('name')} />
                <FieldError msg={villaForm.formState.errors.name?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Alamat lengkap</Label>
                <Input placeholder="Jl. Raya Ubud No. 10" {...villaForm.register('address')} />
                <FieldError msg={villaForm.formState.errors.address?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Kota</Label>
                <Input placeholder="Ubud, Bali" {...villaForm.register('city')} />
                <FieldError msg={villaForm.formState.errors.city?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Nomor telepon</Label>
                <Input type="tel" placeholder="+62 812 3456 7890" {...villaForm.register('phone')} />
                <FieldError msg={villaForm.formState.errors.phone?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Deskripsi singkat <span className="text-muted-foreground">(opsional)</span></Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  rows={3}
                  placeholder="Ceritakan sedikit tentang villa kamu..."
                  {...villaForm.register('description')}
                />
              </div>

              <div className="space-y-2">
                <Label>Fasilitas tersedia</Label>
                <div className="flex flex-wrap gap-2">
                  {FACILITIES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleFacility(f)}
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
                <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isPending}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? 'Menyimpan...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── Step 3: Rooms ─────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Tambahkan kamar pertama kamu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Kamu bisa tambah lebih banyak kamar nanti.
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <form onSubmit={roomsForm.handleSubmit(handleRoomsSubmit)} className="space-y-4">
              {roomFields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative rounded-lg border border-border bg-muted/30 p-4"
                >
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(index)}
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
                        {...roomsForm.register(`rooms.${index}.code`)}
                      />
                      <FieldError msg={roomsForm.formState.errors.rooms?.[index]?.code?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kapasitas tamu</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="2"
                        {...roomsForm.register(`rooms.${index}.capacity`, { valueAsNumber: true })}
                      />
                      <FieldError msg={roomsForm.formState.errors.rooms?.[index]?.capacity?.message} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <Label>Nama kamar</Label>
                    <Input
                      placeholder="Frangipani Suite"
                      {...roomsForm.register(`rooms.${index}.name`)}
                    />
                    <FieldError msg={roomsForm.formState.errors.rooms?.[index]?.name?.message} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Tipe tempat tidur</Label>
                      <Select
                        defaultValue="King"
                        onValueChange={(v) => roomsForm.setValue(`rooms.${index}.bedType`, v)}
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
                          roomsForm.setValue(`rooms.${index}.status`, v as 'AVAILABLE' | 'MAINTENANCE')
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
                      {...roomsForm.register(`rooms.${index}.pricePerNight`, { valueAsNumber: true })}
                    />
                    <FieldError msg={roomsForm.formState.errors.rooms?.[index]?.pricePerNight?.message} />
                  </div>
                </div>
              ))}

              {roomFields.length < 5 && (
                <button
                  type="button"
                  onClick={() => appendRoom(ROOM_DEFAULT)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Plus className="h-4 w-4" /> Tambah kamar lain
                </button>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={isPending}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? 'Menyimpan...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </>
        )}

        {/* ── Step 4: Staff invite ──────────────────────────────────── */}
        {step === 4 && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Undang anggota tim kamu</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Langkah ini opsional. Bisa dilakukan nanti di halaman Users.
              </p>
            </div>

            {error && (
              <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <form onSubmit={staffForm.handleSubmit(handleStaffSubmit)} className="space-y-3">
              {staffFields.map((field, index) => (
                <div key={field.id} className="relative rounded-lg border border-border bg-muted/30 p-4">
                  {staffFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStaff(index)}
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
                        {...staffForm.register(`staffList.${index}.name`)}
                      />
                      <FieldError msg={staffForm.formState.errors.staffList?.[index]?.name?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="staf@villa.com"
                        {...staffForm.register(`staffList.${index}.email`)}
                      />
                      <FieldError msg={staffForm.formState.errors.staffList?.[index]?.email?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Posisi</Label>
                      <Select
                        defaultValue="Front Desk"
                        onValueChange={(v) => staffForm.setValue(`staffList.${index}.position`, v)}
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
                                onChange={() => toggleStaffPermission(index, mod.key)}
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

              {staffFields.length < 3 && (
                <button
                  type="button"
                  onClick={() => appendStaff(STAFF_DEFAULT)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Plus className="h-4 w-4" /> Tambah staf
                </button>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(3)} disabled={isPending}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
                </Button>
                <Button type="submit" className="flex-1" disabled={isPending}>
                  {isPending ? 'Mengundang...' : 'Selanjutnya'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
                </Button>
                <button
                  type="button"
                  onClick={handleSkipStaff}
                  disabled={isPending}
                  className="shrink-0 text-sm text-neutral-400 hover:text-neutral-600"
                >
                  Lewati
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Step 5: Completion ────────────────────────────────────── */}
        {step === 5 && (
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
                  <span className="font-medium">{savedVillaName}</span>
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

            <Button
              className="mt-6 w-full"
              onClick={handleComplete}
              disabled={isPending}
            >
              {isPending ? 'Membuka dashboard...' : 'Buka Dashboard'} {!isPending && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
