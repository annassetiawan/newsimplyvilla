export const revalidate = 60

import { redirect } from 'next/navigation'
import { ArrowUp, ArrowDown, Download, CalendarOff, BedDouble, PackageCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import dynamic from 'next/dynamic'
import { getSessionUser } from '@/lib/getSession'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardTaskWidget } from '@/components/dashboard/task-widget'
import { DashboardDateFilter } from '@/components/dashboard/date-filter'
import { getDateRange } from '@/lib/dashboard-date'

const RevenueChart = dynamic(
  () => import('@/components/dashboard/revenue-chart').then((m) => ({ default: m.RevenueChart })),
  { loading: () => <div className="h-[270px] animate-pulse rounded-lg bg-muted" /> }
)

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
]

const STATUS_STYLES = {
  OCCUPIED: {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    code: 'text-amber-800 dark:text-amber-300',
    label: 'text-amber-600 dark:text-amber-400',
    text: 'Occupied',
  },
  AVAILABLE: {
    card: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    code: 'text-green-800 dark:text-green-300',
    label: 'text-green-600 dark:text-green-400',
    text: 'Available',
  },
  CLEANING: {
    card: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    code: 'text-blue-800 dark:text-blue-300',
    label: 'text-blue-600 dark:text-blue-400',
    text: 'Cleaning',
  },
  MAINTENANCE: {
    card: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    code: 'text-red-800 dark:text-red-300',
    label: 'text-red-600 dark:text-red-400',
    text: 'Maint.',
  },
} as const


const PRIORITY_ORDER: Record<string, number> = { HIGH: 0, MED: 1, LOW: 2 }

