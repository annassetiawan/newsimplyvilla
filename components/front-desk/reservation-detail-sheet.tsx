'use client'

import {
  User,
  Phone,
  Mail,
  CreditCard,
  BedDouble,
  CalendarCheck,
  CalendarX,
  Moon,
  BadgeCheck,
  Pencil,
  Globe,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

function Row({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-right">{children}</div>
    </div>
  )
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
    <Dialog open={!!selected} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {selected && (
          <>
            <DialogHeader className="px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(selected.guest.name)}
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold leading-tight">
                    {selected.guest.name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[selected.status])}>
                      {STATUS_LABEL[selected.status]}
                    </span>
                    {selected.otaName && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {selected.otaName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* Left column */}
                <div className="px-5 py-5 space-y-5">
                  {/* Guest info */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tamu</p>
                    <div className="space-y-2">
                      {selected.guest.idNumber && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-mono text-xs">{selected.guest.idNumber}</span>
                        </div>
                      )}
                      {selected.guest.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{selected.guest.phone}</span>
                        </div>
                      )}
                      {selected.guest.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate text-xs">{selected.guest.email}</span>
                        </div>
                      )}
                      {!selected.guest.idNumber && !selected.guest.phone && !selected.guest.email && (
                        <p className="text-xs text-muted-foreground">Tidak ada kontak</p>
                      )}
                    </div>
                  </div>

                  {/* OTA info */}
                  {selected.otaName && (
                    <div>
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sumber Booking</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span>{selected.otaName}</span>
                        </div>
                        {selected.otaReservationCode && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Hash className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-mono text-xs">{selected.otaReservationCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right column */}
                <div className="px-5 py-5 space-y-5">
                  {/* Reservation */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reservasi</p>
                    <div className="space-y-2.5">
                      <Row icon={BedDouble} label="Room">
                        <span className="font-mono text-xs">{selected.room.code}</span>
                        {' '}{selected.room.name}
                      </Row>
                      <Row icon={CalendarCheck} label="Check-in">
                        {fmtDate(selected.checkIn)}
                      </Row>
                      <Row icon={CalendarX} label="Check-out">
                        {fmtDate(selected.checkOut)}
                      </Row>
                      <Row icon={Moon} label="Malam">
                        {nightCount(selected.checkIn, selected.checkOut)}
                      </Row>
                    </div>
                  </div>

                  {/* Payment */}
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Pembayaran</p>
                    <div className="space-y-2.5">
                      {selected.pricePerNight > 0 && (
                        <Row icon={CreditCard} label="Per malam">
                          {fmtRp(selected.pricePerNight)}
                        </Row>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground shrink-0">Total</span>
                        <span className="text-base font-bold">{fmtRp(selected.totalAmount)}</span>
                      </div>
                      <Row icon={BadgeCheck} label="Bayar">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          selected.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        )}>
                          {selected.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </Row>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            {isActionable && (
              <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => onEdit(selected)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {selected.paymentStatus === 'UNPAID' && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => onMarkPaid(selected.id)}
                    className="bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    {pending ? 'Processing…' : 'Mark as Paid'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => onCancel(selected.id)}
                  className="ml-auto border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                >
                  {pending ? 'Cancelling…' : 'Cancel'}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
