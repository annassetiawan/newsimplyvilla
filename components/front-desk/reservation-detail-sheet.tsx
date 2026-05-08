'use client'

import {
  X,
  User,
  Phone,
  CreditCard,
  BedDouble,
  CalendarCheck,
  CalendarX,
  Moon,
  BadgeCheck,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { ListReservation } from './list-tab'

export const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CHECKEDIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHECKEDOUT: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CHECKEDIN: 'Checked In',
  CHECKEDOUT: 'Checked Out',
  CANCELLED: 'Cancelled',
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
export function fmtRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}
export function nightCount(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}
export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

interface Props {
  selected: ListReservation | null
  onClose: () => void
  pending: boolean
  onMarkPaid: (id: string) => void
  onCancel: (id: string) => void
  onEdit: (res: ListReservation) => void
}

export function ReservationDetailSheet({
  selected,
  onClose,
  pending,
  onMarkPaid,
  onCancel,
  onEdit,
}: Props) {
  const isActionable =
    selected &&
    selected.status !== 'CANCELLED' &&
    selected.status !== 'CHECKEDOUT'

  return (
    <Sheet open={!!selected} onOpenChange={onClose}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]"
      >
        {selected && (
          <>
            <SheetTitle className="sr-only">Reservation detail</SheetTitle>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <p className="text-base font-semibold">Reservation detail</p>
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
              {/* Guest */}
              <div className="px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Guest
                </p>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {getInitials(selected.guest.name)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-base font-semibold leading-tight">
                      {selected.guest.name}
                    </p>
                    {selected.guest.idNumber && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-id">{selected.guest.idNumber}</span>
                      </div>
                    )}
                    {selected.guest.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{selected.guest.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mx-6 border-t border-border" />

              {/* Reservation */}
              <div className="px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Reservation
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BedDouble className="h-4 w-4" />
                      <span>Room</span>
                    </div>
                    <span className="text-sm font-medium">
                      <span className="font-id">{selected.room.code}</span>
                      {' — '}{selected.room.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="h-4 w-4" />
                      <span>Check-in</span>
                    </div>
                    <span className="text-sm font-medium">{fmtDate(selected.checkIn)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarX className="h-4 w-4" />
                      <span>Check-out</span>
                    </div>
                    <span className="text-sm font-medium">{fmtDate(selected.checkOut)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Moon className="h-4 w-4" />
                      <span>Nights</span>
                    </div>
                    <span className="text-sm font-medium">
                      {nightCount(selected.checkIn, selected.checkOut)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mx-6 border-t border-border" />

              {/* Payment */}
              <div className="px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Payment
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total amount</span>
                    <span className="text-lg font-bold">{fmtRp(selected.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment</span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        selected.paymentStatus === 'PAID'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      )}
                    >
                      {selected.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BadgeCheck className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        STATUS_STYLE[selected.status]
                      )}
                    >
                      {STATUS_LABEL[selected.status]}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="space-y-2 border-t border-border px-6 py-4">
              {isActionable && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={pending}
                  onClick={() => onEdit(selected)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit reservation
                </Button>
              )}
              {isActionable && selected.paymentStatus === 'UNPAID' && (
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  disabled={pending}
                  onClick={() => onMarkPaid(selected.id)}
                >
                  {pending ? 'Processing…' : 'Mark as Paid'}
                </Button>
              )}
              {isActionable && (
                <Button
                  variant="outline"
                  className="w-full border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  disabled={pending}
                  onClick={() => onCancel(selected.id)}
                >
                  {pending ? 'Cancelling…' : 'Cancel reservation'}
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
