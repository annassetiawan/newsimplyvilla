export const revalidate = 30

import { notFound, redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { GuestDetailClient } from '@/components/front-desk/guest-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuestDetailPage({ params }: Props) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const guest = await db.guest.findFirst({
    where: {
      id,
      reservations: { some: { room: { villaId: user.villaId } } },
    },
    include: {
      reservations: {
        where: { room: { villaId: user.villaId } },
        include: { room: true },
        orderBy: { checkIn: 'desc' },
      },
    },
  })

  if (!guest) notFound()

  const serialized = {
    id: guest.id,
    name: guest.name,
    phone: guest.phone,
    email: guest.email,
    idNumber: guest.idNumber,
    notes: guest.notes,
    createdAt: guest.createdAt.toISOString(),
    reservations: guest.reservations.map((r) => ({
      id: r.id,
      checkIn: r.checkIn.toISOString(),
      checkOut: r.checkOut.toISOString(),
      status: r.status as 'CONFIRMED' | 'PENDING' | 'CHECKEDIN' | 'CHECKEDOUT' | 'CANCELLED',
      paymentStatus: r.paymentStatus as 'PAID' | 'UNPAID',
      totalAmount: r.totalAmount,
      room: { id: r.room.id, code: r.room.code, name: r.room.name },
    })),
  }

  return <GuestDetailClient guest={serialized} />
}
