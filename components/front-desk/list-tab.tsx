'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cancelReservation } from '@/app/actions/reservations'

export interface ListReservation {
  id: string
  checkIn: string
  checkOut: string
  status: 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT' | 'CANCELLED'
  paymentStatus: 'PAID' | 'UNPAID'
  totalAmount: number
  createdAt: string
  guest: { id: string; name: string; phone: string | null; idNumber: string | null }
  room: { id: string; code: string; name: string }
}

interface Props {
  reservations: ListReservation[]
  onNewReservation: () => void
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CHECKEDIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHECKEDOUT: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CHECKEDIN: 'Checked In',
  CHECKEDOUT: 'Checked Out',
  CANCELLED: 'Cancelled',
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
function nights(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

export function ListTab({ reservations, onNewReservation }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<ListReservation | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = reservations.filter((r) => {
    const q = search.toLowerCase()
    const matchQ =
      r.guest.name.toLowerCase().includes(q) || r.room.code.toLowerCase().includes(q)
    const matchS = statusFilter === 'ALL' || r.status === statusFilter
    return matchQ && matchS
  })

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelReservation(id)
      setSelected(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search guest or room..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CHECKEDIN">Checked In</SelectItem>
            <SelectItem value="CHECKEDOUT">Checked Out</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={onNewReservation}
          className="ml-auto h-8 bg-primary text-white hover:bg-[#C8911A]"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead className="text-center">Nights</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No reservations found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((res) => (
              <TableRow
                key={res.id}
                className="cursor-pointer"
                onClick={() => setSelected(res)}
              >
                <TableCell className="font-medium">{res.guest.name}</TableCell>
                <TableCell className="text-muted-foreground">{res.room.code}</TableCell>
                <TableCell>{fmtDate(res.checkIn)}</TableCell>
                <TableCell>{fmtDate(res.checkOut)}</TableCell>
                <TableCell className="text-center">
                  {nights(res.checkIn, res.checkOut)}
                </TableCell>
                <TableCell className="font-medium">{fmtRp(res.totalAmount)}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      res.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                  >
                    {res.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      STATUS_STYLE[res.status]
                    )}
                  >
                    {STATUS_LABEL[res.status]}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelected(res)}>
                        View detail
                      </DropdownMenuItem>
                      {res.status !== 'CANCELLED' && res.status !== 'CHECKEDOUT' && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={pending}
                          onClick={() => handleCancel(res.id)}
                        >
                          Cancel reservation
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>Reservation detail</SheetTitle>
              </SheetHeader>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Guest
                  </p>
                  <p className="font-semibold">{selected.guest.name}</p>
                  {selected.guest.idNumber && (
                    <p className="text-sm text-muted-foreground">ID: {selected.guest.idNumber}</p>
                  )}
                  {selected.guest.phone && (
                    <p className="text-sm text-muted-foreground">{selected.guest.phone}</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Reservation
                  </p>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Room', `${selected.room.code} — ${selected.room.name}`],
                      ['Check-in', fmtDate(selected.checkIn)],
                      ['Check-out', fmtDate(selected.checkOut)],
                      ['Nights', String(nights(selected.checkIn, selected.checkOut))],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-primary">{fmtRp(selected.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          selected.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {selected.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          STATUS_STYLE[selected.status]
                        )}
                      >
                        {STATUS_LABEL[selected.status]}
                      </span>
                    </div>
                  </div>
                </div>

                {selected.status !== 'CANCELLED' && selected.status !== 'CHECKEDOUT' && (
                  <div className="border-t border-border pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={pending}
                      onClick={() => handleCancel(selected.id)}
                    >
                      {pending ? 'Cancelling...' : 'Cancel reservation'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
