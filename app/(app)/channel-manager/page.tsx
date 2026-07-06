import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { getChannexStatus, getOtaStats, getRatePlansForVilla } from '@/app/actions/channex'
import { ChannexSettingsClient } from '@/components/channex/ChannexSettingsClient'

export const revalidate = 0

export default async function ChannelManagerPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const [status, stats, ratePlans] = await Promise.all([
    getChannexStatus(),
    getOtaStats().catch(() => ({ bookingsThisMonth: 0, syncedRooms: 0, activeRatePlans: 0 })),
    getRatePlansForVilla().catch(() => []),
  ])

  const userRole = user.role as 'OWNER' | 'STAFF' | 'SUPER_ADMIN'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channel Manager</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hubungkan SimplyVilla ke OTA seperti Booking.com, Airbnb, dan Traveloka secara otomatis.
        </p>
      </div>

      <ChannexSettingsClient initialStatus={status} initialStats={stats} userRole={userRole} ratePlans={ratePlans} />
    </div>
  )
}
