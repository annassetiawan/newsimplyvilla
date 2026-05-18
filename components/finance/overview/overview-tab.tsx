'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { cn } from '@/lib/utils'
import { calcMonthlyPL, calcLast6MonthsPL, formatRp, MONTH_NAMES_FULL } from '@/lib/finance'

interface Transaction {
  date: string
  type: string
  amount: number
}

interface Reservation {
  checkIn: string
  totalAmount: number
  status: string
}

interface PosTransaction {
  createdAt: string
  total: number
}

interface Props {
  transactions: Transaction[]
  reservations: Reservation[]
  posTransactions: PosTransaction[]
  currentMonth: number
  currentYear: number
}

function KpiCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string
  value: number
  icon: React.ElementType
  variant: 'default' | 'success' | 'danger'
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            'h-4 w-4',
            variant === 'success' && 'text-emerald-500',
            variant === 'danger' && 'text-red-500',
            variant === 'default' && 'text-muted-foreground',
          )}
        />
      </div>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          variant === 'success' && 'text-emerald-600 dark:text-emerald-400',
          variant === 'danger' && 'text-red-600 dark:text-red-400',
        )}
      >
        {formatRp(value)}
      </p>
    </div>
  )
}

function PLRow({ label, value, bold, indent }: { label: string; value: number; bold?: boolean; indent?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between py-1.5', bold && 'border-t border-border mt-1 pt-2.5')}>
      <span className={cn('text-sm text-muted-foreground', bold && 'font-semibold text-foreground', indent && 'pl-4')}>
        {label}
      </span>
      <span className={cn('text-sm tabular-nums', bold && 'font-semibold')}>{formatRp(value)}</span>
    </div>
  )
}

const CHART_COLORS = { roomRevenue: '#6366f1', posRevenue: '#22c55e', otherIncome: '#f59e0b', expenses: '#ef4444' }

export function OverviewTab({ transactions, reservations, posTransactions, currentMonth, currentYear }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [chartRange, setChartRange] = useState<'1' | '3' | '6'>('6')

  const pl = calcMonthlyPL(transactions, reservations, posTransactions, selectedMonth, selectedYear)
  const last6 = calcLast6MonthsPL(transactions, reservations, posTransactions, currentMonth, currentYear)

  const chartData = chartRange === '1' ? last6.slice(-1) : chartRange === '3' ? last6.slice(-3) : last6

  const monthOptions: { month: number; year: number; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    monthOptions.push({ month: m, year: y, label: `${MONTH_NAMES_FULL[m - 1]} ${y}` })
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Periode:</label>
        <select
          value={`${selectedMonth}-${selectedYear}`}
          onChange={(e) => {
            const [m, y] = e.target.value.split('-').map(Number)
            setSelectedMonth(m)
            setSelectedYear(y)
          }}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {monthOptions.map((o) => (
            <option key={`${o.month}-${o.year}`} value={`${o.month}-${o.year}`}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Gross Revenue" value={pl.grossRevenue} icon={DollarSign} variant="default" />
        <KpiCard label="Total Expenses" value={pl.expenses} icon={TrendingDown} variant="danger" />
        <KpiCard
          label="Net Profit"
          value={pl.netProfit}
          icon={TrendingUp}
          variant={pl.netProfit >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* P&L + Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* P&L Table */}
        <div className="rounded-xl border border-border bg-background p-5">
          <h3 className="mb-3 font-semibold text-sm">Profit & Loss</h3>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Revenue</p>
            <PLRow label="Room Revenue" value={pl.roomRevenue} indent />
            <PLRow label="Business / POS" value={pl.posRevenue} indent />
            <PLRow label="Pemasukan Lain" value={pl.otherIncome} indent />
            <PLRow label="Gross Revenue" value={pl.grossRevenue} bold />

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4 mb-1">Expenses</p>
            <PLRow label="Operasional" value={pl.expenses} indent />
            <PLRow label="Total Expenses" value={pl.expenses} bold />

            <div className="mt-3 rounded-lg bg-muted p-3 flex items-center justify-between">
              <span className="font-bold text-sm">Net Profit</span>
              <span
                className={cn(
                  'font-bold text-sm tabular-nums',
                  pl.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                )}
              >
                {formatRp(pl.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown Chart */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Tren Revenue vs Expenses</h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value as '1' | '3' | '6')}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="1">1 bulan</option>
              <option value="3">3 bulan</option>
              <option value="6">6 bulan</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
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
        </div>
      </div>
    </div>
  )
}
