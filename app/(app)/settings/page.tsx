export const revalidate = 300

import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/settings-client'
import { getSessionUser } from '@/lib/getSession'

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'STAFF' && !user.permissions.includes('settings')) redirect('/dashboard')

  const profile = {
    id: user.id,
    name: user.name,
    email: user.email ?? '',
    position: user.position,
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
