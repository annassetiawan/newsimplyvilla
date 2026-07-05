import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getSessionUser } from '@/lib/getSession'
import { getRatePlanById, getPriceCalendar, getRestriction } from '@/app/actions/ratePlan'
import { RatePlanDetailClient } from '@/components/rooms/RatePlanDetailClient'

interface Props {
  params: Promise<{ roomId: string; ratePlanId: string }>
}

export default async function RatePlanDetailPage({ params }: Props) {
  const [{ roomId, ratePlanId }, user] = await Promise.all([params, getSessionUser()])
  if (!user?.villaId) redirect('/login')

  const ratePlan = await getRatePlanById(ratePlanId)
  if (!ratePlan || ratePlan.villaId !== user.villaId) notFound()

  const now = new Date()
  const [priceOverrides, restriction] = await Promise.all([
    getPriceCalendar(ratePlanId, now.getFullYear(), now.getMonth() + 1),
    getRestriction(ratePlanId),
  ])

  const serializedOverrides = priceOverrides.map((o) => ({
    id: o.id,
    ratePlanId: o.ratePlanId,
    date: o.date.toISOString().split('T')[0],
    price: o.price !== null ? Number(o.price) : null,
    isClosed: o.isClosed,
  }))

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link
          href="/rooms"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Rooms
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <Link
          href={`/rooms/${roomId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {ratePlan.room.name}
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-sm font-medium">{ratePlan.name}</span>
      </div>

      <RatePlanDetailClient
        ratePlan={{
          id: ratePlan.id,
          name: ratePlan.name,
          basePrice: Number(ratePlan.basePrice),
          currency: ratePlan.currency,
          sellMode: ratePlan.sellMode,
          maxPersons: ratePlan.maxPersons,
          isRefundable: ratePlan.isRefundable,
          isActive: ratePlan.isActive,
          roomId: ratePlan.roomId,
          createdAt: ratePlan.createdAt.toISOString(),
        }}
        initialOverrides={serializedOverrides}
        initialRestriction={restriction ? {
          id: restriction.id,
          ratePlanId: restriction.ratePlanId,
          minStay: restriction.minStay,
          maxStay: restriction.maxStay,
          closedToArrival: restriction.closedToArrival,
          closedToDeparture: restriction.closedToDeparture,
        } : null}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth() + 1}
      />
    </div>
  )
}
