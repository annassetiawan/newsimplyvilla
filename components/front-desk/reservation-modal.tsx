'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface Props {
  open: boolean
  onClose: () => void
  availableRooms: RoomOption[]
  existingGuests: GuestOption[]
}

function formatRp(n: number) {
  return `Rp ${(n / 1_000_000).toFixed(1)}M`
}

export function ReservationModal({ open, onClose, availableRooms, existingGuests }: Props) {
  const [pending, startTransition] = useTransition()
  const [guestName, setGuestName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [roomId, setRoomId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID')
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const suggestions =
    guestName.length > 0
      ? existingGuests
          .filter((g) => g.name.toLowerCase().includes(guestName.toLowerCase()))
          .slice(0, 5)
      : []

  const selectedRoom = availableRooms.find((r) => r.id === roomId)
  const nights =
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0
  const totalAmount = selectedRoom && nights > 0 ? selectedRoom.pricePerNight * nights : 0

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
    if (!roomId) return setError('Select a room')
    if (!checkIn || !checkOut) return setError('Both dates are required')
    if (nights <= 0) return setError('Check-out must be after check-in')

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
              <div className="absolute z-20 w-full rounded-md border border-border bg-popover shadow-md top-full mt-1 overflow-hidden">
                {suggestions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => handleSelectGuest(g)}
                  >
                    <span className="font-medium">{g.name}</span>
                    {g.phone && (
                      <span className="ml-2 text-muted-foreground text-xs">{g.phone}</span>
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

          <div className="space-y-1.5">
            <Label>Room</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select available room..." />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.length === 0 && (
                  <SelectItem value="_none" disabled>
                    No available rooms
                  </SelectItem>
                )}
                {availableRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.code} — {r.name} ({formatRp(r.pricePerNight)}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Check-in</Label>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Check-out</Label>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
              />
            </div>
          </div>

          {nights > 0 && selectedRoom && (
            <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">
                {nights} night{nights > 1 ? 's' : ''} · Total:{' '}
              </span>
              <span className="font-semibold text-primary">
                {formatRp(totalAmount)}
              </span>
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
