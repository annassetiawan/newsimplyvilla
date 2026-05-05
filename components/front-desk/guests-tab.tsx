'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

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

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
function fmtRp(n: number) {
  return n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}M` : `Rp ${(n / 1_000).toFixed(0)}K`
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-amber-100 text-amber-700',
  PENDING: 'bg-gray-100 text-gray-600',
  CHECKEDIN: 'bg-blue-100 text-blue-700',
  CHECKEDOUT: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-100 text-red-600',
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CHECKEDIN: 'Checked In',
  CHECKEDOUT: 'Checked Out',
  CANCELLED: 'Cancelled',
}

export function GuestsTab({ guests }: Props) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GuestData | null>(null)

  const filtered = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone ?? '').includes(search)
  )

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
                  {initials(guest.name)}
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
                {guest.notes && (
                  <p className="mt-1.5 truncate text-[11px] italic text-muted-foreground">
                    {guest.notes}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                    {initials(selected.name)}
                  </div>
                  <div>
                    <SheetTitle>{selected.name}</SheetTitle>
                    {selected.phone && (
                      <p className="text-sm text-muted-foreground">{selected.phone}</p>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Profile
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {selected.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span>{selected.email}</span>
                      </div>
                    )}
                    {selected.idNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID number</span>
                        <span>{selected.idNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">First visit</span>
                      <span>{fmtDate(selected.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notes
                    </p>
                    <p className="text-sm text-muted-foreground">{selected.notes}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Stay history ({selected.reservations.filter((r) => r.status !== 'CANCELLED').length})
                  </p>
                  {selected.reservations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No stays recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.reservations.map((res) => (
                        <div key={res.id} className="rounded-lg border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {res.room.code} — {res.room.name}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                STATUS_STYLE[res.status] ?? 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {STATUS_LABEL[res.status] ?? res.status}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {fmtDate(res.checkIn)} — {fmtDate(res.checkOut)}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-primary">
                            {fmtRp(res.totalAmount)}
                          </p>
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
