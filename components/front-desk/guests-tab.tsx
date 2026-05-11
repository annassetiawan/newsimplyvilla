'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtRp, fmtDate } from './reservation-detail-sheet'

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
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

export function GuestsTab({ guests }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = guests.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.phone ?? '').includes(search) ||
      (g.idNumber ?? '').includes(search)
  )

  if (guests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Belum ada data tamu"
        description="Profil tamu akan otomatis dibuat saat reservasi pertama masuk."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guests..."
          className="h-8 pl-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead className="hidden lg:table-cell">Phone</TableHead>
              <TableHead className="hidden lg:table-cell">ID Number</TableHead>
              <TableHead className="hidden text-center lg:table-cell">Stays</TableHead>
              <TableHead className="hidden lg:table-cell">Last visit</TableHead>
              <TableHead className="hidden lg:table-cell">Total spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No guests found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((guest) => {
              const validStays = guest.reservations.filter((r) => r.status !== 'CANCELLED')
              const lastStay = guest.reservations[0]
              const ltv = validStays.reduce((sum, r) => sum + r.totalAmount, 0)

              return (
                <TableRow
                  key={guest.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/front-desk/guests/${guest.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(guest.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{guest.name}</p>
                        {guest.email && (
                          <p className="text-[11px] text-muted-foreground">{guest.email}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {guest.phone ?? '—'}
                  </TableCell>
                  <TableCell className="hidden font-id text-muted-foreground lg:table-cell">
                    {guest.idNumber ?? '—'}
                  </TableCell>
                  <TableCell className="hidden text-center font-medium lg:table-cell">{validStays.length}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {lastStay ? fmtDate(lastStay.checkIn) : '—'}
                  </TableCell>
                  <TableCell className="hidden font-medium lg:table-cell">
                    {ltv > 0 ? fmtRp(ltv) : '—'}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
