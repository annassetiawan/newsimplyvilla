import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'
import { getVillaCalendar } from '@/app/actions/ratePlan'
import { AvailabilityClient } from '@/components/rate-plans/AvailabilityClient'

const WINDOW = 14

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default async function AvailabilityPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  const villaId = user.villaId

  const startDate = toISO(new Date())
  const endDate = toISO(addDays(new Date(), WINDOW - 1))

  const [rooms, initialRows] = await Promise.all([
    db.room.findMany({
      where: { villaId },
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true },
    }),
    getVillaCalendar(startDate, endDate),
  ])

  return (
    <AvailabilityClient rooms={rooms} initialRows={initialRows} initialStartDate={startDate} />
  )
}
