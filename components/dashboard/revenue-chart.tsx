'use client'

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface ChartDataPoint {
  week: string
  revenue: number
}

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`
  return `Rp ${(value / 1_000).toFixed(0)}K`
}

function CustomTooltip({ active, payload, label }: {
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

interface RevenueChartProps {
  data: ChartDataPoint[]
  currentMonthStart?: number
}

export function RevenueChart({ data, currentMonthStart = 8 }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="35%">
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {data.map((_, index) => (
            <Cell key={index} fill={index >= currentMonthStart ? '#E1A62F' : '#e5e7eb'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
