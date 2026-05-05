export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { UsersClient } from '@/components/users/users-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function UsersPage() {
  const staffRaw = await db.staff.findMany({
    where: { villaId: VILLA_ID },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const staff = staffRaw.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? '',
    position: s.position,
    role: s.role as string,
    isActive: s.isActive,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your team</p>
      </div>
      <UsersClient staff={staff} />
    </div>
  )
}
