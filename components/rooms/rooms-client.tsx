'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  X,
  Users,
  Wallet,
  Wrench,
  Settings2,
} from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
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
import { ProGate } from '@/components/ProGate'

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
  plan: 'FREE' | 'PRO'
  roomCount: number
}

export function RoomsClient({ rooms, areas, plan, roomCount }: Props) {
  const [tab, setTab] = useState<FilterTab>('All rooms')
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState<RoomWithReservation | null>(null)
  const [editRoom, setEditRoom] = useState<RoomFormData | null>(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
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
      photos: room.photos,
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
          {plan === 'FREE' && (
            <p className="mt-1 text-sm text-muted-foreground">
              {roomCount}/10 kamar digunakan
              {roomCount >= 8 && (
                <span className="text-amber-500 ml-2">— Mendekati batas</span>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="scrollbar-hide flex overflow-x-auto rounded-lg border border-border bg-background p-1 text-muted-foreground">
          {FILTER_TABS.map((t) => (
            <button type="button"
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all',
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
            className="h-9 w-full pl-8 text-sm sm:w-52"
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
        <ProGate feature="Area Management" description="Kelola area bersama seperti kolam renang, taman, dan lobby villa.">
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
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
        </ProGate>
      )}

      {/* Room detail sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <SheetContent side="right" showCloseButton={false} className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]">
          {selectedRoom && (
            <RoomDetailSheet
              room={selectedRoom}
              onClose={() => setSelectedRoom(null)}
              onEdit={() => { setSelectedRoom(null); openEdit(selectedRoom) }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Room add/edit modal */}
      <RoomModal
        key={roomModalOpen ? (editRoom?.id ?? 'new') : 'closed'}
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

      {/* Gallery modal */}
      <GalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        rooms={rooms}
      />
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
      {/* Image */}
      <div className="relative h-44 bg-muted/40 flex items-center justify-center overflow-hidden">
        {room.photos && room.photos.length > 0 ? (
          <Image
            src={room.photos[0]}
            alt={room.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <p className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase select-none">
            {room.name}
          </p>
        )}
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
            <Link
              href={`/rooms/${room.id}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Kelola Rate Plans"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Link>
            <button type="button"
              aria-label={`Lihat ${room.name}`}
              onClick={onView}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
            <button type="button"
              aria-label={`Edit ${room.name}`}
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

function GalleryModal({
  open,
  onClose,
  rooms,
}: {
  open: boolean
  onClose: () => void
  rooms: RoomWithReservation[]
}) {
  const [lightbox, setLightbox] = useState<{ url: string; room: string } | null>(null)

  useEffect(() => {
    if (!lightbox) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [lightbox])

  const roomsWithPhotos = rooms.filter((r) => r.photos && r.photos.length > 0)
  const totalPhotos = roomsWithPhotos.reduce((s, r) => s + (r.photos?.length ?? 0), 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <DialogTitle>Room Gallery</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPhotos} photos · {roomsWithPhotos.length} rooms
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {roomsWithPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Images className="h-8 w-8 text-muted-foreground/30" strokeWidth={1.5} />
                <p className="text-sm font-medium text-muted-foreground">No photos yet</p>
                <p className="text-xs text-muted-foreground">Upload photos when editing a room.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roomsWithPhotos.map((room) => (
                  <div key={room.id}>
                    <p className="mb-2 text-xs font-semibold text-muted-foreground">
                      <span className="font-id">{room.code}</span> — {room.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {room.photos!.map((url) => (
                        <button type="button"
                          aria-label={`Buka foto ${room.name}`}
                          key={url}
                          onClick={() => setLightbox({ url, room: `${room.code} — ${room.name}` })}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-muted/40"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 33vw, 50vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {/* Backdrop click-to-close is a convenience gesture; the visible close
          button and the Escape handler above already give keyboard users a
          reachable way to dismiss, so this div doesn't need its own role. */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button type="button"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox.url}
              alt=""
              width={1600}
              height={1200}
              className="h-auto w-auto max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            <p className="text-sm text-white/70">{lightbox.room}</p>
          </div>
        </div>
      )}
    </>
  )
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

function RoomDetailSheet({
  room,
  onClose,
  onEdit,
}: {
  room: RoomWithReservation
  onClose: () => void
  onEdit: () => void
}) {
  return (
    <>
      <SheetTitle className="sr-only">Room detail</SheetTitle>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-6 py-4">
        <div>
          <p className="text-base font-semibold">
            <span className="font-id">{room.code}</span>
            {' — '}{room.name}
          </p>
          <span
            className={cn(
              'mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
              STATUS_STYLE[room.status]
            )}
          >
            {STATUS_LABEL[room.status]}
          </span>
        </div>
        <button type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Photos */}
        {room.photos && room.photos.length > 0 ? (
          <div className="mx-6 mt-5 flex gap-2 overflow-x-auto pb-0.5">
            {room.photos.map((url) => (
              <Image
                key={url}
                src={url}
                alt=""
                width={192}
                height={144}
                className="h-36 w-48 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="mx-6 mt-5 h-36 rounded-xl bg-muted/40 flex items-center justify-center">
            <Images className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Room info */}
        <div className="px-6 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Room info
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BedDouble className="h-4 w-4" />
                <span>Type</span>
              </div>
              <span className="text-sm font-medium">{room.type}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Capacity</span>
              </div>
              <span className="text-sm font-medium">{room.capacity} guests</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4" />
                <span>Price / night</span>
              </div>
              <span className="text-sm font-medium">{fmtRp(room.pricePerNight)}</span>
            </div>
          </div>
        </div>

        {/* Current guest */}
        {room.currentReservation && (
          <>
            <div className="mx-6 border-t border-border" />
            <div className="px-6 py-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Current guest
              </p>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(room.currentReservation.guest.name)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold">{room.currentReservation.guest.name}</p>
                  {room.currentReservation.guest.phone && (
                    <p className="text-sm text-muted-foreground">{room.currentReservation.guest.phone}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {fmtDate(room.currentReservation.checkIn)} —{' '}
                    {fmtDate(room.currentReservation.checkOut)}{' '}
                    <span className="font-medium text-foreground">
                      ({nights(room.currentReservation.checkIn, room.currentReservation.checkOut)}n)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Recent maintenance */}
        {room.recentTasks.length > 0 && (
          <>
            <div className="mx-6 border-t border-border" />
            <div className="px-6 py-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Recent maintenance
              </p>
              <div className="space-y-2">
                {room.recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.dueDate && (
                          <p className="text-[11px] text-muted-foreground">Due {fmtDate(task.dueDate)}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
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
          </>
        )}
      </div>

      {/* Sticky footer */}
      <div className="border-t border-border px-6 py-4 flex flex-col gap-2">
        <Link
          href={`/rooms/${room.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <Settings2 className="h-4 w-4" />
          Kelola Rate Plans
        </Link>
        <Button variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit room
        </Button>
      </div>
    </>
  )
}
