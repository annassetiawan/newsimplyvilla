import { db } from '@/lib/db'
import type { Plan } from '@prisma/client'
import { getSessionUser } from '@/lib/getSession'

export async function getVillaSubscription(villaId: string) {
  return db.subscription.findUnique({ where: { villaId } })
}

export function isPro(plan: Plan): boolean {
  return plan === 'PRO'
}

export async function getVillaPlan(): Promise<'FREE' | 'PRO'> {
  const user = await getSessionUser()
  return (user?.villa?.subscription?.plan ?? 'FREE') as 'FREE' | 'PRO'
}
