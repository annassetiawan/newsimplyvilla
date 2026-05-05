export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { RoomsClient } from '@/components/rooms/rooms-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function RoomsPage() {
  const today = new Date()

  const [rooms, areas, tasks] = await Promise.all([
    db.room.findMany({
      where: { villaId: VILLA_ID },
      orderBy: { code: 'asc' },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKEDIN'] } },
          include: { guest: true },
          orderBy: { checkIn: 'asc' },
          take: 1,
        },
      },
    }),
    db.area.findMany({ where: { villaId: VILLA_ID } }),
    db.task.findMany({
      where: { villaId: VILLA_ID, type: 'MAINTENANCE' },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  const serializedRooms = rooms.map((room) => {
    const activeRes = room.reservations.find(
      (r) => new Date(r.checkIn) <= today && new Date(r.checkOut) >= today
    )

    const roomTasks = tasks
      .filter((t) => t.location.includes(room.code))
      .slice(0, 3)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      }))

    return {
      id: room.id,
      code: room.code,
      name: room.name,
      type: room.type,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      status: room.status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
      currentReservation: activeRes
        ? {
            id: activeRes.id,
            checkIn: activeRes.checkIn.toISOString(),
            checkOut: activeRes.checkOut.toISOString(),
            guest: {
              name: activeRes.guest.name,
              phone: activeRes.guest.phone,
            },
          }
        : null,
      recentTasks: roomTasks,
    }
  })

  const serializedAreas = areas.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rooms &amp; Areas</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage room status, details, and shared villa areas.
        </p>
      </div>
      <RoomsClient rooms={serializedRooms} areas={serializedAreas} />
    </div>
  )
}
