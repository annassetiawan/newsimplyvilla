import { db } from '@/lib/db'
import type { Plan } from '@prisma/client'

export async function getVillaSubscription(villaId: string) {
  return db.subscription.findUnique({ where: { villaId } })
}

export function isPro(plan: Plan): boolean {
  return plan === 'PRO'
}
