export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { ArrowUp, CalendarDays, Download, Plus } from 'lucide-react'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { getSessionUser } from '@/lib/getSession'

function formatRp(amount: number) {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}K`
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

const PRIORITY_BADGE: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  MED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  LOW: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

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

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  const villaId = user.villaId

  const [rooms, openTasks, recentReservations, allInventory, aprilTransactions, reservationCount] =
    await Promise.all([
      db.room.findMany({ where: { villaId }, orderBy: { code: 'asc' } }),
      db.task.findMany({
        where: { villaId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      db.reservation.findMany({
        where: { room: { villaId } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { guest: true, room: true },
      }),
      db.inventoryItem.findMany({ where: { villaId } }),
      db.transaction.findMany({
        where: {
          villaId,
          type: 'INCOME',
          date: { gte: new Date('2026-04-01'), lte: new Date('2026-04-30') },
        },
      }),
      db.reservation.count({ where: { room: { villaId } } }),
    ])

  const lowStock = allInventory.filter((i) => i.onHand < i.minLevel)
  const occupiedCount = rooms.filter(
    (r) => r.status === 'OCCUPIED' || r.status === 'CLEANING'
  ).length
  const occupancyPct = rooms.length ? Math.round((occupiedCount / rooms.length) * 100) : 0
  const highPriorityCount = openTasks.filter((t) => t.priority === 'HIGH').length
  const totalRevenue = aprilTransactions.reduce((s, t) => s + t.amount, 0)

  const sortedTasks = [...openTasks].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  )

  const weeklyApril = [0, 0, 0, 0]
  for (const txn of aprilTransactions) {
    const day = new Date(txn.date).getDate()
    const wIdx = Math.min(Math.floor((day - 1) / 7), 3)
    weeklyApril[wIdx] += txn.amount
  }

  const chartData = [
    { week: 'W1', revenue: 18_500_000 },
    { week: 'W2', revenue: 21_000_000 },
    { week: 'W3', revenue: 24_500_000 },
    { week: 'W4', revenue: 28_000_000 },
    { week: 'W5', revenue: 31_000_000 },
    { week: 'W6', revenue: 35_500_000 },
    { week: 'W7', revenue: 38_000_000 },
    { week: 'W8', revenue: 43_000_000 },
    { week: 'W9', revenue: weeklyApril[0] || 46_000_000 },
    { week: 'W10', revenue: weeklyApril[1] || 53_000_000 },
    { week: 'W11', revenue: weeklyApril[2] || 59_000_000 },
    { week: 'W12', revenue: weeklyApril[3] || 65_000_000 },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            An overview of {user.villa.name} — occupancy, revenue, and tasks at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm hover:bg-muted">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            Apr 1 – 24, 2026
          </button>
          <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-[#C8911A]">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <ArrowUp className="h-3 w-3" /> +8.4%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{formatRp(totalRevenue)}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Apr 2026</p>
                <p className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowUp className="h-3 w-3" /> +8.4% from last month
                </p>
              </div>
              <Sparkline trend="up" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Occupancy</p>
              <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <ArrowUp className="h-3 w-3" /> +12%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">{occupancyPct}%</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {occupiedCount} of {rooms.length} rooms today
                </p>
                <p className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowUp className="h-3 w-3" /> +12% vs last week
                </p>
              </div>
              <Sparkline trend="up" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Reservations</p>
              <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <ArrowUp className="h-3 w-3" /> +19%
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight">+{reservationCount}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">All time bookings</p>
                <p className="mt-0.5 flex items-center gap-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowUp className="h-3 w-3" /> +19% from last week
                </p>
              </div>
              <Sparkline trend="up" />
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
      <div className="grid grid-cols-5 gap-4">
        <Card className="col-span-3">
          <CardContent className="p-5">
            <RevenueChart data={chartData} currentMonthStart={8} totalRevenue={totalRevenue} />
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent reservations</CardTitle>
              <button className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            <CardDescription>{reservationCount} bookings this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    {res.room.code} &middot;{' '}
                    {new Date(res.checkIn).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary">
                  +{formatRp(res.totalAmount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Today&apos;s tasks</CardTitle>
              <button className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted">
                <Plus className="h-3 w-3" /> New
              </button>
            </div>
            <CardDescription>
              {openTasks.length} open &middot; {highPriorityCount} high priority
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{task.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {task.assignedTo ?? 'Unassigned'} &middot;{' '}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : 'No due date'}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.LOW
                  )}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

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
            <div className="grid grid-cols-2 gap-2">
              {rooms.map((room) => {
                const s =
                  STATUS_STYLES[room.status as keyof typeof STATUS_STYLES] ??
                  STATUS_STYLES.AVAILABLE
                return (
                  <div key={room.id} className={cn('rounded-lg border p-2.5', s.card)}>
                    <p className={cn('text-xs font-bold', s.code)}>{room.code}</p>
                    <p className={cn('mt-0.5 text-[11px] font-medium', s.label)}>{s.text}</p>
                  </div>
                )
              })}
            </div>
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
              <p className="text-sm text-muted-foreground">All stock levels are healthy.</p>
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
}
