'use client'

import { useState, useTransition } from 'react'
import { Plus, CheckCircle2, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatRp, MONTH_NAMES_FULL } from '@/lib/finance'
import { markPayrollPaid, markPayrollUnpaid } from '@/app/actions/finance'
import { PayrollModal } from './payroll-modal'
import { EmptyState } from '@/components/ui/EmptyState'

interface Payroll {
  id: string
  staffId: string
  month: number
  year: number
  amount: number
  status: string
  paidAt: string | null
  note: string | null
  staff: { id: string; name: string; position: string }
}

interface StaffMember { id: string; name: string; position: string }

interface Props {
  payrolls: Payroll[]
  staffList: StaffMember[]
  currentMonth: number
  currentYear: number
}

export function PayrollTab({ payrolls, staffList, currentMonth, currentYear }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [prefillStaffId, setPrefillStaffId] = useState<string | undefined>()
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [isPending, startTransition] = useTransition()

  const filtered = payrolls.filter((p) => p.month === selectedMonth && p.year === selectedYear)

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0)
  const totalPaid = filtered.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const totalUnpaid = totalAmount - totalPaid

  // Staff without payroll entry this month
  const paidStaffIds = new Set(filtered.map((p) => p.staffId))
  const missingStaff = staffList.filter((s) => !paidStaffIds.has(s.id))

  function openInputForStaff(staffId?: string) {
    setPrefillStaffId(staffId)
    setModalOpen(true)
  }

  function handleMarkPaid(id: string) {
    startTransition(async () => {
      await markPayrollPaid(id)
      toast.success('Gaji ditandai sudah dibayar')
    })
  }

  function handleMarkUnpaid(id: string) {
    startTransition(async () => {
      await markPayrollUnpaid(id)
      toast.success('Gaji ditandai belum dibayar')
    })
  }

  const monthOptions: { month: number; year: number; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    monthOptions.push({ month: m, year: y, label: `${MONTH_NAMES_FULL[m - 1]} ${y}` })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Payroll</h3>
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
        <Button
          onClick={() => openInputForStaff()}
          className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 h-8 px-3 text-sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Input Gaji
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-background p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Total Payroll</p>
          <p className="text-lg font-bold tabular-nums">{formatRp(totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Sudah Dibayar</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{formatRp(totalPaid)}</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Belum Dibayar</p>
          <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{formatRp(totalUnpaid)}</p>
        </div>
      </div>

      {/* Payroll table */}
      {filtered.length === 0 && missingStaff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada data payroll"
          description="Input gaji staff untuk bulan ini"
        />
      ) : (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nama</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Posisi</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Gaji</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tgl Dibayar</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{p.staff.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.staff.position}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{formatRp(p.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          <Clock className="h-3 w-3" /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.status === 'UNPAID' ? (
                          <button
                            onClick={() => handleMarkPaid(p.id)}
                            disabled={isPending}
                            className="rounded-md border border-emerald-500 px-2 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkUnpaid(p.id)}
                            disabled={isPending}
                            className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            Revert
                          </button>
                        )}
                        <button
                          onClick={() => openInputForStaff(p.staffId)}
                          className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Staff without entry */}
                {missingStaff.map((s) => (
                  <tr key={`missing-${s.id}`} className="border-b border-border last:border-0 bg-muted/20 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.position}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground">Belum input</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => openInputForStaff(s.id)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Input
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PayrollModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPrefillStaffId(undefined) }}
        staffList={staffList}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        prefillStaffId={prefillStaffId}
      />
    </div>
  )
}
