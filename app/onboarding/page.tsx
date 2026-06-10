export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { OnboardingClient } from '@/components/onboarding/onboarding-client'

export default async function OnboardingPage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')
  if (user.villa?.isOnboarded) redirect('/dashboard')

  return (
    <OnboardingClient
      userName={user.name}
      villaName={user.villa?.name ?? ''}
      villaAddress={user.villa?.address ?? ''}
      villaContact={user.villa?.contact ?? ''}
      villaDescription={user.villa?.description ?? ''}
    />
  )
}
