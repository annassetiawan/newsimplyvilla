'use client'

import { useState, useTransition } from 'react'
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Waves,
  Leaf,
  ConciergeBell,
  WashingMachine,
  Building2,
  Images,
  BedDouble,
  Filter,
  MapPin,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RoomModal, type RoomFormData } from './room-modal'
import { createArea } from '@/app/actions/rooms'

const STATUS_STYLE = {
  OCCUPIED: 'bg-green-500 text-white',
  AVAILABLE: 'bg-background text-muted-foreground border border-border',
  CLEANING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MAINTENANCE: 'bg-red-500 text-white',
} as const

const STATUS_LABEL = {
  OCCUPIED: 'Occupied',
  AVAILABLE: 'Available',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maintenance',
} as const

const FILTER_TABS = ['All rooms', 'Available', 'Occupied', 'Cleaning', 'Areas'] as const
type FilterTab = (typeof FILTER_TABS)[number]

function fmtRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function nights(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}

function areaIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('pool') || n.includes('swim')) return Waves
  if (n.includes('garden') || n.includes('taman')) return Leaf
  if (n.includes('lobby') || n.includes('reception')) return ConciergeBell
  if (n.includes('laundry') || n.includes('wash')) return WashingMachine
  return Building2
}

export interface RoomWithReservation extends RoomFormData {
  currentReservation?: {
    id: string
    checkIn: string
    checkOut: string
    guest: { name: string; phone: string | null }
  } | null
  recentTasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    dueDate: string | null
  }>
}

export interface AreaData {
  id: string
  name: string
  description: string | null
}

interface Props {
  rooms: RoomWithReservation[]
  areas: AreaData[]
}

