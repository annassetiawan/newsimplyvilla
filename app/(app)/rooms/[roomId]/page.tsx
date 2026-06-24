import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { getRatePlansByRoom } from '@/app/actions/ratePlan'
import { RoomDetailClient } from '@/components/rooms/RoomDetailClient'

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const [room, ratePlans] = await Promise.all([
    db.room.findUnique({
      where: { id: roomId, villaId: user.villaId },
    }),
    getRatePlansByRoom(roomId),
  ])

  if (!room) notFound()

  const serializedRatePlans = ratePlans.map((rp) => ({
    id: rp.id,
    name: rp.name,
    basePrice: Number(rp.basePrice),
    currency: rp.currency,
    sellMode: rp.sellMode,
    maxPersons: rp.maxPersons,
    isRefundable: rp.isRefundable,
    isActive: rp.isActive,
    roomId: rp.roomId,
    createdAt: rp.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/rooms"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Rooms
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm font-medium">{room.name}</span>
      </div>

      <RoomDetailClient
        room={{
          id: room.id,
          code: room.code,
          name: room.name,
          type: room.type,
          capacity: room.capacity,
          pricePerNight: room.pricePerNight,
          status: room.status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE',
          photos: room.photos,
        }}
        ratePlans={serializedRatePlans}
      />
    </div>
  )
}
