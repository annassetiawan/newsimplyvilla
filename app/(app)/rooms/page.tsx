export const revalidate = 60

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { RoomsClient } from '@/components/rooms/rooms-client'
import { getSessionUser } from '@/lib/getSession'

export default async function RoomsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId

  const today = new Date()

  const [rooms, areas, tasks] = await Promise.all([
    db.room.findMany({
      where: { villaId },
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
    db.area.findMany({ where: { villaId } }),
    db.task.findMany({
      where: { villaId, type: 'MAINTENANCE' },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  // Pre-group tasks by room code in a single O(t) pass instead of O(t×r) repeated filter
  const tasksByRoomCode = new Map<string, typeof tasks>()
  for (const task of tasks) {
    for (const room of rooms) {
      if (task.location.includes(room.code)) {
        const list = tasksByRoomCode.get(room.code) ?? []
        list.push(task)
        tasksByRoomCode.set(room.code, list)
        break
      }
    }
  }

  const serializedRooms = rooms.map((room) => {
    const activeRes = room.reservations.find(
      (r) => new Date(r.checkIn) <= today && new Date(r.checkOut) >= today
    )

    const roomTasks = (tasksByRoomCode.get(room.code) ?? [])
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
      photos: room.photos,
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

  const plan = (user.villa.subscription?.plan ?? 'FREE') as 'FREE' | 'PRO'

  return <RoomsClient rooms={serializedRooms} areas={serializedAreas} plan={plan} roomCount={rooms.length} />
}
