export const dynamic = 'force-dynamic'

import { db } from '@/lib/db'
import { SettingsClient } from '@/components/settings/settings-client'

const VILLA_ID = 'villa-senja-ubud'

export default async function SettingsPage() {
  const staff = await db.staff.findFirst({
    where: { villaId: VILLA_ID, role: 'OWNER' },
  })

  const profile = {
    id: staff?.id ?? '',
    name: staff?.name ?? 'Villa Owner',
    email: staff?.email ?? '',
    position: staff?.position ?? 'Owner',
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your profile, preferences, and account settings.
        </p>
      </div>
      <SettingsClient profile={profile} />
    </div>
  )
}
