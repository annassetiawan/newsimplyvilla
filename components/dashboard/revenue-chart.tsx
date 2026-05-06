'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { cn } from '@/lib/utils'

export interface ChartDataPoint {
  week: string
  revenue: number
}

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`
  return `Rp ${(value / 1_000).toFixed(0)}K`
}

function formatYAxis(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">{formatRp(payload[0].value)}</p>
    </div>
  )
}

type TabKey = 'Revenue' | 'Bookings' | 'Occupancy'

interface RevenueChartProps {
  data: ChartDataPoint[]
  currentMonthStart?: number
  totalRevenue?: number
}

export function RevenueChart({ data, currentMonthStart = 8, totalRevenue = 0 }: RevenueChartProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('Revenue')
  const { resolvedTheme } = useTheme()
  const cursorFill = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const tabs: TabKey[] = ['Revenue', 'Bookings', 'Occupancy']

  const formattedTotal =
    totalRevenue >= 1_000_000
      ? `Rp ${(totalRevenue / 1_000_000).toFixed(1)}M`
      : `Rp ${totalRevenue.toLocaleString('id-ID')}`

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold leading-none">Overview</h3>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Revenue &amp; bookings &middot; last 12 weeks &middot; total{' '}
            <strong className="text-foreground">{formattedTotal}</strong>
          </p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-border bg-muted/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab}
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
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={formatYAxis}
            width={32}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: cursorFill, radius: 4 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((_, index) => (
              <Cell key={index} fill={index >= currentMonthStart ? '#E1A62F' : '#e5e7eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
