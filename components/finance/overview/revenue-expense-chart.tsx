'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatRp } from '@/lib/finance'

const CHART_COLORS = { roomRevenue: '#6366f1', expenses: '#ef4444' }

interface ChartPoint {
  label: string
  grossRevenue: number
  expenses: number
}

export function RevenueExpenseChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}jt`}
        />
        <Tooltip
          formatter={(v: number) => formatRp(v)}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="grossRevenue" name="Revenue" fill={CHART_COLORS.roomRevenue} radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
