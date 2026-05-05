export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { MaintenanceClient } from '@/components/maintenance/maintenance-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function MaintenancePage() {
  const [tasksRaw, staff, rooms, areas] = await Promise.all([
    db.task.findMany({
      where: { villaId: VILLA_ID },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    }),
    db.staff.findMany({
      where: { villaId: VILLA_ID },
      orderBy: { name: 'asc' },
    }),
    db.room.findMany({
      where: { villaId: VILLA_ID },
      orderBy: { code: 'asc' },
      select: { code: true, name: true },
    }),
    db.area.findMany({
      where: { villaId: VILLA_ID },
      orderBy: { name: 'asc' },
      select: { name: true },
    }),
  ])

  const tasks = tasksRaw.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type as string,
    location: t.location,
    priority: t.priority as string,
    status: t.status as string,
    assignedTo: t.assignedTo,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
  }))

  const staffOptions = staff.map((s) => ({ id: s.id, name: s.name }))

  const locationOptions = [
    ...rooms.map((r) => `${r.code} – ${r.name}`),
    ...areas.map((a) => a.name),
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance & Cleaning</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Track and manage maintenance and housekeeping tasks.
        </p>
      </div>
      <MaintenanceClient
        tasks={tasks}
        staffOptions={staffOptions}
        locationOptions={locationOptions}
      />
    </div>
  )
}
