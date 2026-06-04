export const revalidate = 0

import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/settings-client'
import { getSessionUser } from '@/lib/getSession'
import { getActivityLog } from '@/app/actions/settings'

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'STAFF' && !user.permissions.includes('settings')) redirect('/dashboard')

  const [profile, activityLog] = await Promise.all([
    Promise.resolve({
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      position: user.position,
    }),
    getActivityLog(),
  ])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your profile, preferences, and account settings.
        </p>
      </div>
      <SettingsClient
        profile={profile}
        activityLog={activityLog}
        villa={{
          name: user.villa?.name ?? '',
          description: user.villa?.description ?? '',
        }}
      />
    </div>
  )
}
