'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MapPin, Phone, Mail, Users, Bed, CheckCircle2, CalendarDays } from 'lucide-react'

interface VillaData {
  id: string
  name: string
  address: string
  description: string | null
  email: string | null
  contact: string | null
  facilities: string[]
}

interface RoomData {
  id: string
  code: string
  name: string
  type: string
  capacity: number
  pricePerNight: number
  status: string
  photos: string[]
}

interface ReservationData {
  id: string
  roomId: string
  checkIn: string
  checkOut: string
  status: string
}

interface Props {
  data: {
    villa: VillaData
    rooms: RoomData[]
    reservations: ReservationData[]
  }
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function isConflicting(
  roomId: string,
  checkIn: string,
  checkOut: string,
  reservations: ReservationData[]
): boolean {
  if (!checkIn || !checkOut) return false
  const ci = new Date(checkIn).getTime()
  const co = new Date(checkOut).getTime()
  return reservations.some(
    (r) =>
      r.roomId === roomId &&
      new Date(r.checkIn).getTime() < co &&
      new Date(r.checkOut).getTime() > ci
  )
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
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="space-y-4 pt-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <h2 className="text-xl font-semibold">Booking Terkirim!</h2>
            <p className="text-muted-foreground">
              Terima kasih <strong>{guestName}</strong>! Booking Anda untuk{' '}
              <strong>{selectedRoom?.name}</strong> telah kami terima.
              {guestPhone && (
                <>
                  {' '}Kami akan menghubungi Anda di{' '}
                  <strong>{guestPhone}</strong>.
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {nights} malam · {formatRp(totalAmount)}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false)
                setGuestName('')
                setGuestEmail('')
                setGuestPhone('')
                setCheckIn('')
                setCheckOut('')
                setRoomId('')
                setNotes('')
              }}
            >
              Booking lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Hero */}
      <section className="bg-background border-b">
        <div className="mx-auto max-w-5xl px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
            {villa.name}
          </h1>
          {villa.description && (
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              {villa.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {villa.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />
                {villa.address}
              </span>
            )}
            {villa.contact && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 shrink-0" />
                {villa.contact}
              </span>
            )}
            {villa.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 shrink-0" />
                {villa.email}
              </span>
            )}
          </div>
          {villa.facilities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {villa.facilities.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Main content: Rooms + Form */}
          <div className="lg:col-span-3 space-y-8">
            {/* Room cards */}
            {rooms.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Belum ada kamar tersedia.
                </CardContent>
              </Card>
            ) : (
              <>
                <h2 className="text-xl font-semibold">Kamar Tersedia</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {rooms.map((room) => {
                    const busy = isConflicting(room.id, checkIn, checkOut, reservations)
                    return (
                      <Card
                        key={room.id}
                        className={cn(
                          'transition-colors',
                          room.status === 'OCCUPIED' && 'opacity-60',
                          roomId === room.id && 'ring-2 ring-primary'
                        )}
                      >
                        {room.photos.length > 0 && (
                          <div className="aspect-video w-full overflow-hidden rounded-t-xl">
                            <img
                              src={room.photos[0]}
                              alt={room.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="space-y-2 pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{room.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {room.code} · {room.type}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-medium',
                                room.status === 'AVAILABLE'
                                  ? 'bg-green-100 text-green-700'
                                  : room.status === 'OCCUPIED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                              )}
                            >
                              {room.status === 'AVAILABLE'
                                ? 'Tersedia'
                                : room.status === 'OCCUPIED'
                                  ? 'Terisi'
                                  : room.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {room.capacity} orang
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Bed className="h-3.5 w-3.5" />
                              {room.type}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-lg font-bold text-primary">
                              {formatRp(room.pricePerNight)}
                            </span>
                            <span className="text-xs text-muted-foreground">/ malam</span>
                          </div>
                          {datesSelected && nights > 0 && busy && (
                            <p className="text-xs text-destructive">
                              Tidak tersedia untuk tanggal dipilih
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </>
            )}
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
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Check-out *</Label>
                        <Input
                          type="date"
                          value={checkOut}
                          onChange={(e) => handleCheckOutChange(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
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
