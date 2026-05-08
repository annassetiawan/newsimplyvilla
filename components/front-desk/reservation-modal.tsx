'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createReservation } from '@/app/actions/reservations'

interface RoomOption {
  id: string
  code: string
  name: string
  pricePerNight: number
}

interface GuestOption {
  id: string
  name: string
  phone: string | null
  idNumber: string | null
}

interface ExistingReservation {
  id: string
  room: { id: string }
  checkIn: string
  checkOut: string
  status: string
}

interface Props {
  open: boolean
  onClose: () => void
  allRooms: RoomOption[]
  existingGuests: GuestOption[]
  existingReservations: ExistingReservation[]
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function isConflicting(
  roomId: string,
  checkIn: string,
  checkOut: string,
  reservations: ExistingReservation[]
): boolean {
  if (!checkIn || !checkOut) return false
  const ci = new Date(checkIn).getTime()
  const co = new Date(checkOut).getTime()
  return reservations.some(
    (r) =>
      r.room.id === roomId &&
      r.status !== 'CANCELLED' &&
      r.status !== 'CHECKEDOUT' &&
      new Date(r.checkIn).getTime() < co &&
      new Date(r.checkOut).getTime() > ci
  )
}

export function ReservationModal({
  open,
  onClose,
  allRooms,
  existingGuests,
  existingReservations,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [guestName, setGuestName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [roomId, setRoomId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID')
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions =
    guestName.length > 0
      ? existingGuests
          .filter((g) => g.name.toLowerCase().includes(guestName.toLowerCase()))
          .slice(0, 5)
      : []

  const datesSelected = Boolean(checkIn && checkOut)
  const nights =
    datesSelected
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0

  const selectedRoom = allRooms.find((r) => r.id === roomId)
  const totalAmount = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : 0

  // When dates change, clear room if it becomes conflicting
  function handleCheckInChange(val: string) {
    setCheckIn(val)
    if (roomId && isConflicting(roomId, val, checkOut, existingReservations)) {
      setRoomId('')
    }
  }
  function handleCheckOutChange(val: string) {
    setCheckOut(val)
    if (roomId && isConflicting(roomId, checkIn, val, existingReservations)) {
      setRoomId('')
    }
  }

  function handleSelectGuest(g: GuestOption) {
    setGuestName(g.name)
    setIdNumber(g.idNumber ?? '')
    setPhone(g.phone ?? '')
    setShowSuggestions(false)
  }

  function reset() {
    setGuestName('')
    setIdNumber('')
    setPhone('')
    setRoomId('')
    setCheckIn('')
    setCheckOut('')
    setPaymentStatus('UNPAID')
    setError('')
    setShowSuggestions(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!guestName.trim()) return setError('Guest name is required')
    if (!checkIn || !checkOut) return setError('Both dates are required')
    if (nights <= 0) return setError('Check-out must be after check-in')
    if (!roomId) return setError('Select a room')

    startTransition(async () => {
      try {
        await createReservation({
          guestName: guestName.trim(),
          idNumber: idNumber || undefined,
          phone: phone || undefined,
          roomId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          paymentStatus,
        })
        reset()
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to create reservation')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New reservation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest name + autocomplete */}
          <div className="relative space-y-1.5">
            <Label>Guest name</Label>
            <Input
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value)
                setShowSuggestions(true)
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Type guest name..."
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
                {suggestions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    onMouseDown={() => handleSelectGuest(g)}
                  >
                    <span className="font-medium">{g.name}</span>
                    {g.phone && (
                      <span className="ml-2 text-xs text-muted-foreground">{g.phone}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ID number</Label>
              <Input
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="KTP / Passport"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+62..."
              />
            </div>
          </div>

          {/* Dates FIRST — so room filter can check conflicts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check-in</Label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => handleCheckInChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out</Label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                min={checkIn}
              />
            </div>
          </div>

          {/* Room — after dates, shows availability */}
          <div className="space-y-1.5">
            <Label>Room</Label>
            {datesSelected && nights > 0 && (() => {
              const busyCount = allRooms.filter((r) =>
                isConflicting(r.id, checkIn, checkOut, existingReservations)
              ).length
              const freeCount = allRooms.length - busyCount
              return (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {freeCount} available
                  </span>
                  {busyCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      {busyCount} booked
                    </span>
                  )}
                </div>
              )
            })()}
            <Select
              value={roomId}
              onValueChange={setRoomId}
              disabled={!datesSelected || nights <= 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    datesSelected && nights > 0
                      ? 'Select a room...'
                      : 'Select dates first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {allRooms.map((r) => {
                  const busy =
                    datesSelected &&
                    nights > 0 &&
                    isConflicting(r.id, checkIn, checkOut, existingReservations)
                  return (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      disabled={busy}
                      className={cn(busy && 'opacity-40')}
                    >
                      <span>{r.code} — {r.name}</span>
                      <span className="ml-1.5 text-muted-foreground">
                        ({formatRp(r.pricePerNight)}/night)
                      </span>
                      {busy && (
                        <span className="ml-1.5 text-xs text-destructive">
                          · Booked
                        </span>
                      )}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {nights > 0 && selectedRoom && (
            <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">
                {nights} night{nights > 1 ? 's' : ''} · Total:{' '}
              </span>
              <span className="font-semibold">{formatRp(totalAmount)}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Payment status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(v) => setPaymentStatus(v as 'PAID' | 'UNPAID')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating...' : 'Create reservation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
