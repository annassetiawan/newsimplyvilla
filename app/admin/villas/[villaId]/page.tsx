import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/getSession'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlanToggle } from '@/components/admin/plan-toggle'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface Props {
  params: Promise<{ villaId: string }>
}

export default async function AdminVillaDetailPage({ params }: Props) {
  const { villaId } = await params

  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  const villa = await db.villa.findUnique({
    where: { id: villaId },
    include: {
      subscription: true,
      staff: { where: { role: 'OWNER' }, take: 1 },
      _count: {
        select: {
          rooms: true,
          staff: true,
          tasks: true,
        },
      },
    },
  })

  if (!villa) notFound()

  const sub = villa.subscription
  const owner = villa.staff[0]

  // Quick stats scoped to this villa
  const [revenueThisMonth, reservationsThisMonth] = await Promise.all([
    db.transaction.aggregate({
      where: {
        villaId: villa.id,
        type: 'INCOME',
        date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      _sum: { amount: true },
    }),
    db.reservation.count({
      where: {
        room: { villaId: villa.id },
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ])

  const villaData = {
    id: villa.id,
    name: villa.name,
    slug: villa.slug,
    email: villa.email,
    ownerName: owner?.name ?? null,
    plan: sub?.plan ?? 'FREE',
    status: sub?.status ?? 'ACTIVE',
    createdAt: sub?.createdAt?.toISOString() ?? new Date().toISOString(),
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/villas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Villas
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{villa.name}</h1>
          <p className="text-sm text-muted-foreground">
            {villa.address ?? 'No address'} · /{villa.slug}
          </p>
        </div>
        <PlanToggle villa={villaData} />
      </div>

      {/* KPI cards for this villa */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {(revenueThisMonth._sum.amount ?? 0).toLocaleString('id-ID')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservations (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{reservationsThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{villa._count.rooms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{villa._count.staff}</p>
          </CardContent>
        </Card>
      </div>

      {/* Villa details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Villa Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-sm font-medium">{villa.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{villa.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-sm font-medium">{villa.address ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact</p>
              <p className="text-sm font-medium">{villa.contact ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Facilities</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {villa.facilities.length > 0
                  ? villa.facilities.map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))
                  : '—'}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Onboarded</p>
              <Badge variant={villa.isOnboarded ? 'default' : 'secondary'} className="text-xs">
                {villa.isOnboarded ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <Badge
                variant={sub?.plan === 'PRO' ? 'default' : 'secondary'}
                className={
                  sub?.plan === 'PRO'
                    ? 'bg-primary-light text-primary dark:bg-primary/20 dark:text-primary'
                    : ''
                }
              >
                {sub?.plan ?? 'FREE'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={
                  sub?.status === 'ACTIVE'
                    ? 'border-emerald-200 text-emerald-700'
                    : 'border-red-200 text-red-700'
                }
              >
                {sub?.status ?? '—'}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="text-sm font-medium">
                {sub?.startDate
                  ? new Date(sub.startDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">End Date</p>
              <p className="text-sm font-medium">
                {sub?.endDate
                  ? new Date(sub.endDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm font-medium">{owner?.name ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{owner?.email ?? ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
