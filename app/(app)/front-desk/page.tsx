export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { FrontDeskClient } from '@/components/front-desk/front-desk-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function FrontDeskPage() {
  const [rooms, reservations, guestsRaw, lostAndFound] = await Promise.all([
    db.room.findMany({ where: { villaId: VILLA_ID }, orderBy: { code: 'asc' } }),
    db.reservation.findMany({
      where: { room: { villaId: VILLA_ID }, status: { notIn: ['CANCELLED'] } },
      include: { guest: true, room: true },
      orderBy: { checkIn: 'asc' },
    }),
    db.guest.findMany({
      where: { reservations: { some: { room: { villaId: VILLA_ID } } } },
      include: {
        reservations: {
          where: { room: { villaId: VILLA_ID } },
          include: { room: true },
          orderBy: { checkIn: 'desc' },
        },
      },
    }),
    db.lostAndFound.findMany({ where: { villaId: VILLA_ID }, orderBy: { foundDate: 'desc' } }),
  ])

  const serializedRooms = rooms.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    type: r.type,
    capacity: r.capacity,
    pricePerNight: r.pricePerNight,
    status: r.status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
    villaId: r.villaId,
  }))

  const serializedReservations = reservations.map((r) => ({
    id: r.id,
    checkIn: r.checkIn.toISOString(),
    checkOut: r.checkOut.toISOString(),
    status: r.status as 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT' | 'CANCELLED',
    paymentStatus: r.paymentStatus as 'PAID' | 'UNPAID',
    totalAmount: r.totalAmount,
    createdAt: r.createdAt.toISOString(),
    guest: {
      id: r.guest.id,
      name: r.guest.name,
      phone: r.guest.phone,
      idNumber: r.guest.idNumber,
    },
    room: { id: r.room.id, code: r.room.code, name: r.room.name },
  }))

  const serializedGuests = guestsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    idNumber: g.idNumber,
    notes: g.notes,
    createdAt: g.createdAt.toISOString(),
    reservations: g.reservations.map((r) => ({
      id: r.id,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut.toISOString(),
      status: r.status,
      totalAmount: r.totalAmount,
      room: { code: r.room.code, name: r.room.name },
    })),
  }))

  const serializedLostFound = lostAndFound.map((i) => ({
    id: i.id,
    item: i.item,
    description: i.description,
    location: i.location,
    foundDate: i.foundDate.toISOString(),
    status: i.status as 'FOUND' | 'CLAIMED',
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Front Desk</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage reservations, check-ins, guests, and lost &amp; found.
        </p>
      </div>
      <FrontDeskClient
        rooms={serializedRooms}
        reservations={serializedReservations}
        guests={serializedGuests}
        lostAndFound={serializedLostFound}
      />
    </div>
  )
}
