import { getSessionUser } from '@/lib/getSession'

export async function getVillaPlan(): Promise<'FREE' | 'PRO'> {
  const user = await getSessionUser()
  return (user?.villa?.subscription?.plan ?? 'FREE') as 'FREE' | 'PRO'
}