function Sparkline({ trend = 'up' }: { trend?: 'up' | 'down' | 'neutral' }) {
  const paths = {
    up: 'M2,28 L14,22 L26,17 L38,13 L50,9 L62,6 L74,3',
    down: 'M2,4 L14,9 L26,15 L38,19 L50,23 L62,26 L74,29',
    neutral: 'M2,18 L14,13 L26,20 L38,15 L50,19 L62,14 L74,18',
  }
  const colors = { up: '#22c55e', down: '#9ca3af', neutral: '#9ca3af' }
  return (
    <svg width="76" height="32" viewBox="0 0 76 32" fill="none" className="opacity-60">
      <path
        d={paths[trend]}
        stroke={colors[trend]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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

  function calcPct(current: number, previous: number): number | null {
    if (previous === 0) return null
    return Math.round(((current - previous) / previous) * 100)
  }

  const revenuePct = calcPct(totalRevenue, lastMonthRevenue)
  const reservationPct = calcPct(thisMonthCount, lastMonthCount)

  const sortedTasks = [...openTasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  )

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  // Single O(n) pass — build revenue, bookings, and occupancy maps before the chart loop
  const revenueMap = new Map<string, number>()
  for (const tx of monthlyIncome) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`
    revenueMap.set(key, (revenueMap.get(key) ?? 0) + tx.amount)
  }

  const bookingsMap = new Map<string, number>()
  const occupancyMap = new Map<string, number>()
  for (const r of chartReservations) {
    const created = r.createdAt
    const bKey = `${created.getFullYear()}-${created.getMonth()}`
    bookingsMap.set(bKey, (bookingsMap.get(bKey) ?? 0) + 1)

    // Walk each month this reservation overlaps and accumulate occupied nights
    const ci = r.checkIn
    const co = r.checkOut
    let cursor = new Date(ci.getFullYear(), ci.getMonth(), 1)
    while (cursor <= co) {
      const mStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
      const mEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999)
      const overlapStart = Math.max(ci.getTime(), mStart.getTime())
      const overlapEnd = Math.min(co.getTime(), mEnd.getTime())
      if (overlapEnd > overlapStart) {
        const nights = Math.ceil((overlapEnd - overlapStart) / 86400000)
        const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
        occupancyMap.set(key, (occupancyMap.get(key) ?? 0) + nights)
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    }
  }

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const totalRoomNights = rooms.length * daysInMonth
    const occupiedNights = occupancyMap.get(key) ?? 0
    const occupancy = totalRoomNights > 0 ? Math.round((occupiedNights / totalRoomNights) * 100) : 0

    return {
      month: MONTH_LABELS[d.getMonth()],
      revenue: revenueMap.get(key) ?? 0,
      bookings: bookingsMap.get(key) ?? 0,
      occupancy,
    }
  })

  const totalBookings = chartData.reduce((s, d) => s + d.bookings, 0)
  const avgOccupancy = Math.round(chartData.reduce((s, d) => s + d.occupancy, 0) / 12)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            An overview of {user.villa.name} — occupancy, revenue, and tasks at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardDateFilter />
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-[#C8911A]">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              {revenuePct !== null && (
                <span className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  revenuePct >= 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {revenuePct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {revenuePct >= 0 ? '+' : ''}{revenuePct}%
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{formatRp(totalRevenue)}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </p>
                {revenuePct !== null ? (
                  <p className={cn(
                    'mt-0.5 flex items-center gap-0.5 text-xs font-medium',
                    revenuePct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  )}>
                    {revenuePct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {revenuePct >= 0 ? '+' : ''}{revenuePct}% from last month
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">No data last month</p>
                )}
              </div>
              <span className="hidden lg:block"><Sparkline trend={revenuePct === null ? 'neutral' : revenuePct >= 0 ? 'up' : 'down'} /></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Today
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{occupancyPct}%</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {occupiedCount} of {rooms.length} rooms occupied
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {rooms.filter((r) => r.status === 'AVAILABLE').length} available
                </p>
              </div>
              <span className="hidden lg:block"><Sparkline trend={occupancyPct > 0 ? 'up' : 'neutral'} /></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Reservations</p>
              {reservationPct !== null && (
                <span className={cn(
                  'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
                  reservationPct >= 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                )}>
                  {reservationPct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {reservationPct >= 0 ? '+' : ''}{reservationPct}%
                </span>
              )}
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{thisMonthCount}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This month</p>
                {reservationPct !== null ? (
                  <p className={cn(
                    'mt-0.5 flex items-center gap-0.5 text-xs font-medium',
                    reservationPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                  )}>
                    {reservationPct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {reservationPct >= 0 ? '+' : ''}{reservationPct}% from last month
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">No data last month</p>
                )}
              </div>
              <span className="hidden lg:block"><Sparkline trend={reservationPct === null ? 'neutral' : reservationPct >= 0 ? 'up' : 'down'} /></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Open Tasks</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                Pending
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{openTasks.length}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{highPriorityCount} high priority</p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                  Pending &amp; in progress
                </p>
              </div>
              <Sparkline trend="neutral" />
            </div>
          </CardContent>
        </Card>
      </div>

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

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent reservations</CardTitle>
              <button className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            <CardDescription>{thisMonthCount} reservasi aktif bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <EmptyState
                icon={CalendarOff}
                title="Belum ada reservasi"
                description="Reservasi terbaru akan tampil di sini."
                actionLabel="Tambah reservasi"
                actionHref="/front-desk"
                minHeight="min-h-[200px]"
              />
            ) : (
              <div className="space-y-4">
                {recentReservations.map((res, i) => (
                  <div key={res.id} className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        AVATAR_COLORS[i % AVATAR_COLORS.length]
                      )}
                    >
                      {getInitials(res.guest.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{res.guest.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-id">{res.room.code}</span> &middot;{' '}
                        {new Date(res.checkIn).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={cn(
                        'text-sm font-semibold',
                        res.paymentStatus === 'PAID' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {formatRp(res.totalAmount)}
                      </p>
                      {res.paymentStatus === 'UNPAID' && (
                        <span className="text-[10px] font-semibold text-red-500">Belum bayar</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Room status</CardTitle>
              <span className="text-xs text-muted-foreground">{rooms.length} rooms</span>
            </div>
            <CardDescription>
              {rooms.filter((r) => r.status === 'AVAILABLE').length} of {rooms.length} available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <EmptyState
                icon={BedDouble}
                title="Belum ada kamar"
                description="Tambahkan kamar villa kamu untuk mulai mengelola status."
                actionLabel="Tambah kamar"
                actionHref="/rooms"
                minHeight="min-h-[160px]"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {rooms.map((room) => {
                  const s =
                    STATUS_STYLES[room.status as keyof typeof STATUS_STYLES] ??
                    STATUS_STYLES.AVAILABLE
                  return (
                    <div key={room.id} className={cn('rounded-lg border p-2.5', s.card)}>
                      <p className={cn('font-id font-bold', s.code)}>{room.code}</p>
                      <p className={cn('mt-0.5 text-[11px] font-medium', s.label)}>{s.text}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Low stock alerts</CardTitle>
              {lowStock.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {lowStock.length}
                </span>
              )}
            </div>
            <CardDescription>
              {lowStock.length === 0
                ? 'All stock levels are healthy'
                : `${lowStock.length} items below threshold`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <EmptyState
                icon={PackageCheck}
                title="Stok semua aman"
                description="Tidak ada item yang perlu di-restock saat ini."
                iconColor="text-green-500 dark:text-green-400"
                minHeight="min-h-[160px]"
              />
            ) : (
              <div className="space-y-4">
                {lowStock.map((item) => {
                  const pct = Math.min(
                    Math.round((item.onHand / item.minLevel) * 100),
                    100
                  )
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        <p className="shrink-0 text-xs">
                          <span className="font-semibold text-foreground">{item.onHand}</span>
                          <span className="text-muted-foreground"> / min {item.minLevel}</span>
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                <button className="mt-1 w-full text-center text-xs font-medium text-primary hover:underline">
                  Reorder all
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    console.error('Dashboard error:', error)
    return <div>Error loading dashboard. Please refresh.</div>
  }
}