export function RoomsClient({ rooms, areas }: Props) {
  const [tab, setTab] = useState<FilterTab>('All rooms')
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<RoomWithReservation | null>(null)
  const [editRoom, setEditRoom] = useState<RoomFormData | null>(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [areaModalOpen, setAreaModalOpen] = useState(false)
  const [areaName, setAreaName] = useState('')
  const [areaDesc, setAreaDesc] = useState('')
  const [areaPending, startAreaTransition] = useTransition()

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
    const matchTab =
      tab === 'All rooms' ||
      tab === 'Areas' ||
      r.status.toLowerCase() === tab.toLowerCase()
    return matchSearch && matchTab
  })

  function openAdd() {
    setEditRoom(null)
    setRoomModalOpen(true)
  }
  function openEdit(room: RoomWithReservation) {
    setEditRoom({
      id: room.id,
      code: room.code,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      status: room.status,
    })
    setRoomModalOpen(true)
  }

  function handleAreaSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!areaName.trim()) return
    startAreaTransition(async () => {
      await createArea({ name: areaName.trim(), description: areaDesc || undefined })
      setAreaName('')
      setAreaDesc('')
      setAreaModalOpen(false)
    })
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rooms &amp; Areas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {rooms.length} rooms and {areas.length} shared areas at Villa Senja Ubud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted">
            <Images className="h-3.5 w-3.5 text-muted-foreground" />
            Gallery
          </button>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add room
          </Button>
        </div>
      </div>

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex h-9 items-center rounded-lg border border-border bg-background p-1 text-muted-foreground">
          {FILTER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
                tab === t
                  ? 'bg-muted text-foreground shadow-sm'
                  : 'hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter rooms..."
            className="h-9 w-52 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Room cards */}
      {tab !== 'Areas' && (
        rooms.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="Belum ada kamar"
            description="Tambahkan kamar villa kamu untuk mulai mengelola reservasi dan status."
            actionLabel="+ Tambah kamar"
            onAction={openAdd}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onView={() => setSelectedRoom(room)}
                onEdit={() => openEdit(room)}
              />
            ))}
            {filteredRooms.length === 0 && (
              <div className="col-span-3 flex flex-col items-center gap-2 py-12 text-center">
                <Filter className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Tidak ada kamar dengan status ini
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  Coba filter lain atau tambah kamar baru.
                </p>
              </div>
            )}
          </div>
        )
      )}

      {/* Shared areas */}
      {(tab === 'All rooms' || tab === 'Areas') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Shared areas</h2>
              <p className="text-sm text-muted-foreground">
                Common spaces and amenities across the property.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAreaModalOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add area
            </Button>
          </div>
          {areas.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Belum ada area bersama"
              description="Tambahkan area seperti kolam renang, taman, atau lobby."
              actionLabel="+ Tambah area"
              onAction={() => setAreaModalOpen(true)}
              minHeight="min-h-[200px]"
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {areas.map((area) => {
                const Icon = areaIcon(area.name)
                return (
                  <div
                    key={area.id}
                    className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/20">
                      <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{area.name}</p>
                      {area.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {area.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Room detail sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selectedRoom && (
            <RoomDetailSheet
              room={selectedRoom}
              onEdit={() => { setSelectedRoom(null); openEdit(selectedRoom) }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Room add/edit modal */}
      <RoomModal
        open={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        initial={editRoom}
      />

      {/* Area modal */}
      <Dialog open={areaModalOpen} onOpenChange={setAreaModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add shared area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAreaSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Area name</Label>
              <Input
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
                placeholder="e.g. Swimming Pool"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={areaDesc}
                onChange={(e) => setAreaDesc(e.target.value)}
                placeholder="Optional description..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAreaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={areaPending}>
                {areaPending ? 'Saving...' : 'Add area'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RoomCard({
  room,
  onView,
  onEdit,
}: {
  room: RoomWithReservation
  onView: () => void
  onEdit: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {/* Image placeholder */}
      <div className="relative h-44 bg-muted/40 flex items-center justify-center">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase select-none">
          {room.name}
        </p>
        <span
          className={cn(
            'absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            STATUS_STYLE[room.status]
          )}
        >
          {STATUS_LABEL[room.status]}
        </span>
      </div>

      {/* Card body */}
      <div className="p-4">
        <p className="font-id text-muted-foreground">{room.code}</p>
        <p className="mt-0.5 text-sm font-bold leading-tight">{room.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {room.capacity} guests &middot; {room.type} &middot; 38 m²
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-base font-bold">{fmtRp(room.pricePerNight)}</p>
            <p className="text-[11px] text-muted-foreground">per night</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onView}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoomDetailSheet({
  room,
  onEdit,
}: {
  room: RoomWithReservation
  onEdit: () => void
}) {
  return (
    <>
      <SheetHeader className="mb-6">
        <div className="flex items-center justify-between">
          <SheetTitle>
            <span className="font-id">{room.code}</span>
            {' — '}{room.name}
          </SheetTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" /> Edit
          </Button>
        </div>
        <span
          className={cn(
            'inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold',
            STATUS_STYLE[room.status]
          )}
        >
          {STATUS_LABEL[room.status]}
        </span>
      </SheetHeader>

      <div className="mb-5 h-40 rounded-xl bg-muted/40 flex items-center justify-center text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
        {room.name}
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Room info
          </p>
          <div className="space-y-1.5 text-sm">
            {[
              ['Type', room.type],
              ['Capacity', `${room.capacity} guests`],
              ['Price / night', fmtRp(room.pricePerNight)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {room.currentReservation && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current guest
            </p>
            <div className="rounded-lg border border-border p-3 space-y-1.5 text-sm">
              <p className="font-semibold">{room.currentReservation.guest.name}</p>
              {room.currentReservation.guest.phone && (
                <p className="text-muted-foreground">{room.currentReservation.guest.phone}</p>
              )}
              <p className="text-muted-foreground">
                {fmtDate(room.currentReservation.checkIn)} —{' '}
                {fmtDate(room.currentReservation.checkOut)}{' '}
                <span className="font-medium text-foreground">
                  ({nights(room.currentReservation.checkIn, room.currentReservation.checkOut)}n)
                </span>
              </p>
            </div>
          </div>
        )}

        {room.recentTasks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent maintenance
            </p>
            <div className="space-y-2">
              {room.recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-2.5"
                >
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-[11px] text-muted-foreground">Due {fmtDate(task.dueDate)}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      task.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'MED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
