import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

const SPARKLINE_PATHS = {
  up: 'M2,28 L14,22 L26,17 L38,13 L50,9 L62,6 L74,3',
  down: 'M2,4 L14,9 L26,15 L38,19 L50,23 L62,26 L74,29',
  neutral: 'M2,18 L14,13 L26,20 L38,15 L50,19 L62,14 L74,18',
} as const

const SPARKLINE_COLORS = { up: '#22c55e', down: '#9ca3af', neutral: '#9ca3af' } as const

function Sparkline({ trend = 'up' }: { trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <svg width="76" height="32" viewBox="0 0 76 32" fill="none" className="opacity-60">
      <path
        d={SPARKLINE_PATHS[trend]}
        stroke={SPARKLINE_COLORS[trend]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PctBadge({ pct }: { pct: number }) {
  return (
    <span className={cn(
      'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold',
      pct >= 0
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    )}>
      {pct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {pct >= 0 ? '+' : ''}{pct}%
    </span>
  )
}

function PctFootnote({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <p className="mt-0.5 text-xs text-muted-foreground">No data last month</p>
  }
  return (
    <p className={cn(
      'mt-0.5 flex items-center gap-0.5 text-xs font-medium',
      pct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
    )}>
      {pct >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {pct >= 0 ? '+' : ''}{pct}% from last month
    </p>
  )
}

interface DashboardKpiCardsProps {
  totalRevenue: number
  revenuePct: number | null
  occupancyPct: number
  occupiedCount: number
  availableCount: number
  roomsCount: number
  thisMonthCount: number
  reservationPct: number | null
  openTasksCount: number
  highPriorityCount: number
}

export function DashboardKpiCards({
  totalRevenue,
  revenuePct,
  occupancyPct,
  occupiedCount,
  availableCount,
  roomsCount,
  thisMonthCount,
  reservationPct,
  openTasksCount,
  highPriorityCount,
}: DashboardKpiCardsProps) {
  const now = new Date()
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            {revenuePct !== null && <PctBadge pct={revenuePct} />}
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{formatRp(totalRevenue)}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {now.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </p>
              <PctFootnote pct={revenuePct} />
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
                {occupiedCount} of {roomsCount} rooms occupied
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {availableCount} available
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
            {reservationPct !== null && <PctBadge pct={reservationPct} />}
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{thisMonthCount}</p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">This month</p>
              <PctFootnote pct={reservationPct} />
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
          <p className="mt-3 text-3xl font-bold tracking-tight">{openTasksCount}</p>
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
  )
}
