export const revalidate = 60

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { UsersClient } from '@/components/users/users-client'
import { getSessionUser } from '@/lib/getSession'

export default async function UsersPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'STAFF' && !user.permissions.includes('users')) redirect('/dashboard')
  const villaId = user.villaId

  const staffRaw = await db.staff.findMany({
    where: { villaId },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const staff = staffRaw.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email ?? '',
    position: s.position,
    role: s.role as string,
    isActive: s.isActive,
    confirmed: s.supabaseUserId !== null,
    permissions: s.permissions,
  }))

  const plan = (user.villa.subscription?.plan ?? 'FREE') as 'FREE' | 'PRO'
  const activeStaffCount = staffRaw.filter((s) => s.isActive).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your team</p>
      </div>
      <UsersClient staff={staff} plan={plan} activeStaffCount={activeStaffCount} />
    </div>
  )
}
