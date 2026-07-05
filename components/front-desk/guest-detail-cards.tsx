'use client'

import { cn } from '@/lib/utils'
import { STATUS_STYLE, STATUS_LABEL, fmtDate, fmtRp } from './reservation-format'
import { memberSince, ordinalStay } from './guest-format'

export interface GuestReservation {
  id: string
  checkIn: string
  checkOut: string
  status: 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT' | 'CANCELLED'
  paymentStatus: 'PAID' | 'UNPAID'
  totalAmount: number
  room: { id: string; code: string; name: string }
}

export interface GuestDetail {
  id: string
  name: string
  phone: string | null
  email: string | null
  idNumber: string | null
  notes: string | null
  createdAt: string
  reservations: GuestReservation[]
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function nightCount(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

export function GuestIdentityCard({ guest, stayCount }: { guest: GuestDetail; stayCount: number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
          {getInitials(guest.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{guest.name}</p>
          {guest.email && (
            <p className="mt-0.5 text-sm text-muted-foreground">{guest.email}</p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {stayCount >= 2 && (
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                Returning guest
              </span>
            )}
            {stayCount > 0 && (
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {ordinalStay(stayCount)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-border" />

      <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Phone
          </p>
          <p className="mt-1 text-sm font-medium">{guest.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            ID Number (KTP)
          </p>
          <p className="font-id mt-1">{guest.idNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Email
          </p>
          <p className="mt-1 text-sm font-medium">{guest.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Member since
          </p>
          <p className="mt-1 text-sm font-medium">{memberSince(guest.createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

export function CurrentStayCard({ currentStay }: { currentStay: GuestReservation | null }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Current stay</p>
        {currentStay ? (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              STATUS_STYLE[currentStay.status]
            )}
          >
            {STATUS_LABEL[currentStay.status]}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">No active stay</span>
        )}
      </div>

      {currentStay ? (
        <>
          <p className="text-base font-semibold">{currentStay.room.name}</p>
          <p className="font-id mb-4 text-muted-foreground">
            {currentStay.room.code}
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Check-in</p>
              <p className="font-semibold">{fmtDate(currentStay.checkIn)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Check-out</p>
              <p className="font-semibold">{fmtDate(currentStay.checkOut)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Nights</p>
              <p className="font-semibold">
                {nightCount(currentStay.checkIn, currentStay.checkOut)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Payment</span>
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                currentStay.paymentStatus === 'PAID'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {currentStay.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Guest is not currently checked in.</p>
      )}
    </div>
  )
}

export function StayHistoryCard({
  reservations,
  stayCount,
  ltv,
}: {
  reservations: GuestReservation[]
  stayCount: number
  ltv: number
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Stay history</p>
        <span className="text-[11px] text-muted-foreground">
          {stayCount} stay{stayCount !== 1 ? 's' : ''}
          {ltv > 0 && <> · <span className="font-medium text-foreground">{fmtRp(ltv)}</span> LTV</>}
        </span>
      </div>

      {reservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No stays recorded.</p>
      ) : (
        <div className="space-y-2">
          {reservations.map((res) => (
            <div
              key={res.id}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{res.room.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fmtDate(res.checkIn)} · {nightCount(res.checkIn, res.checkOut)} nights
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {res.status === 'CANCELLED' ? '—' : fmtRp(res.totalAmount)}
                </p>
                <p
                  className={cn(
                    'text-[11px] font-medium',
                    res.status === 'CHECKEDIN'
                      ? 'text-blue-600 dark:text-blue-400'
                      : res.status === 'CHECKEDOUT'
                        ? 'text-muted-foreground'
                        : res.status === 'CANCELLED'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                  )}
                >
                  {res.status === 'CHECKEDIN'
                    ? 'Active'
                    : res.status === 'CHECKEDOUT'
                      ? 'Completed'
                      : STATUS_LABEL[res.status] ?? res.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GuestStaysList({ reservations }: { reservations: GuestReservation[] }) {
  return (
    <div className="rounded-xl border border-border bg-background">
      {reservations.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No stays recorded.</p>
      ) : (
        <div className="divide-y divide-border">
          {reservations.map((res) => (
            <div key={res.id} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="min-w-[120px]">
                  <p className="text-sm font-semibold">{res.room.name}</p>
                  <p className="font-id text-muted-foreground">{res.room.code}</p>
                </div>
                <div>
                  <p className="text-sm">
                    {fmtDate(res.checkIn)} — {fmtDate(res.checkOut)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {nightCount(res.checkIn, res.checkOut)} nights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {res.status === 'CANCELLED' ? '—' : fmtRp(res.totalAmount)}
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      res.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {res.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    STATUS_STYLE[res.status] ?? 'bg-gray-100 text-gray-600'
                  )}
                >
                  {STATUS_LABEL[res.status] ?? res.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
