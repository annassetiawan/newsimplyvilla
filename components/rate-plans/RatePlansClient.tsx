'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, ChevronRight, Tag, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatRp } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/EmptyState'
import { deleteRatePlan, toggleRatePlanActive } from '@/app/actions/ratePlan'
import { RatePlanModal } from '@/components/rooms/RatePlanModal'
import type { RatePlanData } from '@/components/rooms/RoomDetailClient'

export interface RatePlanRow extends RatePlanData {
  roomCode: string
  roomName: string
}

interface RoomOption {
  id: string
  code: string
  name: string
}

interface Props {
  rooms: RoomOption[]
  ratePlans: RatePlanRow[]
}

export function RatePlansClient({ rooms, ratePlans }: Props) {
  const [rows, setRows] = useState<RatePlanRow[]>(ratePlans)
  const [search, setSearch] = useState('')
  const [roomFilter, setRoomFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RatePlanRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((rp) => {
      if (roomFilter !== 'all' && rp.roomId !== roomFilter) return false
      if (!q) return true
      return (
        rp.name.toLowerCase().includes(q) ||
        rp.roomCode.toLowerCase().includes(q) ||
        rp.roomName.toLowerCase().includes(q)
      )
    })
  }, [rows, search, roomFilter])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(plan: RatePlanRow) {
    setEditing(plan)
    setModalOpen(true)
  }

  function handleSaved(plan: RatePlanData) {
    const room = roomById.get(plan.roomId)
    const row: RatePlanRow = { ...plan, roomCode: room?.code ?? '', roomName: room?.name ?? '' }
    if (editing) {
      setRows((prev) => prev.map((p) => (p.id === row.id ? row : p)))
    } else {
      setRows((prev) => [...prev, row])
    }
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus rate plan ini? Semua data harga dan restriksi terkait juga akan dihapus.')) return
    setDeletingId(id)
    startTransition(async () => {
      const res = await deleteRatePlan(id)
      if (res.success) {
        setRows((prev) => prev.filter((p) => p.id !== id))
        toast.success('Rate plan dihapus')
      } else {
        toast.error('Gagal menghapus rate plan')
      }
      setDeletingId(null)
    })
  }

  function handleToggle(plan: RatePlanRow) {
    startTransition(async () => {
      const res = await toggleRatePlanActive(plan.id, !plan.isActive)
      if (res.success) {
        setRows((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p))
        )
      } else {
        toast.error('Gagal mengubah status')
      }
    })
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Rate Plans</h1>
          <p className="text-sm text-muted-foreground">
            Kelola semua rate plan dari seluruh kamar dalam satu tempat.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Tambah Rate Plan
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama rate plan atau kamar..."
            className="pl-8"
          />
        </div>
        <Select value={roomFilter} onValueChange={setRoomFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Semua Kamar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kamar</SelectItem>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.code} · {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={rows.length === 0 ? 'Belum ada rate plan' : 'Tidak ada rate plan yang cocok'}
          description={
            rows.length === 0
              ? 'Tambah rate plan untuk menentukan harga kamar.'
              : 'Coba ubah kata kunci pencarian atau filter kamar.'
          }
          actionLabel={rows.length === 0 ? '+ Tambah Rate Plan' : undefined}
          onAction={rows.length === 0 ? openAdd : undefined}
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Kamar
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nama Rate Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Harga Dasar
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                  Sell Mode
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((plan) => (
                <tr key={plan.id} className="group hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {plan.roomCode} · {plan.roomName}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/rooms/${plan.roomId}/rate-plans/${plan.id}`}
                      className="font-medium text-foreground hover:underline flex items-center gap-1"
                    >
                      {plan.name}
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {formatRp(plan.basePrice)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden sm:table-cell">
                    {plan.sellMode === 'per_room' ? 'Per Kamar' : 'Per Orang'}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button type="button"
                      aria-label={`${plan.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${plan.name}`}
                      onClick={() => handleToggle(plan)}
                      disabled={isPending}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50',
                        plan.isActive ? 'bg-neutral-800' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform',
                          plan.isActive ? 'translate-x-4' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button type="button"
                        aria-label={`Edit ${plan.name}`}
                        onClick={() => openEdit(plan)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button"
                        aria-label={`Hapus ${plan.name}`}
                        onClick={() => handleDelete(plan.id)}
                        disabled={deletingId === plan.id}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RatePlanModal
        key={modalOpen ? (editing?.id ?? 'new') : 'closed'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        roomId={editing?.roomId ?? ''}
        rooms={rooms}
        initial={editing}
        onSaved={handleSaved}
      />
    </div>
  )
}
