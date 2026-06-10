import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromBearer } from '@/lib/getSessionFromBearer'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getSessionFromBearer(req.headers.get('authorization') ?? null)
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalVillas,
    activePro,
    freeCount,
    totalRevenue,
    totalReservations,
    newThisMonth,
  ] = await Promise.all([
    db.villa.count(),
    db.subscription.count({ where: { plan: 'PRO', status: 'ACTIVE' } }),
    db.subscription.count({ where: { plan: 'FREE', status: 'ACTIVE' } }),
    db.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.reservation.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.villa.count({ where: { updatedAt: { gte: thisMonthStart } } }),
  ])

  return NextResponse.json({
    totalVillas,
    activePro,
    freeCount,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    totalReservations,
    newThisMonth,
  })
}
