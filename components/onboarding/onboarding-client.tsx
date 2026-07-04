'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2 } from 'lucide-react'
import {
  saveVillaProfile,
  saveOnboardingRooms,
  inviteStaff,
  completeOnboarding,
} from '@/app/actions/onboarding'
import {
  ROOM_DEFAULT,
  STAFF_DEFAULT,
  roomsSchema,
  staffFormSchema,
  villaSchema,
  type RoomsValues,
  type StaffValues,
  type VillaValues,
} from './onboarding-shared'
import {
  CompletionStep,
  RoomsStep,
  StaffStep,
  VillaStep,
  WelcomeStep,
} from './onboarding-steps'

interface Props {
  userName: string
  villaName: string
  villaAddress: string
  villaContact: string
  villaDescription: string
}

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
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Forms live here (not in the step components) so values survive
  // navigating back and forth between steps.
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

  const roomsForm = useForm<RoomsValues>({
    resolver: zodResolver(roomsSchema),
    defaultValues: { rooms: [ROOM_DEFAULT] },
  })

  const staffForm = useForm<StaffValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: { staffList: [STAFF_DEFAULT] },
  })

  function toggleFacility(f: string) {
    setFacilities((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))
  }

  function handleVillaSubmit(values: VillaValues) {
    setError('')
    startTransition(async () => {
      try {
        await saveVillaProfile({ ...values, facilities })
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
        {step === 1 && <WelcomeStep userName={userName} onStart={() => setStep(2)} />}

        {step === 2 && (
          <VillaStep
            form={villaForm}
            facilities={facilities}
            onToggleFacility={toggleFacility}
            error={error}
            isPending={isPending}
            onSubmit={handleVillaSubmit}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <RoomsStep
            form={roomsForm}
            error={error}
            isPending={isPending}
            onSubmit={handleRoomsSubmit}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <StaffStep
            form={staffForm}
            error={error}
            isPending={isPending}
            onSubmit={handleStaffSubmit}
            onBack={() => setStep(3)}
            onSkip={handleSkipStaff}
          />
        )}

        {step === 5 && (
          <CompletionStep
            villaName={villaForm.getValues('name') || villaName}
            roomCount={roomCount}
            staffCount={staffCount}
            isPending={isPending}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  )
}
