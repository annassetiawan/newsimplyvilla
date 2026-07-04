'use client'

import { useState, useTransition } from 'react'
import { Plus, Settings2, Palmtree, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { approveLeave, rejectLeave } from '@/app/actions/leave'
import { LeaveModal } from './leave-modal'
import { LeaveAllocationModal } from './leave-allocation-modal'
import { cn } from '@/lib/utils'
import type { Employee, LeaveRequest, LeaveAllocation } from '../types'

interface Props {
  employees: Employee[]
  leaveRequests: LeaveRequest[]
  leaveAllocations: LeaveAllocation[]
  currentYear: number
}

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function fmtDateShort(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

const FILTER_BUTTONS: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Disetujui' },
  { key: 'REJECTED', label: 'Ditolak' },
]

export function LeaveTab({ employees, leaveRequests, leaveAllocations, currentYear }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [allocModalOpen, setAllocModalOpen] = useState(false)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE')

  // Allocation map: employeeId -> LeaveAllocation
  const allocMap = new Map(leaveAllocations.map((a) => [a.employeeId, a]))

  const filtered = leaveRequests.filter((l) => filter === 'ALL' || l.status === filter)

  function handleApprove(id: string) {
    startTransition(async () => {
      const result = await approveLeave(id)
      if ('error' in result) toast.error(result.error as string)
      else toast.success('Cuti disetujui')
    })
  }

  function handleReject(id: string) {
    if (!rejectNote.trim()) {
      toast.error('Isi alasan penolakan')
      return
    }
    startTransition(async () => {
      await rejectLeave(id, rejectNote)
      toast.success('Cuti ditolak')
      setRejectId(null)
      setRejectNote('')
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {FILTER_BUTTONS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                filter === f.key
                  ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                  : 'border border-border text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllocModalOpen(true)}
            className="gap-1.5"
          >
            <Settings2 className="w-4 h-4" /> Set Jatah Cuti
          </Button>
          <Button
            onClick={() => setLeaveModalOpen(true)}
            className="bg-neutral-800 text-white hover:bg-neutral-700 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-300 gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Cuti
          </Button>
        </div>
      </div>

      {/* Quota summary cards */}
      {activeEmployees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeEmployees.map((emp) => {
            const alloc = allocMap.get(emp.id)
            const total = alloc?.totalDays ?? 12
            const used = alloc?.usedDays ?? 0
            const remaining = total - used
            return (
              <div key={emp.id} className="rounded-xl border border-border p-4 space-y-2">
                <p className="text-sm font-medium truncate">{emp.name}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold">{remaining}</p>
                    <p className="text-xs text-muted-foreground">sisa hari</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{used} terpakai</p>
                    <p>{total} jatah</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-neutral-800 dark:bg-neutral-200 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leave requests table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Palmtree}
          title="Belum ada pengajuan cuti"
          description="Tambahkan pengajuan cuti karyawan secara manual."
          actionLabel="Tambah Cuti"
          onAction={() => setLeaveModalOpen(true)}
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Karyawan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Durasi</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Alasan</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((leave, i) => (
                <tr
                  key={leave.id}
                  className={cn(i < filtered.length - 1 && 'border-b border-border')}
                >
                  <td className="px-4 py-3 font-medium">{leave.employee.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {leave.totalDays === 1
                      ? fmtDate(leave.startDate)
                      : `${fmtDateShort(leave.startDate)} – ${fmtDate(leave.endDate)}`}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {leave.totalDays} hari
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">
                    {leave.reason}
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                    {leave.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Disetujui
                      </span>
                    )}
                    {leave.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400">
                        <XCircle className="w-3 h-3" /> Ditolak
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {leave.status === 'PENDING' && (
                      <div className="flex items-center gap-2 justify-end">
                        {rejectId === leave.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              aria-label="Alasan penolakan"
                              className="h-7 text-xs rounded-md border border-input px-2 bg-background w-32"
                              placeholder="Alasan penolakan"
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleReject(leave.id)}
                              disabled={isPending}
                              className="text-xs px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => { setRejectId(null); setRejectNote('') }}
                              className="text-xs px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(leave.id)}
                              disabled={isPending}
                              className="text-xs px-2.5 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectId(leave.id)}
                              className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {leave.status !== 'PENDING' && leave.reviewedBy && (
                      <p className="text-xs text-muted-foreground text-right">oleh {leave.reviewedBy}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeaveModal
        open={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        employees={activeEmployees}
        leaveAllocations={leaveAllocations}
      />

      <LeaveAllocationModal
        open={allocModalOpen}
        onClose={() => setAllocModalOpen(false)}
        employees={activeEmployees}
        leaveAllocations={leaveAllocations}
        currentYear={currentYear}
      />
    </div>
  )
}
