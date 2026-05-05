'use client'

import { useState } from 'react'
import {
  Eye,
  Pencil,
  Plus,
  Search,
  LayoutGrid,
  List,
  Waves,
  Leaf,
  ConciergeBell,
  WashingMachine,
  Building2,
} from 'lucide-react'
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
import { useTransition } from 'react'

const STATUS_STYLE = {
  OCCUPIED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  AVAILABLE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CLEANING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MAINTENANCE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const

const STATUS_LABEL = {
  OCCUPIED: 'Occupied',
  AVAILABLE: 'Available',
  CLEANING: 'Cleaning',
  MAINTENANCE: 'Maint.',
} as const

const FILTER_TABS = ['All', 'Available', 'Occupied', 'Cleaning', 'Areas'] as const
type FilterTab = (typeof FILTER_TABS)[number]

function fmtRp(n: number) {
  return n >= 1_000_000 ? `Rp ${(n / 1_000_000).toFixed(1)}M` : `Rp ${(n / 1_000).toFixed(0)}K`
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
  const [tab, setTab] = useState<FilterTab>('All')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
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
      tab === 'All' ||
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
      {/* Rooms section */}
      <div className="space-y-4">
        {/* Filter tabs + controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
                  tab === t
                    ? 'bg-background text-foreground shadow'
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
              placeholder="Search rooms..."
              className="h-8 w-48 pl-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setView('grid')}
                className={cn(
                  'rounded-l-lg p-2 transition-colors',
                  view === 'grid' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'rounded-r-lg p-2 transition-colors',
                  view === 'list' ? 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="sm"
              onClick={openAdd}
              className="h-8 bg-primary text-white hover:bg-[#C8911A]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add room
            </Button>
          </div>
        </div>

        {/* Room cards — only show when not on Areas tab */}
        {tab !== 'Areas' && (
          view === 'grid' ? (
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
                <p className="col-span-3 py-10 text-center text-sm text-muted-foreground">
                  No rooms found
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border divide-y divide-border">
              {filteredRooms.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">No rooms found</p>
              )}
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{room.code}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          STATUS_STYLE[room.status]
                        )}
                      >
                        {STATUS_LABEL[room.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{room.name} · {room.type} · {room.capacity} pax</p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0">{fmtRp(room.pricePerNight)}/night</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedRoom(room)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(room)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Shared areas section */}
      {(tab === 'All' || tab === 'Areas') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Shared areas</h2>
              <p className="text-sm text-muted-foreground">Common spaces available for all guests</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setAreaModalOpen(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add area
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {areas.map((area) => {
              const Icon = areaIcon(area.name)
              return (
                <div
                  key={area.id}
                  className="rounded-xl border border-border bg-background p-4 flex flex-col gap-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
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
            {areas.length === 0 && (
              <p className="col-span-4 py-6 text-center text-sm text-muted-foreground">
                No shared areas added yet
              </p>
            )}
          </div>
        </div>
      )}

      {/* Room detail sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selectedRoom && <RoomDetailSheet room={selectedRoom} onEdit={() => { setSelectedRoom(null); openEdit(selectedRoom) }} />}
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
      {/* Photo placeholder */}
      <div className="relative h-36 bg-muted/60 flex items-center justify-center">
        <p className="text-sm font-semibold text-muted-foreground">{room.name}</p>
        <span
          className={cn(
            'absolute top-2.5 right-2.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
            STATUS_STYLE[room.status]
          )}
        >
          {STATUS_LABEL[room.status]}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-muted-foreground">{room.code}</p>
            <p className="text-sm font-semibold leading-tight mt-0.5">{room.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {room.type} · {room.capacity} pax
            </p>
          </div>
          <p className="text-sm font-bold text-primary shrink-0">{fmtRp(room.pricePerNight)}/night</p>
        </div>
        <div className="mt-3 flex justify-end gap-1.5">
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onView}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
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
            {room.code} — {room.name}
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

      {/* Photo placeholder */}
      <div className="mb-5 h-40 rounded-xl bg-muted/60 flex items-center justify-center text-sm text-muted-foreground">
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
              ['Capacity', `${room.capacity} pax`],
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
                {fmtDate(room.currentReservation.checkOut)}
                {' '}
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
                      <p className="text-[11px] text-muted-foreground">
                        Due {fmtDate(task.dueDate)}
                      </p>
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
