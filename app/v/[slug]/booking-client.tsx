'use client'

import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'
import {
  formatRp,
  isConflicting,
  type ReservationData,
  type RoomData,
  type VillaData,
} from './booking-shared'
import { VillaHero } from './villa-hero'
import { RoomGrid } from './room-grid'
import { BookingSuccess } from './booking-success'

interface Props {
  data: {
    villa: VillaData
    rooms: RoomData[]
    reservations: ReservationData[]
  }
}

export function BookingClient({ data }: Props) {
  const { villa, rooms, reservations } = data
  const availableRooms = rooms.filter((r) => r.status !== 'OCCUPIED')

  // Form state
  const [pending, startTransition] = useTransition()
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomId, setRoomId] = useState('')
  const [notes, setNotes] = useState('')
  // Computed client-side only — the server and client can render this a
  // moment apart, and a server-rendered "today" would mismatch on hydration.
  const [today, setToday] = useState<string | null>(null)
  useEffect(() => setToday(new Date().toISOString().split('T')[0]), [])
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const datesSelected = Boolean(checkIn && checkOut)
  const nights =
    datesSelected
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0

  const selectedRoom = rooms.find((r) => r.id === roomId)
  const totalAmount = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : 0

  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (roomId && isConflicting(roomId, val, checkOut, reservations)) {
      setRoomId('')
    }
  }

  function handleCheckOutChange(val: string) {
    setCheckOut(val)
    if (roomId && isConflicting(roomId, checkIn, val, reservations)) {
      setRoomId('')
    }
  }

  function handleReset() {
    setSubmitted(false)
    setGuestName('')
    setGuestEmail('')
    setGuestPhone('')
    setCheckIn('')
    setCheckOut('')
    setRoomId('')
    setNotes('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!guestName.trim()) return setError('Nama wajib diisi')
    if (!checkIn || !checkOut) return setError('Tanggal check-in dan check-out wajib diisi')
    if (nights <= 0) return setError('Check-out harus setelah check-in')
    if (!roomId) return setError('Pilih kamar terlebih dahulu')

    startTransition(async () => {
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            villaId: villa.id,
            guestName: guestName.trim(),
            guestEmail: guestEmail.trim() || undefined,
            guestPhone: guestPhone.trim() || undefined,
            roomId,
            checkIn,
            checkOut,
            notes: notes.trim() || undefined,
          }),
        })

        const json = await res.json()

        if (!json.success) {
          setError(json.message)
          toast.error(json.message)
          return
        }

        setSubmitted(true)
        toast.success('Booking berhasil dikirim! Kami akan menghubungi Anda segera.')
      } catch {
        setError('Gagal mengirim booking. Silakan coba lagi.')
        toast.error('Gagal mengirim booking. Silakan coba lagi.')
      }
    })
  }

  if (submitted) {
    return (
      <BookingSuccess
        guestName={guestName}
        guestPhone={guestPhone}
        roomName={selectedRoom?.name}
        nights={nights}
        totalAmount={totalAmount}
        onReset={handleReset}
      />
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <VillaHero villa={villa} />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main content: Rooms */}
          <div className="lg:col-span-3 space-y-8">
            <RoomGrid
              rooms={rooms}
              reservations={reservations}
              checkIn={checkIn}
              checkOut={checkOut}
              selectedRoomId={roomId}
              datesSelected={datesSelected}
              nights={nights}
            />
          </div>

          {/* Sidebar: Booking Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarDays className="h-5 w-5" />
                    Booking Sekarang
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Guest name */}
                    <div className="space-y-1.5">
                      <Label>Nama lengkap *</Label>
                      <Input
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Nama tamu..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Telepon / WA</Label>
                        <Input
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+62..."
                        />
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Check-in *</Label>
                        <Input
                          type="date"
                          value={checkIn}
                          onChange={(e) => handleCheckInChange(e.target.value)}
                          min={today ?? undefined}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Check-out *</Label>
                        <Input
                          type="date"
                          value={checkOut}
                          onChange={(e) => handleCheckOutChange(e.target.value)}
                          min={checkIn || (today ?? undefined)}
                        />
                      </div>
                    </div>

                    {/* Room selection */}
                    <div className="space-y-1.5">
                      <Label>Pilih kamar *</Label>
                      {datesSelected && nights > 0 && (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            {availableRooms.filter(
                              (r) => !isConflicting(r.id, checkIn, checkOut, reservations)
                            ).length}{' '}
                            tersedia
                          </span>
                        </div>
                      )}
                      <Select
                        value={roomId}
                        onValueChange={setRoomId}
                        disabled={!datesSelected || nights <= 0}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              datesSelected && nights > 0
                                ? 'Pilih kamar...'
                                : 'Pilih tanggal dulu'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {rooms.map((r) => {
                            const busy =
                              datesSelected &&
                              nights > 0 &&
                              isConflicting(r.id, checkIn, checkOut, reservations)
                            return (
                              <SelectItem
                                key={r.id}
                                value={r.id}
                                disabled={busy || r.status === 'OCCUPIED'}
                                className={cn(
                                  (busy || r.status === 'OCCUPIED') && 'opacity-40'
                                )}
                              >
                                <span>
                                  {r.code} — {r.name}
                                </span>
                                <span className="ml-1.5 text-muted-foreground">
                                  ({formatRp(r.pricePerNight)}/malam)
                                </span>
                                {(busy || r.status === 'OCCUPIED') && (
                                  <span className="ml-1.5 text-xs text-destructive">
                                    · Tidak tersedia
                                  </span>
                                )}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label>Catatan (opsional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Permintaan khusus..."
                        rows={2}
                      />
                    </div>

                    {/* Price summary */}
                    {nights > 0 && selectedRoom && (
                      <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {formatRp(selectedRoom.pricePerNight)} × {nights} malam
                          </span>
                          <span>{formatRp(selectedRoom.pricePerNight * nights)}</span>
                        </div>
                        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-semibold">
                          <span>Total</span>
                          <span className="text-primary">{formatRp(totalAmount)}</span>
                        </div>
                      </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="w-full" disabled={pending}>
                      {pending ? 'Mengirim...' : 'Kirim Booking'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
