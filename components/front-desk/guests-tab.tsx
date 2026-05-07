'use client'

import { useState } from 'react'
import { Search, X, Phone, Mail, CreditCard, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { STATUS_STYLE, STATUS_LABEL, fmtDate, fmtRp } from './reservation-detail-sheet'

interface GuestReservation {
  id: string
  checkIn: string
  checkOut: string
  status: string
  totalAmount: number
  room: { code: string; name: string }
}

export interface GuestData {
  id: string
  name: string
  phone: string | null
  email: string | null
  idNumber: string | null
  notes: string | null
  createdAt: string
  reservations: GuestReservation[]
}

interface Props {
  guests: GuestData[]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function GuestsTab({ guests }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GuestData | null>(null)

  const filtered = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone ?? '').includes(search)
  )

  const activeStays = selected?.reservations.filter((r) => r.status !== 'CANCELLED') ?? []

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guests..."
          className="h-8 pl-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No guests found</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((guest) => {
            const stays = guest.reservations.filter((r) => r.status !== 'CANCELLED')
            const lastStay = stays[0]
            return (
              <button
                key={guest.id}
                className="rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-muted/50"
                onClick={() => setSelected(guest)}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(guest.name)}
                </div>
                <p className="text-sm font-semibold leading-tight">{guest.name}</p>
                {guest.phone && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{guest.phone}</p>
                )}
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {stays.length} stay{stays.length !== 1 ? 's' : ''}
                  </span>
                  {lastStay && (
                    <span>
                      {new Date(lastStay.checkIn).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]"
        >
          {selected && (
            <>
              <SheetTitle className="sr-only">Guest profile</SheetTitle>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <p className="text-base font-semibold">Guest profile</p>
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                {/* Identity */}
                <div className="px-6 py-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
                      {getInitials(selected.name)}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-lg font-semibold leading-tight">{selected.name}</p>
                      {selected.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{selected.phone}</span>
                        </div>
                      )}
                      {selected.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{selected.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mx-6 border-t border-border" />

                {/* Profile details */}
                <div className="px-6 py-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Profile
                  </p>
                  <div className="space-y-3">
                    {selected.idNumber && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ID number</span>
                        <span className="font-medium">{selected.idNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">First visit</span>
                      <span className="font-medium">{fmtDate(selected.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total stays</span>
                      <span className="font-medium">{activeStays.length}</span>
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground italic">
                      {selected.notes}
                    </div>
                  )}
                </div>

                <div className="mx-6 border-t border-border" />

                {/* Stay history */}
                <div className="px-6 py-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Stay history ({activeStays.length})
                  </p>

                  {selected.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stays recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.reservations.map((res) => (
                        <div key={res.id} className="rounded-lg border border-border p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">
                                {res.room.code} — {res.room.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {fmtDate(res.checkIn)} — {fmtDate(res.checkOut)}
                              </p>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                STATUS_STYLE[res.status] ?? 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {STATUS_LABEL[res.status] ?? res.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>
                                {res.status === 'CANCELLED' ? '—' : fmtRp(res.totalAmount)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              <span>{STATUS_LABEL[res.status] ?? res.status}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
