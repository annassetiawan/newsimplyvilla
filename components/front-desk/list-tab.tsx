'use client'

import { useState, useTransition } from 'react'
import { CalendarOff, MoreHorizontal, Plus, Search } from 'lucide-react'
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
import { cancelReservation, markAsPaid } from '@/app/actions/reservations'
import { EmptyState } from '@/components/ui/EmptyState'
import { ReservationDetailSheet } from './reservation-detail-sheet'
import { EditReservationModal } from './edit-reservation-modal'
import { fmtDate, fmtRp, nightCount, STATUS_STYLE, STATUS_LABEL } from './reservation-detail-sheet'

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

export function ListTab({ reservations, onNewReservation }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<ListReservation | null>(null)
  const [editTarget, setEditTarget] = useState<ListReservation | null>(null)
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

  function handleMarkAsPaid(id: string) {
    startTransition(async () => {
      await markAsPaid(id)
      if (selected?.id === id) {
        setSelected({ ...selected, paymentStatus: 'PAID' })
      }
    })
  }

  function handleEdit(res: ListReservation) {
    setEditTarget(res)
  }

  function handleEditSuccess(updates: Partial<ListReservation>) {
    if (selected) setSelected({ ...selected, ...updates })
  }

  if (reservations.length === 0) {
    return (
      <EmptyState
        icon={CalendarOff}
        title="Belum ada reservasi"
        description="Reservasi yang dibuat akan muncul dalam daftar ini."
        actionLabel="+ Reservasi baru"
        onAction={onNewReservation}
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
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

      {/* Table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="hidden lg:table-cell">Check-in</TableHead>
              <TableHead className="hidden lg:table-cell">Check-out</TableHead>
              <TableHead className="hidden text-center lg:table-cell">Nights</TableHead>
              <TableHead className="hidden lg:table-cell">Amount</TableHead>
              <TableHead className="hidden lg:table-cell">Payment</TableHead>
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
                <TableCell className="font-id text-muted-foreground">{res.room.code}</TableCell>
                <TableCell className="hidden lg:table-cell">{fmtDate(res.checkIn)}</TableCell>
                <TableCell className="hidden lg:table-cell">{fmtDate(res.checkOut)}</TableCell>
                <TableCell className="hidden text-center lg:table-cell">
                  {nightCount(res.checkIn, res.checkOut)}
                </TableCell>
                <TableCell className="hidden font-medium lg:table-cell">{fmtRp(res.totalAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell">
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
                        <DropdownMenuItem onClick={() => handleEdit(res)}>
                          Edit
                        </DropdownMenuItem>
                      )}
                      {res.paymentStatus === 'UNPAID' &&
                        res.status !== 'CANCELLED' &&
                        res.status !== 'CHECKEDOUT' && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(res.id)}>
                            Mark as paid
                          </DropdownMenuItem>
                        )}
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

      <ReservationDetailSheet
        selected={selected}
        onClose={() => setSelected(null)}
        pending={pending}
        onMarkPaid={handleMarkAsPaid}
        onCancel={handleCancel}
        onEdit={handleEdit}
      />

      <EditReservationModal
        reservation={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={handleEditSuccess}
      />
    </div>
  )
}
