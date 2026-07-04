import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { getChannexStatus } from '@/app/actions/channex'
import { ChannexSettingsClient } from '@/components/channex/ChannexSettingsClient'

export const revalidate = 0

export default async function ChannelManagerPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const status = await getChannexStatus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channel Manager</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Hubungkan SimplyVilla ke Channex untuk sync otomatis ke Booking.com, Airbnb, Expedia, dan OTA lainnya.
        </p>
      </div>

      <ChannexSettingsClient initialStatus={status} />
    </div>
  )
}
