export const revalidate = 60

import { redirect } from 'next/navigation'
import { Download } from 'lucide-react'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { getSessionUser } from '@/lib/getSession'
import { DashboardTaskWidget } from '@/components/dashboard/task-widget'
import { DashboardDateFilter } from '@/components/dashboard/date-filter'
import { DashboardKpiCards } from '@/components/dashboard/kpi-cards'
import { RecentReservationsCard } from '@/components/dashboard/recent-reservations-card'
import { RoomStatusCard } from '@/components/dashboard/room-status-card'
import { LowStockCard } from '@/components/dashboard/low-stock-card'
import { getDateRange } from '@/lib/dashboard-date'
import { buildDashboardChartData } from '@/lib/dashboard-chart'

const RevenueChart = dynamic(
  () => import('@/components/dashboard/revenue-chart').then((m) => ({ default: m.RevenueChart })),
  { loading: () => <div className="h-[270px] animate-pulse rounded-lg bg-muted" /> }
)

const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MED: 1, LOW: 2 }

function calcPct(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>
}) {
  const user = await getSessionUser()
  if (!user?.villaId) redirect('/login')

  if (user.role === 'STAFF' && !user.permissions.includes('dashboard')) {
    const first = user.permissions[0]
    redirect(first ? `/${first}` : '/login')
  }

  const villaId = user.villaId
  const { preset = 'this_month' } = await searchParams

  const now = new Date()
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  const { from: rangeFrom, to: rangeTo, prevFrom, prevTo } = getDateRange(preset)

  try {
    const [rooms, openTasks, recentReservations, allInventory, monthlyIncome, chartReservations, thisMonthCount, lastMonthCount] =
      await Promise.all([
      db.room.findMany({ where: { villaId }, orderBy: { code: 'asc' } }),
      db.task.findMany({
        where: { villaId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      db.reservation.findMany({
        where: { room: { villaId }, status: { notIn: ['CANCELLED'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { guest: true, room: true },
      }),
      db.inventoryItem.findMany({
        where: { villaId },
        select: { id: true, name: true, onHand: true, minLevel: true },
      }),
      db.transaction.findMany({
        where: { villaId, type: 'INCOME', date: { gte: twelveMonthsAgo } },
        select: { amount: true, date: true },
      }),
      db.reservation.findMany({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          checkOut: { gte: twelveMonthsAgo },
        },
        select: { checkIn: true, checkOut: true, createdAt: true },
        take: 1000,
      }),
      db.reservation.count({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: rangeFrom, lte: rangeTo },
        },
      }),
      db.reservation.count({
        where: {
          room: { villaId },
          status: { notIn: ['CANCELLED'] },
          createdAt: { gte: prevFrom, lte: prevTo },
        },
      }),
    ])

    const lowStock = allInventory.filter((i) => i.onHand < i.minLevel)
    const occupiedCount = rooms.filter(
      (r) => r.status === 'OCCUPIED' || r.status === 'CLEANING'
    ).length
    const occupancyPct = rooms.length ? Math.round((occupiedCount / rooms.length) * 100) : 0
    const highPriorityCount = openTasks.filter((t) => t.priority === 'HIGH').length
    const totalRevenue = monthlyIncome
      .filter((tx) => tx.date >= rangeFrom && tx.date <= rangeTo)
      .reduce((s, t) => s + t.amount, 0)

    const lastMonthRevenue = monthlyIncome
      .filter((tx) => tx.date >= prevFrom && tx.date <= prevTo)
      .reduce((s, t) => s + t.amount, 0)

    const revenuePct = calcPct(totalRevenue, lastMonthRevenue)
    const reservationPct = calcPct(thisMonthCount, lastMonthCount)

    const sortedTasks = openTasks.toSorted(
      (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
    )

    const chartData = buildDashboardChartData(monthlyIncome, chartReservations, rooms.length, now)
    const totalBookings = chartData.reduce((s, d) => s + d.bookings, 0)
    const avgOccupancy = Math.round(chartData.reduce((s, d) => s + d.occupancy, 0) / 12)

    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              An overview of {user.villa?.name ?? 'SimplyVilla'} — occupancy, revenue, and tasks at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DashboardDateFilter />
            <button type="button" className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-[#C8911A]">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        <DashboardKpiCards
          totalRevenue={totalRevenue}
          revenuePct={revenuePct}
          occupancyPct={occupancyPct}
          occupiedCount={occupiedCount}
          availableCount={rooms.filter((r) => r.status === 'AVAILABLE').length}
          roomsCount={rooms.length}
          thisMonthCount={thisMonthCount}
          reservationPct={reservationPct}
          openTasksCount={openTasks.length}
          highPriorityCount={highPriorityCount}
        />

        {/* Chart + Recent Reservations */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardContent className="p-5">
              <RevenueChart
                data={chartData}
                currentMonthStart={11}
                totalRevenue={totalRevenue}
                totalBookings={totalBookings}
                avgOccupancy={avgOccupancy}
              />
            </CardContent>
          </Card>

          <RecentReservationsCard
            reservations={recentReservations.map((res) => ({
              id: res.id,
              guestName: res.guest.name,
              roomCode: res.room.code,
              checkIn: res.checkIn,
              totalAmount: res.totalAmount,
              paymentStatus: res.paymentStatus,
            }))}
            thisMonthCount={thisMonthCount}
          />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DashboardTaskWidget
            initialTasks={sortedTasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              assignedTo: t.assignedTo,
              dueDate: t.dueDate?.toISOString() ?? null,
            }))}
          />

          <RoomStatusCard rooms={rooms} />

          <LowStockCard items={lowStock} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    return <div>Error loading dashboard. Please refresh.</div>
  }
}
