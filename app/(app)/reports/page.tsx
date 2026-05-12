export const revalidate = 300

import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/getSession'

const ReportsClient = dynamic(
  () => import('@/components/reports/reports-client').then((m) => ({ default: m.ReportsClient })),
  { loading: () => <div className="space-y-4"><div className="h-24 animate-pulse rounded-xl bg-muted" /><div className="h-64 animate-pulse rounded-xl bg-muted" /></div> }
)

export default async function ReportsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role === 'STAFF' && !user.permissions.includes('reports')) redirect('/dashboard')
  const villaId = user.villaId

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [txCurrent, txRecent, txMonthly, rooms] = await Promise.all([
    db.transaction.findMany({
      where: { villaId, date: { gte: periodStart, lte: periodEnd } },
      orderBy: { date: 'desc' },
      select: { type: true, amount: true, date: true, category: true, description: true, id: true, paymentStatus: true },
    }),
    db.transaction.findMany({
      where: { villaId },
      orderBy: { date: 'desc' },
      take: 20,
      select: { id: true, date: true, description: true, type: true, category: true, amount: true, paymentStatus: true },
    }),
    db.transaction.findMany({
      where: { villaId, date: { gte: twelveMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
    db.room.findMany({ where: { villaId } }),
  ])

  const revenue = txCurrent.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const expenses = txCurrent.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const netProfit = revenue - expenses

  const txPrev = txMonthly.filter((t) => t.date >= prevStart && t.date <= prevEnd)
  const prevRevenue = txPrev.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const prevExpenses = txPrev.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const prevNetProfit = prevRevenue - prevExpenses

  const occupiedRooms = rooms.filter(
    (r) => r.status === 'OCCUPIED' || r.status === 'CLEANING'
  ).length
  const avgOccupancy = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthMap = new Map<string, { revenue: number; expenses: number }>()
  for (const tx of txMonthly) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`
    const entry = monthMap.get(key) ?? { revenue: 0, expenses: 0 }
    if (tx.type === 'INCOME') entry.revenue += tx.amount
    else entry.expenses += tx.amount
    monthMap.set(key, entry)
  }

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const entry = monthMap.get(key) ?? { revenue: 0, expenses: 0 }
    return {
      month: MONTH_LABELS[d.getMonth()],
      revenue: entry.revenue,
      expenses: entry.expenses,
    }
  })

  const expCategoryMap = new Map<string, number>()
  for (const tx of txCurrent.filter((t) => t.type === 'EXPENSE')) {
    expCategoryMap.set(tx.category, (expCategoryMap.get(tx.category) ?? 0) + tx.amount)
  }
  const baseCategories = ['Staff salary', 'Utilities', 'Maintenance', 'F&B supplies', 'Amenities']
  const expenseByCategory = baseCategories
    .map((cat) => ({ category: cat, amount: expCategoryMap.get(cat) ?? 0 }))
    .sort((a, b) => b.amount - a.amount)

  const transactions = txRecent.map((t) => ({
    id: t.id,
    date: t.date.toISOString(),
    description: t.description,
    type: t.type as string,
    category: t.category,
    amount: t.amount,
    paymentStatus: t.paymentStatus as string,
  }))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Financial summaries, occupancy rates, and revenue analytics.
        </p>
      </div>
      <ReportsClient
        transactions={transactions}
        monthlyData={monthlyData}
        stats={{ revenue, expenses, netProfit, avgOccupancy, prevRevenue, prevExpenses, prevNetProfit }}
        expenseByCategory={expenseByCategory}
      />
    </div>
  )
}
