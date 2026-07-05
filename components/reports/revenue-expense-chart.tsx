'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-background p-2 text-xs shadow-md space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name}>
          {p.name}: {formatRp(p.value)}
        </p>
      ))}
    </div>
  )
}

export function RevenueExpenseChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180} className="lg:!h-[220px]">
      <BarChart data={data} barGap={4}>
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
        <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
