'use client'

import { useState } from 'react'
import { Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calcMonthlyPL, calcLast6MonthsPL, formatRp, MONTH_NAMES_FULL } from '@/lib/finance'
import { BudgetModal } from './budget-modal'

interface Transaction { date: string; type: string; amount: number }
interface Reservation { checkIn: string; totalAmount: number; status: string }
interface PosTransaction { createdAt: string; total: number }
interface Budget { id: string; month: number; year: number; target: number; villaId: string }

interface Props {
  transactions: Transaction[]
  reservations: Reservation[]
  posTransactions: PosTransaction[]
  budgets: Budget[]
  currentMonth: number
  currentYear: number
}

function statusLabel(actual: number, target: number) {
  if (target === 0) return null
  const pct = actual / target
  if (pct >= 1) return { text: 'Tercapai', color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' }
  if (pct >= 0.8) return { text: 'On Track', color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' }
  return { text: 'Di Bawah Target', color: 'text-red-600 dark:text-red-400', dot: 'bg-red-500' }
}

export function BudgetTab({ transactions, reservations, posTransactions, budgets, currentMonth, currentYear }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const getBudget = (month: number, year: number) =>
    budgets.find((b) => b.month === month && b.year === year)

  const currentBudget = getBudget(currentMonth, currentYear)
  const currentPL = calcMonthlyPL(transactions, reservations, posTransactions, currentMonth, currentYear)
  const last6 = calcLast6MonthsPL(transactions, reservations, posTransactions, currentMonth, currentYear)

  const pct = currentBudget && currentBudget.target > 0
    ? Math.min(100, Math.round((currentPL.grossRevenue / currentBudget.target) * 100))
    : 0

  const status = currentBudget ? statusLabel(currentPL.grossRevenue, currentBudget.target) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Target {MONTH_NAMES_FULL[currentMonth - 1]} {currentYear}
        </h3>
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 h-8 px-3 text-sm"
        >
          <Target className="h-3.5 w-3.5 mr-1.5" />
          Set Target
        </Button>
      </div>

      {/* Current month progress */}
      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        {currentBudget ? (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Aktual vs Target</span>
              {status && (
                <span className={cn('flex items-center gap-1.5 font-medium', status.color)}>
                  <span className={cn('h-2 w-2 rounded-full', status.dot)} />
                  {status.text}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>{formatRp(currentPL.grossRevenue)}</span>
                <span className="text-muted-foreground">dari {formatRp(currentBudget.target)}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-500',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-center text-2xl font-bold tabular-nums">{pct}%</p>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Belum ada target bulan ini.{' '}
            <button onClick={() => setModalOpen(true)} className="underline font-medium text-foreground">
              Set sekarang
            </button>
          </div>
        )}
      </div>

      {/* 6-month table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h4 className="text-sm font-semibold">Riwayat 6 Bulan</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Bulan</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Target</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Aktual</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Selisih</th>
                <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {last6.map(({ label, month, year, grossRevenue }) => {
                const budget = getBudget(month, year)
                const target = budget?.target ?? 0
                const diff = grossRevenue - target
                const s = budget ? statusLabel(grossRevenue, target) : null
                return (
                  <tr key={`${month}-${year}`} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{label} {year}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {target > 0 ? formatRp(target) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRp(grossRevenue)}</td>
                    <td className={cn(
                      'px-4 py-3 text-right tabular-nums font-medium',
                      target === 0 ? 'text-muted-foreground' : diff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
                    )}>
                      {target === 0 ? '—' : (diff >= 0 ? '+' : '') + formatRp(diff)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s ? (
                        <span className={cn('flex items-center justify-center gap-1 text-xs font-medium', s.color)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                          {s.text}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BudgetModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultMonth={currentMonth}
        defaultYear={currentYear}
        currentTarget={currentBudget?.target}
      />
    </div>
  )
}
