import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { db } from '@/lib/db'
import { ProGate } from '@/components/ProGate'
import FinanceClient from '@/components/finance/finance-client'

function startOf6MonthsAgo(now: Date): Date {
  const d = new Date(now)
  d.setMonth(d.getMonth() - 5)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function FinancePage() {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  const now = new Date()
  const last6MonthsStart = startOf6MonthsAgo(now)

  const [transactions, reservations, posTransactions, pettyCash, payrolls, staffList, budgets] =
    await Promise.all([
      db.transaction.findMany({
        where: { villaId: user.villaId!, date: { gte: last6MonthsStart } },
        orderBy: { date: 'desc' },
      }),
      db.reservation.findMany({
        where: {
          room: { villaId: user.villaId! },
          checkIn: { gte: last6MonthsStart },
          status: { in: ['CONFIRMED', 'CHECKEDIN', 'CHECKEDOUT'] },
        },
      }),
      db.posTransaction.findMany({
        where: { villaId: user.villaId!, createdAt: { gte: last6MonthsStart } },
        include: { business: { select: { name: true } } },
      }),
      db.pettyCash.findMany({
        where: { villaId: user.villaId! },
        orderBy: { date: 'desc' },
        take: 200,
      }),
      db.payroll.findMany({
        where: { villaId: user.villaId!, year: now.getFullYear() },
        include: { staff: { select: { id: true, name: true, position: true } } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      db.staff.findMany({
        where: { villaId: user.villaId!, isActive: true },
        select: { id: true, name: true, position: true },
      }),
      db.budget.findMany({
        where: { villaId: user.villaId! },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      }),
    ])

  return (
    <ProGate
      feature="Finance & Account"
      description="Kelola keuangan villa lebih profesional dengan laporan P&L, petty cash, dan payroll."
    >
      <FinanceClient
        transactions={transactions.map((t) => ({
          ...t,
          date: t.date.toISOString(),
        }))}
        reservations={reservations.map((r) => ({
          ...r,
          checkIn: r.checkIn.toISOString(),
          checkOut: r.checkOut.toISOString(),
          createdAt: r.createdAt.toISOString(),
        }))}
        posTransactions={posTransactions.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        }))}
        pettyCash={pettyCash.map((p) => ({
          ...p,
          date: p.date.toISOString(),
          createdAt: p.createdAt.toISOString(),
        }))}
        payrolls={payrolls.map((p) => ({
          ...p,
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        }))}
        staffList={staffList}
        budgets={budgets}
        currentMonth={now.getMonth() + 1}
        currentYear={now.getFullYear()}
      />
    </ProGate>
  )
}
