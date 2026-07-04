'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { cn } from '@/lib/utils'

export interface ChartDataPoint {
  month: string
  revenue: number
  bookings: number
  occupancy: number
}

function formatRp(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

function formatYAxisRevenue(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

type TabKey = 'Revenue' | 'Bookings' | 'Occupancy'

function makeTooltip(tab: TabKey) {
  return function CustomTooltip({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: { value: number }[]
    label?: string
  }) {
    if (!active || !payload?.length) return null
    const val = payload[0].value
    const formatted =
      tab === 'Revenue'
        ? formatRp(val)
        : tab === 'Bookings'
        ? `${val} reservation${val !== 1 ? 's' : ''}`
        : `${val}%`
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground">{formatted}</p>
      </div>
    )
  }
}

interface RevenueChartProps {
  data: ChartDataPoint[]
  currentMonthStart?: number
  totalRevenue?: number
  totalBookings?: number
  avgOccupancy?: number
}

const TABS: TabKey[] = ['Revenue', 'Bookings', 'Occupancy']

export function RevenueChart({
  data,
  currentMonthStart = 8,
  totalRevenue = 0,
  totalBookings = 0,
  avgOccupancy = 0,
}: RevenueChartProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Revenue')
  const { resolvedTheme } = useTheme()
  const cursorFill = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const dataKey = activeTab === 'Revenue' ? 'revenue' : activeTab === 'Bookings' ? 'bookings' : 'occupancy'

  const subtitle =
    activeTab === 'Revenue'
      ? <>Revenue · last 12 months · total <strong className="text-foreground">Rp {totalRevenue.toLocaleString('id-ID')}</strong></>
      : activeTab === 'Bookings'
      ? <>Reservations · last 12 months · total <strong className="text-foreground">{totalBookings} bookings</strong></>
      : <>Occupancy · last 12 months · avg <strong className="text-foreground">{avgOccupancy}%</strong></>

  const yAxisFormatter =
    activeTab === 'Revenue'
      ? formatYAxisRevenue
      : activeTab === 'Occupancy'
      ? (v: number) => `${v}%`
      : (v: number) => String(v)

  const TooltipContent = makeTooltip(activeTab)

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold leading-none">Overview</h3>
          <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} barCategoryGap="35%">
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={yAxisFormatter}
            width={activeTab === 'Revenue' ? 32 : 28}
          />
          <Tooltip
            content={<TooltipContent />}
            cursor={{ fill: cursorFill, radius: 4 }}
          />
          <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={entry.month} fill={index >= currentMonthStart ? '#E1A62F' : '#e5e7eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
