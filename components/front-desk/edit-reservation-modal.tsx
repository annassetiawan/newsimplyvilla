'use client'

import { useState, useTransition, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateReservation } from '@/app/actions/reservations'
import type { ListReservation } from './list-tab'

function toDateInput(iso: string) {
  return new Date(iso).toISOString().split('T')[0]
}

interface Props {
  reservation: ListReservation | null
  onClose: () => void
  onSuccess: (updates: Partial<ListReservation>) => void
}

export function EditReservationModal({ reservation, onClose, onSuccess }: Props) {
  const [pending, startTransition] = useTransition()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [status, setStatus] = useState<'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT'>('CONFIRMED')
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'UNPAID'>('UNPAID')
  const [error, setError] = useState('')

  useEffect(() => {
    if (reservation) {
      setCheckIn(toDateInput(reservation.checkIn))
      setCheckOut(toDateInput(reservation.checkOut))
      setStatus(
        reservation.status === 'CANCELLED' ? 'CONFIRMED' : reservation.status
      )
      setPaymentStatus(reservation.paymentStatus)
      setError('')
    }
  }, [reservation])

  const nights =
    checkIn && checkOut
      ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reservation) return
    if (!checkIn || !checkOut) return setError('Both dates are required')
    if (nights <= 0) return setError('Check-out must be after check-in')

    startTransition(async () => {
      try {
        await updateReservation(reservation.id, {
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          status,
          paymentStatus,
        })
        onSuccess({
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          status,
          paymentStatus,
        })
        onClose()
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to update reservation')
      }
    })
  }

  return (
    <Dialog open={!!reservation} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit reservation</DialogTitle>
        </DialogHeader>

        {reservation && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Readonly context */}
            <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
              <span className="text-muted-foreground">Guest: </span>
              <span className="font-medium">{reservation.guest.name}</span>
              <span className="mx-2 text-border">·</span>
              <span className="font-medium">
                <span className="font-id">{reservation.room.code}</span>
                {' — '}{reservation.room.name}
              </span>
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

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CHECKEDIN">Checked In</SelectItem>
                  <SelectItem value="CHECKEDOUT">Checked Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Payment</Label>
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

            {nights > 0 && (
              <div className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                {nights} night{nights > 1 ? 's' : ''}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
