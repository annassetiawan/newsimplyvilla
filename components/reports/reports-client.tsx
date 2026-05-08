'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Plus, Download, BarChart2, Receipt } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ExpenseModal } from './expense-modal'

export interface TransactionData {
  id: string
  date: string
  description: string
  type: string
  category: string
  amount: number
  paymentStatus: string
}

interface MonthlyData {
  month: string
  revenue: number
  expenses: number
}

interface Props {
  transactions: TransactionData[]
  monthlyData: MonthlyData[]
  stats: {
    revenue: number
    expenses: number
    netProfit: number
    avgOccupancy: number
    prevRevenue: number
    prevExpenses: number
    prevNetProfit: number
  }
  expenseByCategory: { category: string; amount: number }[]
}

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function pct(curr: number, prev: number) {
  if (prev === 0) return 0
  return Math.round(((curr - prev) / prev) * 100)
}

function StatCard({
  label,
  value,
  sub,
  delta,
  positive,
}: {
  label: string
  value: string
  sub: string
  delta: number
  positive: boolean
}) {
  const isGood = positive ? delta >= 0 : delta <= 0
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {delta !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
              isGood
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) => {
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

export function ReportsClient({ transactions, monthlyData, stats, expenseByCategory }: Props) {
  const [expenseOpen, setExpenseOpen] = useState(false)

  const maxExpense = Math.max(...expenseByCategory.map((e) => e.amount), 1)
  const recent = transactions.slice(0, 5)

  const revenues = monthlyData.map((m) => m.revenue)
  const bestIdx = revenues.indexOf(Math.max(...revenues))
  const bestMonth = monthlyData[bestIdx]
  const avgRevenue = revenues.length ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0

  function exportExcel() {
    import('xlsx').then((XLSX) => {
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ['Metric', 'Value'],
        ['Revenue', stats.revenue],
        ['Expenses', stats.expenses],
        ['Net Profit', stats.netProfit],
        ['Avg Occupancy (%)', stats.avgOccupancy],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')

      const txData = [
        ['Date', 'Description', 'Type', 'Category', 'Amount', 'Payment Status'],
        ...transactions.map((t) => [
          new Date(t.date).toLocaleDateString('en-GB'),
          t.description,
          t.type,
          t.category,
          t.amount,
          t.paymentStatus,
        ]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txData), 'Transactions')

      const expData = [
        ['Category', 'Amount'],
        ...expenseByCategory.map((e) => [e.category, e.amount]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expData), 'Expense Breakdown')

      XLSX.writeFile(wb, 'simplyvilla-report.xlsx')
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Financial overview · all values in IDR
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportExcel}>
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setExpenseOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Revenue"
          value={formatRp(stats.revenue)}
          sub="this period"
          delta={pct(stats.revenue, stats.prevRevenue)}
          positive
        />
        <StatCard
          label="Expenses"
          value={formatRp(stats.expenses)}
          sub="this period"
          delta={pct(stats.expenses, stats.prevExpenses)}
          positive={false}
        />
        <StatCard
          label="Net Profit"
          value={formatRp(stats.netProfit)}
          sub="revenue minus expenses"
          delta={pct(stats.netProfit, stats.prevNetProfit)}
          positive
        />
        <StatCard
          label="Avg Occupancy"
          value={`${stats.avgOccupancy}%`}
          sub="rooms occupied"
          delta={0}
          positive
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-border bg-background p-5 space-y-4">
          <div>
            <p className="font-semibold">Revenue overview</p>
            <p className="text-xs text-muted-foreground">Monthly revenue vs expenses, last 12 months</p>
          </div>
          {transactions.length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="Belum ada data keuangan"
              description="Data laporan akan muncul setelah ada transaksi reservasi atau pengeluaran."
              actionLabel="Catat pengeluaran"
              onAction={() => setExpenseOpen(true)}
              minHeight="min-h-[240px]"
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barGap={4}>
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
              <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Best month</p>
                  <p className="font-bold">{bestMonth ? formatRp(bestMonth.revenue) : '—'}</p>
                  <p className="text-xs text-muted-foreground">{bestMonth?.month}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Average</p>
                  <p className="font-bold">{formatRp(Math.round(avgRevenue))}</p>
                  <p className="text-xs text-muted-foreground">per week</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">YoY growth</p>
                  <p className="font-bold text-green-600">+12%</p>
                  <p className="text-xs text-muted-foreground">vs same period last year</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-border bg-background p-5 space-y-4">
          <div>
            <p className="font-semibold">Expense breakdown</p>
            <p className="text-xs text-muted-foreground">By category, this period</p>
          </div>
          <div className="space-y-3">
            {expenseByCategory.map((e) => (
              <div key={e.category}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium">{e.category}</p>
                  <p className="text-xs font-semibold">{formatRp(e.amount)}</p>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E1A62F] transition-all"
                    style={{ width: `${(e.amount / maxExpense) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {expenseByCategory.length === 0 && (
              <p className="text-xs text-muted-foreground">No expenses recorded.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-semibold">Recent transactions</p>
            <p className="text-xs text-muted-foreground">Showing the latest 5 entries</p>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Description</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Receipt className="h-8 w-8 text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Belum ada transaksi</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      Transaksi dari reservasi dan pengeluaran akan muncul di sini.
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {recent.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3 text-sm text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-5 py-3 text-sm font-medium">{t.description}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      t.type === 'INCOME'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {t.type === 'INCOME' ? 'Income' : 'Expense'}
                  </span>
                </td>
                <td
                  className={cn(
                    'px-5 py-3 text-sm font-semibold',
                    t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {t.type === 'INCOME' ? '+' : '-'}
                  {formatRp(t.amount)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      t.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {t.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-5 py-3 border-t border-border">
          <a href="#" className="text-xs text-primary font-medium hover:underline">
            View all →
          </a>
        </div>
      </div>

      <ExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} />
    </div>
  )
}
