export const revalidate = 60

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { RatePlansClient } from '@/components/rate-plans/RatePlansClient'

export default async function RatePlansPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  const villaId = user.villaId

  const rooms = await db.room.findMany({
    where: { villaId },
    orderBy: { code: 'asc' },
    include: {
      ratePlans: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const serializedRooms = rooms.map((room) => ({
    id: room.id,
    code: room.code,
    name: room.name,
  }))

  const serializedRatePlans = rooms.flatMap((room) =>
    room.ratePlans.map((rp) => ({
      id: rp.id,
      name: rp.name,
      basePrice: Number(rp.basePrice),
      currency: rp.currency,
      sellMode: rp.sellMode,
      maxPersons: rp.maxPersons,
      isRefundable: rp.isRefundable,
      isActive: rp.isActive,
      roomId: rp.roomId,
      roomCode: room.code,
      roomName: room.name,
      createdAt: rp.createdAt.toISOString(),
    }))
  )

  return <RatePlansClient rooms={serializedRooms} ratePlans={serializedRatePlans} />
}
