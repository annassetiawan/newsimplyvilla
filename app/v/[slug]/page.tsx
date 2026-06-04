import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { BookingClient } from './booking-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function VillaPage({ params }: PageProps) {
  const { slug } = await params

  const villa = await db.villa.findUnique({
    where: { slug },
    include: {
      rooms: {
        where: { status: { not: 'MAINTENANCE' } },
        orderBy: { code: 'asc' },
      },
    },
  })

  if (!villa) notFound()

  // Fetch existing reservations for availability checking
  const reservations = await db.reservation.findMany({
    where: {
      room: { villaId: villa.id },
      status: { notIn: ['CANCELLED', 'CHECKEDOUT'] },
    },
    select: {
      id: true,
      roomId: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
  })

  const serialized = {
    villa: {
      id: villa.id,
      name: villa.name,
      address: villa.address,
      description: villa.description,
      contact: villa.contact,
      facilities: villa.facilities,
    },
    rooms: villa.rooms.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      pricePerNight: r.pricePerNight,
      status: r.status,
      photos: r.photos,
    })),
    reservations: reservations.map((r) => ({
      id: r.id,
      roomId: r.roomId,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut.toISOString(),
      status: r.status,
    })),
  }

  return <BookingClient data={serialized} />
}
