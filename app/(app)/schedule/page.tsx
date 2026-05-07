export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ScheduleClient } from '@/components/schedule/schedule-client'
import { getSessionUser } from '@/lib/getSession'

export default async function SchedulePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId

  const monday = new Date()
  const day = monday.getDay()
  monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const [staffRaw, shiftsRaw] = await Promise.all([
    db.staff.findMany({
      where: { villaId },
      orderBy: { name: 'asc' },
    }),
    db.shift.findMany({
      where: {
        staff: { villaId },
        date: { gte: monday, lte: sunday },
      },
      orderBy: { date: 'asc' },
    }),
  ])

  const staff = staffRaw.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
  }))

  const shifts = shiftsRaw.map((s) => ({
    id: s.id,
    staffId: s.staffId,
    date: s.date.toISOString(),
    shiftType: s.shiftType as string,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage staff shifts and weekly schedules.
        </p>
      </div>
      <ScheduleClient staff={staff} shifts={shifts} />
    </div>
  )
}
