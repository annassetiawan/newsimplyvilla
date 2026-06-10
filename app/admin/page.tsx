import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { db } from '@/lib/db'
import { AdminKpiCards } from '@/components/admin/admin-kpi-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Fetch all metrics in parallel
  const [
    totalVillas,
    activePro,
    freeCount,
    totalRevenueThisMonth,
    totalRevenueLastMonth,
    totalReservationsThisMonth,
    totalReservationsLastMonth,
    newVillasThisMonth,
    recentVillas,
    recentReservations,
  ] = await Promise.all([
    db.villa.count(),
    db.subscription.count({ where: { plan: 'PRO', status: 'ACTIVE' } }),
    db.subscription.count({ where: { plan: 'FREE', status: 'ACTIVE' } }),
    db.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { type: 'INCOME', date: { gte: lastMonthStart, lt: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.reservation.count({ where: { createdAt: { gte: thisMonthStart } } }),
    db.reservation.count({
      where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
    }),
    db.villa.count({ where: { updatedAt: { gte: thisMonthStart } } }),
    db.villa.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        subscription: true,
        staff: { where: { role: 'OWNER' }, take: 1 },
      },
    }),
    db.reservation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { room: true, guest: true },
    }),
  ])

  const revenueThisMonth = totalRevenueThisMonth._sum.amount ?? 0
  const revenueLastMonth = totalRevenueLastMonth._sum.amount ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of all villas, subscriptions, and revenue across the platform.
        </p>
      </div>

      {/* KPI Cards */}
      <AdminKpiCards
        totalVillas={totalVillas}
        activePro={activePro}
        totalRevenue={revenueThisMonth}
        totalReservations={totalReservationsThisMonth}
        newThisMonth={newVillasThisMonth}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Free</span>
                  <span className="text-sm font-medium">{freeCount}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-slate-400 transition-all"
                    style={{
                      width:
                        totalVillas > 0
                          ? `${(freeCount / totalVillas) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pro</span>
                  <span className="text-sm font-medium">{activePro}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width:
                        totalVillas > 0
                          ? `${(activePro / totalVillas) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {totalVillas > 0
                ? `${Math.round((activePro / totalVillas) * 100)}% of villas are on Pro`
                : 'No villas yet'}
            </p>
          </CardContent>
        </Card>

        {/* Recent Reservations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            {recentReservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reservations yet.</p>
            ) : (
              <div className="space-y-3">
                {recentReservations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.guest.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.room.name} · {new Date(r.checkIn).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {r.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Villas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Villas</CardTitle>
          <Link
            href="/admin/villas"
            className="text-sm text-primary hover:text-primary-hover font-medium"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentVillas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No villas registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left font-medium text-muted-foreground">Villa</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Owner</th>
                    <th className="py-2 text-left font-medium text-muted-foreground">Plan</th>
                    <th className="py-2 text-right font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVillas.map((v) => (
                    <tr key={v.id} className="border-b border-border last:border-0">
                      <td className="py-2">
                        <Link
                          href={`/admin/villas/${v.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {v.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{v.slug}</p>
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {v.staff[0]?.name ?? '—'}
                      </td>
                      <td className="py-2">
                        <Badge
                          variant={v.subscription?.plan === 'PRO' ? 'default' : 'secondary'}
                          className={
                            v.subscription?.plan === 'PRO'
                              ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary'
                              : ''
                          }
                        >
                          {v.subscription?.plan ?? 'FREE'}
                        </Badge>
                      </td>
                      <td className="py-2 text-right">
                        <Badge
                          variant="outline"
                          className={
                            v.subscription?.status === 'ACTIVE'
                              ? 'border-emerald-200 text-emerald-700'
                              : 'border-red-200 text-red-700'
                          }
                        >
                          {v.subscription?.status ?? '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
