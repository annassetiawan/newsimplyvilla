import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { getRatePlansByRoom, getRoomCalendar } from '@/app/actions/ratePlan'
import { RoomDetailClient } from '@/components/rooms/RoomDetailClient'

interface Props {
  params: Promise<{ roomId: string }>
}

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const today = new Date()
  const startDate = toISO(today)
  const endDate = toISO(addDays(today, 13)) // 14-day window

  const [room, ratePlans, calendarRows] = await Promise.all([
    db.room.findUnique({
      where: { id: roomId, villaId: user.villaId },
    }),
    getRatePlansByRoom(roomId),
    getRoomCalendar(roomId, startDate, endDate),
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
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
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
        calendarRows={calendarRows}
        calendarStartDate={startDate}
      />
    </div>
  )
}
